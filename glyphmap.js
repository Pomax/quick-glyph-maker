var GlyphMap = function(w, h, key) {
  this.width = w;
  this.height = h;
  this.glyphs = {};
  this.key = key || "glyphmap";
};

GlyphMap.check = function(key) {
  var data = localStorage[key];
  if(data) {
    data = JSON.parse(data);
    var gm = new GlyphMap(data.w, data.h, key);
    gm.glyphs = data.glyphs;
    return gm;
  }
  return false;
};

GlyphMap.prototype = {
  save: function(name, outline) {
    this.glyphs[name] = outline;
    localStorage[this.key] = JSON.stringify(this);
  },
  toTTX: function() {
    var glyphs = this.glyphs;
    var w = this.width;
    var h = this.height;
    var glyphTTX = Object.keys(glyphs).map(function(name) {
      var d = glyphs[name];
      return toTTX(name, d, w, h);
    });
    return glyphTTX.join("\n\n");
  },
  getNames: function() {
    return Object.keys(this.glyphs);
  },
  get: function(name) {
    return this.glyphs[name] || false;
  }
};
