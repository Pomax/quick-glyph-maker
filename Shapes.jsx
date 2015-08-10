var Shapes = React.createClass({
  statics: {
    cleanSVG: function(svg) {
      // Clean up SVG code here, because the unification
      // process will happily turn M 0 0 L 1 1 L 2 2 into
      // M 0 0 C 0 0 1 1 1 1 C 1 1 2 2 2 2 for ... reasons?
      var _svg;
      var round = function(v) { return ((10000*v)|0)/10000; };

      // step 1: remove any meaningless segments
      while (svg !== _svg) {
        _svg = svg;
        svg = _svg.replace(/((\d+(\.\d+)?,\d+(\.\d+)?)C(\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?))/g, function(a,b,c,_,__,d) {
          c = c.split(",").map(round);
          d = d.split(",").map(round);
          if(c[0] === d[0] && c[1] === d[1]) {
            // meaningless segment?
            if (d[0] === d[2] && d[2] === d[4] && d[1] === d[3] && d[3] === d[5]) {
              return c.join(',');
            }
            // obvious line segment
            if (d[2] === d[4] && d[3] === d[5]) {
              return c.join(',') + 'L' + d.slice(4).join(',');
            }
          }
          // non-obviouse line segment
          var dx = d[4]-c[0], dy = d[5]-c[1];
          if (dx && dy) {
            // do d[0,1] and d[2,3] lie on the line pre--post?
            var  r = round( dy/dx ),
                r1 = round( (d[1] - c[1])/(d[0] - c[0]) || r ),
                r2 = round( (d[3] - c[1])/(d[2] - c[0]) || r );
            if (r===r1 && r1===r2) {
              return c.join(',') + 'L' + d.slice(4).join(',');
            }
          }
          return c.join(',')+'C'+d.join(',');
        });
      }
      console.log(svg);

      return svg;
    },
    pointToSVGPath: function(points, p, idx) {
      return function(p,idx) {
        if (p.back) {
          var b = p.back;
          var p1 = points[idx-1];
          if (p1) {
            var kappa = 0.9;
            var x1 = p1.x + (b.x-p1.x)*kappa;
            var y1 = p1.y + (b.y-p1.y)*kappa;
            var x2 = b.x + (p.x-b.x)*kappa;
            var y2 = b.y + (p.y-b.y)*kappa;
            return ['C',x1,y1,x2,y2,p.x,p.y].join(' ');
          }
          return ['C',b.x,b.y,b.x,b.y,p.x,p.y].join(' ');
        }
        return ['L',p.x,p.y].join(' ');
      };
    },
    pointsToSVGPath: function(points, closed) {
      var path = points.map(Shapes.pointToSVGPath(points));
      if (points[0]) {
        var p = points[0];
        path = ['M',p.x,p.y].concat(path).join(' ');
        if (closed) { path += ' Z'; }
      }
      return path;
    }
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