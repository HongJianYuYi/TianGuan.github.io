/* 天官太乙式 · 式盘绘制
 * 由内而外：中宫天极星（北斗随斗建而移）→ 七政 → 十二次分野 → 二十八宿
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
  var R_DISC = 254;    // 中宫天极星内盘

  // 北斗七星：按 J2000 实测赤道坐标（赤经·cos赤纬, 赤纬）投影，y 向下。
  // 天枢α165.93°/+61.75° 天璇β165.46°/+56.38° 天玑γ178.46°/+53.69°
  // 天权δ183.86°/+57.03° 玉衡ε193.51°/+55.96° 开阳ζ200.98°/+54.93° 摇光η206.89°/+49.31°
  // 两千年自行不足 0.1°，古今形状一致；面对北天赤经向右递增，故不取镜像。m 依视星等。
  var BEIDOU = [
    { n: '天枢', x: -1.136, y: -0.625, m: 1.0 },
    { n: '天璇', x: -1.163, y: -0.088, m: 0.83 },
    { n: '天玑', x: -0.427, y: 0.181, m: 0.8 },
    { n: '天权', x: -0.121, y: -0.153, m: 0.6 },
    { n: '玉衡', x: 0.425, y: -0.046, m: 1.0 },
    { n: '开阳', x: 0.849, y: 0.058, m: 0.85 },
    { n: '摇光', x: 1.182, y: 0.619, m: 0.95 }
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

    // 实星层：距星与名星当日位置（岁差已当日化）；赤纬映作半径微差，亮星带晕
    if (c.stars && c.stars.length) {
      var starEls = [];
      c.stars.forEach(function (st) {
        var a = ang(st.ra);
        var r = 406 - st.dec * 0.33;
        if (r < 395) r = 395;
        if (r > 421) r = 421;
        var p = pt(r, a);
        var sr = Math.max(1.3, 3.0 - 0.62 * st.mag);
        var col = st.dist ? '#eeddab' : '#ccd9f5';
        var dimOp = (st.vis === false) ? ' opacity="0.22"' : '';
        var tipTxt = st.name + '（' + st.bayer + '）· ' + st.mag.toFixed(1) + ' 等' + (st.mag >= 4 ? '（暗星，城郭难见）' : '') + ' · 入 ' + st.xiu + ' ' + st.du.toFixed(1) + ' 度' +
          (st.alt != null ? ' · 高度 ' + st.alt.toFixed(0) + '°' + (st.vis ? '' : '（地平线下）') : '');
        starEls.push('<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sr * 3.2) + '" fill="' + col + '" opacity="' + (st.vis === false ? 0.045 : 0.13) + '"/>');
        starEls.push('<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sr) + '" fill="' + col + '"' + (st.dist ? ' stroke="rgba(232,217,174,0.5)" stroke-width="0.5"' : '') + dimOp + '/>');
        // 悬停命中区：透明大圆，小星点也能稳定触发提示；class 供点击提示委托
        starEls.push('<circle class="st-hit" data-tip="' + tipTxt + '" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="11" fill="rgba(0,0,0,0.001)"><title>' + tipTxt + '</title></circle>');
      });
      s.push('<g>' + starEls.join('') + '</g>');
    }

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

    // 地支环（支扇区以宿界为界）
    var zhiColors = ['rgba(150,180,235,0.028)', 'rgba(150,180,235,0.055)'];
    c.sectors.forEach(function (sec, idx) {
      var zg = angRange(sec.start, sec.start + sec.width);
      s.push('<path d="' + wedge(R_ZHI_IN, R_XIU_IN, zg.a1, zg.a1 + zg.w) + '" fill="' + zhiColors[idx % 2] + '" stroke="rgba(150,180,235,0.16)" stroke-width="0.6"/>');
      var midA = zg.a1 + zg.w / 2;
      s.push(tangText((R_ZHI_IN + R_XIU_IN) / 2 + 22, midA, sec.zhi, 'fill="#f4e6bc" font-size="28"'));
    });

    // 十二次：《汉志》次度表，界穿宿而过，与地支扇区脱钩，岁差漂移自见
    c.ciArcs.forEach(function (arc) {
      var ab = ang(arc.start);
      var pa = pt(R_ZHI_IN, ab), pb = pt(R_XIU_IN, ab);
      s.push('<line x1="' + f(pa[0]) + '" y1="' + f(pa[1]) + '" x2="' + f(pb[0]) + '" y2="' + f(pb[1]) + '" stroke="rgba(196,178,140,0.5)" stroke-width="0.9"/>');
      var midA = ang(arc.mid);
      s.push(tangText((R_ZHI_IN + R_XIU_IN) / 2 - 2, midA, arc.name, 'fill="rgba(196,178,140,0.8)" font-size="13" letter-spacing="1"'));
      s.push(tangText((R_ZHI_IN + R_XIU_IN) / 2 - 19, midA, arc.zhou, 'fill="rgba(140,137,128,0.78)" font-size="10.5"'));
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

    // 七政入度（以赤经定位，与宿环同口径）
    var labels = c.bodies.map(function (b) {
      return { b: b, a: ang(b.ra) };
    }).sort(function (x, y) { return x.a - y.a; });

    var lastA = -999;
    labels.forEach(function (o) {
      var a = o.a;
      var la = a;
      if (la - lastA < 11.5 && la - lastA >= 0) la = lastA + 11.5;
      lastA = la;
      o.labelA = norm360(la);

      var b = o.b;
      var pm = pt(274, a);
      var pl = pt(300, la);

      // 引线
      s.push('<line x1="' + f(pm[0]) + '" y1="' + f(pm[1]) + '" x2="' + f(pl[0]) + '" y2="' + f(pl[1]) + '" stroke="' + b.color + '" stroke-opacity="0.35" stroke-width="0.6"/>');
      // 星点
      s.push('<circle cx="' + f(pm[0]) + '" cy="' + f(pm[1]) + '" r="7" fill="' + b.color + '" opacity="0.16" filter="url(#soft)"/>');
      s.push('<circle cx="' + f(pm[0]) + '" cy="' + f(pm[1]) + '" r="3.1" fill="' + b.color + '"/>');
      s.push('<circle cx="' + f(pm[0]) + '" cy="' + f(pm[1]) + '" r="1.1" fill="#ffffff" opacity="0.85"/>');
      // 名
      s.push(radText(300, la, b.glyph + ' ' + b.name, 'fill="' + b.color + '" font-size="15" letter-spacing="0.5"'));
    });

    // 中宫天极星
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

    s.push('<text x="500" y="' + (CY - 188) + '" text-anchor="middle" fill="#f2e0b0" font-size="27" letter-spacing="11">中宫天极星</text>');
    s.push('<line x1="434" y1="' + (CY - 172) + '" x2="566" y2="' + (CY - 172) + '" stroke="rgba(216,186,116,0.42)" stroke-width="1"/>');

    // 北斗
    var targetA = beidouAngle(c);
    var restA = 120.7; // 基准图中天权→摇光方向角（0=正上，顺时针）
    var rot = targetA - restA;
    var scale = 104;
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
    bd.push('<path d="' + polyPath(BOWL_PATH) + '" fill="none" stroke="rgba(170,205,255,0.85)" stroke-width="1.6"/>');
    bd.push('<path d="' + polyPath(HANDLE_PATH) + '" fill="none" stroke="rgba(170,205,255,0.85)" stroke-width="1.6"/>');
    var BD_BAYER = { '天枢': 'α UMa · 北斗一', '天璇': 'β UMa · 北斗二', '天玑': 'γ UMa · 北斗三', '天权': 'δ UMa · 北斗四', '玉衡': 'ε UMa · 北斗五', '开阳': 'ζ UMa · 北斗六', '摇光': 'η UMa · 北斗七' };
    starPts.forEach(function (sp, ix) {
      bd.push('<circle cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="' + f(9.5 * sp.m) + '" fill="#b6ccff" opacity="0.10" filter="url(#soft)"/>');
      bd.push('<circle cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="' + f(2.5 * sp.m) + '" fill="#e4ecfc"/>');
      bd.push('<circle cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="' + f(1.05 * sp.m) + '" fill="#ffffff"/>');
      bd.push('<circle class="st-hit" data-tip="' + sp.n + '（' + BD_BAYER[sp.n] + '）" cx="' + f(sp.x) + '" cy="' + f(sp.y) + '" r="10" fill="rgba(0,0,0,0.001)"><title>' + sp.n + '（' + BD_BAYER[sp.n] + '）</title></circle>');
      var lx = sp.x + (sp.x > CX ? 11 : -11);
      bd.push('<text x="' + f(lx) + '" y="' + f(sp.y + 5) + '" text-anchor="' + (sp.x > CX ? 'start' : 'end') + '" fill="#d8e4fc" font-size="13.5" letter-spacing="1.5">' + sp.n + '</text>');
    });
    bd.push('</g>');
    s.push('<g>' + bd.join('') + '</g>');

    // 北辰
    s.push('<circle cx="500" cy="500" r="16" fill="url(#coreGrad)" opacity="0.55"/>');
    s.push('<circle cx="500" cy="500" r="2.4" fill="#fffdf4"/>');

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

  /* ===== 地平圈寻星盘 =====
   * 面南而立之见：南上北下、东左西右，与式盘同向。
   * 半径线性映高度（外圈地平 0°、心为天顶 90°），方位自南起顺时针（方位角 −180°）。
   * 地平线下之星不画。北斗七星按当日历元岁差旋转后投出（式盘内盘之北斗为符号，此为实况）。
   */
  var BD_EQU = [
    { n: '天枢', ra: 165.932, dec: 61.751, m: 1.8 },
    { n: '天璇', ra: 165.460, dec: 56.382, m: 2.4 },
    { n: '天玑', ra: 178.458, dec: 53.695, m: 2.4 },
    { n: '天权', ra: 183.857, dec: 57.033, m: 3.3 },
    { n: '玉衡', ra: 193.507, dec: 55.960, m: 1.8 },
    { n: '开阳', ra: 200.981, dec: 54.925, m: 2.2 },
    { n: '摇光', ra: 206.885, dec: 49.313, m: 1.9 }
  ];
  var DIR8N = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  function dirAz(az) { return DIR8N[Math.round(norm360(az) / 45) % 8]; }

  function horizonSvg(c) {
    var R = 430;
    function hp(alt, az) { return pt(R * (1 - alt / 90), az - 180); }
    var lon = c.input.lon, lat = c.input.lat;
    var s = [];
    s.push('<defs><radialGradient id="horGrad" cx="50%" cy="50%" r="52%">' +
      '<stop offset="0%" stop-color="#101a36"/>' +
      '<stop offset="70%" stop-color="#0a1124"/>' +
      '<stop offset="100%" stop-color="#05080f"/>' +
      '</radialGradient></defs>');
    s.push('<circle cx="500" cy="500" r="' + R + '" fill="url(#horGrad)" stroke="rgba(216,186,116,0.45)" stroke-width="1.1"/>');
    s.push('<circle cx="500" cy="500" r="' + (R + 4) + '" fill="none" stroke="rgba(216,186,116,0.18)" stroke-width="0.6"/>');
    // 高度圈（30°、60°，虚线），度数标于南中天线，描底护字
    [30, 60].forEach(function (a) {
      var rr = R * (1 - a / 90);
      s.push('<circle cx="500" cy="500" r="' + f(rr) + '" fill="none" stroke="rgba(150,180,235,0.34)" stroke-width="0.9" stroke-dasharray="4 6"/>');
      var pl = hp(a, 180);
      s.push('<text x="' + f(pl[0] + 10) + '" y="' + f(pl[1]) + '" fill="rgba(190,205,240,0.85)" font-size="13" paint-order="stroke" stroke="#05080f" stroke-width="3">' + a + '°</text>');
    });
    // 四正线（子午、卯酉）
    [0, 90].forEach(function (off) {
      var p1 = hp(0, off), p2 = hp(0, off + 180);
      s.push('<line x1="' + f(p1[0]) + '" y1="' + f(p1[1]) + '" x2="' + f(p2[0]) + '" y2="' + f(p2[1]) + '" stroke="rgba(216,186,116,0.26)" stroke-width="0.8"/>');
    });
    // 天顶
    s.push('<circle cx="500" cy="500" r="3" fill="rgba(240,215,155,0.9)"/>');
    s.push('<text x="500" y="480" text-anchor="middle" fill="rgba(240,215,155,0.85)" font-size="13" letter-spacing="3">天顶</text>');
    // 八方：四正亮金大字，四维次之，与式盘金字同调
    ['南', '西南', '西', '西北', '北', '东北', '东', '东南'].forEach(function (nm, i) {
      var p = pt(R + 30, i * 45);
      var main = i % 2 === 0;
      s.push('<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" text-anchor="middle" dominant-baseline="middle" fill="' + (main ? (i === 0 ? '#f0d79b' : 'rgba(240,215,155,0.85)') : 'rgba(220,187,112,0.62)') + '" font-size="' + (i === 0 ? 22 : (main ? 18 : 14)) + '">' + nm + '</text>');
    });
    // 恒星（地上者）
    if (c.stars) c.stars.forEach(function (st) {
      if (st.alt == null || st.alt <= 0) return;
      var p = hp(st.alt, st.az);
      var sr = Math.max(1.3, 3.0 - 0.62 * st.mag);
      var col = st.dist ? '#eeddab' : '#ccd9f5';
      var tipTxt = st.name + '（' + st.bayer + '）· ' + st.mag.toFixed(1) + ' 等 · 高度 ' + st.alt.toFixed(0) + '° · ' + dirAz(st.az) + ' ' + st.az.toFixed(0) + '°';
      s.push('<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sr * 3.2) + '" fill="' + col + '" opacity="0.13"/>');
      s.push('<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sr) + '" fill="' + col + '"/>');
      s.push('<circle class="st-hit" data-tip="' + tipTxt + '" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="11" fill="rgba(0,0,0,0.001)"><title>' + tipTxt + '</title></circle>');
    });
    // 北斗实况（勺魁勺柄连线，只连地上之段）
    var A2 = window.TGAstro;
    var bdPts = BD_EQU.map(function (b) {
      var pp = A2.precessJ2000(b.ra, b.dec, c.jd);
      var hz = A2.equToHor(pp.ra, pp.dec, c.jd, lon, lat);
      return { n: b.n, m: b.m, hz: hz };
    });
    function bdLine(path) {
      for (var i = 0; i + 1 < path.length; i++) {
        var a = bdPts[path[i]], b2 = bdPts[path[i + 1]];
        if (a.hz.alt <= 0 || b2.hz.alt <= 0) continue;
        var p1 = hp(a.hz.alt, a.hz.az), p2 = hp(b2.hz.alt, b2.hz.az);
        s.push('<line x1="' + f(p1[0]) + '" y1="' + f(p1[1]) + '" x2="' + f(p2[0]) + '" y2="' + f(p2[1]) + '" stroke="rgba(170,205,255,0.8)" stroke-width="1.8" stroke-linecap="round"/>');
      }
    }
    bdLine(BOWL_PATH); bdLine(HANDLE_PATH);
    bdPts.forEach(function (b) {
      if (b.hz.alt <= 0) return;
      var p = hp(b.hz.alt, b.hz.az);
      var tipTxt = b.n + ' · 高度 ' + b.hz.alt.toFixed(0) + '° · ' + dirAz(b.hz.az) + ' ' + b.hz.az.toFixed(0) + '°';
      s.push('<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(Math.max(1.8, 3.2 - 0.62 * b.m)) + '" fill="#d8e4fc"/>');
      s.push('<circle class="st-hit" data-tip="' + tipTxt + '" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="11" fill="rgba(0,0,0,0.001)"><title>' + tipTxt + '</title></circle>');
    });
    // 七政（地上者，字形加名注，描底护字）
    c.bodies.forEach(function (b) {
      if (b.alt == null || b.alt <= 0) return;
      var p = hp(b.alt, b.az);
      var tipTxt = b.name + ' · 高度 ' + b.alt.toFixed(0) + '° · ' + dirAz(b.az) + ' ' + b.az.toFixed(0) + '° · 入 ' + b.xiu.name + '宿';
      s.push('<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" text-anchor="middle" dominant-baseline="middle" font-size="25" fill="' + b.color + '" paint-order="stroke" stroke="#05080f" stroke-width="3.5">' + b.glyph + '</text>');
      s.push('<text x="' + f(p[0]) + '" y="' + f(p[1] + 24) + '" text-anchor="middle" fill="rgba(236,229,212,0.85)" font-size="13" paint-order="stroke" stroke="#05080f" stroke-width="3">' + b.name + '</text>');
      s.push('<circle class="st-hit" data-tip="' + tipTxt + '" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="14" fill="rgba(0,0,0,0.001)"><title>' + tipTxt + '</title></circle>');
    });
    // 盘底注记
    s.push('<text x="500" y="' + (CY + R + 56) + '" text-anchor="middle" fill="rgba(200,170,100,0.72)" font-size="14" letter-spacing="3">中天在南 · 面南仰观 · 虚线为三十、六十度高度圈</text>');
    return '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="地平圈寻星盘">' + s.join('') + '</svg>';
  }

  window.TGChart = {
    build: build,
    svg: svg,
    horizon: horizonSvg,
    beidouAngle: beidouAngle,
    monthZhi: monthZhiOf,
    dirName: dirName,
    CX: CX,
    CY: CY
  };
})();
