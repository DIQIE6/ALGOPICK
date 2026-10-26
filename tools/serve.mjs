#!/usr/bin/env node
/**
 * AlgoPick · 本地服务（静态托管 + AI 代理）
 *
 *   node tools/serve.mjs
 *   → http://127.0.0.1:8787
 *
 * 端口被占用时：
 *   · 如果占用者就是另一个 AlgoPick —— 直接告诉你打开那个地址，不再报错
 *   · 如果是别的程序 —— 自动往后找一个空闲端口（8787→8796），并打印真实地址
 *   · 也可以用 node tools/serve.mjs --port 9000 手动指定
 *
 * 可选环境变量：
 *   ALGOPICK_PORT   端口，默认 8787
 *   ALGOPICK_BASE   AI 服务地址，默认 https://api.deepseek.com/v1
 *   ALGOPICK_MODEL  默认模型，默认 deepseek-chat
 *   ALGOPICK_API_KEY / DEEPSEEK_API_KEY / OPENAI_API_KEY
 *                   —— 设置后页面里就不用再填 Key 了
 *
 * 安全：只监听 127.0.0.1，不对外网开放；路径穿越已拦截。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStatement, translateText } from './statements.mjs';
import { renderTexSVG, latexAvailable, texCacheStats } from './latex.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';

/* ---- 端口参数 ---- */
const argv = process.argv.slice(2);
if (argv.includes('-h') || argv.includes('--help')) {
  console.log(`用法: node tools/serve.mjs [--port 8787] [--stop]

  --port N     指定端口（默认 8787，也可以用环境变量 ALGOPICK_PORT）
  --stop       停掉正在这个端口上运行的 AlgoPick（找不到就什么都不做）

  端口被占用时：若是另一个 AlgoPick，会直接提示你打开它；否则自动往后找空闲端口。
`);
  process.exit(0);
}
const portIdx = argv.indexOf('--port');
const PORT_ARG = portIdx >= 0 ? argv[portIdx + 1] : (process.env.ALGOPICK_PORT || '');
const PORT = Number(PORT_ARG || 8787);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('端口不合法: ' + PORT_ARG + '（应为 1~65535 的整数）');
  process.exit(1);
}
const PORT_EXPLICIT = !!(PORT_ARG || process.env.ALGOPICK_PORT);

const DEF_BASE = process.env.ALGOPICK_BASE || 'https://api.deepseek.com/v1';
const DEF_MODEL = process.env.ALGOPICK_MODEL || 'deepseek-chat';
const ENV_KEY = process.env.ALGOPICK_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json'
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT)) return send(res, 403, 'forbidden');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'not found: ' + rel, { 'Content-Type': 'text/plain; charset=utf-8' });
    send(res, 200, buf, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  });
}

function readBody(req, limit = 1024 * 512) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const chunks = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function llmProxy(req, res) {
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, 400, JSON.stringify({ error: { message: '请求体不是合法 JSON: ' + e.message } }), { 'Content-Type': 'application/json' }); }

  const base = String(payload.baseUrl || DEF_BASE).replace(/\/+$/, '');
  const key = payload.apiKey || ENV_KEY;
  const model = payload.model || DEF_MODEL;
  if (!key) {
    return send(res, 400, JSON.stringify({
      error: { message: '没有可用的 API Key。请在网页「AI 设置」里填写，或启动前设置环境变量 ALGOPICK_API_KEY。' }
    }), { 'Content-Type': 'application/json' });
  }

  const body = { model, messages: payload.messages || [], temperature: payload.temperature == null ? 0.4 : payload.temperature, stream: false };
  const t0 = Date.now();
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    console.log(`[llm] ${r.status} ${model} ${Date.now() - t0}ms`);
    send(res, r.status, text, { 'Content-Type': 'application/json; charset=utf-8' });
  } catch (e) {
    console.error('[llm] 代理失败:', e.message);
    send(res, 502, JSON.stringify({ error: { message: '代理请求失败: ' + e.message } }), { 'Content-Type': 'application/json' });
  }
}

/* ---------- 题干抓取 / 翻译 ---------- */

