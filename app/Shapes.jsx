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
      return <Contour points={points} cid={idx} ref={idx + '-' + points.length} key={"c"+idx} />;
    });
    var ox = this.props.offsetX;
    var oy = this.props.offsetY;
    var group = <g transform={"translate("+ox+","+oy+")"}>{contours}</g>;
    return group;
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
      this.points = contours.slice(-1)[0];
      this.points.closed = false;
      this.setState({ contours: this.contours });
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
    // place point
    if (evt.button === 0) {
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
  },

  mouseMove: function(evt) {
    if (this.mousedown && dist(this.mousedown, this.getMouse())>10) {
      this.mousemoved = true;

      // FIXME: clamped control cubics are very ugly, so here is where
      //        we want to do kappa offsetting, instead, in a way that
      //        shows where WE are dragging, and where the kappa points
      //        will be placed instead. This involves showing what's
      //        happening for the previous point, too...

      var curr = this.point, prev=false, front, back, corrected;

      var x = this.props.mouseX - this.props.offsetX;
      var y = this.props.mouseY - this.props.offsetY;

      // construct outbound control point from current point, kappa corrected
      front = { x: x, y: y };
      corrected = kappa(curr, front);
      this.setRightControl(corrected.x, corrected.y);

      // construct inbound control point from current point, kappa corrected
      back = {
        x: curr.x - (x - curr.x),
        y: curr.y - (y - curr.y)
      };
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


      this.setState({ points: this.points });
    }
  },

  mouseUp: function(evt) {
    if (this.mousemoved ) {
      //console.log("drag");
    } else {
      //console.log("click");
    }
    if (evt.button !== 0) {
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
    var cpt = this.points.slice(-2)[0];
    if (cpt && cpt._front) {
      cpt.front = cpt._front;
      delete cpt._front;
    }
    this.mousedown = false;
  }

});
