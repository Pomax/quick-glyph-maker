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
    var p = this.props;
    return Grid.getSnapped({
      x: p.mouseX,
      y: p.mouseY,
      w: p.width,
      h: p.height,
      d: this.state.divisions
    });
  },
  render: function() {
    var snapped = this.getPosition();
    return <g>
      { this.generateDivisions() }
      <circle {...{
        r: 10,
        cx: snapped.x,
        cy: snapped.y,
        fill: "none",
        stroke: this.props.curve ? "red" : "black"
      }}/>
    </g>;
  }
});
