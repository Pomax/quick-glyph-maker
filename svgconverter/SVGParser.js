var SVGParser = function(receiver) {
  this.receiver = receiver;
  this.debug = false;
  this.receiver.debug = this.debug;
};

SVGParser.prototype = {

  parse: function(path, xoffset, yoffset) {
    path = path.replace(/\s*([mlqczMLQCZ])\s*/g,"\n$1 ")
        .replace(/\s*,/g," ")
        .replace(/(\S)-/g,"$1 -")
        .replace(/ +/," ");

    xoffset = xoffset || 0;
    yoffset = yoffset || 0;

    var receiver = this.receiver,
        strings = path.split("\n"),
        slen = strings.length,
        x = xoffset,
        y = yoffset,
        closed = false,
        cx, cy, cx1,cy1, cx2, cy2,
        s, e, q,
        instruction, op, terms, tlen, nextstring, nextop, record;

    if (this.debug) console.log(strings.join('\n'));

    receiver.start();
    receiver.startShape();

    for(s=1, e=strings.length; s<e; s++) {
      instruction = strings[s].trim();
      op = instruction[0];

      if (this.debug) console.log("operator:",op,"instruction:",instruction);

      terms = (instruction.length>1 ? instruction.trim().split(" ") : ['op']).slice(1).map(parseFloat);
      tlen = terms.length;

      if (this.debug) console.log("terms:",terms);

      // move instruction
      if(op === "m" || op === "M") {
        if (this.debug) console.log("moveto");
        if(op === "m") { x += terms[0]; y += terms[1]; }
        else if(op === "M") { x = terms[0] + xoffset; y = terms[1] + yoffset; }
        // add a point only if the next operation is not another move operation, or a close operation
        if(s<slen-1) {
          nextstring = strings[s+1].trim();
          nextop = nextstring[0];
          record = (["m","M","z","Z"].indexOf(nextop) === -1);
          if(record) {
            if (this.debug) console.log("recording moveto");
            receiver.addPoint(x, y);
          }
        }
      }

      // line instruction
      else if(op === "l" || op === "L") {
        if (this.debug) console.log("lineto");
        // this operation take a series of [x2 y2] coordinates
        for(t=0; t<tlen; t+=2) {
          if(op === "l") { x += terms[0]; y += terms[1]; }
          else if(op === "L" ){ x = terms[0] + xoffset; y = terms[1] + yoffset; }
          receiver.addPoint(x, y);
        }
      }

      // quadratic curve instruction
      else if(op === "q" || op === "Q") {
        if (this.debug) console.log("quadratic");
        // this operation takes a series of [cx cy x2 y2] coordinates
        for(q = 0; q<tlen; q+=4) {
          cx=0;
          cy=0;
          if(op === "q") { cx = x + terms[q]; cy = y + terms[q+1]; }
          else if(op === "Q") { cx = terms[q] + xoffset; cy = terms[q+1] + yoffset; }

          // Derive the cubic control points instead of quadratic
          cx1 = (x + cx + cx)/3;
          cy1 = (y + cy + cy)/3;

          // Make start point bezier if it differs from the control point
          if(x !=cx1 || y !=cy1) { receiver.setRightControl(cx1, cy1); }

          // NOTE: the relative control instruction does not count as offset coordinate, so
          //       any on-curve coordinates are relative to the previous on-curve coordinate.
          if(op === "q") { x += terms[q+2]; y += terms[q+3]; }
          else if(op === "Q") { x = terms[q+2] + xoffset; y = terms[q+3] + yoffset; }

          // Derive cubic control point 2
          cx2 = (x + cx + cx)/3;
          cy2 = (y + cy + cy)/3;

          receiver.addPoint(x, y);
          if(x!=cx2 || y !=cy2) { receiver.setLeftControl(cx2, cy2); }
        }
      }

      // cubic curve instruction
      else if(op === "c" || op === "C") {
        if (this.debug) console.log("cubic");
        // this operation takes a series of [cx1 cy1 cx2 cy2 x2 y2] coordinates
        for(c = 0; c<tlen; c+=6) {

          // Get first control point
          cx1=0;
          cy1=0;
          if(op === "c") { cx1 = x + terms[c]; cy1 = y + terms[c+1]; }
          else if(op === "C") { cx1 = terms[c] + xoffset; cy1 = terms[c+1] + yoffset; }

          // Make start point bezier if it differs from the control point
          if(x!=cx1 || y !=cy1) { receiver.setRightControl(cx1, cy1); }

          // NOTE: control points don't count as "real points". Any control point is relative
          //       to the last previous on-curve coordinate, instead.
          cx2=0;
          cy2=0;
          if(op === "c") { cx2 = x + terms[c+2]; cy2 = y + terms[c+3]; }
          else if(op === "C") { cx2 = terms[c+2] + xoffset; cy2 = terms[c+3] + yoffset; }

          // NOTE: the relative control instruction does not count as offset coordinate, so
          //       any on-curve coordinates are relative to the previous on-curve coordinate.
          if(op === "c") { x += terms[c+4]; y += terms[c+5]; }
          else if(op === "C") { x = terms[c+4] + xoffset; y = terms[c+5] + yoffset; }

          receiver.addPoint(x, y);
          if(x!=cx2 || y !=cy2) { receiver.setLeftControl(cx2,cy2); }
        }
      }

      // close shape instruction
      else if(op === "z" || op === "Z") {
        if (this.debug) console.log("close");
        receiver.closeShape();
        // open a new shape if there are more instructions
        if (s<e-1) { receiver.startShape(); }
      }
    }
    receiver.close();
  }
};
