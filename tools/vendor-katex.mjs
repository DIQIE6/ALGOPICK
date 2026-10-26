#!/usr/bin/env node
/**
 * AlgoPick · 把 KaTeX 下载到本地（离线渲染 LaTeX 公式用）
 *
 *   node tools/vendor-katex.mjs
 *
 * 产出 assets/vendor/katex/{katex.min.js, katex.min.css, fonts/*.woff2}
 * 只下 woff2 字体（KaTeX 的 CSS 把 woff2 放在 src 第一位，浏览器会优先用它）。
 * 下过一次就不用再下，index.html 直接引用本地文件，不依赖 CDN。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'assets', 'vendor', 'katex');
const VER = process.env.KATEX_VERSION || '0.16.11';
const BASE = `https://cdn.jsdelivr.net/npm/katex@${VER}/dist`;

const FONTS = [
  'KaTeX_AMS-Regular', 'KaTeX_Caligraphic-Bold', 'KaTeX_Caligraphic-Regular',
  'KaTeX_Fraktur-Bold', 'KaTeX_Fraktur-Regular', 'KaTeX_Main-Bold', 'KaTeX_Main-BoldItalic',
  'KaTeX_Main-Italic', 'KaTeX_Main-Regular', 'KaTeX_Math-BoldItalic', 'KaTeX_Math-Italic',
  'KaTeX_SansSerif-Bold', 'KaTeX_SansSerif-Italic', 'KaTeX_SansSerif-Regular',
  'KaTeX_Script-Regular', 'KaTeX_Size1-Regular', 'KaTeX_Size2-Regular', 'KaTeX_Size3-Regular',
  'KaTeX_Size4-Regular', 'KaTeX_Typewriter-Regular',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function grab(rel, tries = 5) {
  const url = `${BASE}/${rel}`;
  for (let i = 1; i <= tries; i++) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 40000);
      let r;
      try { r = await fetch(url, { signal: c.signal }); } finally { clearTimeout(t); }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 200) throw new Error('内容过小 (' + buf.length + ' 字节)');
      const file = path.join(DEST, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buf);
      return buf.length;
    } catch (e) {
      if (i === tries) throw new Error(rel + ' 下载失败: ' + e.message);
      await sleep(1200 * i);
    }
  }
}

(async () => {
  console.log(`下载 KaTeX ${VER} → ${path.relative(ROOT, DEST)}/`);
  const want = ['katex.min.js', 'katex.min.css', ...FONTS.map((f) => 'fonts/' + f + '.woff2')];
  let total = 0, skipped = 0;
  for (const rel of want) {
    const file = path.join(DEST, rel);
    if (fs.existsSync(file) && fs.statSync(file).size > 200) { total += fs.statSync(file).size; skipped++; continue; }
    const n = await grab(rel);
    total += n;
    process.stdout.write(`\r  ${rel}  ${(n / 1024).toFixed(1)} KB        \n`);
  }
  console.log(`\n✓ ${want.length} 个文件就绪（跳过已存在 ${skipped} 个），共 ${(total / 1024 / 1024).toFixed(2)} MB`);
  console.log('现在 index.html 会用本地 KaTeX 渲染 $...$ / $$...$$ 公式，不需要联网也不需要 CDN。');
})().catch((e) => { console.error('\n❌ ' + e.message); process.exit(1); });
