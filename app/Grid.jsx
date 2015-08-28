var Grid = React.createClass({
  statics: {
    getSnapped: function(options) {
      var d = options.d*2,
          w = options.w/d,
          h = options.h/d;
      return {
        x: w * Math.round(options.x/w),
        y: h * Math.round(options.y/h)
      };
    }
  },
  
  getInitialState: function() {
    return {
      divisions: this.props.divisions || 4,
      offsetX: 0,
      offsetY: 0,
      _offsetX: 0,
      _offsetY: 0
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
      var o = this.getOffset();
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

      // out of quad, above baseline
      props.stroke = "rgb(150,150,200)";
      lines.push(
        <rect x={-w} y={-h} width={w} height={2*h} fill="rgba(0,0,200,0.2)" stroke="none"/>
        ,
        <rect x={0} y={-h} width={w} height={h} fill="rgba(0,200,0,0.2)" stroke="none"/>
        ,
        <rect x={w} y={-h} width={w} height={2*h} fill="rgba(0,0,200,0.2)" stroke="none"/>
      );      
      for(var i=this.state.divisions*3; i>=0; i--) {
        if(i<this.state.divisions*2) {
          props.d = ['M', -w, (i*y)-h, 'L', 2*w, (i*y)-h].join(' ');
          lines.push(<path {...props} />);
        }
        props.d = ['M', (i*x)-w, -h, 'L', (i*x)-w, h].join(' ');
        lines.push(<path {...props} />);
      }

      // out of quad, below baseline
      props.stroke = "rgb(200,150,150)";
      lines.push(
        <rect x={-w} y={h} width={3*w} height={h} fill="rgba(200,0,0,0.2)" stroke="none"/>
      );                   
      for(var i=this.state.divisions*3; i>=0; i--) {
        if(i<=this.state.divisions) {
          props.d = ['M', -w, (i*y)+h, 'L', 2*w, (i*y)+h].join(' ');
          lines.push(<path {...props} />);
        }
        props.d = ['M', (i*x)-w, h, 'L', (i*x)-w, 2*h].join(' ');
        lines.push(<path {...props} />);
      }
                   
      // in-quad
      props.stroke = "lightgrey";
      lines.push(
        <rect x={0} y={0} width={w} height={h} fill="white" stroke="none"/>
      );
      for(var i=this.state.divisions; i>=0; i--) {
        props.d = ['M 0',(i*y),'L',w,(i*y)].join(' ');
        lines.push(<path {...props} />);
        props.d = ['M',(i*x),'0 L',(i*x),h].join(' ');
        lines.push(<path {...props} />);
      }

      // main grid frame
      lines.push(
        <rect x={-1} y={-1} width={w+2} height={h+2} fill="none" stroke="black"/>
      );

      // baseline
      lines.push(
        <rect x={-w} y={h} width={3*w} height={2} fill="red" stroke="purple"/>
      );

      this.divisions = lines;
    }
    return this.divisions;
  },
                   
  getPosition: function() {
    var p = this.props;
    var o = this.getOffset();
    return Grid.getSnapped({
      x: p.mouseX - o.x,
      y: p.mouseY - o.y,
      w: p.width,
      h: p.height,
      d: this.state.divisions
    });
  },
    
  getOffset: function() {
    var ox = this.state.offsetX + this.state._offsetX;
    var oy = this.state.offsetY + this.state._offsetY;
    return { x: ox, y: oy };
  },
    
  render: function() {
    var snapped = this.getPosition();
    var o = this.getOffset();
    return <g>
      <g transform={ "translate(" + o.x + "," + o.y + ")"}>
        { this.generateDivisions() }
      </g>
    </g>;
  },
    
  mouseDown: function(evt) {
    if (evt.button === 0) {
      this.mark = {
        x: this.props.mouseX,
        y: this.props.mouseY
      };
    }
  },

  mouseMove: function(evt, callback) {
    var curr = {
      x: this.props.mouseX,
      y: this.props.mouseY
    };
    if (this.mark) {
      this.setState({
        _offsetX: curr.x - this.mark.x,
        _offsetY: curr.y - this.mark.y
      }, function() {
        callback(this.getOffset());
      });
    }
  },

  mouseUp: function(evt) {
    if (evt.button === 0) {
      this.mark = false;
      this.setState({
        offsetX: this.state.offsetX + this.state._offsetX,
        _offsetX: 0,
        offsetY: this.state.offsetY + this.state._offsetY,
        _offsetY: 0
      });
    }
  }
    
});
