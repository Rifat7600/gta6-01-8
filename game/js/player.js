// Player: on-foot movement, driving, car theft, punch + pistol combat.
(function () {
  'use strict';
  var U = window.NH.util;
  var C = null;
  var WALK_SPEED = 170, CAR_ACCEL = 420, CAR_MAX = 340, CAR_REV = 140;

  function bind() { C = window.NH.city; }

  function nearestCar(st, maxD) {
    var best = null, bd = maxD;
    for (var i = 0; i < st.cars.length; i++) {
      var c = st.cars[i];
      if (c.isPolice) continue;
      var d = U.dist(st.player.x, st.player.y, c.x, c.y);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  function tryEnterCar(st) {
    var car = nearestCar(st, 64);
    if (!car) return;
    if (!car.isPlayer) {
      // Stealing a parked or traffic car is a crime.
      window.NH.state.addWanted(st, 1);
      st.stats.carsStolen++;
      st.missionMsg = 'Car stolen — the law is watching.';
      st.missionMsgT = 3;
      window.NH.audio.crash();
    }
    st.player.inCar = car;
    st.player.onFoot = false;
    car.isPlayer = true;
    car.speed = 0;
    st.player.x = car.x; st.player.y = car.y;
  }
  function exitCar(st) {
    var car = st.player.inCar;
    if (!car) return;
    car.isPlayer = false;
    car.speed = 0;
    var px = car.x + Math.cos(car.angle + Math.PI / 2) * 30;
    var py = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
    st.player.x = px; st.player.y = py;
    st.player.angle = car.angle;
    st.player.inCar = null;
    st.player.onFoot = true;
  }

  function punch(st) {
    if (st.player.punchT > 0) return;
    st.player.punchT = 0.35;
    window.NH.audio.punch();
    // Hit the nearest pedestrian or police within range.
    var px = st.player.x + Math.cos(st.player.angle) * 30;
    var py = st.player.y + Math.sin(st.player.angle) * 30;
    for (var i = st.peds.length - 1; i >= 0; i--) {
      if (U.dist(px, py, st.peds[i].x, st.peds[i].y) < 34) {
        st.peds[i].flee = 2.5;
        window.NH.state.addWanted(st, 1);
        st.stats.pedsHit++;
      }
    }
  }
  function shoot(st, tx, ty) {
    if (st.player.shootT > 0 || st.player.ammo <= 0) return;
    st.player.shootT = 0.3;
    st.player.ammo--;
    window.NH.audio.shoot();
    var a = Math.atan2(ty - st.player.y, tx - st.player.x);
    st.player.angle = a;
    // Simple hitscan: nearest ped or police along the shot line.
    var best = null, bd = 1e9;
    var all = st.peds.concat(st.police);
    for (var i = 0; i < all.length; i++) {
      var t = all[i];
      var dx = t.x - st.player.x, dy = t.y - st.player.y;
      var along = dx * Math.cos(a) + dy * Math.sin(a);
      if (along < 10 || along > 420) continue;
      var perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
      if (perp < 22 && along < bd) { bd = along; best = t; }
    }
    if (best) {
      if (best.isPolice) { best.hp = (best.hp || 100) - 34; window.NH.state.addWanted(st, 1); }
      else { best.flee = 3; window.NH.state.addWanted(st, 1); }
      if (best.hp !== undefined && best.hp <= 0) {
        var idx = st.police.indexOf(best);
        if (idx >= 0) st.police.splice(idx, 1);
      }
    }
  }

  function update(st, dt, input) {
    var p = st.player;
    p.punchT = Math.max(0, p.punchT - dt);
    p.shootT = Math.max(0, p.shootT - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    if (input.wasPressed('e')) {
      if (p.onFoot) tryEnterCar(st); else exitCar(st);
    }
    if (p.onFoot) {
      var ax = input.axis();
      var moving = ax.x !== 0 || ax.y !== 0;
      if (moving) {
        var len = Math.sqrt(ax.x * ax.x + ax.y * ax.y);
        var nx = p.x + (ax.x / len) * WALK_SPEED * dt;
        var ny = p.y + (ax.y / len) * WALK_SPEED * dt;
        if (!C.solidAt(nx, p.y)) p.x = nx;
        if (!C.solidAt(p.x, ny)) p.y = ny;
        p.angle = Math.atan2(ax.y, ax.x);
        p.speed = WALK_SPEED;
      } else p.speed = 0;
      if (input.wasPressed('f')) punch(st);
      if (input.mouse.clicked) {
        var m = input.mouse;
        shoot(st, p.x + (m.x - 640), p.y + (m.y - 360));
      }
    } else if (p.inCar) {
      var car = p.inCar;
      if (!st.sceneCruise) {
        var ax2 = input.axis();
        // Forward is the car's facing; W accelerates, S brakes/reverses.
        if (ax2.y < 0) car.speed += CAR_ACCEL * dt;
        else if (ax2.y > 0) car.speed -= CAR_ACCEL * 0.8 * dt;
        else car.speed *= Math.pow(0.4, dt);
        if (input.keys[' ']) car.speed *= Math.pow(0.05, dt);
        car.speed = U.clamp(car.speed, -CAR_REV, CAR_MAX);
        var steer = ax2.x * U.clamp(Math.abs(car.speed) / 90, 0, 1) * 2.4 * (car.speed >= 0 ? 1 : -1);
        car.angle += steer * dt;
      }
      var nx2 = car.x + Math.cos(car.angle) * car.speed * dt;
      var ny2 = car.y + Math.sin(car.angle) * car.speed * dt;
      if (!C.solidAt(nx2, car.y)) car.x = nx2; else { car.speed *= -0.3; window.NH.audio.crash(); }
      if (!C.solidAt(car.x, ny2)) car.y = ny2; else { car.speed *= -0.3; window.NH.audio.crash(); }
      p.x = car.x; p.y = car.y; p.angle = car.angle; p.speed = Math.abs(car.speed);
      // Running over pedestrians (not in staged cruise shots).
      if (!st.sceneCruise) {
        for (var i = 0; i < st.peds.length; i++) {
          var pd = st.peds[i];
          if (Math.abs(car.speed) > 60 && U.dist(car.x, car.y, pd.x, pd.y) < 26) {
            pd.flee = 3;
            window.NH.state.addWanted(st, 1);
            st.stats.pedsHit++;
            car.speed *= 0.7;
          }
        }
      }
    }
  }

  function draw(ctx, st) {
    var p = st.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.onFoot) {
      ctx.rotate(p.angle);
      // Vex: dark jacket, neon trim.
      ctx.fillStyle = '#1b1e2e';
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#39e6ff';
      ctx.fillRect(6, -3, 8, 6);
      ctx.fillStyle = '#f2c98a';
      ctx.beginPath(); ctx.arc(4, 0, 6, 0, Math.PI * 2); ctx.fill();
      if (p.punchT > 0.2) { ctx.fillStyle = '#f2c98a'; ctx.fillRect(12, -8, 10, 6); ctx.fillRect(12, 2, 10, 6); }
      ctx.restore();
    } else {
      ctx.restore();
    }
  }

  window.NH.player = { bind: bind, update: update, draw: draw, tryEnterCar: tryEnterCar, exitCar: exitCar };
})();
