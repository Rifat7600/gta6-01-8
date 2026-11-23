// Traffic cars follow the road grid; pedestrians wander the sidewalks.
(function () {
  'use strict';
  var U = window.NH.util;
  var C = null;
  function bind() { C = window.NH.city; }

  function updateTraffic(st, dt) {
    var r = Math.random;
    for (var i = 0; i < st.cars.length; i++) {
      var c = st.cars[i];
      if (c.isPlayer || c.isPolice) continue;
      // Cruise along roads at a steady pace.
      c.speed = 95;
      var nx = c.x + Math.cos(c.angle) * c.speed * dt;
      var ny = c.y + Math.sin(c.angle) * c.speed * dt;
      // At an intersection, sometimes turn.
      var onX = Math.abs(nx - C.nearestRoadX(nx)) < 4;
      var onY = Math.abs(ny - C.nearestRoadY(ny)) < 4;
      if ((onX || onY) && r() < dt * 0.5) {
        var dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        c.angle = dirs[Math.floor(r() * dirs.length)];
      }
      // Stay on roads: if the next step leaves the road network, steer back.
      if (!C.onRoad(nx, ny)) {
        c.angle = Math.atan2(C.nearestRoadY(c.y) - c.y, C.nearestRoadX(c.x) - c.x);
        nx = c.x + Math.cos(c.angle) * c.speed * dt;
        ny = c.y + Math.sin(c.angle) * c.speed * dt;
        if (!C.onRoad(nx, ny)) { c.angle += Math.PI / 2; continue; }
      }
      c.x = nx; c.y = ny;
      // Keep inside the world.
      if (c.x < 60 || c.x > C.WORLD_W - 60 || c.y < 60 || c.y > C.HARBOR_TOP - 40) {
        c.angle += Math.PI;
        c.x = U.clamp(c.x, 60, C.WORLD_W - 60);
        c.y = U.clamp(c.y, 60, C.HARBOR_TOP - 40);
      }
    }
  }

  function updatePeds(st, dt) {
    for (var i = 0; i < st.peds.length; i++) {
      var p = st.peds[i];
      p.dirT -= dt;
      if (p.flee > 0) {
        p.flee -= dt;
        var fa = Math.atan2(p.y - st.player.y, p.x - st.player.x);
        var nx = p.x + Math.cos(fa) * 130 * dt;
        var ny = p.y + Math.sin(fa) * 130 * dt;
        if (!C.solidAt(nx, p.y)) p.x = nx;
        if (!C.solidAt(p.x, ny)) p.y = ny;
        p.angle = fa;
        continue;
      }
      if (p.dirT <= 0) {
        p.dirT = 1.5 + Math.random() * 2.5;
        p.angle += (Math.random() - 0.5) * 2.2;
      }
      var mx = p.x + Math.cos(p.angle) * p.speed * dt;
      var my = p.y + Math.sin(p.angle) * p.speed * dt;
      if (!C.solidAt(mx, p.y) && C.onRoad(mx, p.y)) p.x = mx;
      else p.angle += Math.PI / 2;
      if (!C.solidAt(p.x, my) && C.onRoad(p.x, my)) p.y = my;
      else p.angle += Math.PI / 2;
    }
  }

  function drawCars(ctx, st) {
    var list = st.cars.concat(st.police);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      // Body with neon underglow at night.
      ctx.shadowColor = c.isPolice ? '#ff4040' : '#39e6ff';
      ctx.shadowBlur = c.isPolice ? 14 : 8;
      ctx.fillStyle = c.color;
      ctx.fillRect(-18, -9, 36, 18);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0b0e1c';
      ctx.fillRect(-6, -8, 14, 16);
      ctx.fillStyle = '#dfe8ff';
      ctx.fillRect(12, -7, 3, 3); ctx.fillRect(12, 4, 3, 3);
      ctx.fillStyle = '#ff2a2a';
      ctx.fillRect(-18, -7, 3, 3); ctx.fillRect(-18, 4, 3, 3);
      if (c.isPolice) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-4, -9, 8, 4);
        ctx.fillStyle = '#222';
        ctx.font = 'bold 7px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PD', 0, 2);
      }
      ctx.restore();
    }
  }
  function drawPeds(ctx, st) {
    for (var i = 0; i < st.peds.length; i++) {
      var p = st.peds[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0b0e1c';
      ctx.beginPath(); ctx.arc(2, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  window.NH.traffic = { bind: bind, updateTraffic: updateTraffic, updatePeds: updatePeds, drawCars: drawCars, drawPeds: drawPeds };
})();
