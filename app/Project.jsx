var Project = React.createClass({
  getInitialState: function() {
    return {
      glyphmap: this.props.glyphmap
    };
  },

  render: function() {
    var buttons = this.state.glyphmap.getNames().map(function(n) {
      return <button>{n}</button>
    });
    return <div>
      <h2>Saved glyph outlines</h2>
      { buttons }
    </div>;
  },

  save: function(n, d) {
    this.state.glyphmap.save(n, d);
  }
});