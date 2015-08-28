var Contour = React.createClass({

  getInitialState: function() {
    return {
      points: this.props.points || []
    };
  },

  formPoint: function(x, y, pid) {
    if (pid === undefined) {
      pid = y;
      y = x.y;
      x = x.x;
    }

    var isControl = !!pid.indexOf;

    var over = overPoint({
      x:this.props.mx,
      y:this.props.my
    }, this.props.cid, pid, x, y);

    return <circle {...{
      cx: x || 0,
      cy: y || 0,
      r: 5,
      fill: !!over ? "blue" : isControl ? "green" : "red",
      stroke: !!over ? "blue" : isControl ? "green" : "red",
      strokeWidth: 2,
      style: { zIndex: 2 }
    }}/>;
  },

  formLine: function(p1,p2) {
    return <path {...{
      fill: "none",
      stroke: "green",
      d: ["M",p1.x,p1.y,"L",p2.x,p2.y].join(' ')
    }}/>;
  },

  render: function() {
    var points = this.state.points;
    var markers = points.map(function(p, pid) {
      var marks = [this.formPoint(p.x, p.y, pid)];
      if (p._front) p.front = p._front;
      if (p.front || p.back) {
        // lines
        if (p.front) marks.push(this.formLine(p, p.front));
        if (p.back) marks.push(this.formLine(p.back, p));
        // points
        if (p.front) marks.push(this.formPoint(p.front.x, p.front.y, pid + '.front'));
        if (p.back) marks.push(this.formPoint(p.back.x, p.back.y, pid + '.back'));
      }
      if (p._front) p.front = false;
      return marks;
    }.bind(this));
    var path = pointsToSVGPath(points, points.closed);
    return <g>
      {markers}
      {path ? <path fill="none" stroke="blue" d={path}/> : false}
    </g>;
  }
});