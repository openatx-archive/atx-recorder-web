/****************************************************************
Handle global data and all ajax stuff.
****************************************************************/
import $ from 'jquery'

var device = {rotated: false},
    casesteps = {data:{}},
    logic = {},
    frames = {
      data: [],
      current: null,
      running: false,
      selected: {first: null, last: null},
    },
    screenui = {
      show: true,
      scale: 0.4,
      width: 360,
      height: 640,
      left: 0,
      top: 0,
    };

function updateCanvasSize(img){
    var canvas = document.getElementById("canvas"),
        width, height;
    if ((!img) || (!img.width) || (!img.height)) {
      width = 360;
      height = 640;
    } else {
      height = img.height* screenui.scale;
      width = img.width * height / img.height;
    }
    screenui.width = canvas.width = width;
    screenui.height = canvas.height = height;
    screenui.top = canvas.offsetTop;
    screenui.left = canvas.offsetLeft;
}
function drawImage(img) {
  var canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d");
  if (img == null) {
    ctx.font = "30px Courier New";
    ctx.fillStyle = "#aaa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign="center";
    ctx.fillText("没有图像", canvas.width/2, canvas.height/2);
  } else {
    updateCanvasSize(img);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
}

function prevFrame(){
  if (frames.current == null) { return }
  var i = frames.current-1, found = false;
  for (; i >= 0; i--) {
    if (! frames.data[i].skip) {
      found = true;
      break
    }
  }
  console.log('prevFrame', found, i);
  if (found) {
    frames.current = i;
  }
}

function nextFrame(){
  if (frames.current == null) { return }
  var i = frames.current+1, found = false;
  for (; i < frames.data.length; i++) {
    if (! frames.data[i].skip) {
      found = true;
      break
    }
  }
  if (found) {
    frames.current = i;
  }
}

function skipFrame(idx){
  if ( idx < 0 || idx >= frames.data.length ) {
    return;
  }
  frames.data[idx].skip = true;
}

function unskipFrame(idx){
  if ( idx < 0 || idx >= frames.data.length ) {
    return;
  }
  frames.data[idx].skip = false;
}

function touchToScreen(o, point) {
  switch (o) {
      case 1:
        return {left: point.top, top: device.width - point.left};
      case 2:
        return {left: device.width - point.left, top: device.height - point.top};
      case 3:
        return {left: device.height - point.top, top: point.left};
      default:
        return {left: point.left, top: point.top};
  }
}

// run case via websocket
var ws;
function connectWebsocket(){
  //ws = new WebSocket("ws://127.0.0.1:8000/run");
  ws = new WebSocket("ws://"+ location.host +"/run");
  ws.onopen = function(){
    console.log('WebSocket Closed');
  }
  ws.onmessage = function(evt) {
    var data = JSON.parse(evt.data);
    switch (data.action) {
      case 'run_all':
        frames.current = data.frame;
        if (frames.running && data.frame < frames.data.length-1) {
          ws.send(JSON.stringify({'action':'run_all', 'frame':frames.current+1}));
        } else {
          frames.running = false;
        }
        break;
      case 'run_step':
        frames.running = false;
        break;
      default:
    }
  }
  ws.onerror = function(err) {
    console.log(err);
  }
  ws.onclose = function(){
    console.log('WebSocket Closed');
  }
}

function runCase(step){
  var run = function(){
    frames.running = true;
    if (step) {
      ws.send(JSON.stringify({'action':'run_step', 'frame':frames.current}));
    } else {
      ws.send(JSON.stringify({'action':'run_all', 'frame':frames.current}));
    }
  }
  if (ws.readyState !== 1) {
    ws.close();
    connectWebsocket();
    setTimeout(function () {
      run();
    }, 1000);
  } else {
    run();
  }
}

function stopRunCase(){
  frames.running = false;
}

// all needs to be objects.
module.exports = {
  device,
  frames,
  screenui,
  casesteps,
  logic,
  // functions
  prevFrame,
  nextFrame,
  skipFrame,
  unskipFrame,
  drawImage,
  touchToScreen,
  saveCase: function(data){
    $.ajax({
      url: '/case',
      method: 'POST',
      data: {"data": JSON.stringify(data)},
      success: function(obj){
        console.log(obj);
      },
      dataType: 'json'
    });
  },
  runCase,
  stopRunCase,
}

$(function(){

  // load data
  $.getJSON('/case/case.json', function(data){
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        casesteps.data[key] = data[key];
      }
    }
    // load frames later and trigger ui change
    $.getJSON("/frames/frames.json", function(obj){
      var key;
      for (key in obj['device']) {
        device[key] = obj['device'][key]
      }
      // update screenui.scale
      if (device.width >= 1080) {
        screenui.scale = 0.4;
      }  else if (device.width >= 540 ) {
        screenui.scale = 0.8;
      } else {
        screenui.scale = 1.0;
      }
      updateCanvasSize(device);
      if (obj.frames.length > 0) {
        for (var d, i = 0, l = obj.frames.length; i < l; i++) {
          d = obj.frames[i];
          d.skip = (casesteps.data[i+''] == undefined);
          frames.data.push(d);
        }
        // wait for frames to load into vue.
        setTimeout(function () {
          frames.current = 0;
        }, 1000);
      }
    });
  });

  // bind keyboard
  $(document).keydown(function(event) {
    switch (event.keyCode) {
    case 37: //left
      prevFrame();
      return false;
    case 39: //right
      nextFrame();
      return false;
    }
  });

  // listen window.onresize
  $(window).resize(function(){
    if (frames.current != null) {
      var frame = frames.data[frames.current];
      drawImage(frame.$vm.img);
    } else {
      updateCanvasSize(device);
    }
  });

  // connect WebSocket
  connectWebsocket();
});
