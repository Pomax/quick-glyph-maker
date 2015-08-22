var TTXPointCurveShape = function() {
  this.points = [];
};

TTXPointCurveShape.prototype = new PointCurveShape();

TTXPointCurveShape.prototype.toTTX = function(bounds) {
  var i = this.castint;
  var first = this.points[0].main;
  var x = first.x;
  var y = first.y;

  // first point
  var ttx = [{
    x: i(x),
    y: i(y),
    oncurve: "1"
  }];

  // rest of the shape
  for(var p=1; p<this.points.length; p++) {
    // since we have to work with point pairs, get "prev" and "current"
    var prev;
    if(p>0) { prev = this.points[p-1]; }
    else { prev = this.points.slice(-1)[0]; }
    var curr = this.points[p];

    // Can we turn this into a LineTo instruction?
    if((curr.plain || curr.getLeft()===curr.main) && (prev.plain || prev.getRight()===prev.main)) {
      var lx = curr.main.x;
      var ly = curr.main.y;
      ttx.push({
        x: i(lx),
        y: i(ly),
        oncurve: "1"
      });
    }

    // We cannot: form a cubic bezier instead. Except we can't, because
    // we're generating TrueType XML, which only supports quadratic curves.
    // So: does the form "fit" a quadratic curve well enough? Then simplify it.
    //     does it not? approximate segments.
    else {
      var x1 = prev.main.x,
          y1 = prev.main.y,
          cx1 = prev.getRight().x,
          cy1 = prev.getRight().y,
          cx2 = curr.getLeft().x,
          cy2 = curr.getLeft().y,
          x2 = curr.main.x,
          y2 = curr.main.y,
          qcurves = formQuadratic(x1,y1,cx1,cy1,cx2,cy2,x2,y2);
      qcurves.forEach(function(q) {
        if (!q.points) return;
        var cp = q.points[1],
            ep = q.points[2];
        ttx.push({ x: cp.x, y: cp.y, oncurve: 0});
        ttx.push({ x: ep.x, y: ep.y, oncurve: 1});
      });
    }
  }

  ttx = ttx.map(function(p) {
    p.x = i(p.x);
    if (p.x < bounds.x) { bounds.x = p.x; }
    if (p.x > bounds.X) { bounds.X = p.x; }
    p.y = i(p.y);
    if (p.y < bounds.y) { bounds.y = p.y; }
    if (p.y > bounds.Y) { bounds.Y = p.y; }
    return p;
  });

  return ttx.map(function(p) {
    return '<pt x="'+p.x+'" y="'+p.y+'" on="'+p.oncurve+'"/>';
  }).join('\n');
};
