/* 天官太乙式 · 历法换算
 * 公历 ⇄ 农历 ⇄ 干支历、真太阳时、二十八宿入度、十二次分野
 */
(function () {
  'use strict';

  var D = window.TGData;
  var A = window.TGAstro;
  var norm360 = A.norm360;

  var LUNAR_BASE_UTC = Date.UTC(1900, 0, 31); // 1900-01-31 农历正月初一
  var LUNAR_MIN_YEAR = 1900;
  var LUNAR_MAX_YEAR = 2100;

  function lunarYearDays(y) {
    var sum = 348;
    var info = D.LUNAR_INFO[y - LUNAR_MIN_YEAR];
    for (var i = 0x8000; i > 0x8; i >>= 1) sum += (info & i) ? 1 : 0;
    return sum + lunarLeapDays(y);
  }
  function lunarLeapMonth(y) { return D.LUNAR_INFO[y - LUNAR_MIN_YEAR] & 0xf; }
  function lunarLeapDays(y) {
    if (!lunarLeapMonth(y)) return 0;
    return (D.LUNAR_INFO[y - LUNAR_MIN_YEAR] & 0x10000) ? 30 : 29;
  }
  function lunarMonthDays(y, m) {
    return (D.LUNAR_INFO[y - LUNAR_MIN_YEAR] & (0x10000 >> m)) ? 30 : 29;
  }

  // 展开 1900-2100 全部农历月，便于双向检索
  var LUNAR_MONTHS = (function () {
    var list = [];
    var off = 0;
    for (var y = LUNAR_MIN_YEAR; y <= LUNAR_MAX_YEAR; y++) {
      var leap = lunarLeapMonth(y);
      for (var m = 1; m <= 12; m++) {
        var days = lunarMonthDays(y, m);
        list.push({ y: y, m: m, leap: false, days: days, off: off });
        off += days;
        if (leap === m) {
          var ld = lunarLeapDays(y);
          list.push({ y: y, m: m, leap: true, days: ld, off: off });
          off += ld;
        }
      }
    }
    return list;
  })();

  function dayNumber(y, m, d) {
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  }

  /* ---------- 公历 → 农历 ---------- */
  function solarToLunar(y, m, d) {
    var offset = dayNumber(y, m, d) - Math.floor(LUNAR_BASE_UTC / 86400000);
    if (offset < 0 || offset >= LUNAR_MONTHS[LUNAR_MONTHS.length - 1].off + LUNAR_MONTHS[LUNAR_MONTHS.length - 1].days) {
      return null;
    }
    var lo = 0, hi = LUNAR_MONTHS.length - 1, pos = 0;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (LUNAR_MONTHS[mid].off <= offset) { pos = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    var mon = LUNAR_MONTHS[pos];
    return {
      y: mon.y, m: mon.m, d: offset - mon.off + 1,
      leap: mon.leap, days: mon.days,
      monthName: (mon.leap ? '闰' : '') + D.LUNAR_MONTH_NAME[mon.m - 1] + '月',
      dayName: D.LUNAR_DAY_NAME[offset - mon.off]
    };
  }

  /* ---------- 农历 → 公历 ---------- */
  function lunarToSolar(y, m, d, leap) {
    var found = null;
    for (var i = 0; i < LUNAR_MONTHS.length; i++) {
      var l = LUNAR_MONTHS[i];
      if (l.y === y && l.m === m && l.leap === !!leap) { found = l; break; }
    }
    if (!found) {
      // 该年无此闰月，退化为同月不闰
      for (var j = 0; j < LUNAR_MONTHS.length; j++) {
        var l2 = LUNAR_MONTHS[j];
        if (l2.y === y && l2.m === m && !l2.leap) { found = l2; break; }
      }
      if (!found) return null;
    }
    var maxDay = found.days;
    if (d < 1 || d > maxDay) return null;
    var ms = LUNAR_BASE_UTC + (found.off + d - 1) * 86400000;
    var dt = new Date(ms);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), monthDays: maxDay };
  }

  /* ---------- 干支 ---------- */
  function ganZhiName(index) {
    index = ((index % 60) + 60) % 60;
    return D.GAN[index % 10] + D.ZHI[index % 12];
  }
  function ganZhiIndex(stem, branch) {
    // 由干、支求六十甲子序号，无解返回 -1
    for (var i = 0; i < 60; i++) {
      if (i % 10 === stem && i % 12 === branch) return i;
    }
    return -1;
  }

  // 日柱：儒略日数推六十甲子
  function dayGanZhiIndex(jd) {
    var jdn = Math.floor(jd + 0.5);
    return ((jdn + 49) % 60 + 60) % 60;
  }

  var TERM_CACHE = {};

  function termsOfYear(y) {
    if (!TERM_CACHE[y]) TERM_CACHE[y] = A.solarTermsOfYear(y);
    return TERM_CACHE[y];
  }

  // 该时刻所处干支月（以节为界）
  function monthGanZhi(sunLon, yearStemIndex) {
    var monthOrder = Math.floor(norm360(sunLon - 315) / 30); // 0=寅
    var branch = (2 + monthOrder) % 12;
    var stem = (yearStemIndex * 2 + 2 + monthOrder) % 10;
    return { index: ganZhiIndex(stem, branch), stem: stem, branch: branch, order: monthOrder };
  }

  function yearGanZhiIndex(year) {
    return ((year - 4) % 60 + 60) % 60;
  }

  /* ---------- 真太阳时 ---------- */
  function trueSolar(jd, clockMinutes, lonEast) {
    var eot = A.equationOfTime(jd);
    var lonCorr = (lonEast - 120) * 4;
    var total = clockMinutes + eot + lonCorr;
    var dayShift = Math.floor(total / 1440);
    var mins = total - dayShift * 1440;
    var hh = Math.floor(mins / 60);
    var mm = Math.floor(mins % 60);
    return { minutes: total, dayShift: dayShift, hh: hh, mm: mm, eot: eot, lonCorr: lonCorr };
  }

  /* ---------- 二十八宿环 ---------- */
  var XIU_ZHI = (function () {
    var map = {};
    for (var z in D.CI) {
      var arr = D.CI[z].xiu;
      for (var i = 0; i < arr.length; i++) map[arr[i]] = z;
    }
    return map;
  })();

  var JIAO_ANCHOR_J2000 = 203.84; // 角宿一（Spica）J2000 视黄经
  var JIAO_LAT = -2.0546;         // 角宿一黄纬（两千年间可视作不变）

  // 古法入宿以赤道为断：角宿一黄经随岁差平移，再以当日黄赤交角转为赤经，作为角宿起点
  function jiaoRaOfDate(jd) {
    var year = 2000 + (jd - 2451545.0) / 365.2422;
    var lon = norm360(JIAO_ANCHOR_J2000 + 50.29 / 3600 * (year - 2000));
    return A.eclToEqu(lon, JIAO_LAT, jd).ra;
  }

  function buildXiuRing(jd) {
    var anchor = jiaoRaOfDate(jd);
    var totalGu = 0;
    for (var i = 0; i < D.MANSIONS.length; i++) totalGu += D.MANSIONS[i].gu;

    var ring = [];
    var cum = 0;
    for (var j = 0; j < D.MANSIONS.length; j++) {
      var m = D.MANSIONS[j];
      var w = m.gu / totalGu * 360;
      ring.push({
        index: j,
        name: m.name,
        full: m.name + m.xiu + m.beast,
        xiu: m.xiu,
        beast: m.beast,
        gu: m.gu,
        width: w,
        acc: cum,
        start: norm360(anchor + cum),
        mid: norm360(anchor + cum + w / 2),
        zhi: XIU_ZHI[m.name]
      });
      cum += w;
    }
    ring.anchor = anchor;
    return ring;
  }

  function locateXiu(lon, ring) {
    var d = norm360(lon - ring.anchor);
    for (var i = 0; i < ring.length; i++) {
      var x = ring[i];
      if (d >= x.acc && d < x.acc + x.width) {
        return { xiu: x, du: (d - x.acc) / x.width * x.gu };
      }
    }
    var last = ring[ring.length - 1];
    return { xiu: last, du: last.gu };
  }

  // 十二支在宿环上的扇形（以宿界为界）
  function buildZhiSectors(ring) {
    var sectors = [];
    for (var i = 0; i < ring.length; i++) {
      var x = ring[i];
      var last = sectors[sectors.length - 1];
      if (last && last.zhi === x.zhi) {
        last.width += x.width;
        last.mid = norm360(last.start + last.width / 2);
      } else {
        sectors.push({ zhi: x.zhi, start: x.start, width: x.width, mid: norm360(x.start + x.width / 2) });
      }
    }
    return sectors;
  }

  /* ---------- 十二次（《汉书·律历志》次度表） ---------- */
  var TOTAL_GU = 365.25;

  function normGu(x) { x = x % TOTAL_GU; return x < 0 ? x + TOTAL_GU : x; }

  // 次界以宿度计，穿宿而过；弧宽不等，随宿环整体随岁差移
  function buildCiArcs(ring) {
    var per = 360 / TOTAL_GU;
    var arcs = [];
    for (var i = 0; i < D.CI_SEQ.length; i++) {
      var cur = D.CI_SEQ[i];
      var nxt = D.CI_SEQ[(i + 1) % D.CI_SEQ.length];
      var startGu = D.XIU_CUM[cur.xiu] + cur.du;
      var widthGu = normGu(D.XIU_CUM[nxt.xiu] + nxt.du - startGu);
      var info = D.CI[cur.zhi];
      arcs.push({
        name: cur.name,
        zhi: cur.zhi,
        zhou: info.zhou,
        guo: info.guo,
        startGu: startGu,
        widthGu: widthGu,
        start: norm360(ring.anchor + startGu * per),
        width: widthGu * per,
        mid: norm360(ring.anchor + (startGu + widthGu / 2) * per)
      });
    }
    return arcs;
  }

  // 以赤经断入次
  function locateCi(ra, ring, arcs) {
    var gu = norm360(ra - ring.anchor) / 360 * TOTAL_GU;
    for (var i = 0; i < arcs.length; i++) {
      var a = arcs[i];
      if (normGu(gu - a.startGu) < a.widthGu) return a;
    }
    return arcs[0];
  }

  // 取某体某刻黄道坐标
  function bodyStateAt(key, jd) {
    if (key === 'sun') return { lon: A.sunState(jd).lon, lat: 0 };
    if (key === 'moon') return A.moonState(jd);
    return A.planetState(key, jd);
  }

  /* ---------- 综合起盘 ---------- */
  // 位态之候（黄经差为断，合冲照距皆古法名目）：
  // 内行星——合 / 晨见（西大距）/ 夕见（东大距）；外行星——合伏 / 冲 / 东西方照；太阴——朔弦望。
  function houOf(key, plon, sunLon) {
    var E = A.norm180(plon - sunLon);
    var el = Math.abs(E);
    if (key === 'mercury' || key === 'venus') {
      var maxEl = key === 'mercury' ? 27.8 : 46.7;   // asin(a(1+e))
      if (el < 3) return '合';
      if (Math.abs(el - maxEl) < 2.5) return E > 0 ? '东大距' : '西大距';
      return E > 0 ? '夕见' : '晨见';
    }
    if (key === 'moon') {
      var p = A.norm360(plon - sunLon);
      if (p < 45 || p >= 315) return '朔';
      if (p < 135) return '上弦';
      if (p < 225) return '望';
      return '下弦';
    }
    if (el > 165) return '冲';
    if (Math.abs(el - 90) < 20) return E > 0 ? '东方照' : '西方照';
    return '';
  }

  function computeChart(opt) {
    var y = opt.y, m = opt.m, d = opt.d, hh = opt.hh, mm = opt.mm;
    var lon = opt.lon, lat = opt.lat;
    var jdClock = A.jdFromBeijing(y, m, d, hh, mm, 0);

    var ts = trueSolar(jdClock, hh * 60 + mm, lon);

    // 真太阳时所在日期
    var tstY = y, tstM = m, tstD = d;
    if (ts.dayShift !== 0) {
      var dt = new Date(Date.UTC(y, m - 1, d + ts.dayShift));
      tstY = dt.getUTCFullYear(); tstM = dt.getUTCMonth() + 1; tstD = dt.getUTCDate();
    }

    // 时柱：子时 23:00 起换日
    var lateZi = ts.hh >= 23;
    var dayForPillar = lateZi ? new Date(Date.UTC(tstY, tstM - 1, tstD + 1)) : new Date(Date.UTC(tstY, tstM - 1, tstD));
    var jdDayPillar = A.jdFromLocal(dayForPillar.getUTCFullYear(), dayForPillar.getUTCMonth() + 1, dayForPillar.getUTCDate(), 12, 0, 0, 0);
    var dayIdx = dayGanZhiIndex(jdDayPillar);
    var dayStem = dayIdx % 10;

    var hourBranch = Math.floor((ts.hh + 1) / 2) % 12;
    var hourStem = (dayStem * 2 + hourBranch) % 10;
    var hourIdx = ganZhiIndex(hourStem, hourBranch);

    // 干支年：以立春为界
    var terms = termsOfYear(y);
    var lichun = null;
    for (var i = 0; i < terms.length; i++) if (terms[i].name === '立春') { lichun = terms[i]; break; }
    var gzYear = jdClock >= lichun.jd ? y : y - 1;
    var yearIdx = yearGanZhiIndex(gzYear);
    var yearStem = yearIdx % 10;

    var sun = A.sunState(jdClock);
    var monthGZ = monthGanZhi(sun.lon, yearStem);

    // 当前所处节气（含中气）
    var allTerms = [];
    var prev = termsOfYear(y - 1).concat(terms);
    var nextAlso = termsOfYear(y + 1);
    allTerms = prev.concat(nextAlso);
    var curTerm = null, nextTerm = null;
    for (var t = 0; t < allTerms.length; t++) {
      if (allTerms[t].jd <= jdClock) curTerm = allTerms[t];
      else { nextTerm = allTerms[t]; break; }
    }
    // 民历惯例：节气交节当日即属该节气，即使交节时刻尚未到来
    for (var t2 = 0; t2 < allTerms.length; t2++) {
      var tm = allTerms[t2];
      if (tm.y === y && tm.m === m && tm.d === d) {
        curTerm = tm;
        nextTerm = allTerms[t2 + 1] || null;
        break;
      }
    }

    var lunar = solarToLunar(y, m, d);

    // 七政：黄道推步，赤道入宿（古法治本）
    var ring = buildXiuRing(jdClock);
    var ciArcs = buildCiArcs(ring);
    var bodies = [];
    var defs = D.PLANETS;
    for (var p = 0; p < defs.length; p++) {
      var def = defs[p];
      var st = bodyStateAt(def.key, jdClock);
      // 行度：前后各四分之一日黄经差（度/日），步长收窄以贴合瞬时速度，留期判定更准
      var speed = A.norm180(bodyStateAt(def.key, jdClock + 0.25).lon - bodyStateAt(def.key, jdClock - 0.25).lon) * 2;
      var eq = A.eclToEqu(st.lon, st.lat, jdClock);
      var loc = locateXiu(eq.ra, ring);
      var ci = locateCi(eq.ra, ring, ciArcs);
      var hb = A.equToHor(eq.ra, eq.dec, jdClock, lon, lat);
      bodies.push({
        key: def.key,
        name: def.name,
        alias: def.alias,
        glyph: def.glyph,
        color: def.color,
        lon: norm360(st.lon),
        lat: st.lat || 0,
        ra: eq.ra,
        dec: eq.dec,
        alt: hb.alt,
        az: hb.az,
        speed: speed,
        elong: Math.abs(A.norm180(st.lon - sun.lon)), // 距日角距（伏见之本）
        hou: houOf(def.key, norm360(st.lon), sun.lon), // 位态之候（冲照大距晨夕见）
        xiu: loc.xiu,
        du: loc.du,
        zhi: loc.xiu.zhi,
        ci: ci.name,
        ciZhi: ci.zhi,
        zhou: ci.zhou,
        guo: ci.guo
      });
    }

    var sectors = buildZhiSectors(ring);

    // 恒星：J2000 平位置按当日历元岁差旋转，入宿与七政同口径
    var stars = [];
    if (window.TGStars) {
      for (var si = 0; si < window.TGStars.length; si++) {
        var st0 = window.TGStars[si];
        var sp = A.precessJ2000(st0.ra, st0.dec, jdClock);
        var sloc = locateXiu(sp.ra, ring);
        stars.push({
          name: st0.name,
          bayer: st0.bayer,
          ra: sp.ra,
          dec: sp.dec,
          mag: st0.mag,
          dist: !!st0.xiu,   // 是否距星
          xiu: sloc.xiu.name,
          du: sloc.du
        });
      }
    }

    // 恒星地平坐标：高度角、方位、可见性（此刻，观测地）
    for (var sj = 0; sj < stars.length; sj++) {
      var hz = A.equToHor(stars[sj].ra, stars[sj].dec, jdClock, lon, lat);
      stars[sj].alt = hz.alt;
      stars[sj].az = hz.az;
      stars[sj].vis = hz.alt > 0;
    }

    // 昏旦中星：昏 = 日没后三刻（约 45 分），旦 = 日出前三刻；
    // 中星取该刻距子午圈最近的距星（时角最小）
    var rs = A.sunRiseSet(y, m, d, lon, lat);
    var dusk = rs.set != null ? rs.set + 0.03125 : null;
    var dawn = rs.rise != null ? rs.rise - 0.03125 : null;
    function centralStar(jdT) {
      if (jdT == null || !stars.length) return null;
      var lst = A.localSiderealTime(jdT, lon);
      var best = null, bd = 999;
      for (var k = 0; k < stars.length; k++) {
        if (!stars[k].dist) continue;
        var dh = Math.abs(A.norm180(stars[k].ra - lst));
        if (dh < bd) { bd = dh; best = stars[k]; }
      }
      return best;
    }
    // 昏时斗柄实指：天极→摇光（η UMa）之大圆弧延长，过摇光交地平，
    // 取其方位化十二支（北子南午，顺时针）。近天顶时方位角法失稳，故用向量法。
    // 斗建占法以月建为断，此为昏时实测方位之注记，两不相混。
    var ALKAID = { ra: 206.885, dec: 49.313 }; // J2000
    function duskPointZhi(jdT) {
      if (jdT == null) return null;
      var d2r = Math.PI / 180;
      var pp = A.precessJ2000(ALKAID.ra, ALKAID.dec, jdT);
      var hz2 = A.equToHor(pp.ra, pp.dec, jdT, lon, lat);
      var phi = lat * d2r, alt = hz2.alt * d2r, az = hz2.az * d2r;
      // ENU 坐标：东 x、北 y、上 z；n 为天极方向，s 为摇光方向
      var ny = Math.cos(phi), nz = Math.sin(phi);
      var sx = Math.cos(alt) * Math.sin(az), sy = Math.cos(alt) * Math.cos(az), sz = Math.sin(alt);
      var dot = ny * sy + nz * sz;
      var ux = sx, uy = sy - ny * dot, uz = sz - nz * dot;
      var ul = Math.sqrt(ux * ux + uy * uy + uz * uz);
      if (ul < 1e-9) return null;
      ux /= ul; uy /= ul; uz /= ul;
      var tS = Math.acos(Math.min(1, Math.max(-1, dot))); // 天极至摇光的弧距
      var t0 = Math.atan2(-nz, uz);                       // 大圆高度为零之解（其一）
      var cands = [t0, t0 + Math.PI, t0 + 2 * Math.PI];
      var tH = -1;
      for (var ci2 = 0; ci2 < cands.length; ci2++) {
        if (cands[ci2] > tS + 1e-9 && cands[ci2] < tS + Math.PI) { tH = cands[ci2]; break; }
      }
      if (tH < 0) return null;
      var pe = ux * Math.sin(tH);
      var pn = ny * Math.cos(tH) + uy * Math.sin(tH);
      var G = norm360(Math.atan2(pe, pn) / d2r);
      return D.ZHI[Math.round(G / 30) % 12];
    }
    var horizon = {
      dusk: dusk, dawn: dawn,
      duskStar: centralStar(dusk),
      dawnStar: centralStar(dawn),
      duskPoint: duskPointZhi(dusk)
    };

    // 凌犯守掩：七政与恒星的球面角距（haversine，小角度稳）
    // 犯＝一度以内；凌＝0.15° 内（光芒相及）；掩＝月 0.3° 内（月体覆星）；
    // 守＝行星值留且相距 5° 内（留而不去）。日与恒星不判（昼不可见）。
    function sepDeg(ra1, dec1, ra2, dec2) {
      var d2r = Math.PI / 180;
      var s1 = Math.sin(dec1 * d2r), s2 = Math.sin(dec2 * d2r);
      var c1 = Math.cos(dec1 * d2r), c2 = Math.cos(dec2 * d2r);
      var dA = (ra1 - ra2) * d2r;
      var h = Math.sin((dec1 - dec2) * d2r / 2); h *= h;
      var k = Math.sin(dA / 2); h += c1 * c2 * k * k;
      return 2 * Math.asin(Math.min(1, Math.sqrt(h))) / d2r;
    }
    // 昏旦可见性：太阳 −6° 上为昼（不见），−12°~−6° 为昏旦蒙影，其下为夜；
    // 天体在地平线下则不见。古法占候皆昏旦夜观，故必注其可见与否。
    var sunAltNow = bodies.filter(function (b) { return b.key === 'sun'; })[0];
    sunAltNow = sunAltNow ? sunAltNow.alt : 90;
    var bjHour = ((jdClock - 0.5 + 8 / 24) % 1) * 24;
    var duskSide = bjHour >= 12;
    function visLabel(a1, a2) {
      if (sunAltNow > -6) return '昼不见';
      if ((a1 != null && a1 <= 0) || (a2 != null && a2 <= 0)) return '地平线下';
      if (sunAltNow > -12) return duskSide ? '昏可见' : '旦可见';
      return '夜可见';
    }
    var approaches = [];
    for (var bi = 0; bi < bodies.length; bi++) {
      var bd0 = bodies[bi];
      if (bd0.key === 'sun') continue;
      for (var si2 = 0; si2 < stars.length; si2++) {
        var sg = sepDeg(bd0.ra, bd0.dec, stars[si2].ra, stars[si2].dec);
        var kind = null;
        if (bd0.key === 'moon' && sg < 0.3) kind = '掩';
        else if (sg < 0.15) kind = '凌';
        else if (sg < 1.0) kind = '犯';
        if (!kind && bd0.key !== 'moon' && Math.abs(bd0.speed) <= 0.015 && sg < 5) kind = '守';
        if (kind) approaches.push({ body: bd0.name, key: bd0.key, star: stars[si2].name, xiu: stars[si2].xiu, deg: sg, kind: kind, vis: visLabel(bd0.alt, stars[si2].alt) });
      }
    }
    // 七政互合：两两求角距，口径同上（犯一度、凌 0.15°、月掩 0.3°）；日不判。
    // 主动方取行度快者（月最快，故月犯星居多），与恒星事通排入 approaches。
    for (var pi = 0; pi < bodies.length; pi++) {
      if (bodies[pi].key === 'sun') continue;
      for (var pj = pi + 1; pj < bodies.length; pj++) {
        if (bodies[pj].key === 'sun') continue;
        var b1 = bodies[pi], b2 = bodies[pj];
        var pg = sepDeg(b1.ra, b1.dec, b2.ra, b2.dec);
        var pk = null;
        if ((b1.key === 'moon' || b2.key === 'moon') && pg < 0.3) pk = '掩';
        else if (pg < 0.15) pk = '凌';
        else if (pg < 1.0) pk = '犯';
        if (pk) {
          var fast = Math.abs(b1.speed) >= Math.abs(b2.speed) ? b1 : b2;
          var slow = fast === b1 ? b2 : b1;
          approaches.push({ body: fast.name, key: fast.key, star: slow.name, xiu: slow.xiu.name, deg: pg, kind: pk, vis: visLabel(b1.alt, b2.alt) });
        }
      }
    }
    // 五星聚舍：五纬（辰星太白荧惑岁星填星）同宿为聚，三、四、五星皆书
    var wuWei = bodies.filter(function (b) { return b.key !== 'sun' && b.key !== 'moon'; });
    var byXiu = {};
    wuWei.forEach(function (b) { (byXiu[b.xiu.name] = byXiu[b.xiu.name] || []).push(b.name); });
    var gatherings = [];
    Object.keys(byXiu).forEach(function (x) {
      if (byXiu[x].length >= 3) {
        // 聚舍可见性取组内最严：任一员在地平线下则不见
        var minAlt = Math.min.apply(null, wuWei.filter(function (b) { return b.xiu.name === x; }).map(function (b) { return b.alt; }));
        gatherings.push({ n: byXiu[x].length, xiu: x, stars: byXiu[x], vis: visLabel(minAlt, null) });
      }
    });
    approaches.sort(function (x, y) { return x.deg - y.deg; });
    // 每曜取其最近一事，供表格占候列
    for (var ai = 0; ai < approaches.length; ai++) {
      for (var bj = 0; bj < bodies.length; bj++) {
        if (bodies[bj].key === approaches[ai].key && !bodies[bj].event) bodies[bj].event = approaches[ai];
      }
    }

    return {
      input: { y: y, m: m, d: d, hh: hh, mm: mm, lon: lon, lat: lat },
      jd: jdClock,
      trueSolar: ts,
      tst: { y: tstY, m: tstM, d: tstD, hh: ts.hh, mm: ts.mm },
      lunar: lunar,
      ganzhi: {
        year: ganZhiName(yearIdx),
        yearIdx: yearIdx,
        month: ganZhiName(monthGZ.index),
        monthIdx: monthGZ.index,
        day: ganZhiName(dayIdx),
        dayIdx: dayIdx,
        hour: ganZhiName(hourIdx),
        hourIdx: hourIdx
      },
      term: curTerm ? { name: curTerm.name, y: curTerm.y, m: curTerm.m, d: curTerm.d } : null,
      nextTerm: nextTerm,
      solarLon: sun.lon,
      bodies: bodies,
      ring: ring,
      sectors: sectors,
      ciArcs: ciArcs,
      stars: stars,
      horizon: horizon,
      approaches: approaches,
      gatherings: gatherings,
      sun: sun
    };
  }

  window.TGCal = {
    solarToLunar: solarToLunar,
    lunarToSolar: lunarToSolar,
    lunarMonthsOfYear: function (y) {
      return LUNAR_MONTHS.filter(function (m) { return m.y === y; }).map(function (m) {
        return { m: m.m, leap: m.leap, days: m.days };
      });
    },
    monthGanZhi: monthGanZhi,
    ganZhiName: ganZhiName,
    ganZhiIndex: ganZhiIndex,
    dayGanZhiIndex: dayGanZhiIndex,
    yearGanZhiIndex: yearGanZhiIndex,
    termsOfYear: termsOfYear,
    buildXiuRing: buildXiuRing,
    locateXiu: locateXiu,
    computeChart: computeChart,
    LUNAR_MIN_YEAR: LUNAR_MIN_YEAR,
    LUNAR_MAX_YEAR: LUNAR_MAX_YEAR
  };
})();
