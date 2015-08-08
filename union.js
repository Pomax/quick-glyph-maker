function pathsShapeUnion(subj_paths, shape2) {
  var clip_paths = new ClipperLib.Paths();
  var clip_path = new ClipperLib.Path();
  shape2.forEach(function(p) {
    clip_path.push(new ClipperLib.IntPoint(p.x, p.y));
  });
  clip_paths.push(clip_path);

  var cpr = new ClipperLib.Clipper();
  cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, true);
  cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, true);
  var clipType = ClipperLib.ClipType.ctUnion;
  var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clip_fillType = ClipperLib.PolyFillType.pftNonZero;

  var solution_paths = new ClipperLib.Paths();
  cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  return solution_paths;
}

function union(shape1, shape2) {
  var subj_paths = new ClipperLib.Paths();
  var subj_path = new ClipperLib.Path();
  shape1.forEach(function(p) {
    subj_path.push(new ClipperLib.IntPoint(p.x, p.y));
  });
  subj_paths.push(subj_path);

  var result = pathsShapeUnion(subj_paths, shape2);
  return result.map(function(contour) {
    return contour.map(function(p) {
      return {x:p.X, y:p.Y};
    });
  });
}

function drawUnified(w, h, data) {
  var d = data.map(function(contour) {
    var p = contour[0];
    var initial = ['M',p.x,p.y].join(' ');
    section = contour.slice(1).map(function(p) {
      return ['L',p.x,p.y].join(' ');
    }).join(' ');
    var pathString = [initial, section, 'Z'].join(' ');
    console.log(pathString);
    return pathString;
  }).join(' ');
  return d;
}

