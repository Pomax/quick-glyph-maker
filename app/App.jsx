var App = React.createClass({
  getInitialState: function() {
    return {
      divisions: 10,
      glyphName: false,
      glyphmap: new GlyphMap(this.props.width, this.props.height)
    };
  },
  render: function() {
    var xmlForm = false;
    var d = this.state.dpreview;
    if (d) {
      xmlForm = <div className="previews">
        <h2>SVG path</h2>
        <div className="SVG">{ d }</div>
        <h2>TTX glyph definition</h2>
        <div className="TTX">{ this.state.TTX }</div>
      </div>
    }

    return (
      <div>
        <Panels ref="panels" width={this.props.width} height={this.props.height} divisions={this.state.divisions}/>

        <div className="controls">
          {this.state.glyphName ? <span className="coordinates">glyph: {this.state.glyphName}</span> : false}
          <button onClick={this.newGlyph}>NEW</button>
          <button onClick={this.decRes}>Decrease resolution</button>
          <button onClick={this.incResaves}>Increase resolution</button>
          <button onClick={this.save}>Save</button>
        </div>

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
    this.setState({ divisions: this.state.divisions >>> 1 || 0});
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
      TTX: TTX
    });
    this.refs.project.save(glyphName, path);
  }
});
