var CircleAbstractor = function() {};

var PI = Math.PI;
var TAU = Math.PI*2;
var atan2 = Math.atan2;
var cos = Math.cos;
var sin = Math.sin;
var sqrt = Math.sqrt;

CircleAbstractor.prototype = {
  getCCenter: function(p1, p2, p3) {
    // deltas
    var dx1 = (p2.x - p1.x),
        dy1 = (p2.y - p1.y),
        dx2 = (p3.x - p2.x),
        dy2 = (p3.y - p2.y);

    // perpendiculars (quarter circle turned)
    var dx1p = dx1 * cos(PI/2) - dy1 * sin(PI/2),
        dy1p = dx1 * sin(PI/2) + dy1 * cos(PI/2),
        dx2p = dx2 * cos(PI/2) - dy2 * sin(PI/2),
        dy2p = dx2 * sin(PI/2) + dy2 * cos(PI/2);

    // chord midpoints
    var mx1 = (p1.x + p2.x)/2,
        my1 = (p1.y + p2.y)/2,
        mx2 = (p2.x + p3.x)/2,
        my2 = (p2.y + p3.y)/2;

    // midpoint offsets
    var mx1n = mx1 + dx1p,
        my1n = my1 + dy1p,
        mx2n = mx2 + dx2p,
        my2n = my2 + dy2p;

    // intersection of these lines:
    var i = this.lli(mx1,my1,mx1n,my1n, mx2,my2,mx2n,my2n);
    var r = this.dist(i, p1);

    // arc start/end values, over mid point
    var s = atan2(p1.y - i.y, p1.x - i.x),
        m = atan2(p2.y - i.y, p2.x - i.x),
        e = atan2(p3.y - i.y, p3.x - i.x);

    var __,flipped=false;
    if (s<e) {
      if (s>m || m>e) { s += TAU; }
      if (s>e) { __=e; e=s; s=__; flipped=true; }
    } else {
      if (e<m && m<s) { __=e; e=s; s=__; flipped=true; }
      else { e += TAU; }
    }

    i.s = s;
    i.e = e;
    i.r = r;
    i.f = flipped;
    return i;
  },

  lli: function(x1,y1,x2,y2,x3,y3,x4,y4) {
    var nx=(x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4),
        ny=(x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4),
        d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    if(d===0) { return false; }
    return {x: nx/d, y: ny/d};
  },

  dist: function(p1,p2) {
    var dx = p1.x - p2.x,
        dy = p1.y - p2.y;
    return Math.sqrt(dx*dx + dy*dy);
  }
};

var abstractor = new CircleAbstractor();
