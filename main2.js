(function() {
  var DIFF_THRESHOLD = 10, // diff between 2 frames' luma to be considered as movement (a.k.a. sensitivity)
    MOVEMENT_THRESHOLD = 0.02, // number of "movement" pixels to be considered camera shake (opposed to subject movement)
    ox = 0, oy = 0,
    timeOut, prevFrameImageData,

    video = document.getElementById('video-src'),
    srcCanvas = document.getElementById('canvas-src'),
    diffCanvas = document.getElementById('canvas-diff'),

    canvasWidth = srcCanvas.width,
    canvasHeight = srcCanvas.height,
    canvasArea = (canvasWidth * canvasHeight),

    srcCtx = srcCanvas.getContext('2d'),
    diffCtx = diffCanvas.getContext('2d');

  //*
  if (navigator.getUserMedia) {
    navigator.getUserMedia({video: true}, function (stream) {
      video.src = URL.createObjectURL(stream);
    }, function (e) {
      alert('Webcam error.', e);
    });
  } else {
    video.src = 'pigeons-10s_480.mov'; // fallback.
  }
  //*/

  //document.getElementById('diff-threshold').addEventListener('change', function () { diffThreshold = this.value; });

  // mirror video
  //srcCtx.translate(srcCanvas.width, 0);
  //srcCtx.scale(-1, 1);

  video.addEventListener('play', function () { frameLoop(); });
  video.addEventListener('pause', function () { clearTimeout(timeOut); });

  function frameLoop() {
    //if (!video.paused || !video.ended);
    // Draws the image data from the video source on to a canvas context.
    srcCtx.drawImage(video, 0, 0, video.width, video.height);

    blend();

    // thought requestAnimationFrame() would be more efficient, but I think we
    // it is called too often - 60fps is more than what we need
    //timeOut = requestAnimationFrame(frameLoop);
    timeOut = setTimeout(frameLoop, 1000 / 60);
  }


  function blend() {
    var diff,
      srcFrameImageData,
      blendedData, blendedData2,

      shiftedDiff;

    // Get image data from the image drawn on the source canvas.
    srcFrameImageData = srcCtx.getImageData(0, 0, canvasWidth, canvasHeight);

    // Create an image if the previous image doesn’t exist (1st iteration).
    if (!prevFrameImageData) {
      prevFrameImageData = srcFrameImageData;
    }

    // Get information about the difference between the two frames.
    diff = diffImageData(srcFrameImageData.data, prevFrameImageData.data);

    if (diff.pixels > DIFF_THRESHOLD) {
      gaugeVal = Math.round((diff.pixels / canvasArea) * 100);
    }

    // If a certain percentage of the image area is different...
    if ((diff.pixels / canvasArea) > MOVEMENT_THRESHOLD) {
      // shift cur frame left
      //srcCtx.translate(-1, 0);
      //shiftContext(srcCtx, -1, 0);

      // Effectively shifts the src left and compares to the previous frame.
      shiftedFrameData = srcCtx.getImageData(1, 0, canvasWidth, canvasHeight);
      shiftedDiff = diffImageData(shiftedFrameData.data, prevFrameImageData.data);
      //shiftedDiff -= height; // (to make up for the 1px tall gap from the shift)

      //console.log(diffPixels, shiftedDiff);

      shiftedDiffPercentage = shiftedDiff.pixels / (canvasArea - canvasHeight);
      diffPercentage = diff.pixels / canvasArea;

      //console.log(whitePxPercentage, blendedPercentage);

      // shift back
      //srcCtx.translate(1, 0);
      //shiftContext(srcCtx, 1, 0);

      if (shiftedDiffPercentage < diffPercentage) {
        ox -= 1;
      } else if (shiftedDiffPercentage > diffPercentage) {
        ox += 1;
        //console.log('translate right');
      } else { }
        //console.log(ox);

      //srcCanvas.style.webkitTransform = 'translate(' + ox * 5 + 'px, ' + oy * 5 + 'px)';
      // compare with blended (probably have to compare percentage diff)
      // if < diffPixels, translate left, else right
      // repeat for up      
    }

    // Draw the diff result on to the canvas.
    diffCtx.putImageData(diff.imgData, 0, 0);

    // Store the current frame's image data for the next iteration.
    prevFrameImageData = srcFrameImageData;
  }


  // function shiftContext(ctx, dx, dy) {
  //   // shift everything to the left:
  //   var tempCanvas = document.createElement('canvas'),
  //     shiftedImageData, shiftedContext;

  //   tempCanvas.width = ctx.canvas.width - Math.abs(dx);
  //   tempCanvas.height = ctx.canvas.height - Math.abs(dy);

  //   shiftedContext = tempCanvas.getContext('2d');

  //   shiftedImageData = ctx.getImageData(-dx, -dy, ctx.canvas.width + dx, ctx.canvas.height + dy);

  //   //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  //   shiftedContext.putImageData(imageData, 0, 0);
  //   // now clear the right-most pixels:
  //   //ctx.clearRect(ctx.canvas.width + dx, 0, 1, ctx.canvas.height);

  //   return shiftedContext;
  // }

  function diffImageData(imgData1, imgData2) {
    var i = 0,
      pixelChannels,
      diffPixels = 0,
      diffPixel,
      diffImageData = srcCtx.createImageData(canvasWidth, canvasHeight),
      pixelChannelAvg1, pixelChannelAvg2;

    // Ensure images to compare are of the same dimensions.
    if (imgData1.length != imgData2.length) {console.log('erturnin null');return null};

    // ImageData contains 4 channels (rgba) per pixel.
    pixelChannels = imgData1.length;

    // For each channel of every pixel from the reference frame...
    while (i < pixelChannels) {
      // Get the grayscale (achromatic) value of the pixel.
      pixelChannelAvg1 = luma(imgData1[i], imgData1[i + 1], imgData1[i + 2]);
      pixelChannelAvg2 = luma(imgData2[i], imgData2[i + 1], imgData2[i + 2]);

      // Get the difference between the grayscale value of the pixel.
      diffPixel = Math.abs(pixelChannelAvg1 - pixelChannelAvg2);

      // If difference is "significant" (past our determined threshold), set it to white; else black.
      diffPixel = (diffPixel > DIFF_THRESHOLD) ? 255 : 0;

      // Keep a count of the number of white pixels.
      //diffPixels += !!diffPixel;
      diffPixels = diffPixels + (diffPixel ? 1 : 0);

      // Write the difference in luminosity to the blended canvas context.
      // We write the same value to all color channels to show it in white since
      // there's no noticeable performance difference if we only use one color.
      // There was a slight performance hit if we use only the alpha channel so
      // we set to fully opaque.
      diffImageData.data[  i  ] = diffPixel;   // r
      diffImageData.data[i + 1] = diffPixel;   // g
      diffImageData.data[i + 2] = diffPixel;   // b
      diffImageData.data[i + 3] = 255;         // a

      // advance to the next pixel (a set of rgba channels)
      i = (i + 4);
    }

    return {
      imgData: diffImageData,
      pixels: diffPixels
    };
  }

  // Returns the luma (grayscale) value of an rgb pixel.
  function luma(r, g, b) {
    return (r + g + b) / 3;
    //return (0.3 * r) + (0.59 * g) + (0.11 * b);
    //return (r+r+r + g+g+g+g+g+g + b) / 10;
    //return (Math.min(r, g, b) + Math.max(r, g, b)) / 255 * 50;
  }
}());