/* 天官太乙式 · 基础数据
 * 干支、二十八宿古度、十二次分野、七政、农历表
 */
(function () {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var GAN_YINYANG = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴'];

  // 农历数据：1900-2100，每年 1 个 16 位整数
  // bit0-3 闰月月份；bit4-15 各月大小（1 大 30，0 小 29）；bit16 闰月大小
  var LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  var LUNAR_MONTH_NAME = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var LUNAR_DAY_NAME = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  // 二十八宿：古度（合 365.25 度）、距星、七曜、禽名
  var MANSIONS = [
    { name: '角', gu: 12, star: '角宿一', xiu: '木', beast: '蛟' },
    { name: '亢', gu: 9, star: '亢宿一', xiu: '金', beast: '龙' },
    { name: '氐', gu: 15, star: '氐宿一', xiu: '土', beast: '貉' },
    { name: '房', gu: 5, star: '房宿一', xiu: '日', beast: '兔' },
    { name: '心', gu: 5, star: '心宿二', xiu: '月', beast: '狐' },
    { name: '尾', gu: 18, star: '尾宿一', xiu: '火', beast: '虎' },
    { name: '箕', gu: 11, star: '箕宿一', xiu: '水', beast: '豹' },
    { name: '斗', gu: 26.25, star: '斗宿一', xiu: '木', beast: '獬' },
    { name: '牛', gu: 8, star: '牛宿一', xiu: '金', beast: '牛' },
    { name: '女', gu: 12, star: '女宿一', xiu: '土', beast: '蝠' },
    { name: '虚', gu: 10, star: '虚宿一', xiu: '日', beast: '鼠' },
    { name: '危', gu: 17, star: '危宿一', xiu: '月', beast: '燕' },
    { name: '室', gu: 16, star: '室宿一', xiu: '火', beast: '猪' },
    { name: '壁', gu: 9, star: '壁宿一', xiu: '水', beast: '貐' },
    { name: '奎', gu: 16, star: '奎宿一', xiu: '木', beast: '狼' },
    { name: '娄', gu: 12, star: '娄宿一', xiu: '金', beast: '狗' },
    { name: '胃', gu: 14, star: '胃宿一', xiu: '土', beast: '雉' },
    { name: '昴', gu: 11, star: '昴宿一', xiu: '日', beast: '鸡' },
    { name: '毕', gu: 16, star: '毕宿一', xiu: '月', beast: '乌' },
    { name: '觜', gu: 2, star: '觜宿一', xiu: '火', beast: '猴' },
    { name: '参', gu: 9, star: '参宿一', xiu: '水', beast: '猿' },
    { name: '井', gu: 33, star: '井宿一', xiu: '木', beast: '犴' },
    { name: '鬼', gu: 4, star: '鬼宿一', xiu: '金', beast: '羊' },
    { name: '柳', gu: 15, star: '柳宿一', xiu: '土', beast: '獐' },
    { name: '星', gu: 7, star: '星宿一', xiu: '日', beast: '马' },
    { name: '张', gu: 18, star: '张宿一', xiu: '月', beast: '鹿' },
    { name: '翼', gu: 18, star: '翼宿一', xiu: '火', beast: '蛇' },
    { name: '轸', gu: 17, star: '轸宿一', xiu: '水', beast: '蚓' }
  ];

  // 十二次：本次所辖宿、对应地支、州、国
  var CI = {
    '子': { name: '玄枵', xiu: ['女', '虚', '危'], zhou: '青州', guo: '齐' },
    '丑': { name: '星纪', xiu: ['斗', '牛'], zhou: '扬州', guo: '吴越' },
    '寅': { name: '析木', xiu: ['尾', '箕'], zhou: '幽州', guo: '燕' },
    '卯': { name: '大火', xiu: ['氐', '房', '心'], zhou: '豫州', guo: '宋' },
    '辰': { name: '寿星', xiu: ['角', '亢'], zhou: '兖州', guo: '郑' },
    '巳': { name: '鹑尾', xiu: ['翼', '轸'], zhou: '荆州', guo: '楚' },
    '午': { name: '鹑火', xiu: ['柳', '星', '张'], zhou: '三河', guo: '周' },
    '未': { name: '鹑首', xiu: ['井', '鬼'], zhou: '雍州', guo: '秦' },
    '申': { name: '实沈', xiu: ['觜', '参'], zhou: '益州', guo: '魏' },
    '酉': { name: '大梁', xiu: ['胃', '昴', '毕'], zhou: '冀州', guo: '赵' },
    '戌': { name: '降娄', xiu: ['奎', '娄'], zhou: '徐州', guo: '鲁' },
    '亥': { name: '娵訾', xiu: ['室', '壁'], zhou: '并州', guo: '卫' }
  };

  // 二十八宿起始累计古度（自角宿起，沿环递进）
  var XIU_CUM = {
    '角': 0, '亢': 12, '氐': 21, '房': 36, '心': 41, '尾': 46, '箕': 64,
    '斗': 75, '牛': 101.25, '女': 109.25, '虚': 121.25, '危': 131.25, '室': 148.25, '壁': 164.25,
    '奎': 173.25, '娄': 189.25, '胃': 201.25, '昴': 215.25, '毕': 226.25, '觜': 242.25, '参': 244.25,
    '井': 253.25, '鬼': 286.25, '柳': 290.25, '星': 305.25, '张': 312.25, '翼': 330.25, '轸': 348.25
  };

  // 《汉书·律历志》次度表：十二次以宿度为界，穿宿而过，非三十度等分
  // 沿宿环递进：寿星初轸十二度，大火初氐五度，……鹑尾初张十八度，还于寿星
  var CI_SEQ = [
    { name: '寿星', zhi: '辰', xiu: '轸', du: 12 },
    { name: '大火', zhi: '卯', xiu: '氐', du: 5 },
    { name: '析木', zhi: '寅', xiu: '尾', du: 10 },
    { name: '星纪', zhi: '丑', xiu: '斗', du: 12 },
    { name: '玄枵', zhi: '子', xiu: '女', du: 8 },
    { name: '娵訾', zhi: '亥', xiu: '危', du: 16 },
    { name: '降娄', zhi: '戌', xiu: '奎', du: 5 },
    { name: '大梁', zhi: '酉', xiu: '胃', du: 7 },
    { name: '实沈', zhi: '申', xiu: '毕', du: 12 },
    { name: '鹑首', zhi: '未', xiu: '井', du: 16 },
    { name: '鹑火', zhi: '午', xiu: '柳', du: 9 },
    { name: '鹑尾', zhi: '巳', xiu: '张', du: 18 }
  ];

  // 七政
  var PLANETS = [
    { key: 'sun', name: '太阳', alias: '日', glyph: '☉', color: '#f6d98a', gui: '太阳' },
    { key: 'moon', name: '太阴', alias: '月', glyph: '☽', color: '#dfe9ff', gui: '太阴' },
    { key: 'mercury', name: '辰星', alias: '水', glyph: '☿', color: '#9fd8e6', gui: '辰星' },
    { key: 'venus', name: '太白', alias: '金', glyph: '♀', color: '#f3e6b8', gui: '太白' },
    { key: 'mars', name: '荧惑', alias: '火', glyph: '♂', color: '#ef9d7a', gui: '荧惑' },
    { key: 'jupiter', name: '岁星', alias: '木', glyph: '♃', color: '#c9d8a8', gui: '岁星' },
    { key: 'saturn', name: '填星', alias: '土', glyph: '♄', color: '#d8c39a', gui: '填星' }
  ];

  // 黄道十二宫（七政四余：戌宫起白羊，逆行配支）
  var ZODIAC = ['白羊', '金牛', '双子', '巨蟹', '狮子', '双女', '天秤', '天蝎', '人马', '摩羯', '宝瓶', '双鱼'];
  var ZODIAC_ZHI = ['戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子', '亥'];

  // 二十四节气（按太阳黄经 0° 起）
  var TERMS = [
    '春分', '清明', '谷雨', '立夏', '小满', '芒种',
    '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
    '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
    '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'
  ];

  // 五行生克与七曜庙旺（宫即星所临赤道地支之五行，与盘面支扇区同贯）
  // 庙＝宫生星，旺＝星克宫，平＝星同宫，落＝宫克星，陷＝星生宫
  var BODY_WX = { sun: '火', moon: '水', mercury: '水', venus: '金', mars: '火', jupiter: '木', saturn: '土' };
  var ZHI_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  var WX_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }; // 我生者
  var WX_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };   // 我克者
  function miaoWang(bodyKey, gongZhi) {
    var s = BODY_WX[bodyKey], g = ZHI_WX[gongZhi];
    if (!s || !g) return { t: '—', rule: '', cls: 'ping' };
    if (s === g) return { t: '平', rule: '星同宫', cls: 'ping' };
    if (WX_SHENG[g] === s) return { t: '庙', rule: '宫生星', cls: 'miao' };
    if (WX_KE[s] === g) return { t: '旺', rule: '星克宫', cls: 'wang' };
    if (WX_KE[g] === s) return { t: '落', rule: '宫克星', cls: 'luo' };
    return { t: '陷', rule: '星生宫', cls: 'xian' };
  }

  window.TGData = {
    GAN: GAN,
    ZHI: ZHI,
    GAN_YINYANG: GAN_YINYANG,
    LUNAR_INFO: LUNAR_INFO,
    LUNAR_MONTH_NAME: LUNAR_MONTH_NAME,
    LUNAR_DAY_NAME: LUNAR_DAY_NAME,
    MANSIONS: MANSIONS,
    CI: CI,
    XIU_CUM: XIU_CUM,
    CI_SEQ: CI_SEQ,
    PLANETS: PLANETS,
    ZODIAC: ZODIAC,
    ZODIAC_ZHI: ZODIAC_ZHI,
    TERMS: TERMS,
    BODY_WX: BODY_WX,
    ZHI_WX: ZHI_WX,
    miaoWang: miaoWang
  };
})();
