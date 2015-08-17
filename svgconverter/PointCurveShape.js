function formCoord(x,y)  {
  return {x:x, y:y};
}

var Point = function(x,y) {
  this.main = formCoord(x,y);
};

Point.prototype = {
  plain: true,
  makeCurve: function() {
    this.plain = false;
  },
  setLeft: function(x, y) {
    this.makeCurve();
    this.left = formCoord(x,y);
  },
  setRight: function(x, y) {
    this.makeCurve();
    this.right = formCoord(x,y);
  },
  getLeft: function() {
    return this.plain ? this.main : !this.left? this.main : this.left;
  },
  getRight: function() {
    return this.plain ? this.main : !this.right? this.main : this.right;
  }
}

/**
 * A shape defined in terms of curve points
 */
var PointCurveShape = function() {
  this.points = [];
};

PointCurveShape.prototype = {
  addPoint: function(x, y) {
    this.current = new Point(x,y);
    this.points.push(this.current);
  },

  setLeft: function(x, y) {
    this.current.setLeft(x,y);
  },

  setRight: function(x, y) {
    this.current.setRight(x,y);
  },

  castint: function(v) {
    if(typeof v!== "number") return v;
    return parseInt(Math.round(v));
  },

  toSVG: function() {
    var castint = this.castint;
    var first = this.points[0].main;
    var x = first.x;
    var y = first.y;
    var svg = ["M",x,y].map(castint).join(',');
    // rest of the shape
    for(var p=1; p<this.points.length; p++) {
      // since we have to work with point pairs, get "prev" and "current"
      var prev;
      if(p>0) { prev = this.points[p-1]; }
      else { prev = this.points.slice(-1)[0]; }
      var curr = this.points[p];

      // Can we turn this into a LineTo instruction?
      if(curr.plain && (prev.plain || prev.getRight()===prev.main)) {
        var lx = curr.main.x;
        var ly = curr.main.y;
        svg += ["L",lx,ly].map(castint).join(',');
      }

      // We cannot: form a cubic bezier instead.
      else {
        var cx1 = prev.getRight().x;
        var cy1 = prev.getRight().y;
        var cx2 = curr.getLeft().x;
        var cy2 = curr.getLeft().y;
        var x2 = curr.main.x;
        var y2 = curr.main.y;
        svg += ["C",cx1,cy1,cx2,cy2,x2,y2].map(castint).join(',');
      }
    }
    return svg.replace(/([mMlLcC]),/g,"$1") + "Z";
  }
};
