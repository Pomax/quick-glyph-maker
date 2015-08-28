var Shapes = React.createClass({
  getInitialState: function() {
    this.clear();
    return {
      contours: []
    };
  },

  render: function() {
    var contours = this.state.contours.map(function(points, idx) {
      if(points.length === 0) return false;
      return <Contour {...{
        points: points,
        cid: idx,
        ref: idx + '-' + points.length,
        key: "c"+idx,
        mx: this.props.mouseX,
        my: this.props.mouseY,
        setActivePoint: this.setActivePoint
      }}/>;
    }.bind(this));


    // also add the contour for "what the next thing will look like"
    var nContour = false;
    if (this.state.contours.length > 0) {
      var temp = this.state.contours.slice(-1)[0];
      if(temp) {
        temp = temp.slice(-1)[0];
        if (temp) {
          // create a contour between [temp] and this coordinate
          var pts = {
            x: this.props.gridX,
            y: this.props.gridY,
            back: false
          };
          // invent a control point if we must
          if (temp.front) {
            pts.back = inventKappaControl(temp, pts);
          }
          temp = [temp, pts];
          nContour = <Contour {...{
            points: temp,
            cid: -1,
            ref: '-1-2',
            key: "c-1",
            mx: this.props.mouseX,
            my: this.props.mouseY,
            setActivePoint: this.setActivePoint,
            preview: true
          }}/>;
        }
      }
    }

    var ox = this.props.offsetX;
    var oy = this.props.offsetY;

    var snapped = {
      x: this.props.gridX,
      y: this.props.gridY
    };

    var cursor = false;
    if(!this.state.hideCursor) {
      cursor = [
        <path fill="none" stroke="rgb(200,150,200)" d={ ['M', snapped.x, -oy, 'L', snapped.x, this.props.height - oy].join(' ') } />,
        <path fill="none" stroke="rgb(200,150,200)" d={ ['M', -ox, snapped.y, 'L', this.props.width - ox, snapped.y].join(' ') } />,
        <circle {...{
          r: 10,
          cx: snapped.x,
          cy: snapped.y,
          fill: "none",
          stroke: this.props.curve ? "red" : "black"
        }}/>
      ];
    }

    var group = <g transform={"translate("+ox+","+oy+")"}>
      {contours}
      {nContour}
      {cursor}
    </g>;

    return group;
  },

  setActivePoint: function(contour, pid) {
    this.setState({
      activePoint: {
        contour: contour,
        pid: pid
      }
    });
  },

  load: function(d) {
    var receiver = this;
    this.clear(function() {
      var svgParser = new SVGParser(receiver);
      svgParser.parse(d);
    });
  },

  // "Receiver" functions called by the SVGParser

  start: function() {
    this.clear();
    this.svgParsing = true;
  },

  startShape: function() {
    if (this.points.length > 0) {
      this.points = [];
      this.contours.push(this.points);
    }
  },

  addPoint: function(x,y) {
    this.point = { x: x, y: y };
    this.points.push(this.point);
    this.setState({ contours: this.contours });
  },

  setRightControl: function(x, y) {
    var p = {x:x, y:y};
    this.point.front = p;
  },

  setLeftControl: function(x, y) {
    var p = {x:x, y:y};
    this.point.back = p;
  },

  closeShape: function() {
    this.points.closed = true;
  },

  close: function() {
    this.svgParsing = false;
    this.setState({
      contours: this.contours
    });
  },

  // Own functions

  clear: function(next) {
    this.point = false;
    this.points = [];
    this.contours = [this.points];
    this.setState({
      contours: []
    }, function() {
      if(next) next();
    });
  },

  undo: function() {
    var last;

    // open the shape back up?
    if (this.points.length === 0) {
      var contours = this.contours;
      last = contours.length - 1;
      contours.splice(last,1);
      if (contours.length>0) {
        this.points = contours.slice(-1)[0];
        this.points.closed = false;
      } else {
        this.points = [];
        this.contours = [this.points];
      }
    }

    // remove last added point
    else {
      if (this.points.closed) {
        this.points.closed = false;
      }
      var points = this.points;
      last = points.length -1;
      points.splice(last,1);
    }

    this.setState({ contours: this.contours });
  },

  getMouse: function() {
    return {
      x: this.props.mouseX,
      y: this.props.mouseY
    };
  },

  mouseDown: function(evt) {
    this.mousedown = this.getMouse();
    this.mousemoved = false;

    // place point, or drag point around
    if (evt.button === 0) {

      // 1) overlapping action?
      var over = mouseOver(this.props.mouseX, this.props.mouseY, this.contours);
      if (over) {

        // close shape
        if (over.pointObj === this.points[0]) {
          if (this.point.front && !this.points[0].back) {
            // curve-correct the last point.
            var p = this.point;
            var c1 = p.front;
            var ik = 1 / 0.55228;
            var real = {
              x: p.x + (c1.x-p.x)*ik,
              y: p.y + (c1.y-p.y)*ik
            };
            var corrected = kappa(this.points[0], real);
            this.points[0].back = corrected;
          }
          this.closeShape();
          this.startShape();
        }

        //start dragging a point around?
        else { this.setState({ activePoint: over }); }
      }

      // 2) nope. Just place a point.
      else {

        var x = this.props.gridX;
        var y = this.props.gridY;
        this.addPoint(x,y);

        var prev = this.points.slice(-2)[0];
        if(prev && prev.front) {
          // curve-correct
          var p = this.point;
          var c1 = prev.front;
          var ik = 1 / 0.55228;
          var real = {
            x: prev.x + (c1.x-prev.x)*ik,
            y: prev.y + (c1.y-prev.y)*ik
          };
          this.point.back = kappa(this.point, real);
        }
      }

    }
  },

  mouseMove: function(evt) {
    if (this.mousedown) {

      this.mousemoved = true;

      // 1) moving existing point ?
      if (this.state.activePoint) {
        var p = this.state.activePoint.pointObj;
        var db = {x:0,y:0}, df = {x:0,y:0};
        if (p.back) { db.x = p.x - p.back.x; db.y = p.y - p.back.y; }
        if (p.front) { df.x = p.front.x - p.x; df.y = p.front.y - p.y; }
        p.x = this.props.mouseX;
        p.y = this.props.mouseY;
        if (p.back) { p.back.x = p.x - db.x; p.back.y = p.y - db.y; }
        if (p.front) { p.front.x = p.x + df.x; p.front.y = p.y + df.y; }
        this.props.invalidate();
      }

      // 2) determine curvature control point
      else if(dist(this.mousedown, this.getMouse())>10) {
        var curr = this.point,
            prev = false,
            front,
            back,
            corrected;

        var x = this.props.mouseX - this.props.offsetX;
        var y = this.props.mouseY - this.props.offsetY;

        // construct outbound control point from current point, kappa corrected
        front = { x: x, y: y };
        corrected = kappa(curr, front);
        this.setRightControl(corrected.x, corrected.y);

        // construct inbound control point from current point, kappa corrected
        back = { x: curr.x - (x - curr.x), y: curr.y - (y - curr.y)};
        corrected = kappa(curr, back);
        this.setLeftControl(corrected.x, corrected.y);

        // is there a previous point that we need to "massage"?
        if (this.points.length > 1) {
          prev = this.points.slice(-2)[0];
          if (!prev.front) {
            // plain point: invent an aesthetic control point for it
            if(!prev.back) {
              corrected = kappa(prev, back);
              prev._front = corrected;
            }
            // not a plain point: we need to project [back] onto the
            // control line for this point, to keep with aesthetics.
            else {
              var projected = project(back, prev, prev.back);
              corrected = kappa(prev, projected);
              prev._front = corrected;
            }
          }
        }
        this.setState({
          hideCursor: true,
          points: this.points
        });
      }

    }
  },

  mouseUp: function(evt) {
    if (evt.button === 0) {
      // mouseclick on a repositionable point?
      if (this.state.activePoint && !this.mousemoved) {
        var p = this.state.activePoint.pointObj;

        // turn into plain point
        if((p.front || p.back) && !p.cache) {
          p.cache = {};
          if (p.front) {
            p.cache.front = p.front;
            p.front = false;
          }
          if (p.back) {
            p.cache.back = p.back;
            p.back = false;
          }
        }

        // delete control point?
        else if (this.state.activePoint.point.indexOf && this.state.activePoint.point.indexOf(".")>-1) {
          var confirmed = confirm("Delete control point? (this cannot be undone");
          if (confirmed) {
            var c = this.state.activePoint.contour;
            var contour = this.contours[c];
            var compounds = this.state.activePoint.point.split(".");
            var pt = compounds[0];
            var owner = contour[pt];
            var aspect = compounds[1];
            owner[aspect] = false;
            this.setState({
              activePoint: false
            });
          }
        }

        // turn back into curve point
        else if (p.cache) {
          if (p.cache.front) {
            p.front = p.cache.front;
          }
          if (p.cache.back) {
            p.back = p.cache.back;
          }
          p.cache = false;
        }

        // turn into a curve point, by inventing control points
        else {
          // find the previous and next point(s)
          var c = this.state.activePoint.contour;
          var contour = this.contours[c];
          var clen = contour.length;
          var cpt = this.state.activePoint.point;

          var ppt = cpt - 1;
          if (cpt === 0) { ppt = clen - 1; }
          var prev = contour[ppt];

          var npt = cpt + 1;
          if (npt >= clen) { npt = 0; }
          var next = contour[npt];

          // invent control points based on (prev--next)
          var dx = 0.55228 * (next.x - prev.x)/2;
          var dy = 0.55228 * (next.y - prev.y)/2;

          if(dx === 0 && dy === 0) { dx = 10; }

          p.front = {x: p.x + dx, y: p.y + dy };
          p.back  = {x: p.x - dx, y: p.y - dy };
        }

        this.props.invalidate();
        this.setState({ contours: this.contours });
      }
    }
    var cpt = this.points.slice(-2)[0];
    if (cpt && cpt._front) {
      cpt.front = cpt._front;
      delete cpt._front;
    }

    this.mousedown = false;

    this.setState({
      hideCursor: false,
      activePoint: false
    });
  }

});
