var Shapes = React.createClass({
  getInitialState: function() {
    this.clear(true);
    return { contours: [] };
  },

  render: function() {
    var contours = this.state.contours.map(function(points, idx) {
      return <Contour points={points} cid={idx} ref={idx + '-' + points.length}/>;
    });
    var ox = this.props.offsetX;
    var oy = this.props.offsetY;
    return <g transform={"translate("+ox+","+oy+")"}>{contours}</g>;
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
      return;
    }

    // remove last added point
    var points = this.points;
    last = points.length -1;
    points.splice(last,1);
    this.setState({ contours: this.contours });
  },

  clear: function(bypass) {
    this.point = false;
    this.points = [];
    this.contours = [this.points];
    this.setState({ contours: [] });
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
      this.point = {
        x: this.props.gridX,
        y: this.props.gridY
      };
      this.points.push(this.point);
      this.setState({ contours: this.contours });
    }
  },

  mouseMove: function(evt) {
    if (this.mousedown && dist(this.mousedown, this.getMouse())>10) {
      this.mousemoved = true;
      var p = this.point;
      var x = this.props.mouseX - this.props.offsetX;
      var y = this.props.mouseY - this.props.offsetY;
      var dx = x - p.x;
      var dy = y - p.y;
      p.front = { x:x, y:y };
      p.back = { x:p.x-dx, y:p.y-dy };
      this.setState({ points: this.points });
    }
  },

  mouseUp: function(evt) {
    if (this.mousemoved ) {
      console.log("drag");
    } else {
      console.log("click");
    }
    if (evt.button !== 0) {
      console.log("not left click");
      this.points.closed = true;
      this.points = [];
      this.contours.push(this.points);
      this.setState({ contours: this.contours });
    }
    this.mousedown = false;
  }
});
