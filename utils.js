// =================================
//               ...
// =================================

function compound(w, h, contours) {
  var canvas = document.createElement("myCanvas");
  canvas.width = w;
  canvas.height = h;
  paper.setup(canvas);
  var compound = new paper.CompoundPath();
  contours.forEach(function(contour) {
    compound.addChild(new paper.Path(Shapes.pointsToSVGPath(contour,true)));
  });
  var path = compound.exportSVG();
  var d = path.getAttribute("d");
  return d;
}

function forcePath(path) {
  var d;
  if (path.nodeName.toLowerCase() === "polygon") {
    var points = path.getAttribute('points').split(/\s+|,/);
    var x0=points.shift(), y0=points.shift();
    d = 'M'+x0+','+y0+'L'+points.join(' ')+"z";
  } else { d = path.getAttribute("d"); }
  return d;
}

function union(w, h, path1, path2) {
  var canvas = document.createElement("myCanvas");
  canvas.width = w;
  canvas.height = h;
  paper.setup(canvas);

  var p1 = new paper.Path(path1);
  var p2 = new paper.Path(path2);
  var unified = p1.unite(p2);
  var intersection = p1.intersect(p2);

  //console.log(intersection);

  // polygonal? (until Paper.js _always_ generates paths)
  if(!intersection._segments && !intersection.children) { return -3; }

  // normal real path shape?
  else if(intersection._segments && intersection._segments.length===0) { return -3; }

  var reversed = p1.unite(p2);
  reversed.reverse();

  var ds = [p1, p2, unified, reversed].map(function(p) { return p.exportSVG(); }).map(forcePath);

  // TODO: track non-overlapping elements separately, based on empty intersections?
  if (ds[0] === ds[2] || ds[0] === ds[3]) { return -1; }
  if (ds[1] === ds[2] || ds[1] === ds[3]) { return -2; }
  return ds[2];
}


function unify(w, h, contours) {
  contours = contours.filter(function(v) {
    return v.length > 0;
  });

  var d;
  var paths = [];

  d = pointsToSVGPath(contours[0], true);
  paths.push(d);

  for (var i=1; i<contours.length; i++) {
    var path = pointsToSVGPath(contours[i], true);
    var processed = false;
    for (var p=0; p<paths.length; p++) {
      var refpath = paths[p];
      var tryUnion = union(w, h, refpath, path);
      //console.log(tryUnion);
      if (typeof tryUnion === "number") { continue; }
      paths[p] = tryUnion;
      processed = true;
      break;
    }
    if (!processed) { paths.push(path); }
  }

  // FIXME: TODO: Odd things can happen with certain shapes
  console.log(paths.length + " compounds");

  return paths.join(' ');
}

// =================================
//               ...
// =================================

function rnd(v) {
  if (typeof v !== "number") return v;
  return Math.round(v);
}

function project(p, l1, l2) {
  var m = (l2.y - l1.y) / (l2.x - l1.x);
      b = l1.y - (m * l1.x),
      x = (m * p.y + p.x - m * b) / (m * m + 1);
      y = (m * m * p.y + m * p.x + b) / (m * m + 1);
  return {x:x, y:y};
}

function kappa(p, r, backward) {
  var kappa = 0.55228,
      k = backward? 1-kappa : kappa,
      dx = r.x - p.x,
      dy = r.y - p.y;
  return {
    x: p.x + dx * k,
    y: p.y + dy * k,
  };
}

function inventKappaControl(prev, curr) {
  var ik = 1.0 / 0.55228;
  // projected singular control
  var projected = {
    x: prev.x + ik * (prev.front.x - prev.x),
    y: prev.y + ik * (prev.front.y - prev.y)
  };
  // reprojected onto projected--curr
  return kappa(curr, projected);
}

function pointToSVGPath(points) {
  return function(p, idx) {
    var p1 = points[idx-1], c1, c2;

    if(!p1) { return ['L',p.x,p.y].map(rnd).join(' '); }

    if (p1.front || p.back) {
      if (p1.front && p.back) {
        c1 = p1.front;
        c2 = p.back;
      }
      else if (p.back) {
        c1 = p.back;
        c2 = p.back;
      }
      else {
        c1 = p1.front;
        c2 = p1.front;
      }
      return ['C',c1.x,c1.y,c2.x,c2.y,p.x,p.y].map(rnd).join(' ');
    }

    return ['L',p.x,p.y].map(rnd).join(' ');
  };
}

