/* 天官太乙式 · 交互与联动 */
(function () {
  'use strict';

  var D = window.TGData;
  var A = window.TGAstro;
  var C = window.TGCal;
  var CH = window.TGChart;

  var el = function (id) { return document.getElementById(id); };
  var state = { y: 2026, m: 10, d: 22, hh: 14, mm: 30, lon: 116.407, lat: 39.904, place: '北京市 · 东城区' };
  var current = null;
  var busy = false;

  /* ---------- 星野 ---------- */
  function buildStars() {
    var host = el('stars');
    if (!host) return;
    var rng = (function (s) {
      return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    })(99173);
    var html = '';
    for (var i = 0; i < 110; i++) {
      var x = rng() * 100, y = rng() * 100;
      var size = 0.7 + rng() * 1.7;
      var op = 0.15 + rng() * 0.55;
      html += '<i style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;width:' + size.toFixed(1) +
        'px;height:' + size.toFixed(1) + 'px;--o:' + op.toFixed(2) + ';--dur:' + (4 + rng() * 7).toFixed(1) +
        's;--delay:' + (-rng() * 9).toFixed(1) + 's"></i>';
    }
    host.innerHTML = html;
  }

  /* ---------- 干支下拉 ---------- */
  function fillGzSelects() {
    var html = '';
    for (var i = 0; i < 60; i++) {
      html += '<option value="' + i + '">' + C.ganZhiName(i) + '</option>';
    }
    ['gz-y', 'gz-m', 'gz-d', 'gz-h'].forEach(function (id) { el(id).innerHTML = html; });
  }

  /* ---------- 行政区 ---------- */
  function fillProvinces() {
    var sel = el('loc-prov');
    var html = '';
    Object.keys(window.REGIONS).forEach(function (p) {
      html += '<option>' + p + '</option>';
    });
    sel.innerHTML = html;
  }

  function fillCities(prov, prefer) {
    var obj = window.REGIONS[prov];
    var sel = el('loc-city');
    var html = '';
    var keys = Object.keys(obj.ch);
    if (!keys.length) { html = '<option>' + prov + '</option>'; }
    else keys.forEach(function (c) { html += '<option>' + c + '</option>'; });
    sel.innerHTML = html;
    if (prefer && keys.indexOf(prefer) >= 0) sel.value = prefer;
    fillDistricts(prov, sel.value);
  }

  function fillDistricts(prov, city) {
    var obj = window.REGIONS[prov];
    var cityObj = obj.ch[city];
    var sel = el('loc-dist');
    var html = '';
    var keys = cityObj ? Object.keys(cityObj.ch) : [];
    if (!keys.length) html = '<option>' + city + '</option>';
    else keys.forEach(function (d) { html += '<option>' + d + '</option>'; });
    sel.innerHTML = html;
  }

  function applyPlace() {
    var prov = el('loc-prov').value;
    var city = el('loc-city').value;
    var dist = el('loc-dist').value;
    var obj = window.REGIONS[prov];
    if (!obj) return;
    var cityObj = obj.ch[city];
    var pt = cityObj && cityObj.ch[dist] ? cityObj.ch[dist] : (cityObj ? cityObj.c : obj.c);
    if (!pt) return;
    state.lon = pt[0];
    state.lat = pt[1];
    state.place = prov === city ? prov + (dist === city ? '' : ' · ' + dist) : prov + ' · ' + city + (dist && dist !== city ? ' · ' + dist : '');
    el('loc-lon').value = pt[0];
    el('loc-lat').value = pt[1];
    render();
  }

  function setPlaceByName(prov, city, dist) {
    el('loc-prov').value = prov;
    fillCities(prov, city);
    if (dist) el('loc-dist').value = dist;
    applyPlace();
  }

  /* ---------- 农历下拉 ---------- */
  function fillLunarMonth(year, keepValue) {
    var sel = el('lun-m');
    var list = C.lunarMonthsOfYear(year);
    var html = '';
    list.forEach(function (m) {
      html += '<option value="' + m.m + (m.leap ? 'L' : '') + '">' + (m.leap ? '闰' : '') + D.LUNAR_MONTH_NAME[m.m - 1] + '月</option>';
    });
    sel.innerHTML = html;
    if (keepValue && sel.querySelector('option[value="' + keepValue + '"]')) sel.value = keepValue;
    fillLunarDay(year, parseFloat(sel.value), sel.value.indexOf('L') > 0, 1);
  }

  function fillLunarDay(year, month, leap, keepDay) {
    var sel = el('lun-d');
    var list = C.lunarMonthsOfYear(year);
    var target = list.filter(function (m) { return m.m === month && !!m.leap === !!leap; })[0];
    var days = target ? target.days : 30;
    var html = '';
    for (var i = 1; i <= days; i++) html += '<option value="' + i + '">' + D.LUNAR_DAY_NAME[i - 1] + '</option>';
    sel.innerHTML = html;
    sel.value = Math.min(keepDay || 1, days);
  }

  /* ---------- 渲染 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function render() {
    if (busy) return;
    busy = true;
    try {
      var c = C.computeChart({
        y: state.y, m: state.m, d: state.d, hh: state.hh, mm: state.mm,
        lon: state.lon, lat: state.lat
      });
      current = c;
      current.place = state.place;

      el('chart').innerHTML = CH.svg(c);

      // 读数
      el('ro-tst').textContent = pad(c.tst.hh) + ':' + pad(c.tst.mm);
      el('ro-lon').textContent = (c.trueSolar.lonCorr >= 0 ? '+' : '') + c.trueSolar.lonCorr.toFixed(1) + ' 分';
      el('ro-eot').textContent = (c.trueSolar.eot >= 0 ? '+' : '') + c.trueSolar.eot.toFixed(1) + ' 分';
      el('ro-term').textContent = c.term ? c.term.name + '（' + c.term.m + '月' + c.term.d + '日）' : '—';
      el('ro-sunlon').textContent = c.solarLon.toFixed(2) + '°';

      el('meta-solar').textContent = c.input.y + '年' + c.input.m + '月' + c.input.d + '日 ' + pad(state.hh) + ':' + pad(state.mm);
      el('meta-tst').textContent = '真太阳时 ' + pad(c.tst.hh) + ':' + pad(c.tst.mm);

      // 农历同步
      if (c.lunar) {
        el('lun-y').value = c.lunar.y;
        fillLunarMonth(c.lunar.y, c.lunar.m + (c.lunar.leap ? 'L' : ''));
        el('lun-d').value = c.lunar.d;
        el('lun-note').textContent = '农历 ' + c.lunar.monthName + c.lunar.dayName +
          '　' + c.ganzhi.year + '年　' + (c.lunar.days === 30 ? '大月' : '小月');
      } else {
        el('lun-note').textContent = '超出农历表范围（1900–2100）';
      }

      // 干支同步
      el('gz-y').value = c.ganzhi.yearIdx;
      el('gz-m').value = c.ganzhi.monthIdx;
      el('gz-d').value = c.ganzhi.dayIdx;
      el('gz-h').value = c.ganzhi.hourIdx;
      el('gz-note').textContent = c.ganzhi.year + '年 ' + c.ganzhi.month + '月 ' + c.ganzhi.day + '日 ' + c.ganzhi.hour + '时（' +
        (c.nextTerm ? '距' + c.nextTerm.name + ' ' + Math.max(0, Math.round(c.nextTerm.jd - c.jd)) + '日' : '') + '）';

      renderTable(c);
      renderOmen(c);

      el('record').value = localStorage.getItem('tgty.record') || '';
    } finally {
      busy = false;
    }
  }

  function renderTable(c) {
    var html = '';
    c.bodies.forEach(function (b) {
      html += '<tr>' +
        '<td class="p-name"><span class="p-glyph" style="color:' + b.color + '">' + b.glyph + '</span>' + b.name + '</td>' +
        '<td class="num">' + b.lon.toFixed(2) + '°</td>' +
        '<td class="xiu">' + b.xiu.full + '</td>' +
        '<td class="num">' + b.du.toFixed(2) + '</td>' +
        '<td>' + b.ci + '<span class="dim"> · ' + b.zhou + '</span></td>' +
        '<td>' + b.zodiacZhi + '宫<span class="dim"> ' + b.zodiac + '</span></td>' +
        '</tr>';
    });
    el('omen-body').innerHTML = html;
  }

  function renderOmen(c) {
    var sun = c.bodies[0];
    var mZhi = CH.monthZhi(c);
    // 月将：与月建六合之地支；十二月将神名
    var liuhe = { '子':'丑','丑':'子','寅':'亥','卯':'戌','辰':'酉','巳':'申',
                  '午':'未','未':'午','申':'巳','酉':'辰','戌':'卯','亥':'寅' };
    var jiangshen = { '子':'神后','丑':'大吉','寅':'功曹','卯':'太冲','辰':'天罡','巳':'太乙',
                      '午':'胜光','未':'小吉','申':'传送','酉':'从魁','戌':'河魁','亥':'登明' };
    var yuejiang = liuhe[mZhi];
    el('omen-note').textContent =
      c.lunar.monthName + '建' + mZhi + '，' + yuejiang + '将' + jiangshen[yuejiang] + '。' +
      '太阳入' + sun.xiu.name + '宿' + sun.du.toFixed(1) + '度，斗柄指' + mZhi + '（月建）。';
  }

  /* ---------- 同步入口 ---------- */
  function syncFromSolar(y, m, d) {
    state.y = Math.max(1900, Math.min(2100, Math.round(y) || 1900));
    state.m = Math.max(1, Math.min(12, Math.round(m) || 1));
    var dim = new Date(Date.UTC(state.y, state.m, 0)).getUTCDate();
    state.d = Math.max(1, Math.min(dim, Math.round(d) || 1));
    el('sol-y').value = state.y;
    el('sol-m').value = state.m;
    el('sol-d').value = state.d;
    render();
  }

  function syncFromLunar() {
    var ly = Math.max(1900, Math.min(2100, parseInt(el('lun-y').value, 10) || 1900));
    var mv = el('lun-m').value || '1';
    var leap = mv.indexOf('L') > 0;
    var lm = parseInt(mv, 10);
    var ld = parseInt(el('lun-d').value, 10) || 1;
    var sol = C.lunarToSolar(ly, lm, ld, leap);
    if (!sol) {
      el('lun-note').textContent = '该农历月无此日，请另择';
      return;
    }
    syncFromSolar(sol.y, sol.m, sol.d);
  }

  /* ---------- 由干支反推日期 ---------- */
  function gzOfDate(y, m, d) {
    var jd = A.jdFromBeijing(y, m, d, state.hh, state.mm, 0);
    var terms = C.termsOfYear(y);
    var lichun = null;
    for (var i = 0; i < terms.length; i++) if (terms[i].name === '立春') { lichun = terms[i]; break; }
    var gzYear = jd >= lichun.jd ? y : y - 1;
    var yIdx = C.yearGanZhiIndex(gzYear);
    var sunLon = A.sunLongitude(jd);
    var mGz = C.monthGanZhi(sunLon, yIdx % 10);
    var dIdx = C.dayGanZhiIndex(jd);
    return { y: yIdx, m: mGz.index, d: dIdx, jd: jd };
  }

  function solveGanzhi(ty, tm, td) {
    var best = null, bestDist = Infinity;
    var cur = Date.UTC(state.y, state.m - 1, state.d);
    for (var y = state.y - 34; y <= state.y + 34; y++) {
      if (y < 1901 || y > 2099) continue;
      if (C.yearGanZhiIndex(y) !== ty && C.yearGanZhiIndex(y - 1) !== ty) continue;
      var dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      for (var m = 1; m <= 12; m++) {
        for (var d = 1; d <= dim[m - 1]; d++) {
          var g = gzOfDate(y, m, d);
          if (g.y === ty && g.m === tm && g.d === td) {
            var dist = Math.abs(Date.UTC(y, m - 1, d) - cur);
            if (dist < bestDist) { bestDist = dist; best = { y: y, m: m, d: d }; }
          }
        }
      }
    }
    return best;
  }

  function syncFromGanzhi() {
    var ty = parseInt(el('gz-y').value, 10);
    var tm = parseInt(el('gz-m').value, 10);
    var td = parseInt(el('gz-d').value, 10);
    var hit = solveGanzhi(ty, tm, td);
    if (!hit) {
      el('gz-note').textContent = '近七十年内无此干支日，已复位';
      render();
      return;
    }
    syncFromSolar(hit.y, hit.m, hit.d);
  }

  /* ---------- 事件 ---------- */
  function bind() {
    ['sol-y', 'sol-m', 'sol-d', 'sol-hh', 'sol-mm'].forEach(function (id) {
      el(id).addEventListener('change', function () {
        state.y = parseInt(el('sol-y').value, 10);
        state.m = parseInt(el('sol-m').value, 10);
        state.d = parseInt(el('sol-d').value, 10);
        state.hh = Math.max(0, Math.min(23, parseInt(el('sol-hh').value, 10) || 0));
        state.mm = Math.max(0, Math.min(59, parseInt(el('sol-mm').value, 10) || 0));
        syncFromSolar(state.y, state.m, state.d);
      });
    });

    el('lun-y').addEventListener('change', function () {
      var ly = Math.max(1900, Math.min(2100, parseInt(el('lun-y').value, 10) || 1900));
      el('lun-y').value = ly;
      fillLunarMonth(ly, el('lun-m').value);
      syncFromLunar();
    });
    el('lun-m').addEventListener('change', function () {
      var mv = el('lun-m').value;
      fillLunarDay(parseInt(el('lun-y').value, 10), parseInt(mv, 10), mv.indexOf('L') > 0,
        parseInt(el('lun-d').value, 10));
      syncFromLunar();
    });
    el('lun-d').addEventListener('change', syncFromLunar);

    ['gz-y', 'gz-m', 'gz-d'].forEach(function (id) {
      el(id).addEventListener('change', syncFromGanzhi);
    });
    el('gz-h').addEventListener('change', function () {
      // 时支决定时辰，先移动时刻，再反推日期
      var idx = parseInt(el('gz-h').value, 10);
      var branch = idx % 12;
      var hh = (branch * 2 + 23) % 24;
      state.hh = (hh + 1) % 24;
      el('sol-hh').value = state.hh;
      syncFromGanzhi();
    });

    el('loc-prov').addEventListener('change', function () {
      fillCities(el('loc-prov').value);
      applyPlace();
    });
    el('loc-city').addEventListener('change', function () {
      fillDistricts(el('loc-prov').value, el('loc-city').value);
      applyPlace();
    });
    el('loc-dist').addEventListener('change', applyPlace);

    ['loc-lon', 'loc-lat'].forEach(function (id) {
      el(id).addEventListener('change', function () {
        state.lon = Math.max(-180, Math.min(180, parseFloat(el('loc-lon').value) || 0));
        state.lat = Math.max(-90, Math.min(90, parseFloat(el('loc-lat').value) || 0));
        state.place = '自定义方位';
        render();
      });
    });

    el('btn-now').addEventListener('click', function () {
      var now = new Date();
      state.hh = now.getHours();
      state.mm = now.getMinutes();
      el('sol-hh').value = state.hh;
      el('sol-mm').value = state.mm;
      syncFromSolar(now.getFullYear(), now.getMonth() + 1, now.getDate());
    });

    el('record').addEventListener('input', function () {
      localStorage.setItem('tgty.record', el('record').value);
    });
    el('btn-clear-rec').addEventListener('click', function () {
      el('record').value = '';
      localStorage.setItem('tgty.record', '');
    });

    el('btn-export').addEventListener('click', function () {
      if (!current) return;
      var btn = el('btn-export');
      btn.disabled = true;
      btn.textContent = '正在成像';
      try {
        window.TGExport.save(current, el('record').value, function () {
          btn.disabled = false;
          btn.textContent = '存为图片';
        });
      } catch (e) {
        btn.disabled = false;
        btn.textContent = '存为图片';
        alert('导出失败：' + e.message);
      }
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    buildStars();
    fillGzSelects();
    fillProvinces();

    var now = new Date();
    state.y = now.getFullYear();
    state.m = now.getMonth() + 1;
    state.d = now.getDate();
    state.hh = now.getHours();
    state.mm = now.getMinutes();
    el('sol-y').value = state.y;
    el('sol-m').value = state.m;
    el('sol-d').value = state.d;
    el('sol-hh').value = state.hh;
    el('sol-mm').value = state.mm;

    bind();
    setPlaceByName('北京市', '北京市', '东城区');
    el('record').value = localStorage.getItem('tgty.record') || '';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
