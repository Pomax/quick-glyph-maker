var App = React.createClass({
  getInitialState: function() {
    return {
      mouseX: this.props.width/2,
      mouseY: this.props.height/2,
      divisions: 10
    };
  },
  componentDidMount: function() {
    var setMode = function(mode) {
      this.setState({ mode: mode });
    }.bind(this);
    document.addEventListener("keydown", function(evt) {
      if (evt.key && evt.key.toLowerCase() === 'c') {
        setMode("curve");
      }
    });
  },
  componentDidUpdate: function() {
    if (this.refs.prevpath) {
      var node = React.findDOMNode(this.refs.prevpath);
      node.setAttribute("fill-rule", "evenodd");
    }
  },
  render: function() {
    var w = this.props.width;
    var h = this.props.height;
    var temp = !this.mark ? false : this.temp;
    var shapes = <Shapes ref="shapes" {...{
      mouseX: this.state.mouseX,
      mouseY: this.state.mouseY,
      gridX: this.state.gridX,
      gridY: this.state.gridY
    }}/>;

    return (
      <div>
        <svg ref="handler" {...{
          width: w,
          height: h,
          style: { zIndex: 10 },
          onMouseDown: this.mouseDown,
          onMouseMove: this.mouseMove,
          onMouseUp: this.mouseUp
        }}/>

        <svg width={w} height={h} style={{zIndex: 5}}>{ shapes }</svg>

        <svg width={w} height={h}>
          {this.state.dpreview ? <path ref="prevpath" fill="rgba(0,0,0,0.3)" stroke="black" d={this.state.dpreview}/> : false }
          <Grid ref="grid" {...{
            width: w,
            height: h,
            divisions: this.state.divisions,
            mouseX: this.state.mouseX,
            mouseY: this.state.mouseY
          }}/>
        </svg>

        <div className="controls">
          <button onClick={this.clear}>CLEAR</button>
          <button onClick={this.decRes}>decrease resolution</button>
          <button onClick={this.incRes}>increase resolution</button>
          <button onClick={this.collapse}>FINALISE</button>
        </div>

        {this.state.dpreview ? <div className="dpreview">{this.state.dpreview}</div> : false }
      </div>
    );
  },

  clear: function() {
    this.refs.shapes.clear();
    this.setState({ dpreview: false });
  },

  decRes: function() {
    this.setState({ divisions: this.state.divisions >>> 1 || 0});
  },

  incRes: function() {
    this.setState({ divisions: this.state.divisions << 1 });
  },

  collapse: function() {
    var w = this.props.width;
    var h = this.props.height;
    var d = unify(w, h, this.refs.shapes.contours);
    this.setState({ dpreview: d });
  },

  mouseDown: function(evt) {
    this.refs.shapes.mouseDown(evt);
  },

  mouseUp: function(evt) {
    this.refs.shapes.mouseUp(evt);
  },

  mouseMove: function(evt) {
    if(evt.currentTarget !== evt.nativeEvent.target) return;
    evt = evt.nativeEvent;
    x = evt.offsetX;
    y = evt.offsetY;
    var snapped = this.refs.grid.getPosition();
    this.setState({
      mouseX: x,
      mouseY: y,
      gridX: snapped.x,
      gridY: snapped.y
    }, function() {
      this.refs.shapes.mouseMove(evt);
    });
  }
});
