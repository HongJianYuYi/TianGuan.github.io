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

  function buildXiuRing(jd) {
    var year = 2000 + (jd - 2451545.0) / 365.2422;
    var anchor = norm360(JIAO_ANCHOR_J2000 + 50.29 / 3600 * (year - 2000));
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

  /* ---------- 综合起盘 ---------- */
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

    // 七政黄经
    var ring = buildXiuRing(jdClock);
    var bodies = [];
    var defs = D.PLANETS;
    for (var p = 0; p < defs.length; p++) {
      var def = defs[p];
      var st;
      if (def.key === 'sun') st = { lon: sun.lon, lat: 0 };
      else if (def.key === 'moon') st = A.moonState(jdClock);
      else st = A.planetState(def.key, jdClock);
      var loc = locateXiu(st.lon, ring);
      var zod = Math.floor(norm360(st.lon) / 30);
      bodies.push({
        key: def.key,
        name: def.name,
        alias: def.alias,
        glyph: def.glyph,
        color: def.color,
        lon: norm360(st.lon),
        lat: st.lat || 0,
        xiu: loc.xiu,
        du: loc.du,
        zhi: loc.xiu.zhi,
        ci: D.CI[loc.xiu.zhi].name,
        zhou: D.CI[loc.xiu.zhi].zhou,
        guo: D.CI[loc.xiu.zhi].guo,
        zodiac: D.ZODIAC[zod],
        zodiacZhi: D.ZODIAC_ZHI[zod],
        zodiacDeg: norm360(st.lon) - zod * 30
      });
    }

    var sectors = buildZhiSectors(ring);

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
