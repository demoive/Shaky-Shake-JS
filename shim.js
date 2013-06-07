(function (win, nav) {
  'use strict';

  win.requestAnimationFrame = win.requestAnimationFrame ||
                              win.msRequestAnimationFrame ||
                              win.mozRequestAnimationFrame ||
                              win.webkitRequestAnimationFrame ||
                              function (callback){
                                return win.setTimeout(callback, 1000 / 60);
                              };

  nav.getUserMedia = nav.getUserMedia ||
                     nav.oGetUserMedia ||
                     nav.msGetUserMedia ||
                     nav.mozGetUserMedia ||
                     nav.webkitGetUserMedia;

  // Fallback for browsers that don't provide
  // the URL.createObjectURL API (e.g. Opera).
  if (!win.URL || !win.URL.createObjectURL) {
    win.URL = win.URL || {};
    win.URL.createObjectURL = function (obj) {
      return obj;
    };
  }

})(window, navigator);