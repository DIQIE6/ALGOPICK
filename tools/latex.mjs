/**
 * AlgoPick · 用本机 LaTeX 渲染公式
 *
 *   LaTeX 源码 --latex--> DVI --dvisvgm--> SVG（只含路径，不依赖字体）
 *
 * 用在两个地方：
 *   · tools/serve.mjs 的 /api/tex 接口（网页在「本机 LaTeX」模式下调用）
 *   · 命令行自检 tools/check-latex.mjs
 *
 * 设计要点：
 *   1. 结果按 (源码 + 行内/行间) 哈希缓存到 data/tex-cache/，同一公式只编译一次。
 *   2. 编译串行执行，避免一次请求开一堆 latex 进程。
 *   3. 生成的 SVG 补上 fill="currentColor"，这样暗色主题下也看得见。
 *   4. 只允许纯排版命令，挡住 \input / \write18 这类危险命令。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, 'data', 'tex-cache');

/* ---------------- 环境探测 ---------------- */
function resolveBin(name) {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    const r = spawnSync(cmd, [name], { encoding: 'utf8', timeout: 8000, windowsHide: true });
    if (r.status === 0) {
      const first = String(r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
      if (first && fs.existsSync(first)) return first;
    }
  } catch { /* ignore */ }
  return null;
}

let _env = null;
export function latexEnv() {
  if (_env) return _env;
  const latex = resolveBin('latex');
  const dvisvgm = resolveBin('dvisvgm');
  _env = { latex, dvisvgm, ok: !!(latex && dvisvgm) };
  return _env;
}

export function latexAvailable() { return latexEnv().ok; }

/* ---------------- 安全检查 ---------------- */
const FORBIDDEN = /\\end\s*\{\s*document\s*\}|\\input\b|\\include\b|\\openout\b|\\write\b|\\read\b|\\catcode\b|\\usepackage\b|\\RequirePackage\b|\\directlua\b|\\special\b|\\immediate\b/i;

function badTex(tex) {
  if (!tex || !tex.trim()) return '公式是空的';
  if (tex.length > 1500) return '公式太长（超过 1500 字符）';
  if (FORBIDDEN.test(tex)) return '公式里含有不允许的命令';
  return null;
}

/* ---------------- 编译（串行） ---------------- */
let chain = Promise.resolve();
function serialize(fn) {
  const p = chain.then(fn, fn);
  chain = p.then(() => {}, () => {});
  return p;
}

function compile(tex, display) {
  const env = latexEnv();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'algopick-tex-'));
  try {
    // standalone + \[...\] 遇到 cases 之类环境会报错，实测 $...$ 最稳。
    // 行间公式用 $\displaystyle ...$ 拿到 display 效果；失败再退回普通 $...$。
    const wraps = display ? ['$\\displaystyle ' + tex + '$', '$' + tex + '$'] : ['$' + tex + '$'];
    let lastErr = '';
    let dvi = '';
    for (const body of wraps) {
      const doc = [
        '\\documentclass[border=1pt]{standalone}',
        '\\usepackage{amsmath,amssymb}',
        '\\begin{document}',
        body,
        '\\end{document}',
        ''
      ].join('\n');
      fs.writeFileSync(path.join(dir, 'main.tex'), doc, 'utf8');
      try { fs.rmSync(path.join(dir, 'main.dvi'), { force: true }); } catch { /* ignore */ }

      spawnSync(env.latex, ['-interaction=nonstopmode', '-halt-on-error', '-no-shell-escape', 'main.tex'],
        { cwd: dir, stdio: 'ignore', timeout: 30000, windowsHide: true });

      const out = path.join(dir, 'main.dvi');
      if (fs.existsSync(out)) { dvi = out; break; }
      let log = '';
      try { log = fs.readFileSync(path.join(dir, 'main.log'), 'utf8'); } catch { /* ignore */ }
      const line = (log.match(/^!.*$/m) || [''])[0];
      lastErr = String(line || 'latex 没有生成 dvi').slice(0, 200);
    }
    if (!dvi) throw new Error('LaTeX 编译失败: ' + lastErr);

    spawnSync(env.dvisvgm, ['--no-fonts', '--exact', '-o', 'out.svg', 'main.dvi'],
      { cwd: dir, stdio: 'ignore', timeout: 30000, windowsHide: true });
    const out = path.join(dir, 'out.svg');
    if (!fs.existsSync(out) || fs.statSync(out).size < 100) {
      throw new Error('dvisvgm 没有生成 SVG');
    }

    let svg = fs.readFileSync(out, 'utf8');
    svg = svg.replace(/<\?xml[^>]*\?>\s*/i, '').replace(/<!--[\s\S]*?-->\s*/i, '');
    // 补 currentColor：dvisvgm 不给 path 加 fill，默认是黑色，暗色主题下会看不见
    svg = svg.replace(/<svg\b/i, '<svg fill="currentColor"');
    return svg.trim();
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

function cacheKey(tex, display) {
  return crypto.createHash('sha1').update((display ? 'D' : 'I') + '\u0000' + tex).digest('hex');
}

/**
 * 渲染一段 LaTeX 为 SVG 字符串。
 * @returns {Promise<{ok:true, svg:string, cached:boolean}|never>} 失败会抛错
 */
export function renderTexSVG(tex, display = false) {
  const bad = badTex(tex);
  if (bad) return Promise.reject(new Error(bad));
  const env = latexEnv();
  if (!env.ok) return Promise.reject(new Error('本机没有找到 latex / dvisvgm'));

  const file = path.join(CACHE_DIR, cacheKey(tex, display) + '.svg');
  if (fs.existsSync(file)) {
    try { return Promise.resolve({ ok: true, svg: fs.readFileSync(file, 'utf8'), cached: true }); } catch { /* ignore */ }
  }

  return serialize(() => {
    // 排队期间可能已被别的请求写好
    if (fs.existsSync(file)) {
      try { return { ok: true, svg: fs.readFileSync(file, 'utf8'), cached: true }; } catch { /* ignore */ }
    }
    const svg = compile(tex, display);
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, svg, 'utf8');
    } catch { /* 缓存写不进去也不影响返回 */ }
    return { ok: true, svg, cached: false };
  });
}

export function texCacheStats() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return { count: 0, bytes: 0 };
    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.svg'));
    return { count: files.length, bytes: files.reduce((s, f) => s + fs.statSync(path.join(CACHE_DIR, f)).size, 0) };
  } catch { return { count: 0, bytes: 0 }; }
}
