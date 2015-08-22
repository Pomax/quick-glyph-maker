var App = React.createClass({
  getInitialState: function() {
    return {
      mouseX: this.props.width/2,
      mouseY: this.props.height/2,
      offsetX: 0,
      offsetY: 0,
      zoom: 0.85,
      divisions: 10,
      glyphName: false,
      glyphmap: new GlyphMap(this.props.width, this.props.height)
    };
  },
  componentDidMount: function() {
    // we don't want context menus to pop up while drawing
    var list = document.querySelectorAll("svg");
    Array.prototype.forEach.call(list, function(svg) {
      svg.oncontextmenu = function(){ return false; };
    });

    // this is ... odd, but necessary
    document.addEventListener("keyup", this.keyUp);
    document.addEventListener("keydown", this.keyDown);

    // this is simply necessary because React doesn't have it
    var svgnode = React.findDOMNode(this.refs.handler);
    svgnode.addEventListener("wheel", this.scroll);
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
      gridY: this.state.gridY,
      offsetX: this.state.offsetX,
      offsetY: this.state.offsetY
    }}/>;

    var xmlForm = false;
    var d = this.state.dpreview;
    if (d) {
      xmlForm = <div className="previews">
        <h2>SVG path</h2>
        <div className="SVG">{ d }</div>
        <h2>TTX glyph definition</h2>
        <div className="TTX">{ toTTX(this.state.glyphName, d, w, h) }</div>
      </div>
    }

    var className = [];
    if (this.state.gridDrag) { className.push("grab"); }
    if (this.state.dragging) { className.push("dragging"); }
    className = className.length > 0 ? className.join(' ') : false;

    return (
      <div className={className}>
        <div className="panels">
          <svg ref="handler" {...{
            width: w,
            height: h,
            style: { zIndex: 10 },
            onMouseDown: this.mouseDown,
            onMouseMove: this.mouseMove,
            onMouseUp: this.mouseUp
          }}/>

          <svg width={w} height={h} style={{zIndex: 5}}>
            {this.state.dpreview ? (
            <g transform={"translate("+this.state.offsetX+","+this.state.offsetY+")"}>
              <path ref="prevpath" fill="rgba(0,0,0,0.3)" stroke="black" d={this.state.dpreview}/>
            </g> ): false }
            { shapes }
          </svg>

          <svg width={w} height={h}>
            <Grid ref="grid" {...{
              width: w,
              height: h,
              divisions: this.state.divisions,
              mouseX: this.state.mouseX,
              mouseY: this.state.mouseY,
              drag: this.state.gridDrag
            }}/>
          </svg>
        </div>

        <div className="controls">
          <span className="coordinates">{this.state.gridX||0}/{this.state.gridY||0}</span>
          <button onClick={this.clear}>NEW</button>
          <button onClick={this.decRes}>Decrease resolution</button>
          <button onClick={this.incResaves}>Increase resolution</button>
          <button onClick={this.save}>Save</button>
        </div>

        <Project ref="project" glyphmap={this.state.glyphmap} loadGlyph={this.load} />

        { xmlForm }
      </div>
    );
  },

  load: function(name, d) {
    console.log("loading",name,":",d);
    this.setState({
      glyphName: name,
      dpreview: false
    }, function() {
      this.refs.shapes.load(d);
    });
  },

  clear: function() {
    this.refs.shapes.clear();
    this.setState({
      dpreview: false,
      glyphName: false
    });
  },

  decRes: function() {
    this.setState({ divisions: this.state.divisions >>> 1 || 0});
  },

  incRes: function() {
    this.setState({ divisions: this.state.divisions << 1 });
  },

  save: function() {
    var glyphName = this.state.glyphName || prompt("Please specify a glyph name");
    if (!glyphName) return;

    var w = this.props.width;
    var h = this.props.height;
    var d = unify(w, h, this.refs.shapes.contours);
    this.setState({
      glyphName: glyphName,
      dpreview: d
    });
    this.refs.project.save(glyphName, d);
  },

  scroll: function(evt) {
    var v =  -(evt.deltaY/100);
    this.setState({
      zoom: this.state.zoom + v
    });
  },

  keyDown: function(evt) {
    if (evt.key===" ") {
      evt.preventDefault();
      this.setState({ gridDrag: true });
    }
    // undo last point placement
    if (evt.key==="z" || evt.key==="Z") {
      if (evt.ctrlKey || evt.metaKey) {
        this.refs.shapes.undo();
      }
    }
  },

  keyUp: function(evt) {
    if (evt.key===" ") {
      evt.preventDefault();
      this.setState({ gridDrag: false });
    }
  },

  mouseDown: function(evt) {
    if(this.state.gridDrag) {
      this.setState({
        dragging: this.state.gridDrag
      });
      this.refs.grid.mouseDown(evt);
    } else {
      this.refs.shapes.mouseDown(evt);
    }
  },

  mouseUp: function(evt) {
    if(this.state.gridDrag) {
      this.setState({ dragging: false });
      this.refs.grid.mouseUp(evt);
    } else {
      this.refs.shapes.mouseUp(evt);
    }
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
      if (this.state.gridDrag) {
        this.refs.grid.mouseMove(evt, function(offset) {
          this.setState({
            offsetX: offset.x,
            offsetY: offset.y
          });
        }.bind(this));
      } else {
        this.refs.shapes.mouseMove(evt);
      }
    });
  }
});
