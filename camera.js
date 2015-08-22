var Camera = function(w, h) {
  this.center = { x: w/2, y: h/2 };
  this.width = w;
  this.height = h;
  this._offset = { x: 0, y: 0 };
  this.zoom = 1;
};

Camera.prototype = {
  zoom: function(dz) {
    this.zoom += (dz/100);
  },

  offset: function(dx,dy) {
    this._offset.x += dx;
    this._offset.y += dy;
  },

  commit: function() {
    this.center.x += this._offset.x;
    this.center.y += this._offset.y;
  },

  /**
   * Mapping a screen coordinate to a "world" coordinate
   * @param  {number} x screen X coordinate
   * @param  {number} y screen Y coordinate
   * @return {obj{x,y}} world (x,y) coordinate
   */
  screenToWorld: function(x,y) {

    return {
      x: x,
      y: y
    };
  }

  /**
   * Map a "world" coordinate to a screen coordinate
   * @param  {number} x world X coordinate
   * @param  {number} y world Y coordinate
   * @return {obj{x,y}} screen (x,y) coordinate
   */
  worldToScreen: function(x,y) {
    return {
      x: x,
      y: y
    };
  }
};