function pointsToSVGPath(points, closed) {
  if (!points || points.length === 0) return;

  // temporarily pretend _front controls are true controls
  points.forEach(function(p) { if(p._front) p.front = p._front; });

  var path = points.map(pointToSVGPath(points));
  if (points[0]) {
    var p = points[0];
    path = ['M',p.x,p.y].concat(path.slice(1)).map(rnd).join(' ');
    if (closed) {
      var l = points.slice(-1)[0];
      if (p.back || l.front) {
        var c1, c2;
        if (p.back && l.front) {
          c1 = l.front;
          c2 = p.back;
        }
        else if (p.back) {
          c1 = p.back;
          c2 = p.back;
        }
        else {
          c1 = l.front;
          c2 = l.front;
        }
        path += [' C',c1.x,c1.y,c2.x,c2.y,p.x,p.y].map(rnd).join(' ');
      }
      path += ' Z';
    }
  }

  // undo the previous pretending
  points.forEach(function(p) { if(p._front) p.front = false; });

  return path;
}

// =================================
//               ...
// =================================

function dist(p1, p2) {
  var dx = p2.x-p1.x,
      dy = p2.y-p1.y,
      x2 = dx*dx,
      y2 = dy*dy,
      distanceSquared = x2 + y2;
  return Math.sqrt(distanceSquared);
}

var formQuadratic = (function() {
  var cqErrorMax = 10;

  function lli8(x1,y1,x2,y2,x3,y3,x4,y4) {
    var nx=(x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4),
        ny=(x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4),
        d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    if(d==0) { return false; }
    return { x: nx/d, y: ny/d };
  }

  function naiveQuad(x1,y1,x2,y2,x3,y3,x4,y4) {
    if(typeof y1 === "undefined") {
      var p = x1.points;
      x1 = p[0].x; y1 = p[0].y;
      x2 = p[1].x; y2 = p[1].y;
      x3 = p[2].x; y3 = p[2].y;
      x4 = p[3].x; y4 = p[3].y;
    }
    var qc = lli8(x1,y1,x2,y2,x3,y3,x4,y4);
    return new Bezier(x1,y1,qc.x,qc.y,x4,y4);
  }

  function cqError(ccurve, qcurve) {
    var cm = ccurve.get(0.5),
        qm = qcurve.get(0.5),
        e = dist(cm,qm);
    return e<0? -e : e;
  }

  function formQuadratic(x1,y1,x2,y2,x3,y3,x4,y4) {
    var ccurve = new Bezier(x1,y1,x2,y2,x3,y3,x4,y4);
    var qcurve = naiveQuad(x1,y1,x2,y2,x3,y3,x4,y4);

    // already quadratic enough?
    if(cqError(ccurve, qcurve) < cqErrorMax) {
      return [qcurve];
    }

    // no: start splitting
    var i = 2,
        error = 999,
        segments,
        curves,
        s,
        step=1/i;

    while (error > cqErrorMax) {
      segments = [];
      curves = [];
      error = 0;

      for(s=0; s<i; s++) {
        if ((s+1)*step > 1) continue;
        segments.push(ccurve.split(s*step, (s+1)*step));
      }

      var qcurve = false;
      segments.forEach(function(ccurve) {
        qcurve = naiveQuad(ccurve);
        curves.push(qcurve);
        error += cqError(ccurve, qcurve);
      });

      step = 1/i++;
    }

    // can we filter out "implied" on-curve points?
    // ...

    // done.
    return curves;
  };

  return formQuadratic;
}());

// =================================
//               ...
// =================================

function overPoint(point, i, j, x, y) {
  var dx = Math.abs(x - point.x);
  var dy = Math.abs(y - point.y);
  var d  = Math.sqrt(dx*dx + dy*dy);
  var max = 10;
  var ret = { contour: i, point: j, pointObj: point };
  if (d<=max) return ret;

  if(point.front) {
    dx = Math.abs(x - point.front.x);
    dy = Math.abs(y - point.front.y);
    d = Math.sqrt(dx*dx + dy*dy);
    if (d<=max) {
      ret.point += ".front";
      ret.pointObj = point.front;
      return ret;
    }
  }

  if(point.back) {
    dx = Math.abs(x - point.back.x);
    dy = Math.abs(y - point.back.y);
    d = Math.sqrt(dx*dx + dy*dy);
    if (d<=max) {
      ret.point += ".back";
      ret.pointObj = point.back;
      return ret;
    }
  }
  return false;
}

function mouseOver(x, y, contours) {
  var i,cl=contours.length,contour,j,pl,point,dx,dy,d;
  for (i=0; i<cl; i++) {
    contour = contours[i];
    for (j=0; j<contour.length;j++) {
      point = contour[j];
      var result = overPoint(point, i, j, x, y);
      if(result) return result;
    }
  }
  return false;
}