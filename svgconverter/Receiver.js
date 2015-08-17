var Receiver = function(PCSObject) {
  this.curveshapes = [];
  this.PCSObject = PCSObject || PointCurveShape;
  this.debug = true;
};

Receiver.prototype = {
  MINX: 0,
  MINY: 1,
  MAXX: 2,
  MAXY: 3,

  setDimensions: function(w,h,em) {
    this.w = w;
    this.h = h;
    this.em = em;
  },

  flip: function() {
    this.flip = true;
  },

  convertX: function(x) {
    return this.em * x/this.w;
  },

  convertY: function(y) {
    y = this.em * y/this.h;
    if (this.flip) {
      y = this.em - y;
    }
    return y;
  },

  // start a shape group
  start: function() {
    if (this.debug) console.log("starting");
    this.curveshapes = [];
  },

  // start a new shape in the group
  startShape: function() {
    if (this.debug) console.log("starting a new shape");
    this.current = new this.PCSObject();
  },

  // add an on-screen point
  addPoint: function(x,y) {
    x = this.convertX(x);
    y = this.convertY(y);
    if (this.debug) console.log("adding point",x,y);
    this.current.addPoint(x,y);
    if(!this.bounds) { this.bounds = [x,y,x,y]; }
    var b = this.bounds;
    if (x<b[this.MINX]) { b[this.MINX] = x; }
    if (x>b[this.MAXX]) { b[this.MAXX] = x; }
    if (y<b[this.MINY]) { b[this.MINY] = y; }
    if (y>b[this.MAXY]) { b[this.MAXY] = y; }
  },

  // set the x/y coordinates for the left/right control points
  setLeftControl: function(x, y) {
    x = this.convertX(x);
    y = this.convertY(y);
    if (this.debug) console.log("setting left control",x,y);
    this.current.setLeft(x,y);
  },

  setRightControl: function(x, y) {
    x = this.convertX(x);
    y = this.convertY(y);
    if (this.debug) console.log("setting right control",x,y);
    this.current.setRight(x,y);
  },

  // close the current shape and start a new one
  closeShape: function() {
    if (this.debug) console.log("closing shape");
    this.curveshapes.push(this.current);
    this.current = false;
  },

  // close the group of shapes.
  close: function() {
    if (this.current) {
      if (this.debug) console.log("closing last shape");
      this.closeShape();
    }
    if (this.debug) console.log("end run");
  },

  toSVG: function() {
    var curveshapes = this.curveshapes;
    var svg = "";
    for(var s=0; s<curveshapes.length; s++) {
      svg += curveshapes[s].toSVG();
    }
    return svg;
  }

}
