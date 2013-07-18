
var frameLoopTimeout;

// HTML5 video element that is playing the raw video.
var srcVideo = document.getElementById('video-src');

// Used to draw each video frame on so that we can process it.
var srcCanvas = document.getElementById('canvas-src');

// The canvas context where we can interact with the canvas data.
var srcCtx = srcCanvas.getContext('2d');

// Start webcam
navigator.webkitGetUserMedia({video: true}, function (stream) {
  srcVideo.src = URL.createObjectURL(stream);
}, function (e) {
  alert('Webcam error.', e);
});

// Flip the canvas to effectively mirror the video (for webcam).
//srcCtx.translate(srcCanvas.width, 0);
//srcCtx.scale(-1, 1);

srcVideo.addEventListener('canplay', function () { srcVideo.play(); });
srcVideo.addEventListener('play', function () { frameLoop(); });
srcVideo.addEventListener('pause', function () { clearTimeout(frameLoopTimeout); });


/**
 * Self-calling function on an interval which draws the video source onto a
 * reference canvas.
 */
function frameLoop() {
  // Draws the image data from the video source on to a canvas context.
  srcCtx.drawImage(srcVideo, 0, 0, srcVideo.width, srcVideo.height);

  frameLoopTimeout = setTimeout(frameLoop, 1000 / 40);
}
