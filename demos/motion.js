(function() {
  var MOVEMENT_THRESHOLD = (2 / 100), // a.k.a sensitivity
    LUMA_DIFF_THRESHOLD = 20, // diff between 2 frames' luma to be considered as movement (a.k.a. sensitivity)
    showBinaryDiff = true,
    frameLoopTimeout, prevFrameImageData,

    srcCtx, diffCtx,
shiftCtx,
tempCtx,

    // HTML5 video element that is playing the raw video.
    video = document.getElementById('video-src'),

    // Used to draw each video frame on so that we can process it.
    srcCanvas = document.createElement('canvas'),

    // Can be used to draw the diff between two frames to visualize what is happening.
    diffCanvas = document.createElement('canvas'),
shiftedCanvas = document.createElement('canvas'),
tempCanvas = document.createElement('canvas'),

    canvasWidth = video.width, canvasHeight = video.height,
    canvasArea = (canvasWidth * canvasHeight);

  srcCanvas.width = canvasWidth;
  srcCanvas.height = canvasHeight;
  diffCanvas.width = canvasWidth;
  diffCanvas.height = canvasHeight;
shiftedCanvas.width = canvasWidth - 3;
shiftedCanvas.height = canvasHeight;
tempCanvas.width = canvasWidth - 3;
tempCanvas.height = canvasHeight;


  // Optionally place the canvas into the DOM to be able to visualize.
  //document.body.appendChild(diffCanvas);
document.body.appendChild(shiftedCanvas);

  srcCtx = srcCanvas.getContext('2d');
  diffCtx = diffCanvas.getContext('2d');
shiftCtx = shiftedCanvas.getContext('2d');
tempCtx = shiftedCanvas.getContext('2d');

  if (navigator.getUserMedia) {
    navigator.getUserMedia({video: true}, function (stream) {
      video.src = URL.createObjectURL(stream);
      //video.playbackRate = .5;
      //video.play();
    }, function (e) {
      alert('Webcam error.', e);
    });
  } else {
    video.src = '../pigeons-10s_480.mov'; // fallback.
  }

  document.getElementById('diff-threshold').addEventListener('change', function () {
    LUMA_DIFF_THRESHOLD = 255 - ((this.value / 100) * 255);
  });

  document.getElementById('binary-diff').addEventListener('change', function () {
    showBinaryDiff = (this.checked ? true : false);
  });

  // Flip the canvas to effectively mirror the video (for webcam).
  //srcCtx.translate(srcCanvas.width, 0);
  //srcCtx.scale(-1, 1);

  video.addEventListener('canplay', function () { video.play(); });
  video.addEventListener('play', function () { frameLoop(); });
  video.addEventListener('pause', function () { clearTimeout(frameLoopTimeout); });


  /**
   * Self-calling function on an interval which draws the video source onto a
   * reference canvas and compares the difference between subsequent frames - optionally
   * drawing the difference onto another canvas.
   */
  function frameLoop() {
    var srcFrameImageData,
      movementPxCount,
      diffImageData = srcCtx.createImageData(canvasWidth, canvasHeight);

    // Draws the image data from the video source on to a canvas context.
    srcCtx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

    // Get image data from the image drawn on the source canvas.
    srcFrameImageData = srcCtx.getImageData(0, 0, canvasWidth, canvasHeight);

  // Effectively shifts the src left and compares to the previous frame.
  var shiftedFrameImageData = srcCtx.getImageData(3, 0, canvasWidth - 3, canvasHeight);

// I THINK THE LAST ARGUMENT OF THE COMPAREFRAMES() BELOW NEEDS TO BE THE prevFrameImageData 
// INFORMATION (MINUS 3 PIXELS OF COURSE). FIND A WAY TO "CROP" THIS

  //var shiftedRefDiff = srcCtx.createImageData(canvasWidth - 3, canvasHeight);
  var diffShiftedImageData = srcCtx.createImageData(canvasWidth - 3, canvasHeight);

    // Create an image if the previous image doesn’t exist (1st iteration).
    if (!prevFrameImageData) {
      prevFrameImageData = srcFrameImageData;
    }

    movementPxCount = compareFrames(diffImageData, srcFrameImageData, prevFrameImageData);

//maybe use a temp ctx instead of shiftCtx?
tempCtx.putImageData(prevFrameImageData, 0, 0);
var shiftedPrevFrameImageData = tempCtx.getImageData(0, 0, canvasWidth - 3, canvasHeight);

  var motionPxCount = compareFrames(diffShiftedImageData, shiftedFrameImageData, shiftedPrevFrameImageData);
  //var motionRefPxCount = compareFrames(shiftedRefDiff, shiftedFrameImageData, prevFrameImageData);
  //detectMotion();

  var shiftedDiffPercentage = motionPxCount / (canvasArea - (3*canvasHeight));
  var diffPercentage = movementPxCount / canvasArea;
//console.log(diffPercentage, Math.abs(1 - shiftedDiffPercentage));

    // Only used for the movement gauge.
    //if (movementPxCount > MOVEMENT_THRESHOLD) {
    //  gaugeVal = Math.round((movementPxCount / canvasArea) * 100);
    //}

    // Store the current frame's image data for the next iteration.
    prevFrameImageData = srcFrameImageData;

    // Draw the diff result on to the canvas.
    diffCtx.putImageData(diffImageData, 0, 0);
shiftCtx.putImageData(diffShiftedImageData, 0, 0);

    // requestAnimationFrame() is more efficient, however, since a webcam stream
    // plays at much lower than 60fps and we only need to capture individual frames
    // we would only need at most the same frame rate as the webcam stream; plus,
    // calling it more often than there are frames produces a "blink" effect
    // within the compared frames
    //frameLoopTimeout = requestAnimationFrame(frameLoop);
    frameLoopTimeout = setTimeout(frameLoop, 1000 / 40);

    return frameLoopTimeout;
  }


  /**
   * Returns the number of "significantly different" pixels.
   * Stores the blended/merged/diff image data in <deltaImgData>.
   */
  function compareFrames(deltaImgData, imgData1, imgData2) {
    var i = 0,
      pxBinaryDiff,
      diffPxCount = 0,
      pxLuminanceDiff,
      pxLuminance1, pxLuminance2,
      imgDataSubPixels1 = imgData1.data,
      imgDataSubPixels2 = imgData2.data,
      deltaImgDataSubPixels = deltaImgData.data,
      subPixelCount = imgDataSubPixels1.length;

    // Ensure the images being compared are of the same dimensions.
    if (subPixelCount != imgDataSubPixels2.length) {
      console.error('comparing images of different dimensions');
      return null;
    };

    // For each sub-pixel channel (rgba) of every pixel from the image data...
    while (i < subPixelCount) {
      // Get the grayscale (achromatic) value of the pixel.
      pxLuminance1 = luma(imgDataSubPixels1[i], imgDataSubPixels1[i + 1], imgDataSubPixels1[i + 2]);
      pxLuminance2 = luma(imgDataSubPixels2[i], imgDataSubPixels2[i + 1], imgDataSubPixels2[i + 2]);

      // Get the difference in brightness of both pixels.
      pxLuminanceDiff = Math.abs(pxLuminance1 - pxLuminance2);

      // If brightness difference is "significant", set it to white, else black.
      if (pxLuminanceDiff >= LUMA_DIFF_THRESHOLD) {
        pxBinaryDiff = 255;
        diffPxCount++;
      } else {
        pxBinaryDiff = 0;
      }

      // Write the difference in luminosity to the blended canvas context.
      // We write the same value to all color channels to show it in white since
      // there's no noticeable performance difference if we only use one color.
      // There was a slight performance hit if we use only the alpha channel so
      // we set to fully opaque.
      deltaImgDataSubPixels[  i  ] = (showBinaryDiff ? pxBinaryDiff : pxLuminanceDiff);   // r
      deltaImgDataSubPixels[i + 1] = (showBinaryDiff ? pxBinaryDiff : pxLuminanceDiff);   // g
      deltaImgDataSubPixels[i + 2] = (showBinaryDiff ? pxBinaryDiff : pxLuminanceDiff);   // b
      deltaImgDataSubPixels[i + 3] = 255;                                                 // a

      // Advance to the next pixel (a set of rgba channels).
      i = (i + 4);
    }

    return diffPxCount;
  }


  /**
   * Returns the luma (grayscale) value of a set of rgb sub-pixel channels.
   */
  function luma(r, g, b) {
    return (r + g + b) / 3;
    //return (r+r+r + g+g+g+g+g+g + b) / 10;
  }
}());
