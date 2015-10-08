var Shapes = React.createClass({

  mixins: [
    MouseMixing
  ],

  getInitialState: function() {
    this.clear();
    return {
      contours: []
    };
  },

  render: function() {
    var contours = this.state.contours.map(function(points, idx) {
      if(points.length === 0) return false;
      var key = "c" + idx;
      var ref = key + '-' + points.length;
      return <Contour {...{
        points: points,
        cid: idx,
        key: key,
        ref: ref,
        mx: this.props.mouseX,
        my: this.props.mouseY,
        setActivePoint: this.setActivePoint
      }}/>;
    }.bind(this));


    // also add the contour for "what the next thing will look like"
    var nContour = false;
    if (this.state.contours.length > 0) {
      var temp = this.state.contours.slice(-1)[0];
      if(temp) {
        temp = temp.slice(-1)[0];
        if (temp) {
          // create a contour between [temp] and this coordinate
          var pts = {
            x: this.props.gridX,
            y: this.props.gridY,
            back: false
          };
          // invent a control point if we must
          if (temp.front) {
            pts.back = inventKappaControl(temp, pts);
          }
          temp = [temp, pts];
          nContour = <Contour {...{
            points: temp,
            cid: -1,
            ref: '-1-2',
            key: "c-1",
            mx: this.props.mouseX,
            my: this.props.mouseY,
            setActivePoint: this.setActivePoint,
            preview: true
          }}/>;
        }
      }
    }

    var ox = this.props.offsetX;
    var oy = this.props.offsetY;

    var snapped = {
      x: this.props.gridX,
      y: this.props.gridY
    };

    var cursor = false;
    if(!this.state.hideCursor) {
      cursor = [
        <path key="vertical" fill="none" stroke="rgb(200,150,200)" d={ ['M', snapped.x, -oy, 'L', snapped.x, this.props.height - oy].join(' ') } />,
        <path key="horizontal" fill="none" stroke="rgb(200,150,200)" d={ ['M', -ox, snapped.y, 'L', this.props.width - ox, snapped.y].join(' ') } />,
        <circle key="marker" {...{
          r: 10,
          cx: snapped.x,
          cy: snapped.y,
          fill: "none",
          stroke: this.props.curve ? "red" : "black"
        }}/>
      ];
    }

    var group = <g transform={"translate("+ox+","+oy+")"}>
      {contours}
      {nContour}
      {cursor}
    </g>;

    return group;
  },

  setActivePoint: function(contour, pid) {
    this.setState({
      activePoint: {
        contour: contour,
        pid: pid
      }
    });
  },

  load: function(d) {
    var receiver = this;
    this.clear(function() {
      var svgParser = new SVGParser(receiver);
      svgParser.parse(d);
    });
  },

  // "Receiver" functions called by the SVGParser

  start: function() {
    this.clear();
    this.svgParsing = true;
  },

  startShape: function() {
    if (this.points.length > 0) {
      this.points = [];
      this.contours.push(this.points);
    }
  },

  addPoint: function(x,y) {
    this.point = { x: x, y: y };
    this.points.push(this.point);
    this.setState({ contours: this.contours });
  },

  setRightControl: function(x, y) {
    var p = {x:x, y:y};
    this.point.front = p;
  },

  setLeftControl: function(x, y) {
    var p = {x:x, y:y};
    this.point.back = p;
  },

  closeShape: function() {
    this.points.closed = true;
  },

  close: function() {
    this.svgParsing = false;
    this.setState({ contours: this.contours });
    this.startShape();
  },

  // Own functions

  clear: function(next) {
    this.point = false;
    this.points = [];
    this.contours = [this.points];
    if (this.isMounted()) {
      this.setState({
        contours: []
      }, function() {
        if(next) next();
      });
    }
  },

  undo: function() {
    var last;

    // open the shape back up?
    if (this.points.length === 0) {
      var contours = this.contours;
      last = contours.length - 1;
      contours.splice(last,1);
      if (contours.length>0) {
        this.points = contours.slice(-1)[0];
        this.points.closed = false;
      } else {
        this.points = [];
        this.contours = [this.points];
      }
    }

    // remove last added point
    else {
      if (this.points.closed) {
        this.points.closed = false;
      }
      var points = this.points;
      last = points.length -1;
      points.splice(last,1);
    }

    this.setState({ contours: this.contours });
  }
});
