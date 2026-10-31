// One-off helper: collects openly licensed photo candidates for each dish
// from Wikimedia Commons and Openverse, so a human can pick the right one.
import fs from 'node:fs/promises';
import sharp from 'sharp';

const UA = 'TipTopDemoImageFinder/1.0 (https://github.com/rajshaikh-ai/thetiptop-demo)';
const DISHES = {
  'chicken-dum-biryani': ['chicken dum biryani', 'hyderabadi chicken biryani'],
  'fry-chicken-biryani': ['fried chicken biryani', 'chicken 65 biryani'],
  'egg-biryani': ['egg biryani'],
  'veg-biryani': ['vegetable biryani', 'veg biryani'],
  'butter-chicken': ['butter chicken', 'murgh makhani'],
  'butter-chicken-masala': ['chicken tikka masala', 'butter chicken masala'],
  'kadhai-chicken': ['kadai chicken', 'karahi chicken'],
  'aloo-bhujia': ['aloo bhujia sabzi', 'aloo fry potato curry dry', 'aloo sabzi'],
  'aloo-chokha': ['aloo chokha', 'aloo bharta'],
  'aloo-gobi': ['aloo gobi'],
  'aloo-jeera': ['jeera aloo', 'aloo jeera'],
  'bhindi-masala': ['bhindi masala', 'okra masala'],
  'dal-makhani': ['dal makhani'],
  'malai-chaap': ['malai soya chaap', 'soya chaap gravy', 'malai chaap'],
  'masala-chaap': ['masala soya chaap', 'soya chaap curry', 'soya chaap'],
  'veg-chowmein': ['veg chowmein', 'vegetable hakka noodles', 'chow mein vegetable'],
  'chilli-paneer': ['chilli paneer'],
  'chilli-chicken': ['chilli chicken'],
  'tandoori-roti': ['tandoori roti', 'tandoori roti bread'],
  'butter-naan': ['butter naan', 'naan bread'],
  'lachha-paratha': ['lachha paratha', 'laccha paratha'],
  'jeera-rice': ['jeera rice'],
  'plain-rice': ['steamed basmati rice', 'bowl of white rice'],
  'boondi-raita': ['boondi raita'],
  'mix-raita': ['vegetable raita', 'cucumber raita'],
  'veg-thali': ['north indian veg thali', 'vegetarian thali'],
  'non-veg-thali': ['non veg thali', 'chicken thali'],
};

const OK_LICENSE = /^(cc0|pdm|public domain|cc[ -]?by(-sa)?[ -]?[\d.]*|cc[ -]?by[ -]?[\d.]*|by|by-sa)$/i;
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function commons(term) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({ action: 'query', format: 'json', generator: 'search', gsrsearch: `${term} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: '1200' }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  return Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index).map((p) => {
    const ii = p.imageinfo?.[0] || {};
    const m = ii.extmetadata || {};
    return { source: 'Wikimedia Commons', title: p.title, url: ii.thumburl || ii.url, page: ii.descriptionurl, license: strip(m.LicenseShortName?.value), author: strip(m.Artist?.value), w: ii.width, h: ii.height };
  });
}

async function openverse(term) {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}&license_type=commercial,modification&page_size=6&mature=false`;
  const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results || []).map((x) => ({ source: `Openverse (${x.source})`, title: x.title, url: x.url, page: x.foreign_landing_url, license: `CC ${x.license.toUpperCase()} ${x.license_version || ''}`.trim(), author: x.creator || 'Unknown', w: x.width, h: x.height }));
}

const out = {};
await fs.mkdir('candidates', { recursive: true });
for (const [id, terms] of Object.entries(DISHES)) {
  const seen = new Set();
  const list = [];
  for (const t of terms) {
    for (const fn of [commons, openverse]) {
      try {
        for (const c of await fn(t)) {
          if (!c.url || seen.has(c.url)) continue;
          seen.add(c.url);
          list.push(c);
        }
      } catch (e) { console.log('search failed', id, t, e.message); }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  const kept = [];
  for (const c of list) {
    if (kept.length >= 12) break;
    const lic = c.license.replace(/^CC /i, 'CC ').trim();
    if (/nc|nd/i.test(lic) || !(/cc0|pdm|public domain|cc by|cc-by|by-sa|^cc /i.test(lic))) continue;
    if (c.w && c.h && Math.min(c.w, c.h) < 480) continue;
    try {
      const r = await fetch(c.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
      if (!r.ok) continue;
      if (Number(r.headers.get('content-length') || 0) > 15e6) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const n = kept.length;
      await sharp(buf).rotate().resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(`candidates/${id}-${n}.jpg`);
      kept.push({ n, ...c, license: lic });
    } catch (e) { console.log('download failed', c.url, e.message); }
  }
  out[id] = kept;
  console.log(id, kept.length);
  await fs.writeFile('candidates/candidates.json', JSON.stringify(out, null, 2));
}
await fs.writeFile('candidates/candidates.json', JSON.stringify(out, null, 2));