const CACHE_FILE = path.join(ROOT, 'data', 'stmt-cache.json');
let stmtCache = {};
try { if (fs.existsSync(CACHE_FILE)) stmtCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { stmtCache = {}; }

let saveTimer = null;
function scheduleCacheSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(stmtCache), 'utf8');
      // 同时写一份浏览器能直接 <script> 加载的版本：
      // 凡是抓过的题，下次打开页面就离线可用了
      const entries = Object.keys(stmtCache).map((k) => {
        const v = stmtCache[k];
        // [显示用的中文题干, 来源, 自动抓取的原始版本(被手动改过时才有)]
        const arr = v.auto ? [v.text, v.from, v.auto] : [v.text, v.from];
        return JSON.stringify(k) + ':' + JSON.stringify(arr);
      });
      fs.writeFileSync(path.join(ROOT, 'data', 'stmt-cache.js'),
        '/* AlgoPick 题干缓存 —— 由 tools/serve.mjs 自动生成（抓过的题会自动变成离线题库）\n' +
        ' * 生成时间: ' + new Date().toISOString() + '   条目: ' + entries.length + ' */\n' +
        'window.STMT_CACHE = {\n' + entries.join(',\n') + '\n};\n', 'utf8');
    } catch (e) { console.error('[stmt] 缓存写入失败:', e.message); }
  }, 2000);
}

const inflight = new Map();

/** 网页里配的 AI 优先，其次环境变量 */
function pickAI(p) {
  return (p && p.apiKey)
    ? { baseUrl: p.baseUrl || DEF_BASE, apiKey: p.apiKey, model: p.model || DEF_MODEL }
    : (ENV_KEY ? { baseUrl: DEF_BASE, apiKey: ENV_KEY, model: DEF_MODEL } : null);
}

