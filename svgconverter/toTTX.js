function toTTX(name, path, w, h) {
  var receiver = new TTXReceiver();
  receiver.setDimensions(w,h, 2048);
  receiver.flip();
  var svgParser = new SVGParser(receiver);
  svgParser.parse(path);
  return receiver.toTTX(name);
}
