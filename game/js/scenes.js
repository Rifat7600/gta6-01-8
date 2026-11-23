// ?scene= presets: deterministic staged states for the four screenshots.
// cover: Vex driving downtown at night, mission 1 active.
// chase: 3-star police pursuit on the avenue.
// mission: on foot at the Pier 9 pickup, crate in reach.
// foot: Vex on foot near the hotel, police closing in.
(function () {
  'use strict';
  var U = window.NH.util;

  function applyScene(st, name) {
    st.scene = name;
    var p = st.player;
    if (name === 'cover') {
      var car = window.NH.state.newCar(1800, 1700, -Math.PI / 2, '#37f');
      car.isPlayer = true;
      st.cars.push(car);
      p.inCar = car; p.onFoot = false;
      p.x = car.x; p.y = car.y; p.angle = car.angle;
      car.speed = 120;
      st.sceneCruise = true;
      p.money = 1250; p.ammo = 30;
      window.NH.missions.startMission(st, 0);
      // A little traffic around: one behind on the same avenue, one crossing.
      var t1 = window.NH.state.newCar(1800, 1950, -Math.PI / 2, '#e33'); st.cars.push(t1);
      var t2 = window.NH.state.newCar(1400, 1200, 0, '#fd3'); st.cars.push(t2);
    } else if (name === 'chase') {
      var car2 = window.NH.state.newCar(1800, 1000, 0, '#e33');
      car2.isPlayer = true;
      st.cars.push(car2);
      p.inCar = car2; p.onFoot = false;
      p.x = car2.x; p.y = car2.y; p.angle = car2.angle;
      car2.speed = 280;
      st.sceneCruise = true;
      p.wanted = 3; st.wantedHeat = 100;
      st.sceneHoldPolice = true;
      window.NH.missions.startMission(st, 3);
      for (var i = 0; i < 4; i++) {
        var pc = window.NH.state.newCar(1580 - i * 80, 1000 + (i % 2 ? 25 : -25), 0, '#111', { isPolice: true });
        pc.hp = 100;
        pc.cruiseSpeed = 280; // trail the player at a fixed gap for the shot
        st.police.push(pc);
      }
      st.missionMsg = 'Lose the cruisers — 60 seconds.';
      st.missionMsgT = 5;
    } else if (name === 'mission') {
      p.x = 660; p.y = 1780; p.angle = Math.PI / 2; p.onFoot = true; p.inCar = null;
      p.money = 1400; p.ammo = 24;
      window.NH.missions.startMission(st, 1);
      st.missionMsg = 'Pick up the crate at Pier 9.';
      st.missionMsgT = 5;
    } else if (name === 'foot') {
      p.x = 1330; p.y = 700; p.angle = 0; p.onFoot = true; p.inCar = null;
      p.wanted = 1; st.wantedHeat = 20;
      st.sceneHoldPolice = true;
      window.NH.missions.startMission(st, 0);
      // A cruiser on patrol down the avenue: visible, closing slowly,
      // never close enough to bust the staged shot.
      var pc2 = window.NH.state.newCar(1000, 600, 0, '#111', { isPolice: true });
      pc2.hp = 100;
      pc2.patrol = true;
      pc2.patrolSpeed = 90;
      st.police.push(pc2);
      st.missionMsg = 'On foot near the Hotel — a cruiser is closing in.';
      st.missionMsgT = 5;
    }
  }

  function fromUrl() {
    var q = window.location.search || '';
    var m = q.match(/[?&]scene=([a-z]+)/);
    return m ? m[1] : null;
  }

  window.NH.scenes = { applyScene: applyScene, fromUrl: fromUrl };
})();
