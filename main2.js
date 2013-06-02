(function() {
  // var webcamError = function(e) {
  //   alert('Webcam error!', e);
  // };

  var video = document.getElementById('video-src');

  // navigator.getUserMedia({video: true}, function (stream) {
  //   video.src = URL.createObjectURL(stream);
  //   //video.play();
  //   update();
  // }, webcamError);

  // if (navigator.getUserMedia) {
  //   navigator.getUserMedia({audio: true, video: true}, function(stream) {
  //     video.src = stream;
  //     initialize();
  //   }, webcamError);
  // } else if (navigator.webkitGetUserMedia) {
  //   navigator.webkitGetUserMedia({audio: true, video: true}, function(stream) {
  //     video.src = window.webkitURL.createObjectURL(stream);
  //     initialize();
  //   }, webcamError);
  // } else {
  //   //video.src = 'somevideo.webm'; // fallback.
  // }

  // var notesPos = [0, 82, 159, 238, 313, 390, 468, 544];

  var movementThreshold = 30;
  var timeOut, lastImageData;
  var canvasSource = document.getElementById('canvas-src');
  var canvasBlended = document.getElementById('canvas-blended');

  var contextSource = canvasSource.getContext('2d');
  var contextBlended = canvasBlended.getContext('2d');

  //document.getElementById('movement-threshold').addEventListener('change', function () { movementThreshold = this.value; });

  // mirror video
  //contextSource.translate(canvasSource.width, 0);
  //contextSource.scale(-1, 1);

  video.addEventListener('play', function () { update(); });
  video.addEventListener('pause', function () { clearTimeout(timeOut); });

  function update() {
    //if (!video.paused || !video.ended);
    drawVideo();
    blend();
    //checkAreas();

    // thought requestAnimationFrame() would be more efficient, but I think we
    // it is called too often - more than what we need at 60fps 
    timeOut = setTimeout(update, 1000 / 60);
    //timeOut = requestAnimationFrame(update);
  }

  function drawVideo() {
    contextSource.drawImage(video, 0, 0, video.width, video.height);
  }

  function blend() {
    var sourceData,
      blendedData,
      width = canvasSource.width,
      height = canvasSource.height;

    // get image data from the image drawn on the source canvas
    sourceData = contextSource.getImageData(0, 0, width, height);

    // create an image if the previous image doesn’t exist
    if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);

    // create a ImageData instance to receive the blended result
    blendedData = contextSource.createImageData(width, height);

    // blend the 2 images
    differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);

    // draw the result in a canvas
    contextBlended.putImageData(blendedData, 0, 0);

    // store the current webcam image
    lastImageData = sourceData;
  }

  function threshold(value) {
    return (value > movementThreshold) ? 255 : 0;
  }

  // function difference(target, data1, data2) {
  //   // blend mode difference
  //   if (data1.length != data2.length) return null;
  //   var i = 0;
  //   while (i < (data1.length * 0.25)) {
  //     target[4*i] = data1[4*i] == 0 ? 0 : Math.abs(data1[4*i] - data2[4*i]);
  //     target[4*i+1] = data1[4*i+1] == 0 ? 0 : Math.abs(data1[4*i+1] - data2[4*i+1]);
  //     target[4*i+2] = data1[4*i+2] == 0 ? 0 : Math.abs(data1[4*i+2] - data2[4*i+2]);
  //     target[4*i+3] = 0xFF;
  //     ++i;
  //   }
  // }

  function differenceAccuracy(target, data1, data2) {
    var i = 0,
      pixels,
      average1, average2, diff;

    if (data1.length != data2.length) return null;

    // ImageData contains 4 channels (rgba) per pixel.
    //pixels = (data1.length / 4);
    pixelData = data1.length;

    // For each pixel data of the reference frame...
    while (i < pixelData) {
      // Gets the grayscale (achromatic) value of the pixel.
      average1 = luma(data1[i], data1[i + 1], data1[i + 2]);
      average2 = luma(data2[i], data2[i + 1], data2[i + 2]);

      // Get the difference between current and previous reference frames.
      diff = threshold(Math.abs(average1 - average2));

      // Write the difference in luminosity to the blended canvas context.
      // We write the same value to all color channels to show it in white since
      // there's no noticeable performance difference if we only use one color.
      // There was a slight performance hit if we use only the alpha channel so
      // we set to fully opaque.
      target[i] = diff;       // r
      target[i + 1] = diff;   // g
      target[i + 2] = diff;   // b
      target[i + 3] = 255;    // a

      // advance to the next pixel (set of rgba channels)
      i = (i + 4);
    }
  }

  // Returns the luma (grayscale) value of an rgb pixel.
  function luma(r, g, b) {
    return (r + g + b) / 3;
    //return (0.3 * r) + (0.59 * g) + (0.11 * b);
    //return (r+r+r + g+g+g+g+g+g + b) / 10;
    //return (Math.min(r, g, b) + Math.max(r, g, b)) / 255 * 50;
  }

  // function checkAreas() {
  //  // loop over the note areas
  //  for (var r=0; r<8; ++r) {
  //    // get the pixels in a note area from the blended image
  //    var blendedData = contextBlended.getImageData(notes[r].area.x, notes[r].area.y, notes[r].area.width, notes[r].area.height);
  //    var i = 0;
  //    var average = 0;
  //    // loop over the pixels
  //    while (i < (blendedData.data.length * 0.25)) {
  //      // make an average between the color channel
  //      average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
  //      ++i;
  //    }
  //    // calculate an average between of the color values of the note area
  //    average = Math.round(average / (blendedData.data.length * 0.25));
  //    if (average > 10) {
  //      // over a small limit, consider that a movement is detected
  //      // play a note and show a visual feedback to the user
  //      playSound(notes[r]);
  //      //notes[r].visual.style.display = "block";
  //      //$(notes[r].visual).fadeOut();
  //    }
  //  }
  // }


})();