// 一次性脚本：抓取 DataV 行政区划中心点，生成 js/data/regions.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://geo.datav.aliyun.com/areas_v3/bound/';

function get(url, n = 4) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const run = () => {
      tries++;
      const req = https.get(url, { timeout: 15000 }, (res) => {
        if (res.statusCode !== 200) { res.resume(); return fail(new Error('HTTP ' + res.statusCode)); }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { fail(e); }
        });
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', (e) => fail(e));
      const fail = (e) => {
        if (tries >= n) return reject(e);
        setTimeout(run, 250 * tries);
      };
    };
    run();
  });
}

const point = (p) => {
  const c = p.center || p.centroid;
  if (!c || c.length < 2) return null;
  return [Math.round(c[0] * 1000) / 1000, Math.round(c[1] * 1000) / 1000];
};

async function features(adcode) {
  try {
    const j = await get(BASE + adcode + '_full.json');
    return (j.features || []).filter((f) => f.properties && f.properties.name);
  } catch (e) {
    return null;
  }
}

async function pool(tasks, limit = 10) {
  let idx = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (idx < tasks.length) { await tasks[idx++](); }
  }));
}

(async () => {
  console.log('fetch country...');
  const country = await get(BASE + '100000_full.json');
  const provinces = country.features.filter((f) => f.properties && f.properties.name);
  const out = {};
  const provFeat = {};

  for (const pf of provinces) {
    const pn = pf.properties.name;
    const pcode = String(pf.properties.adcode);
    out[pn] = { c: point(pf.properties), ch: {} };
    provFeat[pn] = { pcode, feats: null };
  }

  await pool(provinces.map((pf) => async () => {
    const pn = pf.properties.name;
    provFeat[pn].feats = await features(provFeat[pn].pcode);
  }), 8);

  const cityJobs = [];
  for (const pf of provinces) {
    const pn = pf.properties.name;
    const pcode = provFeat[pn].pcode;
    const cs = provFeat[pn].feats || [];
    const isMunicipality = ['110000', '120000', '310000', '500000'].includes(pcode);
    for (const cf of cs) {
      const cn = cf.properties.name;
      const pt = point(cf.properties);
      if (!pt) continue;
      const ccode = String(cf.properties.adcode);
      if (isMunicipality) {
        if (!out[pn].ch[pn]) out[pn].ch[pn] = { c: out[pn].c, ch: {} };
        out[pn].ch[pn].ch[cn] = pt;
      } else {
        if (!out[pn].ch[cn]) out[pn].ch[cn] = { c: pt, ch: {} };
        // 省直辖县级单位（如济源、仙桃）自身即末级
        if (ccode.endsWith('00') && !out[pn].ch[cn].ch['本级']) out[pn].ch[cn].ch = {};
        const target = out[pn].ch[cn];
        cityJobs.push(async () => {
          const ds = await features(ccode);
          if (!ds) return;
          for (const df of ds) {
            const dn = df.properties.name;
            const dpt = point(df.properties);
            if (dpt) target.ch[dn] = dpt;
          }
        });
      }
    }
  }

  console.log('fetch cities/districts...', cityJobs.length);
  await pool(cityJobs, 12);

  // 清理：没有区县的市，用市级中心作为唯一选项
  for (const pn of Object.keys(out)) {
    for (const cn of Object.keys(out[pn].ch)) {
      const obj = out[pn].ch[cn];
      if (!Object.keys(obj.ch).length) obj.ch[cn] = obj.c.slice();
    }
  }

  const js = '/* 行政区划中心经纬度：数据源 阿里云 DataV.GeoAtlas（GCJ-02，对真太阳时影响可忽略） */\nwindow.REGIONS = ' +
    JSON.stringify(out) + ';\n';
  const dest = path.join(__dirname, '..', 'js', 'data', 'regions.js');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, js, 'utf8');
  let p = 0, c = 0, d = 0;
  for (const k of Object.keys(out)) { p++; for (const k2 of Object.keys(out[k].ch)) { c++; d += Object.keys(out[k].ch[k2].ch).length; } }
  console.log('written', (js.length / 1024).toFixed(1) + 'KB', '省', p, '市', c, '区县', d);
})();
