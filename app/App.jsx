var App = React.createClass({
  statics: {
    glyphMapKey: "quick-glyph-maker-project"
  },
  getInitialState: function() {
    var glyphmap = GlyphMap.check(App.glyphMapKey);
    if (!glyphmap) {
      glyphmap = new GlyphMap(this.props.width, this.props.height, App.glyphMapKey);
    }
    return {
      divisions: 10,
      glyphName: false,
      glyphmap: glyphmap
    };
  },
  render: function() {
    var xmlForm = false;

    if (this.state.TTX) {
      xmlForm = <div className="previews">
        <h2>SVG path</h2>
        <div className="SVG">{ this.state.dpreview }</div>
        <h2>TTX glyph definition</h2>
        <div className="TTX">{ this.state.TTX }</div>
      </div>
    }

    return (
      <div>
        <Panels ref="panels" width={this.props.width} height={this.props.height} divisions={this.state.divisions} />
        <Controls glyphName={this.state.glyphName} newGlyph={this.newGlyph} decRes={this.decRes} incRes={this.incRes} load={this.load} save={this.save}/>
        <Project ref="project" glyphmap={this.state.glyphmap} loadGlyph={this.load} />
        {xmlForm}
      </div>
    );
  },

  newGlyph: function() {
    this.setState({
      glyphName: false
    }, function() {
      this.refs.panels.clear();
    });
  },

  decRes: function() {
    this.setState({ divisions: Math.max(this.state.divisions >>> 1, 2)});
  },

  incRes: function() {
    this.setState({ divisions: this.state.divisions << 1 });
  },


  load: function(name, d) {
    this.setState({
      glyphName: name
    }, function() {
      this.refs.panels.load(d);
    });
  },

  save: function() {
    var glyphName = this.state.glyphName || prompt("Please specify a glyph name");
    if (!glyphName) return;

    var w = this.props.width;
    var h = this.props.height;
    var path = this.refs.panels.unify();
    var TTX = toTTX(this.state.glyphName, path, w, h);
    this.setState({
      glyphName: glyphName,
      dpreview: path,
      TTX: TTX
    });
    this.refs.project.save(glyphName, path);
  }
});

