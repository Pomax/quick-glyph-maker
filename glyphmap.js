var GlyphMap = function(w, h) {
  this.width = w;
  this.height = h;
  this.glyphs = {};
};

GlyphMap.prototype = {
  save: function(name, outline) {
    this.glyphs[name] = outline;
  },
  toTTX: function() {
    var glyphs = this.glyphs;
    var w = this.width;
    var h = this.height;
    var glyphTTX = Object.keys(glyphs).map(function(name) {
      var d = glyphs[name];
      console.log(name, d, w, h);
      return toTTX(name, d, w, h);
    });
    return glyphTTX.join("\n\n");
  },
  getNames: function() {
    return Object.keys(this.glyphs);
  }
};

