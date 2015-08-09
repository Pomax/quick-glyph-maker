var App = React.createClass({
  getInitialState: function() {
    return {
      mouseX: this.props.width/2,
      mouseY: this.props.height/2,
      divisions: 10,
      contours: [],
      mode: false
    };
  },
  componentDidMount: function() {
    var setMode = function(mode) {
      this.setState({ mode: mode });
    }.bind(this);
    document.addEventListener("keydown", function(evt) {
      if (evt.key.toLowerCase() === 'c') {
        setMode("curve");
      }
    });
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
          <Grid ref="grid" width={w} height={h} divisions={this.state.divisions} mouseX={mx} mouseY={my} curve={this.state.mode==='curve'}/>
          { contours }
          <Shapes ref="lines" width={w} height={h} temp={temp} />
        </svg>
        <svg width={w} height={h}>
          <path fill="rgba(0,0,0,0.3)" stroke="black" d={this.state.dpreview}/>
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
      if(this.state.mode === 'curve') {
        this.mark.curve = true;
        this.setState({ mode: false });
      }
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
