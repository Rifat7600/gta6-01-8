// Neon Harbor — game loop, camera, save/load, boot.
(function () {
  'use strict';
  var U = window.NH.util;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var VIEW_W = 1280, VIEW_H = 720;
  var SAVE_KEY = 'neon-harbor-save-v1';

  var st = window.NH.state.create();
  st.missions = window.NH.missions.makeMissions();
  window.NH.player.bind();
  window.NH.traffic.bind();
  window.NH.police.bind();
  window.NH.hud.bind();
  window.NH.input.setup(canvas);

  function save() {
    try {
      var p = st.player;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        money: p.money, ammo: p.ammo, missionsDone: st.stats.missionsDone,
        missionIndex: st.missionIndex, x: p.x, y: p.y, bestWanted: st.stats.bestWanted
      }));
    } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var s = JSON.parse(raw);
      st.player.money = s.money || 1250;
      st.player.ammo = s.ammo || 30;
      st.stats.missionsDone = s.missionsDone || 0;
      st.stats.bestWanted = s.bestWanted || 0;
      var idx = Math.min(s.missionIndex || 0, st.missions.length - 1);
      st.player.x = s.x || 1400; st.player.y = s.y || 620;
      return idx;
    } catch (e) { return false; }
  }

  var sceneName = window.NH.scenes.fromUrl();
  if (sceneName) {
    // Deterministic staged screenshot: skip the title screen.
    st.mode = 'play';
    window.NH.missions.startMission(st, 0);
    window.NH.scenes.applyScene(st, sceneName);
  } else {
    var savedIdx = load();
    if (savedIdx !== false && savedIdx > 0) {
      window.NH.missions.startMission(st, savedIdx);
      st.missionMsg = 'Welcome back, Vex. Mara has work for you.';
      st.missionMsgT = 4;
    } else {
      window.NH.missions.startMission(st, 0);
    }
  }

  var last = performance.now();
  // Diagnostic hook (read-only): lets a test page inspect live state.
  window.NH.debug = { state: st };
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var input = window.NH.input;
    if (input.wasPressed('m')) {
      st.mute = !st.mute;
      window.NH.audio.setMuted(st.mute);
    }
    if (st.mode === 'title') {
      window.NH.audio.ensure();
      if (input.wasPressed('enter') || input.mouse.clicked) {
        st.mode = 'play';
        window.NH.audio.ensure();
      }
      window.NH.hud.drawTitle(ctx, VIEW_W, VIEW_H);
      input.endFrame();
      requestAnimationFrame(frame);
      return;
    }
    if (st.mode === 'play' && input.wasPressed('p')) st.mode = 'pause';
    else if (st.mode === 'pause' && input.wasPressed('p')) st.mode = 'play';
    if ((st.mode === 'busted' || st.mode === 'wasted' || st.mode === 'pause') && input.wasPressed('enter')) {
      if (st.mode === 'busted' || st.mode === 'wasted') {
        // Restart the current mission, keep the money earned so far.
        st.player.hp = 100;
        st.player.wanted = 0; st.wantedHeat = 0;
        st.police.length = 0;
        st.player.x = 1400; st.player.y = 620;
        if (st.player.inCar) window.NH.player.exitCar(st);
        window.NH.missions.startMission(st, st.missionIndex);
      }
      st.mode = 'play';
    }
    if (st.mode === 'play') {
      st.time += dt;
      st.missionMsgT = Math.max(0, st.missionMsgT - dt);
      window.NH.player.update(st, dt, input);
      window.NH.traffic.updateTraffic(st, dt);
      window.NH.traffic.updatePeds(st, dt);
      window.NH.police.update(st, dt);
      window.NH.missions.update(st, dt);
      window.NH.audio.update(st.player.inCar ? Math.abs(st.player.inCar.speed) / 340 : st.player.speed / 170, st.player.wanted, dt, st.time);
      st.saveT += dt;
      if (st.saveT > 5) { st.saveT = 0; save(); }
      if (st.player.hp <= 0 && st.mode === 'play') { st.mode = 'wasted'; window.NH.audio.busted(); }
    }
    // Smooth follow camera, clamped to the world.
    var tx = U.clamp(st.player.x - VIEW_W / 2, 0, window.NH.city.WORLD_W - VIEW_W);
    var ty = U.clamp(st.player.y - VIEW_H / 2, 0, window.NH.city.WORLD_H - VIEW_H);
    st.camX = U.lerp(st.camX, tx, 1 - Math.pow(0.001, dt));
    st.camY = U.lerp(st.camY, ty, 1 - Math.pow(0.001, dt));
    if (sceneName) { st.camX = tx; st.camY = ty; }

    ctx.save();
    ctx.translate(-Math.round(st.camX), -Math.round(st.camY));
    window.NH.city.draw(ctx, st.camX, st.camY, VIEW_W, VIEW_H, st.time);
    // Mission target marker.
    var tgt = window.NH.missions.currentTarget(st);
    if (tgt && st.mode === 'play') {
      var pulse = 0.6 + 0.4 * Math.sin(st.time * 4);
      ctx.strokeStyle = 'rgba(255, 210, 62, ' + pulse + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(tgt.x, tgt.y, 46, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tgt.label || '', tgt.x, tgt.y + 62);
      ctx.textAlign = 'left';
    }
    window.NH.traffic.drawCars(ctx, st);
    window.NH.traffic.drawPeds(ctx, st);
    window.NH.player.draw(ctx, st);
    ctx.restore();

    window.NH.hud.draw(ctx, st, VIEW_W, VIEW_H);
    if (st.mode === 'pause') {
      window.NH.hud.drawOverlay(ctx, VIEW_W, VIEW_H, 'PAUSED', ['Take a breath, Vex. The harbor waits.'], '#39e6ff');
    } else if (st.mode === 'busted') {
      window.NH.hud.drawOverlay(ctx, VIEW_W, VIEW_H, 'BUSTED', ['The Harbor PD caught up with you.', 'Mara posts bail — the job goes on.'], '#ff4040');
    } else if (st.mode === 'wasted') {
      window.NH.hud.drawOverlay(ctx, VIEW_W, VIEW_H, 'WASTED', ['Neon Harbor is unforgiving tonight.', 'Mara patches you up — the job goes on.'], '#ff4040');
    }
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
