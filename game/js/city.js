// Neon Harbor city map: roads, buildings, harbor, neon signs.
// Layout is generated once from a fixed seed, so every run is identical.
(function () {
  'use strict';
  var U = window.NH.util;
  var WORLD_W = 3200, WORLD_H = 2400;
  var ROAD_X = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];
  var ROAD_Y = [200, 600, 1000, 1400, 1800];
  var ROAD_HALF = 26;
  var HARBOR_TOP = 2080; // water starts here

  var r = U.rng(1337);
  var buildings = [];
  var parks = [];
  // One or two buildings per block, plus a park in a few blocks.
  for (var bx = 0; bx < ROAD_X.length - 1; bx++) {
    for (var by = 0; by < ROAD_Y.length - 1; by++) {
      var x0 = ROAD_X[bx] + ROAD_HALF + 14, x1 = ROAD_X[bx + 1] - ROAD_HALF - 14;
      var y0 = ROAD_Y[by] + ROAD_HALF + 14, y1 = ROAD_Y[by + 1] - ROAD_HALF - 14;
      var roll = r();
      if (roll < 0.16) { parks.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }); continue; }
      var n = roll < 0.7 ? 2 : 1;
      for (var i = 0; i < n; i++) {
        var w = 90 + r() * 130, h = 80 + r() * 120;
        var px = x0 + r() * Math.max(1, (x1 - x0) - w);
        var py = y0 + r() * Math.max(1, (y1 - y0) - h);
        var hue = U.pick(r, ['#1c2440', '#232a4a', '#2a2140', '#1a2a3a', '#2e2138']);
        var win = U.pick(r, ['#ffd76a', '#7fe7ff', '#ff9de2', '#b6ff9d', '#ffc46b']);
        var cols = 2 + Math.floor(w / 46), rows = 2 + Math.floor(h / 42);
        buildings.push({ x: px, y: py, w: w, h: h, color: hue, win: win, cols: cols, rows: rows, lit: 0.55 + r() * 0.4 });
      }
    }
  }
  // A strip of warehouses along the docks.
  for (var d = 0; d < 5; d++) {
    buildings.push({ x: 320 + d * 560, y: 1900, w: 300, h: 120, color: '#241f33', win: '#ff9de2', cols: 6, rows: 2, lit: 0.7 });
  }

  var signs = [
    { x: 1400, y: 560, text: 'HOTEL', color: '#ff4fd8', size: 34 },
    { x: 1800, y: 960, text: 'CLUB VOLT', color: '#39e6ff', size: 30 },
    { x: 1000, y: 1360, text: 'CASINO', color: '#ffd23e', size: 32 },
    { x: 600, y: 1760, text: 'PIER 9', color: '#7dff6a', size: 30 },
    { x: 2200, y: 560, text: 'NEON', color: '#ff5a5a', size: 30 },
    { x: 2600, y: 1360, text: 'DINE', color: '#c792ff', size: 26 }
  ];

  function onRoad(x, y) {
    for (var i = 0; i < ROAD_X.length; i++) if (Math.abs(x - ROAD_X[i]) <= ROAD_HALF + 8) return true;
    for (var j = 0; j < ROAD_Y.length; j++) if (Math.abs(y - ROAD_Y[j]) <= ROAD_HALF + 8) return true;
    return false;
  }
  function inWater(x, y) { return y >= HARBOR_TOP; }
  function solidAt(x, y) {
    if (x < 20 || y < 20 || x > WORLD_W - 20 || y > WORLD_H - 20) return true;
    if (inWater(x, y)) return true;
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      if (x > b.x - 4 && x < b.x + b.w + 4 && y > b.y - 4 && y < b.y + b.h + 4) return true;
    }
    return false;
  }
  function nearestRoadX(x) {
    var best = ROAD_X[0], bd = 1e9;
    for (var i = 0; i < ROAD_X.length; i++) { var d = Math.abs(x - ROAD_X[i]); if (d < bd) { bd = d; best = ROAD_X[i]; } }
    return best;
  }
  function nearestRoadY(y) {
    var best = ROAD_Y[0], bd = 1e9;
    for (var j = 0; j < ROAD_Y.length; j++) { var d = Math.abs(y - ROAD_Y[j]); if (d < bd) { bd = d; best = ROAD_Y[j]; } }
    return best;
  }
  function randomRoadPoint(rr) {
    if (rr() < 0.5) return { x: U.pick(rr, ROAD_X), y: 60 + rr() * 1700 };
    return { x: 60 + rr() * 3000, y: U.pick(rr, ROAD_Y) };
  }

  function draw(ctx, camX, camY, viewW, viewH, time) {
    var x0 = camX - 40, y0 = camY - 40, x1 = camX + viewW + 40, y1 = camY + viewH + 40;
    // Ground.
    ctx.fillStyle = '#0b0e1c';
    ctx.fillRect(camX, camY, viewW, viewH);
    // Sidewalk blocks tint.
    ctx.fillStyle = '#10142a';
    for (var bx = 0; bx < ROAD_X.length - 1; bx++) {
      for (var by = 0; by < ROAD_Y.length - 1; by++) {
        var rx = ROAD_X[bx] + ROAD_HALF, ry = ROAD_Y[by] + ROAD_HALF;
        var rw = ROAD_X[bx + 1] - ROAD_X[bx] - ROAD_HALF * 2;
        var rh = ROAD_Y[by + 1] - ROAD_Y[by] - ROAD_HALF * 2;
        if (rx < x1 && rx + rw > x0 && ry < y1 && ry + rh > y0) ctx.fillRect(rx, ry, rw, rh);
      }
    }
    // Parks.
    for (var p = 0; p < parks.length; p++) {
      var pk = parks[p];
      if (pk.x < x1 && pk.x + pk.w > x0 && pk.y < y1 && pk.y + pk.h > y0) {
        ctx.fillStyle = '#0d2b1a';
        ctx.fillRect(pk.x, pk.y, pk.w, pk.h);
        ctx.fillStyle = '#123f24';
        ctx.beginPath(); ctx.arc(pk.x + pk.w * 0.3, pk.y + pk.h * 0.4, 16, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(pk.x + pk.w * 0.7, pk.y + pk.h * 0.6, 20, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Harbor water + docks.
    ctx.fillStyle = '#06121f';
    ctx.fillRect(Math.max(x0, 0), Math.max(y0, HARBOR_TOP), Math.min(x1, WORLD_W) - Math.max(x0, 0), Math.min(y1, WORLD_H) - Math.max(y0, HARBOR_TOP));
    ctx.fillStyle = '#0a2438';
    for (var w = 0; w < 40; w++) {
      var wx = (w * 173) % WORLD_W, wy = HARBOR_TOP + 20 + ((w * 97) % 280);
      if (wx > x0 && wx < x1 && wy > y0 && wy < y1) ctx.fillRect(wx, wy, 60 + (w % 3) * 18, 3);
    }
    ctx.fillStyle = '#3a2f22';
    ctx.fillRect(Math.max(x0, 0), HARBOR_TOP - 14, Math.min(x1, WORLD_W) - Math.max(x0, 0), 14);
    // Roads.
    ctx.fillStyle = '#171a26';
    var i, j;
    for (i = 0; i < ROAD_X.length; i++) ctx.fillRect(ROAD_X[i] - ROAD_HALF, Math.max(y0, 0), ROAD_HALF * 2, Math.min(y1, HARBOR_TOP) - Math.max(y0, 0));
    for (j = 0; j < ROAD_Y.length; j++) ctx.fillRect(Math.max(x0, 0), ROAD_Y[j] - ROAD_HALF, Math.min(x1, WORLD_W) - Math.max(x0, 0), ROAD_HALF * 2);
    // Lane dashes.
    ctx.fillStyle = '#e8c84a';
    for (i = 0; i < ROAD_X.length; i++) {
      for (var yy = 0; yy < HARBOR_TOP; yy += 56) {
        if (yy > y0 && yy < y1) ctx.fillRect(ROAD_X[i] - 2, yy, 4, 28);
      }
    }
    for (j = 0; j < ROAD_Y.length; j++) {
      for (var xx = 0; xx < WORLD_W; xx += 56) {
        if (xx > x0 && xx < x1) ctx.fillRect(xx, ROAD_Y[j] - 2, 28, 4);
      }
    }
    // Buildings with lit windows.
    for (i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      if (b.x > x1 || b.x + b.w < x0 || b.y > y1 || b.y + b.h < y0) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#05060d';
      ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      for (var c = 0; c < b.cols; c++) {
        for (var rr2 = 0; rr2 < b.rows; rr2++) {
          var lit = ((c * 7 + rr2 * 13 + i * 3) % 10) / 10 < b.lit;
          if (!lit) continue;
          ctx.fillStyle = b.win;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(b.x + 8 + c * ((b.w - 16) / b.cols), b.y + 8 + rr2 * ((b.h - 16) / b.rows), 10, 12);
          ctx.globalAlpha = 1;
        }
      }
    }
    // Neon signs with glow.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var s = 0; s < signs.length; s++) {
      var sg = signs[s];
      if (sg.x < x0 - 120 || sg.x > x1 + 120 || sg.y < y0 - 60 || sg.y > y1 + 60) continue;
      var pulse = 0.75 + 0.25 * Math.sin(time * 2 + s * 1.7);
      ctx.save();
      ctx.font = 'bold ' + sg.size + 'px system-ui, sans-serif';
      ctx.shadowColor = sg.color;
      ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = sg.color;
      ctx.globalAlpha = pulse;
      ctx.fillText(sg.text, sg.x, sg.y);
      ctx.restore();
    }
  }

  window.NH.city = {
    WORLD_W: WORLD_W, WORLD_H: WORLD_H, ROAD_X: ROAD_X, ROAD_Y: ROAD_Y,
    ROAD_HALF: ROAD_HALF, HARBOR_TOP: HARBOR_TOP,
    buildings: buildings, parks: parks, signs: signs,
    onRoad: onRoad, inWater: inWater, solidAt: solidAt,
    nearestRoadX: nearestRoadX, nearestRoadY: nearestRoadY, randomRoadPoint: randomRoadPoint,
    draw: draw
  };
})();
