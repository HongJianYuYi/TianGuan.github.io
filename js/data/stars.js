/* 天官太乙式 · 恒星表
 * J2000.0 平赤道坐标（依巴谷/SIMBAD 星表值），起盘时按当日历元岁差旋转。
 * name=中文星名, bayer=拜耳/佛氏名, ra/dec=赤经赤纬（度）, mag=V 视星等,
 * xiu=该星为距星时标所属宿，否则为 null。
 * 距星对照从唐宋通行制（伊世同《中西对照恒星图表》），异说见各注。
 */
(function () {
  'use strict';

  window.TGStars = [
    /* ===== 二十八宿距星 ===== */
    { name: '角宿一', bayer: 'α Vir', ra: 201.298, dec: -11.161, mag: 0.97, xiu: '角' },
    { name: '亢宿一', bayer: 'κ Vir', ra: 213.224, dec: -10.274, mag: 4.18, xiu: '亢' },
    { name: '氐宿一', bayer: 'α² Lib', ra: 222.720, dec: -16.042, mag: 2.75, xiu: '氐' },
    { name: '房宿一', bayer: 'π Sco', ra: 239.713, dec: -26.114, mag: 2.89, xiu: '房' },
    { name: '心宿一', bayer: 'σ Sco', ra: 245.297, dec: -25.593, mag: 2.89, xiu: '心' },
    { name: '尾宿一', bayer: 'μ¹ Sco', ra: 253.084, dec: -38.018, mag: 3.00, xiu: '尾' },
    { name: '箕宿一', bayer: 'γ² Sgr', ra: 271.452, dec: -30.424, mag: 2.99, xiu: '箕' },
    { name: '斗宿一', bayer: 'φ Sgr', ra: 281.414, dec: -26.991, mag: 3.17, xiu: '斗' },
    { name: '牛宿一', bayer: 'β Cap', ra: 305.253, dec: -14.781, mag: 3.08, xiu: '牛' },   // 一说早期以 α Cap 为距星
    { name: '女宿一', bayer: 'ε Aqr', ra: 311.919, dec: -9.496, mag: 3.77, xiu: '女' },
    { name: '虚宿一', bayer: 'β Aqr', ra: 322.890, dec: -5.571, mag: 2.87, xiu: '虚' },
    { name: '危宿一', bayer: 'α Aqr', ra: 331.446, dec: -0.320, mag: 2.94, xiu: '危' },
    { name: '室宿一', bayer: 'α Peg', ra: 346.190, dec: 15.205, mag: 2.48, xiu: '室' },
    { name: '壁宿一', bayer: 'γ Peg', ra: 3.309, dec: 15.184, mag: 2.83, xiu: '壁' },
    { name: '奎宿一', bayer: 'η And', ra: 14.302, dec: 23.418, mag: 4.40, xiu: '奎' },    // 一说以 ζ And 为距星
    { name: '娄宿一', bayer: 'β Ari', ra: 28.660, dec: 20.808, mag: 2.64, xiu: '娄' },
    { name: '胃宿一', bayer: '35 Ari', ra: 40.863, dec: 27.707, mag: 4.65, xiu: '胃' },
    { name: '昴宿一', bayer: '17 Tau', ra: 56.219, dec: 24.113, mag: 3.70, xiu: '昴' },   // 一说以 η Tau 昴宿六为距星
    { name: '毕宿一', bayer: 'ε Tau', ra: 67.154, dec: 19.180, mag: 3.53, xiu: '毕' },
    { name: '觜宿一', bayer: 'λ Ori', ra: 83.785, dec: 9.934, mag: 3.39, xiu: '觜' },     // 一说以 φ¹ Ori 为距星
    { name: '参宿三', bayer: 'δ Ori', ra: 83.002, dec: -0.299, mag: 2.23, xiu: '参' },    // 参三星东起第一
    { name: '井宿一', bayer: 'μ Gem', ra: 95.740, dec: 22.514, mag: 2.86, xiu: '井' },
    { name: '鬼宿一', bayer: 'θ Cnc', ra: 127.899, dec: 18.095, mag: 5.33, xiu: '鬼' },
    { name: '柳宿一', bayer: 'δ Hya', ra: 129.414, dec: 5.704, mag: 4.16, xiu: '柳' },
    { name: '星宿一', bayer: 'α Hya', ra: 141.897, dec: -8.659, mag: 1.98, xiu: '星' },
    { name: '张宿一', bayer: 'υ¹ Hya', ra: 147.870, dec: -14.847, mag: 4.12, xiu: '张' },
    { name: '翼宿一', bayer: 'α Crt', ra: 164.944, dec: -18.299, mag: 4.07, xiu: '翼' },
    { name: '轸宿一', bayer: 'γ Crv', ra: 183.952, dec: -17.542, mag: 2.59, xiu: '轸' },

    /* ===== 星占常用名星 ===== */
    { name: '大角', bayer: 'α Boo', ra: 213.915, dec: 19.182, mag: -0.05, xiu: null },
    { name: '天狼', bayer: 'α CMa', ra: 101.287, dec: -16.716, mag: -1.46, xiu: null },
    { name: '老人', bayer: 'α Car', ra: 95.988, dec: -52.696, mag: -0.74, xiu: null },
    { name: '南门二', bayer: 'α Cen', ra: 219.902, dec: -60.834, mag: -0.27, xiu: null },
    { name: '河鼓二', bayer: 'α Aql', ra: 297.696, dec: 8.868, mag: 0.76, xiu: null },
    { name: '织女一', bayer: 'α Lyr', ra: 279.235, dec: 38.784, mag: 0.03, xiu: null },
    { name: '心宿二', bayer: 'α Sco', ra: 247.352, dec: -26.432, mag: 0.96, xiu: null },  // 大火，变星约 0.6~1.6
    { name: '轩辕十四', bayer: 'α Leo', ra: 152.093, dec: 11.967, mag: 1.35, xiu: null },
    { name: '北落师门', bayer: 'α PsA', ra: 344.413, dec: -29.622, mag: 1.16, xiu: null },
    { name: '招摇', bayer: 'γ Boo', ra: 218.019, dec: 38.308, mag: 3.03, xiu: null },
    { name: '贯索四', bayer: 'α CrB', ra: 233.672, dec: 26.715, mag: 2.23, xiu: null },
    { name: '五帝座一', bayer: 'β Leo', ra: 177.265, dec: 14.572, mag: 2.14, xiu: null },
    { name: '北极星（勾陈一）', bayer: 'α UMi', ra: 37.955, dec: 89.264, mag: 1.98, xiu: null },
    { name: '北极五星·帝', bayer: 'β UMi', ra: 222.676, dec: 74.156, mag: 2.08, xiu: null },
    { name: '北极五星·太子', bayer: 'γ UMi', ra: 230.182, dec: 71.834, mag: 3.05, xiu: null },
    { name: '天枪三', bayer: 'κ² Boo', ra: 213.371, dec: 51.790, mag: 4.54, xiu: null },
    { name: '天市右垣·蜀', bayer: 'α Ser', ra: 236.067, dec: 6.426, mag: 2.65, xiu: null },
    { name: '天关', bayer: 'ζ Tau', ra: 84.411, dec: 21.143, mag: 3.00, xiu: null },      // 1054 客星近旁

    /* ===== 三垣补星：太微垣、天市垣之占验高频星官（紫微垣已见上）
     * 证认从《仪象考成》通行制；皆 ≤3.9 等，目视可见。 */
    // 太微垣：左右执法、东西上相次相次将
    { name: '太微左垣·左执法', bayer: 'η Vir', ra: 184.977, dec: -0.667, mag: 3.85, xiu: null },
    { name: '太微右垣·右执法', bayer: 'β Vir', ra: 177.674, dec: 1.765, mag: 3.61, xiu: null },
    { name: '太微东垣·东上相', bayer: 'γ Vir', ra: 190.415, dec: -1.449, mag: 2.74, xiu: null },
    { name: '太微东垣·东次相', bayer: 'δ Vir', ra: 193.901, dec: 3.397, mag: 3.36, xiu: null },
    { name: '太微东垣·东次将', bayer: 'ε Vir', ra: 195.545, dec: 10.959, mag: 2.85, xiu: null },
    { name: '太微西垣·西上相', bayer: 'δ Leo', ra: 168.527, dec: 20.524, mag: 2.56, xiu: null },
    { name: '太微西垣·西次相', bayer: 'θ Leo', ra: 168.560, dec: 15.430, mag: 3.32, xiu: null },
    // 三台：上台、中台、下台（各二星，取其一）
    { name: '三台·上台一', bayer: 'ι UMa', ra: 134.802, dec: 48.042, mag: 3.14, xiu: null },
    { name: '三台·中台一', bayer: 'μ UMa', ra: 155.582, dec: 41.500, mag: 3.05, xiu: null },
    { name: '三台·下台一', bayer: 'ν UMa', ra: 169.620, dec: 33.094, mag: 3.48, xiu: null },
    // 天市垣：帝座、侯、宗正
    { name: '天市垣·帝座', bayer: 'α Her', ra: 258.662, dec: 14.390, mag: 3.48, xiu: null },  // 变星 2.7~4.0
    { name: '天市垣·侯', bayer: 'α Oph', ra: 263.734, dec: 12.561, mag: 2.08, xiu: null },
    { name: '天市垣·宗正一', bayer: 'β Oph', ra: 265.868, dec: 4.567, mag: 2.77, xiu: null },
    // 天市左垣诸国：魏、燕、东海、宋
    { name: '天市左垣·魏', bayer: 'δ Her', ra: 258.758, dec: 24.839, mag: 3.13, xiu: null },
    { name: '天市左垣·燕', bayer: 'ν Oph', ra: 269.757, dec: -9.774, mag: 3.34, xiu: null },
    { name: '天市左垣·东海', bayer: 'η Ser', ra: 275.328, dec: -2.899, mag: 3.26, xiu: null },
    { name: '天市左垣·宋', bayer: 'η Oph', ra: 257.595, dec: -15.725, mag: 2.43, xiu: null },
    // 天市右垣诸国：河中、河间、秦、巴、梁、楚、韩
    { name: '天市右垣·河中', bayer: 'β Her', ra: 247.555, dec: 21.490, mag: 2.78, xiu: null },
    { name: '天市右垣·河间', bayer: 'γ Her', ra: 245.480, dec: 19.153, mag: 3.75, xiu: null },
    { name: '天市右垣·秦', bayer: 'δ Ser', ra: 233.700, dec: 10.537, mag: 3.85, xiu: null },
    { name: '天市右垣·巴', bayer: 'ε Ser', ra: 237.704, dec: 4.478, mag: 3.71, xiu: null },
    { name: '天市右垣·梁', bayer: 'δ Oph', ra: 243.586, dec: -3.694, mag: 2.73, xiu: null },
    { name: '天市右垣·楚', bayer: 'ε Oph', ra: 244.580, dec: -4.692, mag: 2.97, xiu: null },
    { name: '天市右垣·韩', bayer: 'ζ Oph', ra: 249.290, dec: -10.567, mag: 2.56, xiu: null }
  ];
})();
