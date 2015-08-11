var App = React.createClass({
  statics: {
    compound: function(w, h, contours) {
      var canvas = document.createElement("myCanvas");
      canvas.width = w;
      canvas.height = h;
      paper.setup(canvas);
      var compound = new paper.CompoundPath();
      contours.forEach(function(contour) {
        compound.addChild(new paper.Path(Shapes.pointsToSVGPath(contour,true)));
      });
      var path = compound.exportSVG();
      var d = path.getAttribute("d");
      return d;
    },
    unify: function(w, h, path1, path2) {
      var canvas = document.createElement("myCanvas");
      canvas.width = w;
      canvas.height = h;
      paper.setup(canvas);
      path1 = new paper.Path(path1);
      path2 = new paper.Path(path2);
      unified = path1.unite(path2);
      var d, path = unified.exportSVG();
      if (path.nodeName.toLowerCase() === "polygon") {
        var points = path.getAttribute('points').split(/\s+|,/);
        var x0=points.shift(), y0=points.shift();
        var d = 'M'+x0+','+y0+'L'+points.join(' ')+"z";
      } else { d = path.getAttribute("d"); }
      return d;
    }
  },
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
             onMouseDown={this.mouseDown}
             onMouseMove={this.snap}
             onMouseUp={this.mouseUp}

             style={{zIndex:1000}} />
        <svg width={w} height={h}>
          <Grid ref="grid" width={w} height={h} divisions={this.state.divisions} mouseX={mx} mouseY={my} curve={this.state.mode==='curve'}/>
          { contours }
          <Shapes ref="lines" width={w} height={h} temp={temp} control={this._mousedown} />
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
    var w = this.props.width;
    var h = this.props.height;
    /*
    var unified = Shapes.pointsToSVGPath(contours[0], true);
    if (contours.length > 1) {
      contours.slice(1).forEach(function(contour) {
        unified = App.unify(w, h, unified, Shapes.pointsToSVGPath(contour, true));
      });
    }
    */
    var unified = App.compound(w, h, contours);
    this.setState({ dpreview: unified }, function() { this.clear(); });
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
  mouseUp: function(evt) {
    if (evt.button === 0) {
      if (this.state.dpreview) {
        this.setState({ dpreview: false });
      }
      var mark = this.mark;
      var ref = this.temp;
      if (ref && (ref.x !== mark.x || ref.y !== mark.y)) {
        this.refs.lines.setControl(ref);
      }
      this.mark = false;
      this.temp = false;
    }
    this._mousedown = false;
  },
  snap: function(evt) {
    evt = evt.nativeEvent;
    x = evt.offsetX;
    y = evt.offsetY;
    if (this.mark) { this.temp = this.refs.grid.getPosition(); }
    this.setState({ mouseX: x, mouseY: y});
  },
  mouseDown: function(evt) {
    if (evt.button == 0) {
      this.mark = this.refs.grid.getPosition();
      this.refs.lines.addPoint(this.mark);
    } else {
      var contour = this.refs.lines.close();
      var contours = this.state.contours;
      contours.push(contour);
      this.refs.lines.clear();
      this.setState({ contours: contours });
    }
    this._mousedown = true;
  }
});
