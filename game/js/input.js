// Keyboard + mouse input. Tracks held keys and click position.
(function () {
  'use strict';
  var keys = {};
  var mouse = { x: 0, y: 0, down: false, clicked: false };
  var pressed = {}; // edge-triggered keys, consumed each frame

  function setup(canvas) {
    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
      if (!keys[k]) pressed[k] = true;
      keys[k] = true;
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
    // Losing focus must not leave a key stuck down.
    window.addEventListener('blur', function () { for (var k in keys) keys[k] = false; });
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', function (e) {
      mouse.down = true; mouse.clicked = true;
      var r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    window.addEventListener('mouseup', function () { mouse.down = false; });
  }
  function wasPressed(k) { var v = !!pressed[k]; if (v) pressed[k] = false; return v; }
  function endFrame() { pressed = {}; mouse.clicked = false; }
  function axis() {
    var x = 0, y = 0;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    if (keys['w'] || keys['arrowup']) y -= 1;
    if (keys['s'] || keys['arrowdown']) y += 1;
    return { x: x, y: y };
  }
  window.NH.input = { setup: setup, keys: keys, mouse: mouse, wasPressed: wasPressed, endFrame: endFrame, axis: axis };
})();
