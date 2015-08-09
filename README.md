# A quick glyph maker

I needed a quick outline drawing tool for a blog post I'm writing about making fonts, and needed something that would let me draw and turn that into a fully clipepd SVG outline. Couldn't find it, so I had to roll it myself, and so I did, using [humphd](https://twitter.com/humphd)'s most excellent [Bramble](https://github.com/humphd/brackets) in-browser-full-code-editor (it's Adobe's [Brackets](http://brackets.io), but heavily massaged into running in the browser with a full file system and live previews. You should check it out) and some [React](http://facebook.github.io/react). The clipping is achieved with [clipper.js](http://sourceforge.net/p/jsclipper/wiki/Home%206), a port of the C++ `clipper` library hosted over on sourceforge. Unfortunately clipper only unifies polygons, so I still need to find a good way to deal with curves.

Current version up on http://pomax.github.io/quick-glyph-maker/

- Pomax
