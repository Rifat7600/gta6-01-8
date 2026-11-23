// HUD: wanted stars, health, money, ammo, objective, speed, live minimap,
// title / pause / busted / wasted screens, floating messages.
(function () {
  'use strict';
  var U = window.NH.util;
  var C = null;
  function bind() { C = window.NH.city; }

  function drawStars(ctx, x, y, n) {
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (var i = 0; i < 5; i++) {
      ctx.fillStyle = i < n ? '#ffd23e' : '#3a3f55';
      ctx.fillText('★', x + i * 26, y);
    }
  }

  function drawMinimap(ctx, st, viewW, viewH) {
    var mw = 220, mh = 165, mx = viewW - mw - 14, my = 14;
    var sx = mw / C.WORLD_W, sy = mh / C.WORLD_H;
    ctx.save();
    ctx.fillStyle = 'rgba(4, 6, 16, 0.85)';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#39e6ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    ctx.fillStyle = '#2a3352';
    for (var i = 0; i < C.ROAD_X.length; i++) ctx.fillRect(mx + C.ROAD_X[i] * sx - 1, my, 2, mh);
    for (var j = 0; j < C.ROAD_Y.length; j++) ctx.fillRect(mx, my + C.ROAD_Y[j] * sy, mw, 2);
    ctx.fillStyle = '#0a2438';
    ctx.fillRect(mx, my + C.HARBOR_TOP * sy, mw, mh - C.HARBOR_TOP * sy);
    var t = window.NH.missions.currentTarget(st);
    if (t) {
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.arc(mx + t.x * sx, my + t.y * sy, 5, 0, Math.PI * 2); ctx.fill();
    }
    for (var k = 0; k < st.police.length; k++) {
      ctx.fillStyle = '#ff4040';
      ctx.beginPath(); ctx.arc(mx + st.police[k].x * sx, my + st.police[k].y * sy, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(mx + st.player.x * sx, my + st.player.y * sy - 6);
    ctx.lineTo(mx + st.player.x * sx + 5, my + st.player.y * sy + 4);
    ctx.lineTo(mx + st.player.x * sx - 5, my + st.player.y * sy + 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function draw(ctx, st, viewW, viewH) {
    var p = st.player;
    // Top-left panel.
    ctx.fillStyle = 'rgba(4, 6, 16, 0.8)';
    ctx.fillRect(12, 12, 250, 108);
    ctx.strokeStyle = 'rgba(57, 230, 255, 0.4)';
    ctx.strokeRect(12, 12, 250, 108);
    drawStars(ctx, 24, 20, p.wanted);
    ctx.fillStyle = '#7dff6a';
    ctx.fillRect(24, 52, 150 * (p.hp / 100), 12);
    ctx.strokeStyle = '#3a3f55';
    ctx.strokeRect(24, 52, 150, 12);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('HP ' + Math.ceil(p.hp), 182, 58);
    ctx.fillStyle = '#7dff6a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('$' + p.money, 24, 84);
    ctx.fillStyle = '#c8d2e8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('AMMO ' + p.ammo, 130, 84);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('VEX MARLOWE', 24, 108);
    // Objective bar.
    if (st.missions && st.missions[st.missionIndex]) {
      var m = st.missions[st.missionIndex];
      ctx.fillStyle = 'rgba(4, 6, 16, 0.8)';
      var label = 'MISSION ' + (st.missionIndex + 1) + ' — ' + m.name + ': ' + m.objective;
      ctx.font = 'bold 15px system-ui, sans-serif';
      var w = ctx.measureText(label).width + 28;
      ctx.fillRect((viewW - w) / 2, viewH - 84, w, 30);
      ctx.fillStyle = '#ffd23e';
      ctx.textAlign = 'center';
      ctx.fillText(label, viewW / 2, viewH - 68);
      ctx.textAlign = 'left';
    }
    // Mission message banner.
    if (st.missionMsgT > 0 && st.missionMsg) {
      ctx.font = '15px system-ui, sans-serif';
      var mw2 = ctx.measureText(st.missionMsg).width + 32;
      ctx.fillStyle = 'rgba(4, 6, 16, 0.85)';
      ctx.fillRect((viewW - mw2) / 2, 16, mw2, 30);
      ctx.fillStyle = '#e8f4ff';
      ctx.textAlign = 'center';
      ctx.fillText(st.missionMsg, viewW / 2, 32);
      ctx.textAlign = 'left';
    }
    // Speed + controls hint, bottom right.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'right';
    var spd = p.inCar ? Math.round(Math.abs(p.inCar.speed) * 0.55) : Math.round(p.speed * 0.55);
    ctx.fillText(spd + ' km/h', viewW - 16, viewH - 52);
    ctx.fillStyle = '#8fa3c8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('WASD move / drive · E car · F punch · click shoot · Space brake · P pause · M mute', viewW - 16, viewH - 30);
    ctx.textAlign = 'left';
    drawMinimap(ctx, st, viewW, viewH);
    // Target direction arrow at screen edge.
    var t2 = window.NH.missions.currentTarget(st);
    if (t2 && st.mode === 'play') {
      var dx = t2.x - p.x, dy = t2.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 500) {
        var a = Math.atan2(dy, dx);
        var ax = viewW / 2 + Math.cos(a) * 260, ay = viewH / 2 + Math.sin(a) * 170;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(a);
        ctx.fillStyle = '#ffd23e';
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffd23e';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(d) + 'm', ax, ay + 26);
        ctx.textAlign = 'left';
      }
    }
    if (p.hurtT > 0) {
      ctx.fillStyle = 'rgba(255, 40, 40, ' + (p.hurtT * 0.3) + ')';
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  function drawTitle(ctx, viewW, viewH) {
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4fd8';
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#ff4fd8';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText('NEON HARBOR', viewW / 2, 210);
    ctx.shadowColor = '#39e6ff';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#39e6ff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('AN OPEN-WORLD CRIME GAME', viewW / 2, 270);
    ctx.restore();
    ctx.fillStyle = '#e8f4ff';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('You are Vex Marlowe, a driver for the fixer Mara Voss.', viewW / 2, 340);
    ctx.fillText('Steal cars, run five jobs, and stay ahead of the Harbor PD.', viewW / 2, 368);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press ENTER or click to start', viewW / 2, 440);
    ctx.fillStyle = '#8fa3c8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('WASD move / drive · E enter or steal car · F punch · click shoot · Space handbrake · P pause · M mute', viewW / 2, 500);
    ctx.fillText('Progress saves to this browser automatically.', viewW / 2, 528);
  }

  function drawOverlay(ctx, viewW, viewH, title, lines, accent) {
    ctx.fillStyle = 'rgba(4, 6, 16, 0.82)';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText(title, viewW / 2, 300);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = '18px system-ui, sans-serif';
    for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], viewW / 2, 360 + i * 30);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Press ENTER to keep playing', viewW / 2, 360 + lines.length * 30 + 20);
    ctx.textAlign = 'left';
  }

  window.NH.hud = { bind: bind, draw: draw, drawTitle: drawTitle, drawOverlay: drawOverlay };
})();
