function getCurveFrom(p1, p2, p3) {
  if(!!p3) {
    var c = abstractor.getCCenter(p1,p2,p3);
    var largeArcFlag = 0;
    var SweepFlag = c.f ? 0 : 1;
    var arcto = ['A', c.r, c.r, 0, largeArcFlag, SweepFlag, p3.x, p3.y].join(' ');
    return arcto;
  }
  return ['L', p2.x, p2.y].join(' ');
}

var Shapes = React.createClass({
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
    var polyline = points.map(function(p,idx) {
      if (!p.curve) {
        return ['L',p.x,p.y].join(' ');
      } else {
        // construct an arc through this point
        return getCurveFrom(points[idx-1], p, points[idx+1]);
      }
    });

    if (points[0]) {
      var p = points[0];
      polyline = ['M',p.x,p.y].concat(polyline).join(' ');
      if (this.state.closed) { polyline += ' Z'; }
      props.d = polyline;
      polyline = <path {...props}/>
    }

    return polyline;
  },
  render: function() {
    var points = this.state.points;
    var props = {
      fill:  this.state.closed ? "rgba(255,0,200,0.3)" : "none",
      stroke: this.state.closed ? "blue" : "black"
    };
    var polyline = this.getPolyLine(points, props);
    var temp = this.getTemp(points, props);
    return <g>{polyline}{temp}</g>;
  },
  addPoint: function(p) {
    var points = this.state.points;
    points.push(p);
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