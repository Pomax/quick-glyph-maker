var Project = React.createClass({
  getInitialState: function() {
    return {
      glyphmap: this.props.glyphmap
    };
  },

  render: function() {
    var load = this.props.loadGlyph;
    var gm = this.state.glyphmap;
    var loadGlyph = function(n) {
      load(n, gm.get(n));
    };

    var buttons = this.state.glyphmap.getNames().map(function(n,position) {
      return <button key={position} onClick={function() { loadGlyph(n) }}>{n}</button>
    });

    return <div className="project">
      <h2>Saved glyph outlines</h2>
      { buttons }
    </div>;
  },

  save: function(n, d) {
    this.state.glyphmap.save(n, d);
  }
});