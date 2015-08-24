var Controls = React.createClass({
  render: function() {
    return (
      <div className="controls">
        {this.props.glyphName ? <span className="coordinates">glyph: {this.props.glyphName}</span> : false}

        <div className="up-down">
          <button onClick={this.props.decRes}>Decrease resolution</button>
          <button onClick={this.props.incResaves}>Increase resolution</button>
        </div>

        <div className="glyph properties">
          <button onClick={this.props.newGlyph}>New Glyph</button>
          <button onClick={this.props.save}>Save</button>
        </div>
      </div>
    );
  }
});
