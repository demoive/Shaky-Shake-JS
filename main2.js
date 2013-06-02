(function() {

  // function hasGetUserMedia() {
  //  // Note: Opera builds are unprefixed.
  //  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
  //    navigator.mozGetUserMedia || navigator.msGetUserMedia);
  // }

  // if (hasGetUserMedia()) {
  //  $("#info").hide();
  //  $("#message").show();
  // } else {
  //  $("#info").show();
  //  $("#message").hide();
  //  $("#video-demo").show();
  //  $("#video-demo")[0].play();
  //  return;
  // }

  var webcamError = function(e) {
    alert('Webcam error!', e);
  };

  var video = document.getElementById('video-src');

  navigator.getUserMedia({video: true}, function (stream) {
    video.src = URL.createObjectURL(stream);
    //video.play();
    update();
  }, webcamError);

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

  // var AudioContext = (
  //  window.AudioContext ||
  //  window.webkitAudioContext ||
  //  null
  // );

  // var notesPos = [0, 82, 159, 238, 313, 390, 468, 544];

  var timeOut, lastImageData;
  var canvasSource = document.getElementById('canvas-src');
  var canvasBlended = document.getElementById('canvas-blended');

  var contextSource = canvasSource.getContext('2d');
  var contextBlended = canvasBlended.getContext('2d');

  //var soundContext;
  //var bufferLoader;
  //var notes = [];

  // mirror video
  contextSource.translate(canvasSource.width, 0);
  contextSource.scale(-1, 1);

  var c = 5;

  update();

  // function initialize() {
  //  if (!AudioContext) {
  //    alert("AudioContext not supported!");
  //  }
  //  else {
  //    loadSounds();
  //  }
  // }

  // function loadSounds() {
  //  soundContext = new AudioContext();
  //  bufferLoader = new BufferLoader(soundContext,
  //    [
  //      'sounds/note1.mp3',
  //      'sounds/note2.mp3',
  //      'sounds/note3.mp3',
  //      'sounds/note4.mp3',
  //      'sounds/note5.mp3',
  //      'sounds/note6.mp3',
  //      'sounds/note7.mp3',
  //      'sounds/note8.mp3'
  //    ],
  //    finishedLoading
  //  );
  //  bufferLoader.load();
  // }

  // function finishedLoading(bufferList) {
  //  for (var i=0; i<8; i++) {
  //    var source = soundContext.createBufferSource();
  //    source.buffer = bufferList[i];
  //    source.connect(soundContext.destination);
  //    var note = {
  //      note: source,
  //      ready: true,
  //      visual: document.getElementById('note' + i)
  //    };
  //    note.area = {x:notesPos[i], y:0, width:note.visual.width, height:100};
  //    notes.push(note);
  //  }
  //  start();
  // }

  // function playSound(obj) {
  //  if (!obj.ready) return;
  //  var source = soundContext.createBufferSource();
  //  source.buffer = obj.note.buffer;
  //  source.connect(soundContext.destination);
  //  source.noteOn(0);
  //  obj.ready = false;
  //  // throttle the note
  //  setTimeout(setNoteReady, 400, obj);
  // }

  // function setNoteReady(obj) {
  //  obj.ready = true;
  // }

  // function start() {
  //  $(canvasSource).show();
  //  $(canvasBlended).show();
  //  $("#xylo").show();
  //  $("#message").hide();
  //  $("#description").show();
  //  update();
  // }

  function update() {
    drawVideo();
    blend();
    //checkAreas();
    timeOut = setTimeout(update, 1000/60);
  }

  function drawVideo() {
    contextSource.drawImage(video, 0, 0, video.width, video.height);
  }

  function blend() {
    var width = canvasSource.width;
    var height = canvasSource.height;
    // get webcam image data
    var sourceData = contextSource.getImageData(0, 0, width, height);
    // create an image if the previous image doesn’t exist
    if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
    // create a ImageData instance to receive the blended result
    var blendedData = contextSource.createImageData(width, height);
    // blend the 2 images
    differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
    // draw the result in a canvas
    contextBlended.putImageData(blendedData, 0, 0);
    // store the current webcam image
    lastImageData = sourceData;
  }

  // function fastAbs(value) {
  //  // funky bitwise, equal Math.abs
  //  return (value ^ (value >> 31)) - (value >> 31);
  // }

  function threshold(value) {
    return (value > 0x15) ? 0xFF : 0;
  }

  function difference(target, data1, data2) {
    // blend mode difference
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
      target[4*i] = data1[4*i] == 0 ? 0 : Math.abs(data1[4*i] - data2[4*i]);
      target[4*i+1] = data1[4*i+1] == 0 ? 0 : Math.abs(data1[4*i+1] - data2[4*i+1]);
      target[4*i+2] = data1[4*i+2] == 0 ? 0 : Math.abs(data1[4*i+2] - data2[4*i+2]);
      target[4*i+3] = 0xFF;
      ++i;
    }
  }

  function differenceAccuracy(target, data1, data2) {
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
      var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
      var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
      var diff = threshold(Math.abs(average1 - average2));
      target[4*i] = diff;
      target[4*i+1] = diff;
      target[4*i+2] = diff;
      target[4*i+3] = 0xFF;
      ++i;
    }
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