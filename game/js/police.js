// Wanted system + police: cruisers spawn, chase, ram and bust the player.
(function () {
  'use strict';
  var U = window.NH.util;
  var C = null;
  function bind() { C = window.NH.city; }

  function spawnPolice(st) {
    var p = st.player;
    var a = Math.random() * Math.PI * 2;
    var x = U.clamp(p.x + Math.cos(a) * 700, 80, C.WORLD_W - 80);
    var y = U.clamp(p.y + Math.sin(a) * 500, 80, C.HARBOR_TOP - 60);
    var car = window.NH.state.newCar(x, y, a, '#111', { isPolice: true });
    car.hp = 100;
    st.police.push(car);
  }

  function update(st, dt) {
    var p = st.player;
    // Wanted heat decays when no police can see the player.
    var anyNear = false;
    for (var i = 0; i < st.police.length; i++) {
      if (U.dist(p.x, p.y, st.police[i].x, st.police[i].y) < 420) { anyNear = true; break; }
    }
    if (p.wanted > 0 && !anyNear) {
      st.wantedHeat -= 6 * dt;
      if (st.wantedHeat <= (p.wanted - 1) * 20) {
        p.wanted = Math.max(0, p.wanted - 1);
        st.missionMsg = p.wanted === 0 ? 'You lost them. The harbor is quiet again.' : 'Heat dropping — ' + p.wanted + ' star' + (p.wanted > 1 ? 's' : '') + ' left.';
        st.missionMsgT = 3;
      }
    } else if (p.wanted > 0) {
      st.wantedHeat = Math.min(100, st.wantedHeat + 1.5 * dt);
    }
    // Spawn cruisers up to the wanted level (plus one). Staged patrol
    // cruisers do not count toward the quota and are never removed.
    // Staged scenes stage their own police, so no extra spawns there.
    if (!st.sceneHoldPolice) {
      var want = p.wanted === 0 ? 0 : p.wanted + 1;
      var active = 0;
      for (var ai = 0; ai < st.police.length; ai++) if (!st.police[ai].patrol) active++;
      while (active < want) { spawnPolice(st); active++; }
      for (var ri = st.police.length - 1; ri >= 0 && active > want; ri--) {
        if (!st.police[ri].patrol) { st.police.splice(ri, 1); active--; }
      }
    }

    for (var k = 0; k < st.police.length; k++) {
      var c = st.police[k];
      if (c.patrol) {
        // Staged patrol cruiser: cruises straight along its road, never chases.
        var pnx = c.x + Math.cos(c.angle) * (c.patrolSpeed || 90) * dt;
        var pny = c.y + Math.sin(c.angle) * (c.patrolSpeed || 90) * dt;
        if (C.onRoad(pnx, pny)) { c.x = pnx; c.y = pny; }
        else c.angle += Math.PI / 2;
        continue;
      }
      var d = U.dist(c.x, c.y, p.x, p.y);
      var wantAngle = Math.atan2(p.y - c.y, p.x - c.x);
      c.angle += U.clamp(U.angDiff(c.angle, wantAngle), -2.6 * dt, 2.6 * dt);
      var targetSpeed = c.cruiseSpeed !== undefined ? c.cruiseSpeed : (d > 90 ? 300 + p.wanted * 12 : 120);
      c.speed = U.lerp(c.speed, targetSpeed, dt * 1.5);
      var nx = c.x + Math.cos(c.angle) * c.speed * dt;
      var ny = c.y + Math.sin(c.angle) * c.speed * dt;
      if (!C.solidAt(nx, c.y)) c.x = nx;
      if (!C.solidAt(c.x, ny)) c.y = ny;
      // Ram the player.
      if (d < 40) {
        c.speed *= 0.4;
        if (p.inCar) {
          p.inCar.hp -= 20 * dt;
          if (p.inCar.hp <= 0) {
            p.inCar.hp = 0;
            window.NH.player.exitCar(st);
            st.missionMsg = 'Your car is wrecked — run!';
            st.missionMsgT = 3;
          }
        } else {
          p.hp -= 22 * dt;
          p.hurtT = 0.4;
          if (p.hp <= 0) { p.hp = 0; st.mode = 'wasted'; window.NH.audio.busted(); }
        }
        window.NH.audio.crash();
      }
      // Bust: player on foot, slow, police right on top.
      if (!p.inCar && d < 34 && p.speed < 40) {
        st.mode = 'busted';
        window.NH.audio.busted();
      }
    }
  }

  window.NH.police = { bind: bind, update: update, spawnPolice: spawnPolice };
})();
