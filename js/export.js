/* 天官太乙式 —— 导出：按页面原貌合成纯 SVG 长图，再绘入 2 倍分辨率 canvas 导出 PNG。
 * 说明：浏览器对含 <foreignObject> 的 SVG 图像一律污染 canvas，故不克隆 DOM，
 * 而是按页面版式（页头 + 推步/式盘/占验三栏 + 页脚）用纯 SVG 复刻；
 * 文字内容全部实时取自页面 DOM，保证与屏上所见一致。
 * 印信甲骨文「星」为字形矢量轮廓（取自方正甲骨文，UPM=1000），无字体依赖。 */
(function () {
  'use strict';

  // 甲骨文「星」字形轮廓（fontTools 提取，y 向上，使用时 scale(k,-k) 翻转）
  var XING_PATH = 'M432 -35Q448 -38 467 -34Q483 -32 487 -33Q509 -37 535 -32Q556 -30 565 -31H578L591 -26Q601 -21 609 -19Q623 -15 639 -15Q652 -13 659 -8Q660 -7 669 -1Q691 10 695 16Q697 18 694 20Q691 22 683 24Q676 25 669 27Q662 30 652 30Q638 30 632 32Q620 34 618 34Q610 34 603 32Q589 30 584 31Q578 31 567 29Q554 26 554 31L553 59Q551 69 549 79Q546 88 547 102Q547 125 544 136L540 146L541 182Q541 215 543 221Q546 229 543 243Q539 255 538 298Q538 321 536 331Q534 344 535 356Q536 373 538 377Q545 390 562 399Q572 404 575 407Q577 409 585 419Q595 434 597 436Q606 445 610 454Q615 469 641 492Q649 499 658 523Q662 533 664 535Q670 545 669 557Q669 566 665 571Q663 577 660 577Q656 575 652 573Q648 570 643 567Q613 551 592 521Q585 509 578 503Q558 482 556 476Q552 470 542 468Q538 467 534 469Q529 474 528 484Q526 491 524 547Q522 571 521 575Q521 588 520 601Q519 676 514 699Q512 705 512 710Q510 725 505 734Q502 742 499 753Q496 766 495 768Q493 771 488 771Q485 771 482 766Q476 753 475 728Q475 712 474 696Q474 686 474 676Q475 671 475 636Q473 602 475 597Q480 585 479 552Q479 531 478 510Q478 483 473 479Q468 475 463 480Q460 483 456 485Q454 486 431 507Q405 532 394 538Q392 539 385 546Q372 561 366 571Q356 578 346 585Q342 587 338 589Q324 599 316 597Q312 593 320 580Q327 568 334 556Q342 541 347 536Q355 529 361 510Q364 498 373 493Q378 490 379 486Q389 472 407 456Q413 454 413 450Q415 446 418 443Q421 438 423 434Q424 432 429 424Q432 419 435 415Q443 403 456 395Q462 393 466 389Q474 381 481 365Q487 356 488 355Q495 349 493 332Q493 322 492 313Q491 294 489 275Q489 254 488 251Q485 220 487 190Q490 166 488 151Q486 141 486 108Q486 75 487 73Q488 65 488 58Q487 50 486 43Q487 30 482 26Q480 24 466 21Q460 19 452 21Q443 21 434 21Q411 18 390 21Q376 21 362 22H340L327 19Q307 15 302 15Q283 14 274 9Q269 6 263 5Q255 1 254 0L251 -2L254 -5Q264 -15 286 -19Q295 -22 299 -22Q301 -24 312 -24Q318 -25 330 -23Q334 -21 342 -21Q353 -21 372 -28Q378 -31 404 -30Q416 -30 420 -32Q426 -34 432 -35ZM695 189Q701 187 713 190Q720 192 727 194Q738 197 750 197Q763 198 772 202Q805 221 816 250Q816 251 818 269Q818 283 820 293Q824 310 820 322Q818 326 815 335Q808 361 808 374Q807 384 795 395Q780 410 771 410Q760 409 749 409Q720 406 705 399L696 395H667H639L632 388Q628 385 623 380Q620 374 617 361Q617 346 606 326Q593 302 593 284Q593 275 590 256L586 241L588 235Q593 225 602 223Q612 220 613 220Q626 213 635 206Q642 200 655 197Q659 196 668 193Q676 191 684 191Q690 190 695 189ZM712 242Q696 240 690 240Q676 239 667 248Q659 256 657 271Q656 283 657 289Q658 291 660 305Q667 336 696 345Q699 346 704 346Q706 346 712 348Q718 350 731 350Q745 350 753 348Q764 344 764 338Q764 333 765 331Q767 329 767 314Q768 275 766 267Q762 259 755 251L746 242H735Q724 242 712 242ZM206 212Q209 211 212 211Q218 212 226 213Q235 215 251 215Q260 215 266 217Q269 218 276 218Q281 218 285 220Q288 220 298 222Q318 225 339 232Q349 236 351 237Q353 237 357 241L362 245V265Q361 281 365 320Q366 337 357 354Q353 364 348 381Q345 394 338 412Q333 427 319 428Q311 431 304 433Q292 436 288 436Q278 437 275 439Q256 452 246 445Q235 439 219 433Q211 431 199 427Q195 425 190 424Q182 421 177 412Q176 411 174 399Q174 388 171 382Q169 372 169 356Q167 336 166 332Q160 314 160 297L159 287L165 268Q170 257 174 246Q176 242 178 236Q182 219 206 212ZM290 263Q286 262 268 262Q228 262 222 272Q219 276 219 327V342L224 352Q229 361 236 368Q246 380 260 377Q271 377 278 373Q283 370 288 368Q296 367 303 361Q310 354 309 345Q309 329 306 311Q306 305 307 301Q312 281 300 270Q295 264 290 263Z';
  var XING_CX = 489.5, XING_CY = 368; // 字形视觉中心（字体单位）

  var SERIF = "'Songti SC','STSong','Noto Serif SC','Source Han Serif SC',SimSun,serif";
  var GOLD = '#dcbb70', GOLD2 = '#f0d79b', GOLD_DIM = '#9a8248';
  var IVORY = '#ece5d4', MUTED = '#8b8a83', MUTED2 = '#64635e';
  var LINE = 'rgba(201,168,96,0.26)', LINE_SOFT = 'rgba(201,168,96,0.12)';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function f(n) { return Math.round(n * 100) / 100; }
  function T(x, y, txt, size, fill, opt) {
    opt = opt || {};
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-size="' + size + '" fill="' + fill + '"' +
      ' font-family="' + SERIF + '"' +
      (opt.anchor ? ' text-anchor="' + opt.anchor + '"' : '') +
      (opt.ls ? ' letter-spacing="' + opt.ls + '"' : '') +
      (opt.op ? ' opacity="' + opt.op + '"' : '') +
      '>' + esc(txt) + '</text>';
  }
  function rect(x, y, w, h, fill, stroke, rx) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' +
      (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="0.8"' : '') + '/>';
  }
  function hline(x1, x2, y, stroke) {
    return '<line x1="' + f(x1) + '" y1="' + f(y) + '" x2="' + f(x2) + '" y2="' + f(y) + '" stroke="' + (stroke || LINE_SOFT) + '" stroke-width="0.7"/>';
  }
  // 按宽度折行（中文按字数，粗略）
  function wrap(str, chars) {
    var out = [], s = String(str || '').replace(/\s+/g, ' ').trim();
    while (s.length > chars) { out.push(s.slice(0, chars)); s = s.slice(chars); }
    out.push(s);
    return out;
  }

  function el(id) { return document.getElementById(id); }
  function valOf(id) {
    var n = el(id);
    if (!n) return '';
    if (n.tagName === 'SELECT') return n.options[n.selectedIndex] ? n.options[n.selectedIndex].text : '';
    return n.value || '';
  }
  // 一个 .fld 控件 → 「值 + 单位」
  function fldText(fld) {
    var inp = fld.querySelector('input, select');
    var unit = fld.querySelector('span');
    var v = '';
    if (inp) v = inp.tagName === 'SELECT'
      ? (inp.options[inp.selectedIndex] ? inp.options[inp.selectedIndex].text : '')
      : inp.value;
    return unit ? v + ' ' + unit.textContent : v;
  }
  function cssColor(sel) {
    var n = document.querySelector(sel);
    return n ? getComputedStyle(n).backgroundColor : GOLD;
  }

  /* ---------- 背景与星野 ---------- */
  function drawBG(W, H) {
    var s = [];
    s.push('<defs>' +
      '<linearGradient id="bgG" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#05070f"/><stop offset="0.55" stop-color="#04060c"/><stop offset="1" stop-color="#06080f"/></linearGradient>' +
      '<radialGradient id="glowT" cx="0.5" cy="0" r="0.7">' +
      '<stop offset="0" stop-color="#16233f" stop-opacity="0.9"/><stop offset="0.7" stop-color="#16233f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="glowB" cx="0.88" cy="1" r="0.6">' +
      '<stop offset="0" stop-color="#1a1830" stop-opacity="0.8"/><stop offset="1" stop-color="#1a1830" stop-opacity="0"/></radialGradient>' +
      '</defs>');
    s.push(rect(0, 0, W, H, 'url(#bgG)'));
    s.push(rect(0, 0, W, H, 'url(#glowT)'));
    s.push(rect(0, 0, W, H, 'url(#glowB)'));
    // 星野：直接读页面生成的 110 颗星位置
    var stars = document.querySelectorAll('#stars i');
    var dots = [];
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i].style;
      var cx = parseFloat(st.left) / 100 * W, cy = parseFloat(st.top) / 100 * H;
      var r = parseFloat(st.width) / 2 || 0.6;
      var op = parseFloat(st.getPropertyValue('--o')) || 0.4;
      dots.push('<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="#dfe8ff" opacity="' + op + '"/>');
    }
    s.push(dots.join(''));
    return s.join('');
  }

  /* ---------- 页头 ---------- */
  function drawHeader() {
    var s = [];
    var sx = 40, sy = 44, ss = 64; // 印信方框
    s.push(rect(sx, sy, ss, ss, 'rgba(220,187,112,0.05)', LINE, 3));
    var k = 0.056;
    var cx = sx + ss / 2, cy = sy + ss / 2;
    s.push('<g transform="translate(' + f(cx - XING_CX * k) + ' ' + f(cy + XING_CY * k) + ') scale(' + k + ' ' + (-k) + ')">' +
      '<path d="' + XING_PATH + '" fill="#e8d6a8"/></g>');
    s.push(T(124, 84, '天官太乙式', 34, GOLD2, { ls: 6 }));
    s.push(T(126, 110, '究天人之际 · 通古今之变 · 成一家之言', 12.5, MUTED, { ls: 2 }));
    var meta = (el('meta-solar') ? el('meta-solar').textContent : '') + ' · ' + (el('meta-tst') ? el('meta-tst').textContent : '');
    s.push(T(1620, 84, meta, 12, MUTED, { anchor: 'end' }));
    s.push(T(1620, 108, '实星占验 · 二十八宿分野', 10.5, MUTED2, { anchor: 'end', ls: 2 }));
    s.push(hline(40, 1620, 138, LINE));
    return s.join('');
  }

  /* ---------- 面板通用（题 13px 居左，铭 10px 居右，如页面） ---------- */
  function panelChrome(x, y, w, h, name, em) {
    return rect(x, y, w, h, 'rgba(12,18,36,0.82)', LINE, 2) +
      T(x + 20, y + 34, name, 13, GOLD, { ls: 4 }) +
      T(x + w - 20, y + 33, em, 10, GOLD_DIM, { anchor: 'end', ls: 2 }) +
      hline(x + 20, x + w - 20, y + 48, LINE_SOFT);
  }

  /* ---------- 推步区（fillH 给定面板高时，读数区如页面 margin-top:auto 贴底） ---------- */
  function drawInput(x, y0, w, fillH) {
    var s = [], y = y0 + 72;
    var blocks = document.querySelectorAll('#sec-input .cal-block');
    Array.prototype.forEach.call(blocks, function (blk, bi) {
      var head = blk.querySelector('.cal-head b');
      var hint = blk.querySelector('.cal-head .hint');
      s.push(T(x + 20, y, head ? head.textContent : '', 13, GOLD));
      if (hint) s.push(T(x + w - 20, y, hint.textContent, 9.5, MUTED2, { anchor: 'end' }));
      y += 24;
      var rows = blk.querySelectorAll('.row');
      Array.prototype.forEach.call(rows, function (row) {
        if (row.classList.contains('step-row')) return; // 时间步进为推演之具，不入案例图
        var parts = [];
        row.querySelectorAll('.fld').forEach(function (fld) { parts.push(fldText(fld)); });
        s.push(T(x + 20, y, parts.join('　'), 14, IVORY));
        y += 24;
      });
      var note = blk.querySelector('.cal-foot');
      if (note && note.textContent.trim() && note.textContent.trim() !== '—') {
        note.textContent.trim().split('\n').forEach(function (para) {
          wrap(para, 30).forEach(function (ln) {
            s.push(T(x + 20, y, ln, 10, MUTED));
            y += 17;
          });
        });
      }
      if (bi < blocks.length - 1) { y += 4; s.push(hline(x + 20, x + w - 20, y)); }
      y += 18;
    });
    // 读数区
    var ros = document.querySelectorAll('#sec-input .ro-line');
    var roH = ros.length * 21 + 18;
    if (fillH && y0 + fillH - 16 - roH > y) y = y0 + fillH - 16 - roH;
    s.push(rect(x + 20, y, w - 40, roH, 'rgba(0,0,0,0.18)', LINE_SOFT));
    y += 22;
    Array.prototype.forEach.call(ros, function (ro, ri) {
      var lb = ro.querySelector('span'), vl = ro.querySelector('b');
      s.push(T(x + 32, y, lb ? lb.textContent : '', 11, MUTED));
      s.push(T(x + w - 32, y, vl ? vl.textContent : '', ri === 0 ? 15 : 13, ri === 0 ? '#f7e6b8' : GOLD2, { anchor: 'end' }));
      y += 21;
    });
    return { svg: s.join(''), h: y - y0 + 16 };
  }

  /* ---------- 式盘区 ---------- */
  function drawChart(c, x, y0, w) {
    var s = [];
    var cw = w - 40, k = cw / 1000;
    var chartStr = window.TGChart.svg(c).replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    s.push('<g transform="translate(' + f(x + 20) + ' ' + f(y0 + 60) + ') scale(' + f(k) + ')">' + chartStr + '</g>');
    var ly = y0 + 60 + cw + 26;
    var legend = [
      ['lg-o', '二十八宿'], ['lg-t', '十二地支分野'], ['lg-p', '七政行度'], ['lg-c', '中宫天极星']
    ];
    // 图例整行居中，尾注随其后，如页面 flex 布局
    var noteTxt = '上南下北 · 左东右西 · 地支顺时针';
    var totalW = 0;
    legend.forEach(function (lg) { totalW += 14 + lg[1].length * 11 + 16; });
    totalW += noteTxt.length * 11;
    var lx = x + 20 + Math.max(0, (cw - totalW) / 2);
    legend.forEach(function (lg) {
      var col = cssColor('.chart-legend .' + lg[0]);
      s.push('<rect x="' + f(lx) + '" y="' + f(ly - 8) + '" width="9" height="9" fill="' + col + '" rx="1"/>');
      s.push(T(lx + 14, ly, lg[1], 11, MUTED));
      lx += 14 + lg[1].length * 11 + 16;
    });
    s.push(T(lx, ly, noteTxt, 11, 'rgba(190,170,125,0.55)'));
    return { svg: s.join(''), h: 60 + cw + 44 };
  }

  /* ---------- 占验区 ---------- */
  function drawOmen(x, y0, w, record, fillH) {
    var s = [], y = y0 + 66;
    var iw = w - 40;
    // 表格
    var ths = [], rows = [];
    document.querySelectorAll('.omen-table thead th').forEach(function (th) { ths.push(th.textContent); });
    document.querySelectorAll('#omen-body tr').forEach(function (tr) {
      var r = [];
      tr.querySelectorAll('td').forEach(function (td) { r.push(td.textContent); });
      rows.push(r);
    });
    // 斗建时序与断语文本先行折算，供表格拉伸定行高
    var note = el('omen-note') ? el('omen-note').textContent.trim() : '';
    var nLines = wrap(note, 29);
    var exH = 26 + nLines.length * 17 + 12;
    var recTxt = (record || '').trim() || '记所占之事、所得之验……';
    var rLines = [];
    String(recTxt).split('\n').forEach(function (p) {
      wrap(p, 28).forEach(function (ln) { rLines.push(ln); });
    });
    if (rLines.length > 10) rLines = rLines.slice(0, 10);
    var recH = Math.max(rLines.length, 3) * 18 + 16;
    // 列宽仿页面自动布局：各列按内容定基宽，余宽均分九列
    var baseW = [46, 56, 46, 52, 48, 32, 22, 32, 30]; // 星曜/占候/行度/赤经/高度/星次/入宿/宿度/分野
    var extra = (iw - 364) / 9;
    var colW = baseW.map(function (bw) { return bw + extra; });
    // 页面表格 height:100% 随面板拉伸，导出同之
    var headH = 24, rowH = 26;
    if (fillH) {
      var fixed = 66 + headH + 16 + exH + 16 + 12 + recH + 16 + 34 + 16;
      rowH = Math.max(26, (fillH - fixed) / rows.length);
    }
    var tblH = headH + rows.length * rowH;
    s.push(rect(x + 20, y, iw, tblH, 'rgba(150,180,235,0.03)', LINE_SOFT));
    var cx0 = x + 20;
    var xs = [cx0];
    for (var i = 0; i < colW.length - 1; i++) xs.push(xs[i] + colW[i]);
    // 页面表头与数据均居中，故取列中心、middle 锚点
    var mids = colW.map(function (cw, i) { return xs[i] + cw / 2; });
    s.push(rect(cx0, y, iw, headH, 'rgba(216,186,116,0.07)'));
    ths.forEach(function (t, i) { s.push(T(mids[i], y + 16, t, 10, GOLD_DIM, { anchor: 'middle', ls: 1 })); });
    // 单元格配色与界面一致：占候分事/态、行度分顺逆留伏、星次泥金、宿名泥金
    var MO_COLOR = { '顺': '#e6d7ae', '逆': '#d98a7e', '留': '#e0b34e', '伏': '#7c828f' };
    rows.forEach(function (r, ri) {
      var ry = y + headH + ri * rowH;
      if (ri % 2 === 0) s.push(rect(cx0, ry, iw, rowH, 'rgba(216,186,116,0.03)'));
      s.push(hline(cx0, cx0 + iw, ry, 'rgba(201,168,96,0.10)'));
      r.forEach(function (cell, ci) {
        var col = '#d5cfc0'; // 页面 td 默认色
        if (ci === 0) col = IVORY;
        else if (ci === 1) {
          var c0 = cell.charAt(0);
          col = (c0 === '犯' || c0 === '凌' || c0 === '掩') ? '#d98a7e' : (c0 === '守' ? '#e0b34e' : '#d5cfc0');
        }
        else if (ci === 2) col = MO_COLOR[cell.charAt(0)] || '#e6d7ae';
        else if (ci === 3 || ci === 6) col = '#e6d7ae';
        else if (ci === 4) col = '#dcc488'; // 星次
        else if (ci === 5) col = GOLD2;     // 入宿
        s.push(T(mids[ci], ry + rowH / 2 + 4, cell, 11, col, { anchor: 'middle' }));
      });
    });
    y += tblH + 16;
    // 斗建时序
    s.push(rect(x + 20, y, iw, exH, 'rgba(220,187,112,0.03)'));
    s.push(rect(x + 20, y, 2, exH, 'rgba(201,168,96,0.35)'));
    s.push(T(x + 32, y + 18, '斗建时序', 10, GOLD_DIM, { ls: 2 }));
    nLines.forEach(function (ln, i) { s.push(T(x + 32, y + 38 + i * 17, ln, 10.5, '#bdb6a4')); });
    y += exH + 16;
    // 断语记录
    s.push(T(x + 20, y, '断语记录', 12, GOLD));
    s.push(T(x + w - 20, y, '自动留存于本机', 9, MUTED2, { anchor: 'end' }));
    y += 12;
    s.push(rect(x + 20, y, iw, recH, 'rgba(0,0,0,0.25)', LINE_SOFT));
    rLines.forEach(function (ln, i) {
      s.push(T(x + 30, y + 21 + i * 18, ln, 10.5, record && record.trim() ? IVORY : '#565a63'));
    });
    y += recH + 16;
    // 操作钮（原貌呈现）
    var bw = (iw - 10) / 2;
    s.push(rect(x + 20, y, bw, 34, 'rgba(220,187,112,0.10)', LINE, 1));
    s.push(T(x + 20 + bw / 2, y + 21, '存为图片', 11, GOLD2, { anchor: 'middle', ls: 3 }));
    s.push(rect(x + 20 + bw + 10, y, bw, 34, 'transparent', LINE_SOFT, 1));
    s.push(T(x + 20 + bw + 10 + bw / 2, y + 21, '清空记录', 11, MUTED, { anchor: 'middle', ls: 3 }));
    y += 34;
    return { svg: s.join(''), h: y - y0 + 16 };
  }

  /* ---------- 页脚 ---------- */
  function drawFooter(y, W) {
    var s = [];
    var ps = document.querySelectorAll('.foot p');
    s.push(hline(40, W - 40, y, LINE_SOFT));
    y += 22;
    Array.prototype.forEach.call(ps, function (p) {
      wrap(p.textContent.trim(), 100).forEach(function (ln) {
        s.push(T(40, y, ln, 10.5, '#5b5f6a'));
        y += 18;
      });
      y += 2;
    });
    return { svg: s.join(''), h: y + 20 };
  }

  function buildPageSVG(c, record) {
    var W = 1660, PAD = 40;
    var y0 = 158;
    var colX = [PAD, PAD + 366 + 18, PAD + 366 + 18 + 778 + 18];
    var colW = [366, 778, 400];

    var input = drawInput(colX[0], y0, colW[0]);
    var chart = drawChart(c, colX[1], y0, colW[1]);
    var omen = drawOmen(colX[2], y0, colW[2], record);
    var panelH = Math.max(input.h, chart.h, omen.h);
    // 页面三栏等高（grid stretch）：推步读数贴底、占验表格拉伸，重绘以填满面板
    input = drawInput(colX[0], y0, colW[0], panelH);
    omen = drawOmen(colX[2], y0, colW[2], record, panelH);

    var foot = drawFooter(y0 + panelH + 18, W);
    var H = foot.h + PAD;

    var s = [];
    s.push(drawBG(W, H));
    s.push(drawHeader());
    s.push(panelChrome(colX[0], y0, colW[0], panelH, '推步区', '钦若昊天·敬授民时'));
    s.push(panelChrome(colX[1], y0, colW[1], panelH, '式盘区', '璇玑玉衡·以齐七政'));
    s.push(panelChrome(colX[2], y0, colW[2], panelH, '占验区', '观乎天文·以察时变'));
    s.push(input.svg, chart.svg, omen.svg);
    s.push(foot.svg);

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '">' + s.join('') + '</svg>';
  }

  function save(c, record, done) {
    if (!c) { if (done) done(); return; }
    var svg;
    try {
      svg = buildPageSVG(c, record);
    } catch (e) {
      alert('导出失败：' + e.message);
      if (done) done();
      return;
    }
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
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

  window.TGExport = { save: save };
})();
