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

  if(!intersection) { return -3; }

  var reversed = p1.unite(p2);
  reversed.reverse();

  var ds = [p1, p2, unified, reversed].map(function(p) { return p.exportSVG(); }).map(forcePath);

  // TODO: track non-overlapping elements separately, based on empty intersections
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
      if (typeof tryUnion === "number") { continue; }
      paths[p] = tryUnion;
      processed = true;
      break;
    }
    if (!processed) { paths.push(path); }
  }

  // FIXME: TODO: Odd things happen with two separate donuts
  console.log(paths.length + " compounds");

  return paths.join(' ');
}

// =================================
//               ...
// =================================

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

function pointToSVGPath(points, p, idx) {
  return function(p, idx) {
    var p1 = points[idx-1], c1, c2;

    if(!p1) { return ['L',p.x,p.y].join(' '); }

    if (p1.front || p.back) {
      if (p1.front && p.back) {
        c1 = kappa(p1, p1.front);
        c2 = kappa(p.back, p, true);
      }
      else if (p.back) {
        c1 = kappa(p1, p.back);
        c2 = kappa(p.back, p, true);
      }
      else {
        c1 = kappa(p1, p1.front);
        c2 = kappa(p1.front, p, true);
      }
      return ['C',c1.x,c1.y,c2.x,c2.y,p.x,p.y].join(' ');
    }

    return ['L',p.x,p.y].join(' ');
  };
}

function pointsToSVGPath(points, closed) {
  if (!points || points.length === 0) return;

  var path = points.map(pointToSVGPath(points));
  if (points[0]) {
    var p = points[0];
    path = ['M',p.x,p.y].concat(path.slice(1)).join(' ');
    if (closed) {
      var l = points.slice(-1)[0];
      if (p.back || l.front) {
        var c1, c2;
        if (p.back && l.front) {
          c1 = kappa(l, l.front);
          c2 = kappa(p.back, p, true);
        }
        else if (p.back) {
          c1 = kappa(l, p.back);
          c2 = kappa(p.back, p, true);
        }
        else {
          c1 = kappa(l, l.front);
          c2 = kappa(l.front, p, true);
        }
        path += [' C',c1.x,c1.y,c2.x,c2.y,p.x,p.y].join(' ');
      } else { path += ' Z'; }
    }
  }
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
