var TTXReceiver = function() {
  this.curveshapes = [];
};

TTXReceiver.prototype = new Receiver(TTXPointCurveShape);

TTXReceiver.prototype.toTTX = function(glyphName) {
  glyphName = glyphName || ".notdef";
  var curveshapes = this.curveshapes;
  var b = {x:999999,y:999999,X:-999999,Y:-999999};
  var contours = curveshapes.map(function(ttxpcs) {
    return [
      '<contour>',
      ttxpcs.toTTX(b),
      '</contour>'
    ].join('\n');
  }).join('\n');

  return [
    '<TTGlyph name="'+glyphName+'" xMin="'+b.x+'" yMin="'+b.y+'" xMax="'+b.X+'" yMax="'+b.Y+'">',
    contours,
    '<instructions><assembly></assembly></instructions>',
    '</TTGlyph>'
  ].join('\n');
};
