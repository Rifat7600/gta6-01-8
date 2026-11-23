// Synthesized WebAudio: engine hum, sirens, blips, gunshots, crashes.
// No audio files, no network. Created lazily on first user gesture.
(function () {
  'use strict';
  var ctx = null, master = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null;
  var muted = false;

  function ensure() {
    if (ctx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 50;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'sine';
      sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();
    } catch (e) { ctx = null; }
  }
  function blip(freq, dur, type, vol) {
    if (!ctx || muted) return;
    try {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.08));
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + (dur || 0.08));
    } catch (e) {}
  }
  function noise(dur, vol) {
    if (!ctx || muted) return;
    try {
      var len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var g = ctx.createGain(); g.gain.value = vol || 0.3;
      src.connect(g); g.connect(master); src.start();
    } catch (e) {}
  }
  function update(speedNorm, wanted, dt, time) {
    if (!ctx) return;
    if (muted) { engineGain.gain.value = 0; sirenGain.gain.value = 0; return; }
    engineGain.gain.value = 0.02 + speedNorm * 0.05;
    engineOsc.frequency.value = 45 + speedNorm * 130;
    if (wanted > 0) {
      sirenGain.gain.value = 0.035;
      sirenOsc.frequency.value = 650 + 250 * Math.sin(time * 4);
    } else {
      sirenGain.gain.value = 0;
    }
  }
  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.25; }
  window.NH.audio = {
    ensure: ensure, update: update, setMuted: setMuted,
    shoot: function () { noise(0.12, 0.35); },
    punch: function () { noise(0.08, 0.2); },
    crash: function () { noise(0.25, 0.4); },
    pickup: function () { blip(880, 0.1, 'sine', 0.25); blip(1320, 0.12, 'sine', 0.2); },
    mission: function () { blip(660, 0.12, 'square', 0.2); blip(990, 0.18, 'square', 0.2); },
    busted: function () { blip(220, 0.4, 'sawtooth', 0.3); }
  };
})();
