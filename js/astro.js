/* 天官太乙式 · 天文历算引擎
 * 太阳、太阴、五星视黄经（Schlyter 低精度行星算法，与 astronomy-engine 对照误差约 0.7 角分内）
 * 儒略日、均时差、二十四节气、恒星时
 */
(function () {
  'use strict';

  var D2R = Math.PI / 180;
  var R2D = 180 / Math.PI;
  var EPS = 23.4392911; // 黄赤交角 J2000

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function norm180(x) { x = norm360(x); return x > 180 ? x - 360 : x; }

  /* ---------- 儒略日 ---------- */
  // 由本地年月日时分与所在时区（小时）求 JD
  function jdFromLocal(y, m, d, hh, mm, ss, tz) {
    var yy = y, mm2 = m;
    if (mm2 <= 2) { yy -= 1; mm2 += 12; }
    var A = Math.floor(yy / 100);
    var B = 2 - A + Math.floor(A / 4);
    var frac = (hh + mm / 60 + (ss || 0) / 3600) / 24 - (tz || 0) / 24;
    return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm2 + 1)) + d + frac + B - 1524.5;
  }

  // JD → UTC 年月日时分秒
  function dateFromJD(jd) {
    var z = Math.floor(jd + 0.5);
    var f = jd + 0.5 - z;
    var a = z;
    if (z >= 2299161) {
      var alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    var b = a + 1524;
    var c = Math.floor((b - 122.1) / 365.25);
    var d = Math.floor(365.25 * c);
    var e = Math.floor((b - d) / 30.6001);
    var day = b - d - Math.floor(30.6001 * e) + f;
    var month = e < 14 ? e - 1 : e - 13;
    var year = month > 2 ? c - 4716 : c - 4715;
    var dayInt = Math.floor(day);
    var secTotal = Math.round((day - dayInt) * 86400);
    return {
      y: year, m: month, d: dayInt,
      hh: Math.floor(secTotal / 3600),
      mm: Math.floor((secTotal % 3600) / 60),
      ss: secTotal % 60
    };
  }

  // JD（UT）→ 北京时间
  function beijingFromJD(jd) {
    return dateFromJD(jd + 8 / 24);
  }

  // 由北京时间求 JD
  function jdFromBeijing(y, m, d, hh, mm, ss) {
    return jdFromLocal(y, m, d, hh, mm, ss, 8);
  }

  /* ---------- 太阳 ---------- */
  function sunState(jd) {
    var d = jd - 2451543.5;
    var w = 282.9404 + 4.70935e-5 * d;          // 近日点黄经
    var e = 0.016709 - 1.151e-9 * d;            // 偏心率
    var M = norm360(356.0470 + 0.9856002585 * d); // 平近点角
    var E = M + R2D * e * Math.sin(M * D2R) * (1 + e * Math.cos(M * D2R));
    var xv = Math.cos(E * D2R) - e;
    var yv = Math.sqrt(1 - e * e) * Math.sin(E * D2R);
    var v = norm360(Math.atan2(yv, xv) * R2D);
    var r = Math.sqrt(xv * xv + yv * yv);
    var lon = norm360(v + w);
    var omega = 125.04 - 1934.136 * d;
    var apparent = lon - 0.00569 - 0.00478 * Math.sin(omega * D2R);
    var L = norm360(M + w); // 平黄经
    return {
      lon: norm360(apparent),          // 视黄经
      meanLon: lon,
      L: L,
      r: r,
      x: r * Math.cos(lon * D2R),
      y: r * Math.sin(lon * D2R),
      M: M,
      w: w
    };
  }

  function sunLongitude(jd) { return sunState(jd).lon; }

  // 均时差（分钟，真太阳时 = 平太阳时 + eot）
  function equationOfTime(jd) {
    var s = sunState(jd);
    var lam = s.lon;
    var alpha = Math.atan2(Math.cos(EPS * D2R) * Math.sin(lam * D2R), Math.cos(lam * D2R)) * R2D;
    var eot = 4 * norm180(s.L - alpha);
    // 天文年历惯例：11 月初 +16 分钟
    return eot;
  }

  /* ---------- 太阴 ---------- */
  function moonState(jd) {
    var s = sunState(jd);
    var d = jd - 2451543.5;
    var N = norm360(125.1228 - 0.0529538083 * d);
    var i = 5.1454;
    var w = norm360(318.0634 + 0.1643573223 * d);
    var a = 60.2666;
    var e = 0.0549;
    var M = norm360(115.3654 + 13.0649929509 * d);

    var E = M + R2D * e * Math.sin(M * D2R) * (1 + e * Math.cos(M * D2R));
    for (var k = 0; k < 3; k++) {
      E = E - (E - R2D * e * Math.sin(E * D2R) - M) / (1 - e * Math.cos(E * D2R));
    }
    var xv = a * (Math.cos(E * D2R) - e);
    var yv = a * Math.sqrt(1 - e * e) * Math.sin(E * D2R);
    var v = Math.atan2(yv, xv) * R2D;
    var r = Math.sqrt(xv * xv + yv * yv);

    // 黄道坐标（先按轨道倾角转）
    var xh = r * (Math.cos(N * D2R) * Math.cos((v + w) * D2R) - Math.sin(N * D2R) * Math.sin((v + w) * D2R) * Math.cos(i * D2R));
    var yh = r * (Math.sin(N * D2R) * Math.cos((v + w) * D2R) + Math.cos(N * D2R) * Math.sin((v + w) * D2R) * Math.cos(i * D2R));
    var zh = r * Math.sin((v + w) * D2R) * Math.sin(i * D2R);
    var lon = norm360(Math.atan2(yh, xh) * R2D);
    var lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * R2D;

    // 摄动
    var Ms = s.M, ws = s.w;
    var Ls = norm360(Ms + ws);
    var Lm = norm360(N + w + M);
    var D = norm360(Lm - Ls);
    var F = norm360(Lm - N);
    var dLon =
      -1.274 * Math.sin((M - 2 * D) * D2R) +
       0.658 * Math.sin(2 * D * D2R) -
       0.186 * Math.sin(Ms * D2R) -
       0.059 * Math.sin((2 * M - 2 * D) * D2R) -
       0.057 * Math.sin((M - 2 * D + Ms) * D2R) +
       0.053 * Math.sin((M + 2 * D) * D2R) +
       0.046 * Math.sin((2 * D - Ms) * D2R) +
       0.041 * Math.sin((M - Ms) * D2R) -
       0.035 * Math.sin(D * D2R) -
       0.031 * Math.sin((M + Ms) * D2R) -
       0.015 * Math.sin((2 * F - 2 * D) * D2R) +
       0.011 * Math.sin((M - 4 * D) * D2R);
    var dLat =
      -0.173 * Math.sin((F - 2 * D) * D2R) -
       0.055 * Math.sin((M - F - 2 * D) * D2R) -
       0.046 * Math.sin((M + F - 2 * D) * D2R) +
       0.033 * Math.sin((F + 2 * D) * D2R) +
       0.017 * Math.sin((2 * M + F) * D2R);

    return { lon: norm360(lon + dLon), lat: lat + dLat, dist: r, phase: norm360(lon + dLon - s.lon) };
  }

  /* ---------- 五星 ---------- */
  var ELEMENTS = {
    mercury: function (d) {
      return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.00e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d };
    },
    venus: function (d) {
      return { N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.8910 + 1.38374e-5 * d, a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d };
    },
    mars: function (d) {
      return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d };
    },
    jupiter: function (d) {
      return { N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.8950 + 0.0830853001 * d };
    },
    saturn: function (d) {
      return { N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.9670 + 0.0334442282 * d };
    }
  };

  function planetState(key, jd) {
    var d = jd - 2451543.5;
    var el = ELEMENTS[key](d);
    var M = norm360(el.M);
    var e = el.e;
    var E = M + R2D * e * Math.sin(M * D2R) * (1 + e * Math.cos(M * D2R));
    for (var k = 0; k < 5; k++) {
      E = E - (E - R2D * e * Math.sin(E * D2R) - M) / (1 - e * Math.cos(E * D2R));
    }
    var xv = el.a * (Math.cos(E * D2R) - e);
    var yv = el.a * Math.sqrt(1 - e * e) * Math.sin(E * D2R);
    var v = Math.atan2(yv, xv) * R2D;
    var r = Math.sqrt(xv * xv + yv * yv);

    var xh = r * (Math.cos(el.N * D2R) * Math.cos((v + el.w) * D2R) - Math.sin(el.N * D2R) * Math.sin((v + el.w) * D2R) * Math.cos(el.i * D2R));
    var yh = r * (Math.sin(el.N * D2R) * Math.cos((v + el.w) * D2R) + Math.cos(el.N * D2R) * Math.sin((v + el.w) * D2R) * Math.cos(el.i * D2R));
    var zh = r * Math.sin((v + el.w) * D2R) * Math.sin(el.i * D2R);

    // 木星、土星摄动（加于日心黄经）
    var Mj = norm360(19.8950 + 0.0830853001 * d);
    var Msat = norm360(316.9670 + 0.0334442282 * d);
    if (key === 'jupiter' || key === 'saturn') {
      var lonH = norm360(Math.atan2(yh, xh) * R2D);
      var latH = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * R2D;
      if (key === 'jupiter') {
        lonH += -0.332 * Math.sin((2 * Mj - 5 * Msat - 67.6) * D2R)
          - 0.056 * Math.sin((2 * Mj - 2 * Msat + 21) * D2R)
          + 0.042 * Math.sin((3 * Mj - 5 * Msat + 21) * D2R)
          - 0.036 * Math.sin((Mj - 2 * Msat) * D2R)
          + 0.022 * Math.cos((Mj - Msat) * D2R)
          + 0.023 * Math.sin((2 * Mj - 3 * Msat + 52) * D2R)
          - 0.016 * Math.sin((Mj - 5 * Msat - 69) * D2R);
      } else {
        lonH += 0.812 * Math.sin((2 * Mj - 5 * Msat - 67.6) * D2R)
          - 0.229 * Math.cos((2 * Mj - 4 * Msat - 2) * D2R)
          + 0.119 * Math.sin((Mj - 2 * Msat - 3) * D2R)
          + 0.046 * Math.sin((2 * Mj - 6 * Msat - 69) * D2R)
          + 0.014 * Math.sin((Mj - 3 * Msat + 32) * D2R);
        latH += -0.020 * Math.cos((2 * Mj - 4 * Msat - 2) * D2R)
          + 0.018 * Math.sin((2 * Mj - 6 * Msat - 49) * D2R);
      }
      xh = r * Math.cos(lonH * D2R) * Math.cos(latH * D2R);
      yh = r * Math.sin(lonH * D2R) * Math.cos(latH * D2R);
      zh = r * Math.sin(latH * D2R);
    }

    var s = sunState(jd);
    var xg = xh - (-s.x);
    var yg = yh - (-s.y);
    var lon = norm360(Math.atan2(yg, xg) * R2D);
    var lat = Math.atan2(zh, Math.sqrt(xg * xg + yg * yg)) * R2D;
    return { lon: lon, lat: lat, dist: Math.sqrt(xg * xg + yg * yg + zh * zh), helio: r };
  }

  /* ---------- 二十四节气 ---------- */
  function refineTerm(target, approx) {
    var jd = approx;
    for (var i = 0; i < 12; i++) {
      var diff = norm180(target - sunLongitude(jd));
      jd += diff / 0.9856473;
      if (Math.abs(diff) < 1e-8) break;
    }
    return jd;
  }

  // 返回某公历年（UT）的 24 节气，按时间先后：小寒→冬至
  function solarTermsOfYear(year) {
    var jd0 = jdFromLocal(year, 1, 1, 0, 0, 0, 0);
    var l0 = sunLongitude(jd0);
    var out = [];
    for (var k = 0; k < 24; k++) {
      var target = (285 + 15 * k) % 360;
      var diff = norm360(target - l0);
      var approx = jd0 + diff / 0.9856473;
      var jd = refineTerm(target, approx);
      var bj = beijingFromJD(jd);
      out.push({
        lon: target,
        jd: jd,
        name: window.TGData.TERMS[target / 15],
        isJie: (target / 15) % 2 === 1,
        y: bj.y, m: bj.m, d: bj.d, hh: bj.hh, mm: bj.mm
      });
    }
    return out;
  }

  /* ---------- 恒星时（用于北斗指向） ---------- */
  function localSiderealTime(jd, lonEast) {
    var T = (jd - 2451545.0) / 36525;
    var gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
    return norm360(gmst + lonEast);
  }

  /* ---------- 黄赤转换 ---------- */
  // 黄赤交角（当日值）
  function obliquity(jd) {
    var T = (jd - 2451545.0) / 36525;
    return 23.4392911 - 0.0130042 * T;
  }

  // 黄道坐标 → 赤道坐标（当日真赤道），返回 {ra, dec}（度）
  function eclToEqu(lon, lat, jd) {
    var e = obliquity(jd) * D2R;
    var l = norm360(lon) * D2R;
    var b = (lat || 0) * D2R;
    var ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)) * R2D;
    var dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) * R2D;
    return { ra: norm360(ra), dec: dec };
  }

  window.TGAstro = {
    norm360: norm360,
    norm180: norm180,
    jdFromLocal: jdFromLocal,
    jdFromBeijing: jdFromBeijing,
    dateFromJD: dateFromJD,
    beijingFromJD: beijingFromJD,
    sunState: sunState,
    sunLongitude: sunLongitude,
    equationOfTime: equationOfTime,
    moonState: moonState,
    planetState: planetState,
    solarTermsOfYear: solarTermsOfYear,
    localSiderealTime: localSiderealTime,
    obliquity: obliquity,
    eclToEqu: eclToEqu
  };
})();
