var Shapes = React.createClass({
  statics: {
    pointToSVGPath: pointToSVGPath,
    pointsToSVGPath: pointsToSVGPath
  },
  getInitialState: function() {
    return {
      points: this.props.points || [],
      closed: this.props.closed || false
    }
  },
  formLine: function(p1, p2) {
    var w = this.props.width;
    var h = this.props.height;
    return ['M',p1.x,p1.y,'L',p2.x,p2.y].join(' ');
  },
  getTemp: function(points, props) {
    var temp = this.props.temp;
    if (temp) {
      props.d = this.formLine(points.slice(-1)[0], temp);
      return <path {...props}/>;
    }
    return false;
  },
  getPolyLine: function(points, props) {
    props.d = Shapes.pointsToSVGPath(points, this.state.closed);
    return <path {...props}/>;
  },
  getMarkers: function(points, props) {
    return points.map(function(p) {
      return <circle cx={p.x} cy={p.y} r={5} {...props}/>;
    });
  },
  render: function() {
    var points = this.state.points;
    var props = {
      fill:  this.state.closed ? "rgba(255,0,200,0.3)" : "none",
      stroke: this.state.closed ? "blue" : "black"
    };
    var polyline = this.getPolyLine(points, props);
    var temp = this.getTemp(points, props);
    var markers = this.getMarkers(points, props);
    return <g>
      {polyline}
      {temp}
      {markers}
    </g>;
  },
  addPoint: function(p) {
    var points = this.state.points;
    var last = points.slice(-1)[0];
    if (last && last.front) {
      p.back = last.front;
      last.front = false;
    }
    points.push(p);
    this.setState({points: points});
  },
  setControl: function(front) {
    var points = this.state.points.reverse();
    var p  = points[0];
    p.front = front;
    p.back = {
      x: p.x - (front.x-p.x),
      y: p.y - (front.y-p.y)
    };
    points = points.reverse();
    this.setState({points: points});
  },
  close: function() {
    this.setState({ closed: true });
    return this.state.points.slice();
  },
  clear: function() {
    this.setState({ points: [], closed: false });
  }
});