async function statementHandler(p, res) {
  const id = String(p.id || '').trim();
  const link = String(p.url || '').trim();
  if (!id && !link) return send(res, 400, JSON.stringify({ ok: false, error: '缺少 id 或 url' }), { 'Content-Type': 'application/json' });

  const key = id || link;
  if (stmtCache[key] && stmtCache[key].text) {
    return send(res, 200, JSON.stringify({ ok: true, text: stmtCache[key].text, from: stmtCache[key].from, cached: true }), { 'Content-Type': 'application/json' });
  }
  if (inflight.has(key)) {
    const r = await inflight.get(key);
    return send(res, 200, JSON.stringify(r), { 'Content-Type': 'application/json' });
  }

  // 网页里配的 AI 优先，其次环境变量
  const ai = pickAI(p.ai);

  const t0 = Date.now();
  const task = (async () => {
    try {
      const r = await getStatement({ id, url: link }, { ai, preferAI: !!ai, log: (c) => process.stdout.write(c) });
      process.stdout.write('\n');
      if (r.ok && r.text) {
        stmtCache[key] = { text: r.text, from: r.from, at: Date.now() };
        scheduleCacheSave();
        console.log(`[stmt] ${key} <- ${r.from} ${r.text.length}字 翻译=${!!r.translated} ${Date.now() - t0}ms`);
        return { ok: true, text: r.text, from: r.from, translated: r.translated, note: r.note };
      }
      console.log(`[stmt] ${key} 失败 ${Date.now() - t0}ms :: ${(r.tried || []).join(' | ')}`);
      return { ok: false, error: r.error || '抓取失败', tried: r.tried };
    } catch (e) {
      console.error('[stmt] 异常:', e.message);
      return { ok: false, error: e.message };
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, task);
  const out = await task;
  send(res, out.ok ? 200 : 502, JSON.stringify(out), { 'Content-Type': 'application/json; charset=utf-8' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/llm' || url.pathname === '/api/chat') {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method !== 'POST') return send(res, 405, 'POST only');
    return llmProxy(req, res);
  }
  if (url.pathname === '/api/statement') {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method === 'GET') {
      return statementHandler({ id: url.searchParams.get('id'), url: url.searchParams.get('url') }, res);
    }
    if (req.method !== 'POST') return send(res, 405, 'GET/POST only');
    return readBody(req).then((b) => {
      let p;
      try { p = JSON.parse(b || '{}'); } catch { p = {}; }
      return statementHandler(p, res);
    }).catch((e) => send(res, 400, JSON.stringify({ ok: false, error: e.message }), { 'Content-Type': 'application/json' }));
  }
  if (url.pathname === '/api/translate') {
    // 已经拿到英文原文（自动抓到的，或用户手动粘贴的）→ 只做翻译
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method !== 'POST') return send(res, 405, 'POST only');
    return readBody(req).then(async (b) => {
      let p;
      try { p = JSON.parse(b || '{}'); } catch { p = {}; }
      const text = String(p.text || '').trim();
      const J = { 'Content-Type': 'application/json; charset=utf-8' };
      if (!text) return send(res, 400, JSON.stringify({ ok: false, error: '缺少 text' }), J);
      const ai = pickAI(p.ai);
      const t0 = Date.now();
      try {
        const r = await translateText(text, ai, (c) => process.stdout.write(c));
        process.stdout.write('\n');
        console.log(`[translate] ${text.length}字 -> ${r.from} ${Date.now() - t0}ms`);
        // 带上题号的话，顺手存进离线题库（data/stmt-cache.js）
        const id = String(p.id || '').trim();
        if (id && r.text) {
          stmtCache[id] = { text: r.text, from: (p.from ? p.from + '+' : '') + r.from, at: Date.now() };
          scheduleCacheSave();
        }
        return send(res, 200, JSON.stringify({ ok: true, text: r.text, from: r.from }), J);
      } catch (e) {
        console.error('[translate] 失败:', e.message);
        return send(res, 502, JSON.stringify({ ok: false, error: e.message }), J);
      }
    }).catch((e) => send(res, 400, JSON.stringify({ ok: false, error: e.message }), { 'Content-Type': 'application/json' }));
  }
  if (url.pathname === '/api/tex') {
    // 用本机 LaTeX 把公式渲染成 SVG（结果按公式哈希缓存，同一公式只编译一次）
    const J = { 'Content-Type': 'application/json; charset=utf-8' };
    if (!latexAvailable()) {
      return send(res, 503, JSON.stringify({ ok: false, error: '本机没有找到 latex / dvisvgm，无法用 LaTeX 渲染' }), J);
    }
    if (req.method === 'GET') {
      const tex = Buffer.from(url.searchParams.get('f') || '', 'base64url').toString('utf8');
      return renderTexSVG(tex, url.searchParams.get('d') === '1')
        .then((r) => send(res, 200, r.svg, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'max-age=86400' }))
        .catch((e) => send(res, 400, e.message, { 'Content-Type': 'text/plain; charset=utf-8' }));
    }
    if (req.method !== 'POST') return send(res, 405, 'GET/POST only');
    return readBody(req).then(async (b) => {
      let p;
      try { p = JSON.parse(b || '{}'); } catch { p = {}; }
      if (!p.tex) return send(res, 400, JSON.stringify({ ok: false, error: '缺少 tex' }), J);
      const t0 = Date.now();
      try {
        const r = await renderTexSVG(String(p.tex), !!p.display);
        process.stdout.write('\n');
        console.log(`[tex] ${String(p.tex).slice(0, 40)} ${r.cached ? 'cache' : (Date.now() - t0) + 'ms'}`);
        return send(res, 200, JSON.stringify({ ok: true, svg: r.svg, cached: r.cached }), J);
      } catch (e) {
        console.error('[tex] 失败:', e.message);
        return send(res, 400, JSON.stringify({ ok: false, error: e.message }), J);
      }
    }).catch((e) => send(res, 400, JSON.stringify({ ok: false, error: e.message }), J));
  }
  if (url.pathname === '/api/save-statement') {
    // 用户手动修改译文后保存：写进缓存，同时成为离线题库的一部分
    if (req.method !== 'POST') return send(res, 405, 'POST only');
    return readBody(req).then(async (b) => {
      let p;
      try { p = JSON.parse(b || '{}'); } catch { p = {}; }
      const J = { 'Content-Type': 'application/json; charset=utf-8' };
      const id = String(p.id || '').trim();
      const text = String(p.text || '').trim();
      if (!id || !text) return send(res, 400, JSON.stringify({ ok: false, error: '缺少 id 或 text' }), J);
      const prev = stmtCache[id];
      stmtCache[id] = {
        text,
        from: String(p.from || (prev && prev.from) || 'manual'),
        at: Date.now(),
        auto: (prev && prev.auto) || (prev && prev.text) || undefined
      };
      scheduleCacheSave();
      console.log(`[save-stmt] ${id} 用户修改 ${text.length} 字`);
      return send(res, 200, JSON.stringify({ ok: true }), J);
    }).catch((e) => send(res, 400, JSON.stringify({ ok: false, error: e.message }), { 'Content-Type': 'application/json' }));
  }
  if (url.pathname === '/api/shutdown') {
    // 只可能来自本机（服务只监听 127.0.0.1），用于 node tools/serve.mjs --stop
    if (req.method !== 'POST') return send(res, 405, 'POST only');
    send(res, 200, JSON.stringify({ ok: true, bye: true }), { 'Content-Type': 'application/json' });
    console.log('\n收到停止请求，正在退出…');
    setTimeout(() => process.exit(0), 150);
    return;
  }
  if (url.pathname === '/api/health') {
    return send(res, 200, JSON.stringify({ ok: true, app: 'algopick', base: DEF_BASE, model: DEF_MODEL, hasEnvKey: !!ENV_KEY, statementCache: Object.keys(stmtCache).length, latex: latexAvailable(), texCache: texCacheStats().count }), { 'Content-Type': 'application/json' });
  }
  serveStatic(req, res);
});

