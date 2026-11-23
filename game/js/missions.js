// Five story missions for Mara Voss, with objectives, markers and payouts.
(function () {
  'use strict';
  var U = window.NH.util;

  function makeMissions() {
    return [
      {
        name: 'First Fare', pay: 150,
        intro: 'Mara: "A package. Club Volt. Don\'t open it, don\'t stop for anyone."',
        objective: 'Deliver the package to Club Volt',
        target: { x: 1800, y: 1000, r: 60, label: 'CLUB VOLT' },
        kind: 'goto', t: 0
      },
      {
        name: 'Hot Cargo', pay: 250,
        intro: 'Mara: "A crate is waiting at Pier 9. The hotel wants it by midnight."',
        objective: 'Pick up the crate at Pier 9, then deliver it to the Hotel',
        target: { x: 600, y: 1830, r: 60, label: 'PIER 9' },
        kind: 'pickup', t: 0, stage: 0
      },
      {
        name: 'Tail the Runner', pay: 300,
        intro: 'Mara: "A courier is skimming off the top. Follow him — do not get seen."',
        objective: 'Tail the runner: stay 100–320 px behind him',
        target: { x: 0, y: 0, r: 0, label: 'RUNNER' },
        kind: 'tail', t: 0, tailTime: 0
      },
      {
        name: 'Heat Escape', pay: 400,
        intro: 'Mara: "The whole precinct is on you. Survive 60 seconds and lose them."',
        objective: 'Survive the 3-star chase for 60 seconds',
        target: { x: 0, y: 0, r: 0, label: '' },
        kind: 'survive', t: 0
      },
      {
        name: 'The Big Score', pay: 800,
        intro: 'Mara: "The casino vault. In, out, and to the safehouse. This clears your name."',
        objective: 'Rob the casino vault, then reach the safehouse',
        target: { x: 1000, y: 1400, r: 60, label: 'CASINO' },
        kind: 'pickup', t: 0, stage: 0
      }
    ];
  }

  var runner = null; // the tail target car

  function startMission(st, idx) {
    var m = st.missions[idx];
    st.missionIndex = idx;
    st.missionMsg = m.intro;
    st.missionMsgT = 5;
    m.t = 0; m.stage = 0; m.tailTime = 0;
    if (m.kind === 'tail') {
      runner = window.NH.state.newCar(st.player.x + 260, st.player.y, 0, '#fd3');
      st.cars.push(runner);
    }
    if (m.kind === 'survive') {
      if (st.player.wanted < 3) window.NH.state.addWanted(st, 3 - st.player.wanted);
    }
    window.NH.audio.mission();
  }

  function completeMission(st) {
    var m = st.missions[st.missionIndex];
    st.player.money += m.pay;
    st.stats.missionsDone++;
    st.missionMsg = 'Job done — ' + m.name + ' paid $' + m.pay + '.';
    st.missionMsgT = 4;
    window.NH.audio.pickup();
    if (runner) {
      var ri = st.cars.indexOf(runner);
      if (ri >= 0) st.cars.splice(ri, 1);
      runner = null;
    }
    if (st.missionIndex + 1 < st.missions.length) {
      startMission(st, st.missionIndex + 1);
    } else {
      st.missionMsg = 'All five jobs done. Neon Harbor is yours, Vex.';
      st.missionMsgT = 6;
    }
  }

  function update(st, dt) {
    if (!st.missions) return;
    var m = st.missions[st.missionIndex];
    if (!m) return;
    var p = st.player;
    m.t += dt;
    if (m.kind === 'goto') {
      if (U.dist(p.x, p.y, m.target.x, m.target.y) < m.target.r) completeMission(st);
    } else if (m.kind === 'pickup') {
      if (m.stage === 0) {
        if (U.dist(p.x, p.y, m.target.x, m.target.y) < m.target.r) {
          m.stage = 1;
          window.NH.audio.pickup();
          if (st.missionIndex === 1) {
            m.target = { x: 1400, y: 600, r: 60, label: 'HOTEL' };
            m.objective = 'Deliver the crate to the Hotel';
          } else {
            m.target = { x: 2200, y: 600, r: 60, label: 'SAFEHOUSE' };
            m.objective = 'Reach the safehouse with the score';
          }
          st.missionMsg = 'Got it. Now move.';
          st.missionMsgT = 3;
        }
      } else {
        if (U.dist(p.x, p.y, m.target.x, m.target.y) < m.target.r) completeMission(st);
      }
    } else if (m.kind === 'tail') {
      if (!runner) return;
      // The runner cruises along the roads, unaware.
      runner.speed = 110;
      var na = runner.angle + (Math.random() - 0.5) * 0.6 * dt;
      var nx = runner.x + Math.cos(na) * runner.speed * dt;
      var ny = runner.y + Math.sin(na) * runner.speed * dt;
      if (window.NH.city.onRoad(nx, ny)) { runner.x = nx; runner.y = ny; runner.angle = na; }
      else runner.angle += Math.PI / 2;
      var d = U.dist(p.x, p.y, runner.x, runner.y);
      if (d < 320 && d > 100) {
        m.tailTime += dt;
        if (m.tailTime > 12) completeMission(st);
      } else {
        m.tailTime = Math.max(0, m.tailTime - dt * 2);
        if (d < 100) {
          st.missionMsg = 'Too close — he will spot you!';
          st.missionMsgT = 1;
        }
      }
    } else if (m.kind === 'survive') {
      if (m.t > 60 && p.wanted === 0) completeMission(st);
      else if (m.t > 60 && p.wanted > 0) {
        st.missionMsg = 'Lose the heat to finish the job.';
        st.missionMsgT = 2;
      }
    }
  }

  function currentTarget(st) {
    if (!st.missions) return null;
    var m = st.missions[st.missionIndex];
    if (!m) return null;
    if (m.kind === 'tail' && runner) return { x: runner.x, y: runner.y, r: 0, label: 'RUNNER' };
    if (m.kind === 'survive') return null;
    return m.target;
  }

  window.NH.missions = { makeMissions: makeMissions, startMission: startMission, completeMission: completeMission, update: update, currentTarget: currentTarget };
})();
