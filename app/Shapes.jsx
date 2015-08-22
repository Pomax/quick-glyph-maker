var Shapes = React.createClass({
  getInitialState: function() {
    this.clear();
    return {
      contours: []
    };
  },

  render: function() {
    var contours = this.state.contours.map(function(points, idx) {
      return <Contour points={points} cid={idx} ref={idx + '-' + points.length} />;
    });
    var ox = this.props.offsetX;
    var oy = this.props.offsetY;
    return <g transform={"translate("+ox+","+oy+")"}>{contours}</g>;
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
    var update = this.contours;
    this.setState({
      contours: update
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

      var p = this.point;
      var x = this.props.mouseX - this.props.offsetX;
      var y = this.props.mouseY - this.props.offsetY;
      var dx = x - p.x;
      var dy = y - p.y;
      this.setRightControl(x, y);
      this.setLeftControl(p.x - dx, p.y - dy);
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
      //console.log("not left click");
      this.closeShape();
      this.startShape();
    }
    this.mousedown = false;
  }
});