/* ---------- 启动：端口被占用时给出人话提示 ---------- */

/** 探测这个端口上跑的到底是不是 AlgoPick */
async function probeAlgoPick(port) {
  try {
    const r = await fetch(`http://${HOST}:${port}/api/health`, { signal: AbortSignal.timeout(1500) });
    const j = await r.json();
    return !!(j && j.ok && j.app === 'algopick');
  } catch { return false; }
}

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const onErr = (e) => { server.removeListener('listening', onOk); reject(e); };
    const onOk = () => { server.removeListener('error', onErr); resolve(port); };
    server.once('error', onErr);
    server.once('listening', onOk);
    server.listen(port, HOST);
  });
}

function banner(port) {
  const u = `http://${HOST}:${port}`;
  console.log('AlgoPick 本地服务已启动');
  console.log('  打开：  ' + u);
  console.log('  AI：    ' + DEF_BASE + '  (' + DEF_MODEL + ')' + (ENV_KEY ? '  [已从环境变量读取 Key]' : '  [需要在网页里填 Key]'));
  console.log('  LaTeX： ' + (latexAvailable()
    ? '已找到本机 latex / dvisvgm，公式可高保真渲染（已缓存 ' + texCacheStats().count + ' 个）'
    : '未找到 latex / dvisvgm，公式将用内置 KaTeX 渲染'));
  console.log('  停止：  Ctrl+C   （或另开一个窗口跑 node tools/serve.mjs --stop）');
}

async function start() {
  // --stop：把已经在跑的 AlgoPick 停掉
  if (argv.includes('--stop')) {
    for (let p = PORT; p < PORT + 10; p++) {
      if (!(await probeAlgoPick(p))) continue;
      try {
        await fetch(`http://${HOST}:${p}/api/shutdown`, { method: 'POST', signal: AbortSignal.timeout(3000) });
        console.log(`已停止 http://${HOST}:${p} 上的 AlgoPick 服务。`);
      } catch (e) {
        console.error(`停止失败：${e.message}（可以直接关掉那个终端窗口，或用任务管理器结束 node 进程）`);
        process.exit(1);
      }
      return;
    }
    console.log(`在 ${PORT}~${PORT + 9} 上没有找到正在运行的 AlgoPick。`);
    return;
  }

  if (PORT_EXPLICIT) {
    // 明确指定了端口：占用就直说，不要自作主张换
    if (await probeAlgoPick(PORT)) {
      console.log(`端口 ${PORT} 上已经有一个 AlgoPick 在跑了，不用再启动一次。`);
      console.log('直接打开： http://' + HOST + ':' + PORT);
      console.log('（想重启就先在原来那个窗口按 Ctrl+C）');
      return;
    }
    try { await tryListen(PORT); banner(PORT); }
    catch (e) {
      if (e.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 被别的程序占用了。换个端口再试： node tools/serve.mjs --port ${PORT + 1}`);
        process.exit(1);
      }
      throw e;
    }
    return;
  }

  // 默认端口：先看是不是自己在跑，否则自动往后找空闲端口
  for (let p = PORT; p < PORT + 10; p++) {
    if (await probeAlgoPick(p)) {
      console.log(`AlgoPick 已经在 http://${HOST}:${p} 运行了，不用再启动一次。`);
      console.log('直接打开： http://' + HOST + ':' + p);
      console.log('（想重启就先在原来那个窗口按 Ctrl+C）');
      return;
    }
    try {
      await tryListen(p);
      if (p !== PORT) console.log(`（端口 ${PORT} 被占用，已自动改用 ${p}）`);
      banner(p);
      return;
    } catch (e) {
      if (e.code !== 'EADDRINUSE') throw e;
      // 继续试下一个端口
    }
  }
  console.error(`端口 ${PORT}~${PORT + 9} 都被占用了，请手动指定： node tools/serve.mjs --port 9000`);
  process.exit(1);
}

start().catch((e) => {
  console.error('服务启动失败：' + e.message);
  process.exit(1);
});
