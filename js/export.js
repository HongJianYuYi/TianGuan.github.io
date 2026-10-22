/* 天官太乙式 · 导出成像
 * 将输入摘要、式盘、占验表格与记录合成为一张独立 SVG，再经 Canvas 转为 PNG 下载。
 */
(function () {
  'use strict';

  var FONT_T = '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif';
  var FONT_K = '"Kaiti SC","KaiTi","STKaiti","Songti SC",serif';
  var GOLD = '#d8ba74';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function sign(n, unit) { return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1) + (unit || ''); }

  // 按字宽估算折行（中文算一，西文数字算半）
  function wrapText(text, maxUnit) {
    var lines = [];
    String(text || '').split(/\r?\n/).forEach(function (para) {
      var line = '', w = 0;
      for (var i = 0; i < para.length; i++) {
        var ch = para.charAt(i);
        var cw = /[\x00-\xff]/.test(ch) ? 0.55 : 1;
        if (w + cw > maxUnit) { lines.push(line); line = ''; w = 0; }
        line += ch; w += cw;
      }
      lines.push(line);
    });
    return lines;
  }

  function buildSVG(c, record) {
    var W = 1240, H = 1710;
    var S = [];

    // 底：夜空
    S.push('<rect width="' + W + '" height="' + H + '" fill="url(#bgGrad)"/>');
    S.push('<rect width="' + W + '" height="' + H + '" fill="url(#vignette)"/>');

    // 标题
    S.push('<text x="' + W / 2 + '" y="84" text-anchor="middle" font-family=\'' + FONT_T + '\' font-size="40" letter-spacing="14" fill="#f0e3bf">天官太乙式</text>');
    S.push('<text x="' + W / 2 + '" y="116" text-anchor="middle" font-family=\'' + FONT_T + '\' font-size="12.5" letter-spacing="7" fill="rgba(216,186,116,0.72)">七政四余 · 二十八宿分野 · 真太阳时起盘</text>');
    S.push('<line x1="360" y1="136" x2="560" y2="136" stroke="rgba(216,186,116,0.34)" stroke-width="0.8"/>');
    S.push('<line x1="680" y1="136" x2="880" y2="136" stroke="rgba(216,186,116,0.34)" stroke-width="0.8"/>');
    S.push('<circle cx="620" cy="136" r="2" fill="rgba(216,186,116,0.6)"/>');

    /* ---- 输入摘要：三栏两行 ---- */
    var bx = 60, by = 156, bw = 1120, bh = 168;
    S.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="rgba(150,180,235,0.028)" stroke="rgba(216,186,116,0.24)" stroke-width="0.8"/>');
    var colW = bw / 3, rowH = bh / 2;
    for (var vx = 1; vx <= 2; vx++) {
      S.push('<line x1="' + (bx + colW * vx) + '" y1="' + (by + 14) + '" x2="' + (bx + colW * vx) + '" y2="' + (by + bh - 14) + '" stroke="rgba(216,186,116,0.16)" stroke-width="0.7"/>');
    }
    S.push('<line x1="' + (bx + 14) + '" y1="' + (by + rowH) + '" x2="' + (bx + bw - 14) + '" y2="' + (by + rowH) + '" stroke="rgba(216,186,116,0.16)" stroke-width="0.7"/>');

    var lunar = c.lunar;
    var lunMain = lunar ? (lunar.monthName + lunar.dayName) : '—';
    var lunSub = lunar ? (c.ganzhi.year + '年 · ' + (lunar.days === 30 ? '大月' : '小月') + ' · 定朔') : '超出农历表范围（1900–2100）';

    var cells = [
      { label: '公历', main: c.input.y + '年' + c.input.m + '月' + c.input.d + '日　' + pad(c.input.hh) + ':' + pad(c.input.mm), sub: '北京时间（UTC+8）' },
      { label: '农历', main: lunMain, sub: lunSub },
      { label: '干支历', main: c.ganzhi.year + '年　' + c.ganzhi.month + '月　' + c.ganzhi.day + '日　' + c.ganzhi.hour + '时', sub: '年以立春为界 · 月以节为界' },
      { label: '方位', main: c.place || '自定义方位', sub: '东经 ' + c.input.lon.toFixed(3) + '° · 北纬 ' + c.input.lat.toFixed(3) + '°' },
      { label: '真太阳时', main: pad(c.tst.hh) + ':' + pad(c.tst.mm) + '（' + (c.tst.y + '年' + c.tst.m + '月' + c.tst.d + '日') + '）', sub: '地平经差 ' + sign(c.trueSolar.lonCorr, ' 分') + ' · 均时差 ' + sign(c.trueSolar.eot, ' 分') },
      { label: '节气', main: c.term ? c.term.name + '（' + c.term.m + '月' + c.term.d + '日）' : '—', sub: '太阳黄经 ' + c.solarLon.toFixed(2) + '°' + (c.nextTerm ? ' · 距' + c.nextTerm.name + Math.max(0, Math.round(c.nextTerm.jd - c.jd)) + '日' : '') }
    ];

    cells.forEach(function (cell, i) {
      var cx = bx + colW * (i % 3) + 22;
      var cy = by + rowH * Math.floor(i / 3);
      S.push('<text x="' + cx + '" y="' + (cy + 26) + '" font-family=\'' + FONT_T + '\' font-size="10.5" letter-spacing="3" fill="rgba(216,186,116,0.62)">' + esc(cell.label) + '</text>');
      S.push('<text x="' + cx + '" y="' + (cy + 54) + '" font-family=\'' + FONT_T + '\' font-size="18" fill="#e9dfc6">' + esc(cell.main) + '</text>');
      S.push('<text x="' + cx + '" y="' + (cy + 73) + '" font-family=\'' + FONT_T + '\' font-size="10.5" letter-spacing="0.5" fill="rgba(206,196,172,0.58)">' + esc(cell.sub) + '</text>');
    });

    /* ---- 式盘 ---- */
    var chart = window.TGChart.build(c);
    var scale = 0.8, cx0 = (W - 1000 * scale) / 2, cy0 = 340;
    S.push('<g transform="translate(' + cx0 + ' ' + cy0 + ') scale(' + scale + ')">' + chart.defs + chart.body + '</g>');

    /* ---- 占验表 ---- */
    var tx = 80, ty = 1180, tw = 1080;
    var cols = [210, 120, 170, 100, 230, 250];
    var heads = ['星曜', '黄经', '入宿', '宿度', '入次 / 分野', '黄道宫'];
    var rowH2 = 36;
    var bottom = ty + rowH2 * (c.bodies.length + 1);

    S.push('<text x="' + tx + '" y="' + (ty - 16) + '" font-family=\'' + FONT_T + '\' font-size="13" letter-spacing="4" fill="rgba(216,186,116,0.8)">七政行度</text>');
    S.push('<rect x="' + tx + '" y="' + ty + '" width="' + tw + '" height="' + (bottom - ty) + '" fill="rgba(150,180,235,0.024)" stroke="rgba(216,186,116,0.22)" stroke-width="0.8"/>');
    S.push('<rect x="' + tx + '" y="' + ty + '" width="' + tw + '" height="' + rowH2 + '" fill="rgba(216,186,116,0.07)"/>');

    var acc = 0;
    var xs = cols.map(function (w) { var x = tx + acc; acc += w; return x; });

    heads.forEach(function (h, i) {
      S.push('<text x="' + (xs[i] + 14) + '" y="' + (ty + 23) + '" font-family=\'' + FONT_T + '\' font-size="11.5" letter-spacing="2" fill="rgba(216,186,116,0.86)">' + esc(h) + '</text>');
    });
    S.push('<line x1="' + tx + '" y1="' + (ty + rowH2) + '" x2="' + (tx + tw) + '" y2="' + (ty + rowH2) + '" stroke="rgba(216,186,116,0.22)" stroke-width="0.8"/>');

    c.bodies.forEach(function (b, r) {
      var ry = ty + rowH2 * (r + 1);
      if (r % 2 === 1) S.push('<rect x="' + tx + '" y="' + ry + '" width="' + tw + '" height="' + rowH2 + '" fill="rgba(216,186,116,0.026)"/>');
      if (r > 0) S.push('<line x1="' + tx + '" y1="' + ry + '" x2="' + (tx + tw) + '" y2="' + ry + '" stroke="rgba(216,186,116,0.10)" stroke-width="0.6"/>');

      var baseY = ry + 23;
      S.push('<text x="' + (xs[0] + 14) + '" y="' + baseY + '" font-family=\'' + FONT_T + '\' font-size="13" fill="#e9dfc6">' +
        '<tspan fill="' + b.color + '" font-size="14">' + esc(b.glyph) + '</tspan> ' + esc(b.name) + '　<tspan fill="rgba(200,190,166,0.5)" font-size="10.5">' + esc(b.alias) + '</tspan></text>');
      S.push('<text x="' + (xs[1] + 14) + '" y="' + baseY + '" font-family=\'' + FONT_T + '\' font-size="12" fill="rgba(226,218,198,0.9)">' + b.lon.toFixed(2) + '°</text>');
      S.push('<text x="' + (xs[2] + 14) + '" y="' + baseY + '" font-family=\'' + FONT_T + '\' font-size="12.5" fill="#e9dfc6">' + esc(b.xiu.full) + '</text>');
      S.push('<text x="' + (xs[3] + 14) + '" y="' + baseY + '" font-family=\'' + FONT_T + '\' font-size="12" fill="rgba(226,218,198,0.9)">' + b.du.toFixed(2) + '</text>');
      S.push('<text x="' + (xs[4] + 14) + '" y="' + baseY + '" font-family=\'' + FONT_T + '\' font-size="12" fill="#e9dfc6">' + esc(b.ci) +
        '<tspan fill="rgba(200,190,166,0.5)"> · ' + esc(b.zhou) + ' · ' + esc(b.guo) + '</tspan></text>');
      S.push('<text x="' + (xs[5] + 14) + '" y="' + baseY + '" font-family=\'' + FONT_T + '\' font-size="12" fill="#e9dfc6">' + esc(b.zodiacZhi) + '宫 ' +
        '<tspan fill="rgba(200,190,166,0.55)">' + esc(b.zodiac) + ' ' + b.zodiacDeg.toFixed(1) + '°</tspan></text>');
    });

    // 斗建时序
    var sun = c.bodies[0];
    var mZhi = window.TGChart.monthZhi(c);
    var liuhe = { '子':'丑','丑':'子','寅':'亥','卯':'戌','辰':'酉','巳':'申',
                  '午':'未','未':'午','申':'巳','酉':'辰','戌':'卯','亥':'寅' };
    var jiangshen = { '子':'神后','丑':'大吉','寅':'功曹','卯':'太冲','辰':'天罡','巳':'太乙',
                      '午':'胜光','未':'小吉','申':'传送','酉':'从魁','戌':'河魁','亥':'登明' };
    var yuejiang = liuhe[mZhi];
    var omenLine = c.lunar.monthName + '建' + mZhi + '，' + yuejiang + '将' + jiangshen[yuejiang] + '；太阳入' + sun.xiu.name + '宿' +
      sun.du.toFixed(1) + '度，斗柄指' + mZhi + '（月建）。';
    S.push('<text x="' + tx + '" y="' + (bottom + 26) + '" font-family=\'' + FONT_K + '\' font-size="13" fill="rgba(214,204,180,0.86)">' + esc(omenLine) + '</text>');

    /* ---- 占验记录 ---- */
    var rx = tx, ryy = bottom + 50, rw = tw, rh = 160;
    S.push('<text x="' + rx + '" y="' + (ryy - 12) + '" font-family=\'' + FONT_T + '\' font-size="13" letter-spacing="4" fill="rgba(216,186,116,0.8)">占验记录</text>');
    S.push('<rect x="' + rx + '" y="' + ryy + '" width="' + rw + '" height="' + rh + '" fill="rgba(10,16,32,0.55)" stroke="rgba(216,186,116,0.18)" stroke-width="0.8"/>');
    var rec = (record || '').trim();
    var lines = rec ? wrapText(rec, 62).slice(0, 5) : [];
    if (!lines.length) {
      S.push('<text x="' + (rx + 20) + '" y="' + (ryy + 34) + '" font-family=\'' + FONT_K + '\' font-size="14" fill="rgba(180,172,152,0.38)">（未录）</text>');
    } else {
      lines.forEach(function (ln, i) {
        S.push('<text x="' + (rx + 20) + '" y="' + (ryy + 34 + i * 26) + '" font-family=\'' + FONT_K + '\' font-size="14" letter-spacing="0.5" fill="rgba(224,214,190,0.9)">' + esc(ln) + '</text>');
      });
      if (wrapText(rec, 62).length > 5) {
        S.push('<text x="' + (rx + rw - 20) + '" y="' + (ryy + rh - 14) + '" text-anchor="end" font-family=\'' + FONT_T + '\' font-size="10" fill="rgba(180,172,152,0.45)">（原文过长，仅取前五行）</text>');
      }
    }

    // 页脚
    S.push('<text x="' + W / 2 + '" y="' + (H - 34) + '" text-anchor="middle" font-family=\'' + FONT_T + '\' font-size="10.5" letter-spacing="1.2" fill="rgba(190,182,160,0.42)">宿度依古宿制（二十八宿古度合 365.25 度，角宿起于角宿一），黄经用现代星历推步 · 天官太乙式</text>');

    var defs =
      '<defs>' +
      '<linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#070b18"/>' +
      '<stop offset="46%" stop-color="#0a1124"/>' +
      '<stop offset="100%" stop-color="#05080f"/>' +
      '</linearGradient>' +
      '<radialGradient id="vignette" cx="50%" cy="34%" r="72%">' +
      '<stop offset="0%" stop-color="#1b2a4d" stop-opacity="0.26"/>' +
      '<stop offset="62%" stop-color="#000000" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>' +
      '</radialGradient>' +
      '</defs>';

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      defs + S.join('') + '</svg>';
  }

  function save(c, record, done) {
    if (!c) { if (done) done(); return; }
    var svg = buildSVG(c, record);
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var img = new Image();

    img.onload = function () {
      try {
        var scale = 2;
        var cv = document.createElement('canvas');
        cv.width = img.width * scale;
        cv.height = img.height * scale;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#060a15';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);

        var name = '天官太乙式_' + c.input.y + pad(c.input.m) + pad(c.input.d) + '_' + pad(c.input.hh) + pad(c.input.mm) + '.png';
        cv.toBlob(function (b) {
          if (!b) { alert('本机浏览器不支持导出此格式'); return; }
          var a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        }, 'image/png');
      } catch (e) {
        alert('导出失败：' + e.message);
      } finally {
        URL.revokeObjectURL(url);
        if (done) done();
      }
    };

    img.onerror = function () {
      URL.revokeObjectURL(url);
      if (done) done();
      alert('导出失败：图像生成异常');
    };

    img.src = url;
  }

  window.TGExport = { save: save, buildSVG: buildSVG };
})();
