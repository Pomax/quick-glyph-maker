function overPoint(point, i, j, x, y) {
  var dx = Math.abs(x - point.x);
  var dy = Math.abs(y - point.y);
  var d  = Math.sqrt(dx*dx + dy*dy);
  var max = 5;
  var ret = { contour: i, point: j, pointObj: point };
  if (d<=max) return ret;

  if(point.front) {
    dx = Math.abs(x - point.front.x);
    dy = Math.abs(y - point.front.y);
    d = Math.sqrt(dx*dx + dy*dy);
    if (d<=max) {
      ret.point += ".front";
      ret.pointObj = point.front;
      return ret;
    }
  }

  if(point.back) {
    dx = Math.abs(x - point.back.x);
    dy = Math.abs(y - point.back.y);
    d = Math.sqrt(dx*dx + dy*dy);
    if (d<=max) {
      ret.point += ".back";
      ret.pointObj = point.back;
      return ret;
    }
  }
  return false;
}

function mouseOver(x, y, contours) {
  var i,cl=contours.length,contour,j,pl,point,dx,dy,d;
  for (i=0; i<cl; i++) {
    contour = contours[i];
    for (j=0; j<contour.length;j++) {
      point = contour[j];
      var result = overPoint(point, i, j, x, y);
      if(result) return result;
    }
  }
  return false;
}


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
    var ox = this.props.offsetX;
    var oy = this.props.offsetY;
    var group = <g transform={"translate("+ox+","+oy+")"}>{contours}</g>;
    return group;
  },

  setActivePoint: function(contour, pid) {
    this.activePoint = {
      contour: contour,
      pid: pid
    };
    console.log(this.activePoint);
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

    // place point, or drag point around
    if (evt.button === 0) {

      // 1) start dragging a point around?
      this.activePoint = false;
      var over = mouseOver(this.props.mouseX, this.props.mouseY, this.contours);
      if (over) { this.activePoint = over.pointObj; }

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
      if (this.activePoint) {
        var p = this.activePoint;
        var db={x:0,y:0}, df={x:0,y:0};
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
        this.setState({ points: this.points });
      }

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
    else {
      // mouseclick on a repositionable point?
      if (this.activePoint && !this.mousemoved) {
        // turn into plain point
        if(!this.activePoint.cache) {
          this.activePoint.cache = {};
          if (this.activePoint.front) {
            this.activePoint.cache.front = this.activePoint.front;
            this.activePoint.front = false;
          }
          if (this.activePoint.back) {
            this.activePoint.cache.back = this.activePoint.back;
            this.activePoint.back = false;
          }
        }
        // turn into curve point
        else if (this.activePoint.cache) {
          if (this.activePoint.cache.front) {
            this.activePoint.front = this.activePoint.cache.front;
          }
          if (this.activePoint.cache.back) {
            this.activePoint.back = this.activePoint.cache.back;
          }
          this.activePoint.cache = false;
        }
      }
    }
    var cpt = this.points.slice(-2)[0];
    if (cpt && cpt._front) {
      cpt.front = cpt._front;
      delete cpt._front;
    }
    this.mousedown = false;
  }

});
