/* 天官太乙式 · 式盘绘制
 * 由内而外：紫微宫（北斗随斗建而移）→ 七政 → 十二次分野 → 二十八宿
 * 盘面以上南下北、左东右西为序，故地支自午起，顺时针行。
 */
(function () {
  'use strict';

  var D = window.TGData;
  var norm360 = window.TGAstro.norm360;

  var CX = 500, CY = 500;
  var R_OUT = 462;   // 外缘
  var R_XIU_IN = 392;  // 宿环内缘
  var R_ZHI_IN = 314;  // 地支环内缘
  var R_DISC = 232;    // 紫微宫

  // 北斗七星（口径朝上，斗柄向左下，单位为盘心比例的坐标，y 向下）
  var BEIDOU = [
    { n: '天枢', x: 0.42, y: 0.62, m: 1.0 },
    { n: '天璇', x: 0.62, y: -0.30, m: 0.92 },
    { n: '天玑', x: 0.05, y: -0.55, m: 0.86 },
    { n: '天权', x: -0.15, y: -0.10, m: 0.7 },
    { n: '玉衡', x: -0.72, y: -0.02, m: 0.98 },
    { n: '开阳', x: -1.18, y: 0.30, m: 0.84 },
    { n: '摇光', x: -1.50, y: 0.72, m: 0.9 }
  ];
  var BOWL_PATH = [0, 1, 2, 3];
  var HANDLE_PATH = [3, 4, 5, 6];

  var ZHOU_GROUP = [
    { name: '东方青龙', start: '角', end: '箕' },
    { name: '北方玄武', start: '斗', end: '壁' },
    { name: '西方白虎', start: '奎', end: '参' },
    { name: '南方朱雀', start: '井', end: '轸' }
  ];

  function f(n) { return Math.round(n * 100) / 100; }

  function pt(r, a) {
    var rad = a * Math.PI / 180;
    return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
  }

  function wedge(r1, r2, a1, a2) {
    var p1 = pt(r2, a1), p2 = pt(r2, a2), p3 = pt(r1, a2), p4 = pt(r1, a1);
    var large = (a2 - a1) > 180 ? 1 : 0;
    return 'M' + f(p1[0]) + ' ' + f(p1[1]) +
      ' A' + r2 + ' ' + r2 + ' 0 ' + large + ' 1 ' + f(p2[0]) + ' ' + f(p2[1]) +
      ' L' + f(p3[0]) + ' ' + f(p3[1]) +
      ' A' + r1 + ' ' + r1 + ' 0 ' + large + ' 0 ' + f(p4[0]) + ' ' + f(p4[1]) + ' Z';
  }

  function tangText(r, a, text, attrs) {
    var p = pt(r, a);
    var n = norm360(a);
    var rot = (n > 90 && n < 270) ? a - 180 : a;
    return '<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" transform="rotate(' + f(rot) + ' ' + f(p[0]) + ' ' + f(p[1]) + ')" text-anchor="middle" dominant-baseline="middle" ' + (attrs || '') + '>' + text + '</text>';
  }

  function radText(r, a, text, attrs) {
    var p = pt(r, a);
    var n = norm360(a);
    var rot, anchor;
    if (n > 180) { rot = a + 90; anchor = 'end'; }
    else { rot = a - 90; anchor = 'start'; }
    return '<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" transform="rotate(' + f(rot) + ' ' + f(p[0]) + ' ' + f(p[1]) + ')" text-anchor="' + anchor + '" dominant-baseline="middle" ' + (attrs || '') + '>' + text + '</text>';
  }

  // 线性同余伪随机，保证盘面星点固定
  function makeRng(seed) {
    var s = seed;
    return function () {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  // 月建：立春起寅，每节递进一支
  var MONTH_ZHI = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

  function midWuOf(c) {
    var wu = c.sectors.filter(function (s) { return s.zhi === '午'; })[0];
    return wu ? wu.mid : c.ring[0].start;
  }

  function angAt(c, lon) { return norm360(midWuOf(c) - lon); }

  function spanAt(c, lo, hi) {
    var a1 = angAt(c, hi), a2 = angAt(c, lo);
    return { a1: a1, w: norm360(a2 - a1) };
  }

  // 斗柄所指即月建：以太阳黄经定月，斗柄在该支扇区内随节气推进
  function beidouAngle(c) {
    var lon = norm360(c.solarLon - 315);
    var m = Math.floor(lon / 30) % 12;
    var t = (lon - m * 30) / 30;
    var sec = c.sectors.filter(function (s) { return s.zhi === MONTH_ZHI[m]; })[0];
    if (!sec) return 0;
    var sp = spanAt(c, sec.start, sec.start + sec.width);
    return norm360(sp.a1 + sp.w * t);
  }

  function monthZhiOf(c) {
    return MONTH_ZHI[Math.floor(norm360(c.solarLon - 315) / 30) % 12];
  }

  var DIR_NAMES = ['南', '西南', '西', '西北', '北', '东北', '东', '东南'];
  function dirName(a) {
    return DIR_NAMES[Math.round(norm360(a) / 45) % 8];
  }

  function build(c) {
    var ring = c.ring;
    // 上南下北、左东右西：黄经自西向东增，盘上应逆时针行。
    // 故以午中为顶，地支依午→未→申……顺时针排布，宿则循其本位。
    function ang(lon) { return angAt(c, lon); }
    function angRange(lo, hi) { return spanAt(c, lo, hi); }

    var defs =
      '<defs>' +
      '<radialGradient id="discGrad" cx="50%" cy="42%" r="62%">' +
      '<stop offset="0%" stop-color="#152142"/>' +
      '<stop offset="42%" stop-color="#0c1428"/>' +
      '<stop offset="100%" stop-color="#060a15"/>' +
      '</radialGradient>' +
      '<radialGradient id="haloGrad" cx="50%" cy="38%" r="58%">' +
      '<stop offset="0%" stop-color="#2b4478" stop-opacity="0.32"/>' +
      '<stop offset="60%" stop-color="#141d36" stop-opacity="0.08"/>' +
      '<stop offset="100%" stop-color="#000000" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#fff8e2" stop-opacity="0.95"/>' +
      '<stop offset="35%" stop-color="#e9d49a" stop-opacity="0.55"/>' +
      '<stop offset="100%" stop-color="#c9a558" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<filter id="soft" x="-60%" y="-60%" width="220%" height="220%">' +
      '<feGaussianBlur stdDeviation="2.6"/>' +
      '</filter>' +
      '<filter id="softer" x="-80%" y="-80%" width="260%" height="260%">' +
      '<feGaussianBlur stdDeviation="6"/>' +
      '</filter>' +
      '</defs>';

    var s = [];

    // 地盘光晕
    s.push('<circle cx="500" cy="500" r="' + (R_OUT + 14) + '" fill="url(#haloGrad)"/>');

    // 宿环
    var xiuFills = ['rgba(216,186,116,0.030)', 'rgba(216,186,116,0.065)'];
    ring.forEach(function (x, idx) {
      var rg = angRange(x.start, x.start + x.width);
      s.push('<path d="' + wedge(R_XIU_IN, R_OUT, rg.a1, rg.a1 + rg.w) + '" fill="' + xiuFills[idx % 2] + '" stroke="rgba(216,186,116,0.16)" stroke-width="0.6"/>');
    });

    // 宿度细刻（每五古度一刻）
    var ticks = [];
    ring.forEach(function (x) {
      var a0 = angRange(x.start, x.start + x.width).a1;
      var per = x.width / x.gu;
      var n = Math.floor(x.gu / 5);
      for (var k = 1; k <= n; k++) {
        var a = a0 + k * 5 * per;
        var pa = pt(R_OUT - 1, a), pb = pt(R_OUT - 10, a);
        ticks.push('<line x1="' + f(pa[0]) + '" y1="' + f(pa[1]) + '" x2="' + f(pb[0]) + '" y2="' + f(pb[1]) + '" stroke="rgba(216,186,116,0.30)" stroke-width="0.7"/>');
      }
    });
    s.push('<g>' + ticks.join('') + '</g>');

    // 宿界
    ring.forEach(function (x) {
      var a = ang(x.start);
      var pa = pt(R_XIU_IN, a), pb = pt(R_OUT, a);
      s.push('<line x1="' + f(pa[0]) + '" y1="' + f(pa[1]) + '" x2="' + f(pb[0]) + '" y2="' + f(pb[1]) + '" stroke="rgba(216,186,116,0.34)" stroke-width="0.8"/>');
    });

    // 宿名
    ring.forEach(function (x) {
      var a = ang(x.mid);
      s.push(tangText(R_OUT - 34, a, x.name, 'fill="#e7d3a0" font-size="18" letter-spacing="0.5"'));
      s.push(tangText(R_OUT - 15, a, x.xiu, 'fill="rgba(200,170,100,0.55)" font-size="10"'));
    });

    // 四方星象
    var xn = {};
    ring.forEach(function (x) { xn[x.name] = x; });
    ZHOU_GROUP.forEach(function (g) {
      var gs = angRange(xn[g.start].start, xn[g.end].start + xn[g.end].width);
      var mid = gs.a1 + gs.w / 2;
      s.push(tangText(R_OUT + 16, mid, g.name, 'fill="rgba(190,170,125,0.62)" font-size="11.5" letter-spacing="4"'));
    });

    // 地支 / 十二次
    var zhiColors = ['rgba(150,180,235,0.028)', 'rgba(150,180,235,0.055)'];
    c.sectors.forEach(function (sec, idx) {
      var zg = angRange(sec.start, sec.start + sec.width);
      s.push('<path d="' + wedge(R_ZHI_IN, R_XIU_IN, zg.a1, zg.a1 + zg.w) + '" fill="' + zhiColors[idx % 2] + '" stroke="rgba(150,180,235,0.16)" stroke-width="0.6"/>');
      var ci = D.CI[sec.zhi];
      var midA = zg.a1 + zg.w / 2;
      s.push(tangText((R_ZHI_IN + R_XIU_IN) / 2 + 22, midA, sec.zhi, 'fill="#f4e6bc" font-size="28"'));
      s.push(tangText((R_ZHI_IN + R_XIU_IN) / 2 - 2, midA, ci.name, 'fill="rgba(196,178,140,0.8)" font-size="13" letter-spacing="1"'));
      s.push(tangText((R_ZHI_IN + R_XIU_IN) / 2 - 19, midA, ci.zhou, 'fill="rgba(140,137,128,0.78)" font-size="10.5"'));
    });

    // 七政环
    s.push('<circle cx="500" cy="500" r="' + R_ZHI_IN + '" fill="none" stroke="rgba(216,186,116,0.30)" stroke-width="0.8"/>');
    s.push('<circle cx="500" cy="500" r="' + R_DISC + '" fill="none" stroke="rgba(216,186,116,0.34)" stroke-width="0.8"/>');

    // 七政刻度（每 10 度）
    var pticks = [];
    for (var t = 0; t < 36; t++) {
      var at = t * 10;
      var pa2 = pt(R_DISC, at), pb2 = pt(R_DISC + (t % 3 === 0 ? 9 : 5), at);
      pticks.push('<line x1="' + f(pa2[0]) + '" y1="' + f(pa2[1]) + '" x2="' + f(pb2[0]) + '" y2="' + f(pb2[1]) + '" stroke="rgba(216,186,116,' + (t % 3 === 0 ? 0.34 : 0.18) + ')" stroke-width="0.7"/>');
    }
    s.push('<g>' + pticks.join('') + '</g>');

    // 七政入度
    var labels = c.bodies.map(function (b) {
      return { b: b, a: ang(b.lon) };
    }).sort(function (x, y) { return x.a - y.a; });

    var lastA = -999;
    labels.forEach(function (o) {
      var a = o.a;
      var la = a;
      if (la - lastA < 11.5 && la - lastA >= 0) la = lastA + 11.5;
      lastA = la;
      o.labelA = norm360(la);

      var b = o.b;
      var pm = pt(262, a);
      var pl = pt(292, la);

      // 引线
      s.push('<line x1="' + f(pm[0]) + '" y1="' + f(pm[1]) + '" x2="' + f(pl[0]) + '" y2="' + f(pl[1]) + '" stroke="' + b.color + '" stroke-opacity="0.35" stroke-width="0.6"/>');
      // 星点
      s.push('<circle cx="' + f(pm[0]) + '" cy="' + f(pm[1]) + '" r="7" fill="' + b.color + '" opacity="0.16" filter="url(#soft)"/>');
      s.push('<circle cx="' + f(pm[0]) + '" cy="' + f(pm[1]) + '" r="3.1" fill="' + b.color + '"/>');
      s.push('<circle cx="' + f(pm[0]) + '" cy="' + f(pm[1]) + '" r="1.1" fill="#ffffff" opacity="0.85"/>');
      // 名
      s.push(radText(292, la, b.glyph + ' ' + b.name, 'fill="' + b.color + '" font-size="15" letter-spacing="0.5"'));
    });

    // 紫微宫
    s.push('<circle cx="500" cy="500" r="' + R_DISC + '" fill="url(#discGrad)" opacity="0.92"/>');
    s.push('<circle cx="500" cy="500" r="' + (R_DISC - 6) + '" fill="none" stroke="rgba(216,186,116,0.18)" stroke-width="0.7"/>');

    var innerStars = [];
    var rng2 = makeRng(8848);
    for (var j = 0; j < 70; j++) {
      var ir = Math.sqrt(rng2()) * (R_DISC - 26);
      if (ir < 40) continue;
      var ia = rng2() * 360;
      var ip = pt(ir, ia);
      innerStars.push('<circle cx="' + f(ip[0]) + '" cy="' + f(ip[1]) + '" r="' + f(0.5 + rng2() * 1.0) + '" fill="#dfe9ff" opacity="' + f(0.1 + rng2() * 0.4) + '"/>');
    }
    s.push('<g>' + innerStars.join('') + '</g>');

    s.push('<text x="500" y="' + (CY - 170) + '" text-anchor="middle" fill="rgba(232,214,168,0.86)" font-size="17" letter-spacing="8">紫微宫</text>');
    s.push('<line x1="448" y1="' + (CY - 154) + '" x2="552" y2="' + (CY - 154) + '" stroke="rgba(216,186,116,0.30)" stroke-width="0.7"/>');

    // 北斗
    var targetA = beidouAngle(c);
    var mZhi = monthZhiOf(c);
    var restA = 238.7;
    var rot = targetA - restA;
    var scale = 96;
    var starPts = BEIDOU.map(function (st) {
      return { n: st.n, m: st.m, x: CX + st.x * scale, y: CY + 18 + st.y * scale };
    });

    var bd = [];
    function polyPath(seq) {
      return seq.map(function (ix, k) {
        return (k === 0 ? 'M' : 'L') + f(starPts[ix].x) + ' ' + f(starPts[ix].y);
      }).join(' ');
    }
    bd.push('<g transform="rotate(' + f(rot) + ' ' + CX + ' ' + (CY + 18) + ')">');
    bd.push('<path d="' + polyPath(BOWL_PATH) + '" fill="none" stroke="rgba(160,196,255,0.42)" stroke-width="0.9"/>');
    bd.push('<path d="' + polyPath(HANDLE_PATH) + '" fill="none" stroke="rgba(160,196,255,0.42)" stroke-width="0.9"/>');
    starPts.forEach(function (sp, ix) {
      bd.push('<circle cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="' + f(9 * sp.m) + '" fill="#b6ccff" opacity="0.10" filter="url(#soft)"/>');
      bd.push('<circle cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="' + f(2.4 * sp.m) + '" fill="#eaf1ff"/>');
      bd.push('<circle cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="' + f(1.0 * sp.m) + '" fill="#ffffff"/>');
      var lx = sp.x + (sp.x > CX ? 9 : -9);
      bd.push('<text x="' + f(lx) + '" y="' + f(sp.y + 3) + '" text-anchor="' + (sp.x > CX ? 'start' : 'end') + '" fill="rgba(190,206,240,0.66)" font-size="9.5" letter-spacing="0.5">' + sp.n + '</text>');
    });
    bd.push('</g>');
    s.push('<g>' + bd.join('') + '</g>');

    // 北辰
    s.push('<circle cx="500" cy="500" r="16" fill="url(#coreGrad)" opacity="0.7"/>');
    s.push('<circle cx="500" cy="500" r="2.2" fill="#fffdf4"/>');
    s.push('<text x="500" y="' + (CY + 192) + '" text-anchor="middle" fill="rgba(190,170,125,0.78)" font-size="12.5" letter-spacing="2">斗柄指' + mZhi + ' · ' + c.lunar.monthName + '建' + mZhi + '</text>');
    s.push('<text x="500" y="' + (CY + 210) + '" text-anchor="middle" fill="rgba(140,137,128,0.7)" font-size="10" letter-spacing="1">北辰不动 · 众星拱之</text>');

    // 外缘
    s.push('<circle cx="500" cy="500" r="' + R_OUT + '" fill="none" stroke="rgba(216,186,116,0.45)" stroke-width="1.1"/>');
    s.push('<circle cx="500" cy="500" r="' + (R_OUT + 4) + '" fill="none" stroke="rgba(216,186,116,0.18)" stroke-width="0.6"/>');
    s.push('<circle cx="500" cy="500" r="' + (R_OUT - 78) + '" fill="none" stroke="rgba(216,186,116,0.30)" stroke-width="0.9"/>');
    s.push('<circle cx="500" cy="500" r="' + R_ZHI_IN + '" fill="none" stroke="rgba(150,180,235,0.22)" stroke-width="0.7"/>');

    return { defs: defs, body: s.join(''), midWu: midWuOf(c), ang: ang };
  }

  function svg(c, cls) {
    var out = build(c);
    return '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" class="' + (cls || '') + '" role="img" aria-label="天官太乙式星盘">' +
      out.defs + out.body + '</svg>';
  }

  window.TGChart = {
    build: build,
    svg: svg,
    beidouAngle: beidouAngle,
    monthZhi: monthZhiOf,
    dirName: dirName,
    CX: CX,
    CY: CY
  };
})();
