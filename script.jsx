var Grid = React.createClass({
  statics: {
    getSnapped: function(x,y,w,h,d) {
      d = d*2;
      w = w/d;
      h = h/d;
      return {
        x: w * Math.round(x/w),
        y: h * Math.round(y/h)
      };
    }
  },
  getInitialState: function() {
    return {
      divisions: this.props.divisions || 4
    };
  },
  componentDidUpdate: function() {
    if (this.props.divisions !== this.state.divisions) {
      this.setState({
        divisions: this.props.divisions
      }, function() {
        this.divisions = false;
        this.generateDivisions();
      });
    }
  },
  generateDivisions: function() {
    if (!this.divisions) {
      var w = this.props.width;
      var h = this.props.height;
      var d = this.state.divisions;
      var x = w/d;
      var y = h/d;
      var lines = [];
      var props = {
        fill: "none",
        stroke: "lightgrey"
      };
      for(var i=this.state.divisions; i>=0; i--) {
        props.d = ['M 0',(i*y),'L',w,(i*y)].join(' ')
        lines.push(<path {...props} />);
        props.d = ['M',(i*x),'0 L',(i*x),h].join(' ')
        lines.push(<path {...props} />);
      }
      this.divisions = lines;
    }
    return this.divisions;
  },
  getPosition: function() {
    var snapped = Grid.getSnapped(this.props.mouseX,
                                  this.props.mouseY,
                                  this.props.width,
                                  this.props.height,
                                  this.state.divisions);
    return snapped;
  },
  render: function() {
    var snapped = this.getPosition();
    return <g>
      { this.generateDivisions() }
      <circle r={10} cx={snapped.x} cy={snapped.y} fill="none" stroke="black"/>
    </g>;
  }
});

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
  render: function() {
    var points = this.state.points;

    var props = {
      fill:  this.state.closed ? "rgba(255,0,200,0.3)" : "none",
      stroke: this.state.closed ? "blue" : "black"
    };

    // are we drawing a line?
    var temp = this.props.temp;
    if (temp) {
      props.d = this.formLine(points.slice(-1)[0], temp);
      temp = <path {...props}/>;
    }

    // already committed shape:
    var polyline = points.map(function(p) {
      if (!p.c) {
        return ['L',p.x,p.y].join(' ');
      } else {
        // TODO: arc mode
      }
    });

    var p0 = points[0];
    if (p0) {
      polyline = ['M',p0.x,p0.y].concat(polyline).join(' ');
      if (this.state.closed) { polyline += ' Z'; }
      props.d = polyline;
      polyline = <path {...props}/>
    }

    return (
      <g>{ polyline }{ temp }</g>
    );
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



var App = React.createClass({
  getInitialState: function() {
    return {
      mouseX: this.props.width/2,
      mouseY: this.props.height/2,
      divisions: 10,
      contours: []
    };
  },
  render: function() {
    var w = this.props.width;
    var h = this.props.height;
    var mx = this.state.mouseX;
    var my = this.state.mouseY;
    var temp = !this.mark ? false : this.temp;

    var contours = this.state.contours.map(function(points) {
      return <Shapes width={w} height={h} points={points} closed={true} />
    });

    return (
      <div>
        <svg width={w} height={h}
             onMouseMove={this.snap}
             onMouseUp={this.placePoint}
             onMouseDown={this.end}
             style={{zIndex:1000}} />
        <svg width={w} height={h}>
          <Grid ref="grid" width={w} height={h} divisions={this.state.divisions} mouseX={mx} mouseY={my} />
          { contours }
          <Shapes ref="lines" width={w} height={h} temp={temp} />
        </svg>
        <svg width={w} height={h}>
          <path fill="rgba(0,0,0,0.3)" stroke="none" d={this.state.dpreview}/>
        </svg>
        <div className="controls">
          <button onClick={this.clear}>CLEAR</button>
          <button onClick={this.decRes}>decrease resolution</button>
          <button onClick={this.incRes}>increase resolution</button>
          <button onClick={this.unify}>FINALISE</button>
        </div>
        {this.state.dpreview ? <div className="dpreview">{this.state.dpreview}</div> : false }
      </div>
    );
  },
  unify: function() {
    var contours = this.state.contours;
    var unified = [contours[0]];
    if (contours.length > 1) {
      unified = union(contours[0], contours[1]);
      for(var i=2; i<contours.length; i++) {
        unified = pathsShapeUnion(unified, contours[i]);
      }
    }
    unifiedPath = drawUnified(this.props.width, this.props.height, unified);
    this.setState({ dpreview: unifiedPath }, function() {
      this.clear();
    });
  },
  clear: function() {
    this.refs.lines.clear();
    this.setState({ contours: [] });
  },
  decRes: function() {
    this.setState({
      divisions: this.state.divisions >> 1
    });
  },
  incRes: function() {
    this.setState({
      divisions: this.state.divisions << 1
    });
  },
  placePoint: function(evt) {
    if (evt.button === 0) {
      this.mark = this.refs.grid.getPosition();
      this.refs.lines.addPoint(this.mark);
      if (this.state.dpreview) {
        this.setState({ dpreview: false });
      }
    }
  },
  end: function(evt) {
    if (evt.button !== 0) {
      this.mark = false;
      this.temp = false;
      var contour = this.refs.lines.close();
      var contours = this.state.contours;
      contours.push(contour);
      this.refs.lines.clear();
      this.setState({ contours: contours });
    }
  },
  snap: function(evt) {
    evt = evt.nativeEvent;
    x = evt.offsetX;
    y = evt.offsetY;
    if (this.mark) {
      this.temp = this.refs.grid.getPosition();
    }
    this.setState({ mouseX: x, mouseY: y});
  }
});

React.render(<App width={600} height={600}/>, document.getElementById('app'));


