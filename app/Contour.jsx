var Contour = React.createClass({

  getInitialState: function() {
    return {
      cid: this.props.cid,
      points: this.props.points || []
    };
  },

  formPoint: function(x,y, pid) {
    if (pid === undefined) { pid = y; y = x.y; x = x.x; }
    var cid = this.state.cid;
    return <circle {...{
      cx: x || 0,
      cy: y || 0,
      r: 5,
      fill: "red",
      stroke: "red",
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
      if (p.front || p.back) {
        marks.push(this.formPoint(p.front), pid + 'p');
        marks.push(this.formPoint(p.back), pid + 'n');
        marks.push(this.formLine(p.back, p.front));
      }
      return marks;
    }.bind(this));
    var path = pointsToSVGPath(points, points.closed);
    return <g>
      {markers}
      {path ? <path fill="none" stroke="blue" d={path}/> : false}
    </g>;
  }
});