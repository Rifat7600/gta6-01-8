// Central game state: player, cars, pedestrians, police, missions, wanted.
(function () {
  'use strict';
  var U = window.NH.util;
  var C = null; // city, bound on init

  function newCar(x, y, angle, color, opts) {
    opts = opts || {};
    return {
      x: x, y: y, angle: angle, speed: 0, color: color,
      hp: 100, isPolice: !!opts.isPolice, isPlayer: false,
      target: null, // traffic waypoint
      turnAt: 0, stuck: 0
    };
  }
  function newPed(x, y) {
    return {
      x: x, y: y, angle: U.rng((x * 31 + y * 17) | 0)() * Math.PI * 2,
      speed: 22 + Math.random() * 18, color: ['#e8e8e8', '#ffd23e', '#ff9de2', '#7fe7ff', '#b6ff9d'][Math.floor(Math.random() * 5)],
      dirT: 0, flee: 0
    };
  }

  function create() {
    C = window.NH.city;
    var st = {
      mode: 'title', // title | play | pause | busted | wasted
      time: 0,
      player: {
        x: 1400, y: 620, angle: -Math.PI / 2, speed: 0,
        hp: 100, money: 1250, ammo: 30, wanted: 0,
        inCar: null, onFoot: true, punchT: 0, shootT: 0, hurtT: 0
      },
      cars: [], peds: [], police: [],
      missions: null, missionIndex: 0, missionMsg: '', missionMsgT: 0,
      wantedHeat: 0, // 0..100, drives star changes
      camX: 0, camY: 0,
      mute: false, saveT: 0,
      stats: { carsStolen: 0, pedsHit: 0, missionsDone: 0, bestWanted: 0 },
      scene: null
    };
    // Parked + traffic cars.
    var colors = ['#e33', '#37f', '#fd3', '#3d6', '#f6f', '#fff', '#f80', '#6cf'];
    var r = U.rng(4242);
    for (var i = 0; i < 16; i++) {
      var p = C.randomRoadPoint(r);
      var a = (r() < 0.5 ? 0 : Math.PI / 2) + (r() < 0.5 ? 0 : Math.PI);
      st.cars.push(newCar(p.x, p.y, a, colors[i % colors.length]));
    }
    // A few parked cars near the spawn.
    st.cars.push(newCar(1470, 660, 0, '#e33'));
    st.cars.push(newCar(1330, 660, Math.PI, '#37f'));
    for (var k = 0; k < 22; k++) {
      var px = 120 + r() * 2900, py = 120 + r() * 1850;
      if (!C.solidAt(px, py) && C.onRoad(px, py)) st.peds.push(newPed(px, py));
      else st.peds.push(newPed(C.nearestRoadX(px), C.nearestRoadY(py)));
    }
    return st;
  }

  function addWanted(st, n) {
    st.player.wanted = U.clamp(st.player.wanted + n, 0, 5);
    st.wantedHeat = st.player.wanted * 20;
    if (st.player.wanted > st.stats.bestWanted) st.stats.bestWanted = st.player.wanted;
  }

  window.NH.state = { create: create, newCar: newCar, newPed: newPed, addWanted: addWanted };
})();
