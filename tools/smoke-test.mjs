#!/usr/bin/env node
/**
 * AlgoPick · 冒烟测试（真实浏览器，无第三方依赖）
 *
 *   node tools/smoke-test.mjs
 *
 * 用 Edge/Chrome 的 headless 模式打开 index.html，通过 CDP 模拟真实操作：
 * 抽题 → 选择 → 提交 → 判分 → 下一题 → 筛选 → 进度落盘，逐项断言。
 * 需要本机装有 Edge 或 Chrome。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 默认测 file:// 打开；也可以 ALGOPICK_URL=http://127.0.0.1:8787 node tools/smoke-test.mjs
const PAGE = process.env.ALGOPICK_URL || ('file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/'));
const PORT = 9333;

const CANDIDATES = [
  process.env.ALGOPICK_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean);

const browser = CANDIDATES.find((p) => { try { return fs.existsSync(p); } catch { return false; } });
if (!browser) {
  console.log('⚠ 没找到 Edge/Chrome，跳过冒烟测试。可设置环境变量 ALGOPICK_BROWSER 指定浏览器路径。');
  process.exit(0);
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'algopick-test-'));
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--mute-audio', '--window-size=1400,1000',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, ms = 20000, step = 250) {
  const t0 = Date.now();
  for (;;) {
    try { const v = await fn(); if (v) return v; } catch { /* retry */ }
    if (Date.now() - t0 > ms) throw new Error('等待超时');
    await sleep(step);
  }
}

let ws, msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(method + ' 超时')); } }, 20000);
  });
}

async function evalJS(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('页面内异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? '  — ' + detail : ''}`);
}

(async () => {
  try {
    const ver = await waitFor(async () => (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json());
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === 'page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const { resolve, reject } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    const errors = [];
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        errors.push(m.params.args.map((a) => a.value || a.description).join(' '));
      }
    });

    await send('Page.navigate', { url: PAGE });
    await waitFor(() => evalJS('!!window.AlgoPick'));
    await sleep(1200);   // 让 1.2 万道题库完成归一化与首轮渲染

    console.log(`\n浏览器: ${path.basename(browser)}   页面: ${PAGE}\n`);

    /* ---- 1. 题库加载 ---- */
    const stats = await evalJS('({total: AlgoPick.all().length, pool: AlgoPick.S.pool.length, shown: document.getElementById("poolInfo").textContent})');
    check('题库加载成功', stats.total > 500, `共 ${stats.total} 道，可选 ${stats.pool} 道`);

    const curated = await evalJS(`(() => {
      const withText = AlgoPick.all().filter(q => q.statement && q.statement.length > 30);
      return { n: withText.length, sample: withText.slice(0,3).map(q => q.title).join(' / ') };
    })()`);
    check('本地精选题库（带中文题干）已合并', curated.n >= 140, `${curated.n} 道，例如 ${curated.sample}`);

    const dupCheck = await evalJS(`(() => {
      const q = AlgoPick.all().find(x => x.id === 'cf-1486C1');
      return q ? !!q.statement : null;
    })()`);
    check('撞题时保留带题干的那一份', dupCheck === true, 'cf-1486C1');

    /* ---- 中文题干（非中文题目翻译/直拉） ---- */
    const stmt = await evalJS(`(() => {
      const auto = AlgoPick.all().filter(q => q.stmtFrom);
      const hasCJK = s => /[\\u4e00-\\u9fff]/.test(String(s||''));
      const bad = auto.filter(q => !hasCJK(q.statement));           // 标为中文来源却还是英文 -> 有问题
      const bySrc = {};
      auto.forEach(q => { bySrc[q.stmtFrom] = (bySrc[q.stmtFrom]||0)+1; });
      return { auto: auto.length, bad: bad.length, bySrc: JSON.stringify(bySrc),
               sample: auto.length ? auto[0].title + ' :: ' + String(auto[0].statement).slice(0,40) : '' };
    })()`);
    if (stmt.auto > 0) {
      check('自动获取的题干全部是中文（不会把英文原文当译文显示）', stmt.bad === 0, `${stmt.auto} 条，非中文 ${stmt.bad} 条 · 来源 ${stmt.bySrc}`);
      check('每条自动题干都标了来源', stmt.bySrc !== '{}', stmt.sample);
    } else {
      check('中文题干（可选，本机未抓到则为空）', true, '没有抓到题干：直接打开原站功能不受影响');
    }

    const badgeRendered = await evalJS(`(() => {
      const q = AlgoPick.all().find(x => x.stmtFrom === 'leetcode-cn') || AlgoPick.all().find(x => x.stmtFrom);
      if (!q) return 'skip';
      // 用题干里的一段独特文字定位这道题（题号 lc-3 会同时匹配 lc-30/lc-31…，不能用）
      AlgoPick.S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: String(q.statement).slice(0, 24) };
      AlgoPick.S.pool = AlgoPick.all().filter(x => x.id === q.id);
      document.querySelector('[data-act="skip"]').click();
      const rendered = AlgoPick.S.cur && AlgoPick.S.cur.id === q.id;
      if (!rendered) return 'not-rendered:' + (AlgoPick.S.cur && AlgoPick.S.cur.id);
      return (document.querySelector('.stmt-src') ? 'badge' : 'no-badge')
        + '|open=' + !!document.querySelector('[data-act="open"]');
    })()`);
    check('题干下方显示来源标记，且始终保留「打开原题」', /^badge\|open=true$/.test(badgeRendered), badgeRendered);

    const noStmtBtn = await evalJS(`(() => {
      const q = AlgoPick.all().find(x => !x.statement && x.url);
      if (!q) return 'skip';
      AlgoPick.S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: q.id };
      AlgoPick.S.pool = AlgoPick.all().filter(x => x.id === q.id);
      document.querySelector('[data-act="skip"]').click();
      return (document.querySelector('[data-act="get-stmt"]') ? 'btn' : 'no-btn') + '|' + AlgoPick.S.cur.id;
    })()`);
    check('没有题干的题给出「获取中文题干」入口', /^btn\|/.test(noStmtBtn), noStmtBtn);
    await evalJS('document.getElementById("btnResetFilter").click()');   // 恢复全量题库再继续后续测试

    /* ---- 2. 首题渲染 ---- */
    const opts = await evalJS('document.querySelectorAll("[data-opt]").length');
    check('渲染出选择题选项', opts >= 4 && opts <= 9, `${opts} 个选项`);
    const srcs = await evalJS('Array.from(new Set(AlgoPick.all().map(q=>q.src))).join(",")');
    check('多来源题库合并', srcs.split(',').length >= 2, srcs);

    /* ---- 3. 选对 -> 完全正确 ---- */
    const right = await evalJS(`(() => {
      const q = AlgoPick.S.cur;
      document.querySelectorAll('[data-opt]').forEach(el => {
        if (q.answer.includes(el.dataset.opt)) el.click();
      });
      document.querySelector('[data-act="submit"]').click();
      return { verdict: document.querySelector('.verdict').textContent.trim(),
               hasExplain: !!document.querySelector('.explain, .cues'),
               id: q.id, answer: q.answer };
    })()`);
    check('选对判为「完全正确」', right.verdict.includes('完全正确'), right.verdict);
    check('答后给出解析/识别信号', right.hasExplain, `题号 ${right.id} 答案 ${right.answer}`);

    /* ---- 4. 进度落盘 ---- */
    const saved = await evalJS(`JSON.parse(localStorage.getItem('algopick.v1.progress')||'{}')['${right.id}']`);
    check('进度写入 localStorage', !!saved && saved.seen === 1 && saved.correct === 1, JSON.stringify(saved));

    /* ---- 5. 下一题 ---- */
    const nextId = await evalJS(`(() => { document.querySelector('[data-act="next"]').click(); return AlgoPick.S.cur.id; })()`);
    check('可以进入下一题', !!nextId && nextId !== right.id, `${right.id} → ${nextId}`);
    const cleared = await evalJS('document.querySelectorAll(".opt.sel").length');
    check('新题清空上次选择', cleared === 0);

    /* ---- 6. 选错 -> 判为错误 ---- */
    const wrong = await evalJS(`(() => {
      const q = AlgoPick.S.cur, bad = q.answer.concat(q.alternatives);
      const opts = Array.from(document.querySelectorAll('[data-opt]'));
      const el = opts.find(e => !bad.includes(e.dataset.opt));
      if (!el) return { noDecoy: true, n: opts.length, answer: q.answer };
      el.click();
      const selected = AlgoPick.S.selected.slice();
      document.querySelector('[data-act="submit"]').click();
      const v = document.querySelector('.verdict');
      return { selected, verdict: v ? v.textContent.trim() : null };
    })()`);
    check('选错判为不正确', !wrong.noDecoy && wrong.verdict && wrong.verdict.includes('不对'), JSON.stringify(wrong));

    /* ---- 7. 不会，看答案 ---- */
    const revealed = await evalJS(`(() => {
      document.querySelector('[data-act="next"]').click();
      document.querySelector('[data-act="reveal"]').click();
      return document.querySelector('.verdict').textContent.trim() + '|' +
             document.querySelectorAll('.opt.right').length;
    })()`);
    check('「不会看答案」直接揭示正解', revealed.includes('看答案') && !revealed.endsWith('|0'), revealed);

    /* ---- 8. 快捷键 ---- */
    const keyOk = await evalJS(`(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
      const before = AlgoPick.S.cur.id;
      document.dispatchEvent(new KeyboardEvent('keydown', {key:'1', bubbles:true}));
      const sel = document.querySelectorAll('.opt.sel').length;
      return { sel, before, after: AlgoPick.S.cur.id };
    })()`);
    check('键盘 1 选择 / Enter 进入下一题', keyOk.sel === 1, JSON.stringify(keyOk));

    /* ---- 9. 筛选 ---- */
    const filt = await evalJS(`(() => {
      const chip = Array.from(document.querySelectorAll('#fDiff .chip')).find(c => c.dataset.val === 'hard');
      chip.click();
      return { pool: AlgoPick.S.pool.length, allHard: AlgoPick.S.pool.every(q => q.difficulty === 'hard') };
    })()`);
    check('按难度筛选生效', filt.allHard && filt.pool > 0, `hard ${filt.pool} 道`);

    const tagFilt = await evalJS(`(() => {
      document.getElementById('btnResetFilter').click();
      const chip = Array.from(document.querySelectorAll('#fTag .chip')).find(c => c.dataset.val === 'dsu');
      if (!chip) return { skip: true };
      chip.click();
      return { pool: AlgoPick.S.pool.length, allDsu: AlgoPick.S.pool.every(q => q.answer.includes('dsu')) };
    })()`);
    check('按知识点筛选生效', tagFilt.skip || (tagFilt.allDsu && tagFilt.pool > 0), JSON.stringify(tagFilt));

    /* ---- 10. 导入自定义题库 ---- */
    const imp = await evalJS(`(() => {
      const bank = [{title:'测试题', statement:'给定一个数组，找出出现次数超过一半的元素，要求 O(1) 额外空间。', answer:['摩尔投票'], difficulty:'easy', explain:'摩尔投票法'}];
      window.BANK_A = (window.BANK_A||[]).concat(bank);
      document.getElementById('pasteImport').value = JSON.stringify(bank);
      document.getElementById('doImport').click();
      const q = AlgoPick.all().find(x => x.title === '测试题');
      return { found: !!q, norm: q && q.answer };
    })()`);
    check('中文知识点名自动映射并导入', imp.found && imp.norm[0] === 'moore-vote', JSON.stringify(imp));

    /* ---- 讲解版块 ---- */
    const learnData = await evalJS(`(() => {
      const L = AlgoPick.learn();
      const ids = Object.keys(L);
      const bad = ids.filter(id => !(L[id].ops||[]).length || !L[id].template || !(L[id].links||[]).length);
      const links = ids.reduce((s,id) => s + (L[id].links||[]).length, 0);
      const ops = ids.reduce((s,id) => s + (L[id].ops||[]).length, 0);
      const nonPython = ids.filter(id => !/def |for |while |return |=/.test(String(L[id].template)));
      return { ids: ids.length, ops, links, bad: bad.length, nonPython: nonPython.length };
    })()`);
    check('讲解数据覆盖全部知识点', learnData.ids === 72 && learnData.bad === 0,
      `${learnData.ids} 个知识点 · ${learnData.ops} 条基本操作 · ${learnData.links} 个学习链接`);
    check('每个知识点都有 Python 模板', learnData.nonPython === 0, `不像代码的模板 ${learnData.nonPython} 个`);

    const tab = await evalJS(`(() => {
      document.getElementById('tabLearn').click();
      const on = document.getElementById('viewLearn').style.display !== 'none';
      const off = document.getElementById('viewPractice').style.display === 'none';
      const items = document.querySelectorAll('#learnList .learn-item').length;
      const tools = document.getElementById('practiceTools').style.display;
      return { on, off, items, tools };
    })()`);
    check('讲解是网页内的独立版块（标签切换）', tab.on && tab.off && tab.items >= 70 && tab.tools === 'none',
      `列表 ${tab.items} 项，切到讲解时练习工具隐藏`);

    const detail = await evalJS(`(() => {
      const it = document.querySelector('#learnList [data-learn-item="dijkstra"]');
      it.click();
      return {
        title: (document.querySelector('#learnMain h2')||{}).textContent,
        secs: document.querySelectorAll('#learnMain .learn-sec').length,
        ops: document.querySelectorAll('#learnMain .learn-op').length,
        codes: document.querySelectorAll('#learnMain pre.code').length,
        links: document.querySelectorAll('#learnMain .learn-link').length,
        allCode: Array.from(document.querySelectorAll('#learnMain pre.code')).map(x => x.textContent).join('\\n---\\n')
      };
    })()`);
    check('讲解详情：基本操作 / Python 实现 / 应用 / 链接齐全',
      detail.title === '最短路 Dijkstra' && detail.secs >= 5 && detail.ops >= 4 && detail.codes >= 5 && detail.links >= 3,
      `${detail.title}：章节${detail.secs} 操作${detail.ops} 代码块${detail.codes} 链接${detail.links}`);
    check('模板确实是 Python', /def /.test(detail.allCode) && /import |heapq/.test(detail.allCode),
      (detail.allCode.match(/def [a-z_]+\(/) || [''])[0]);

    const jump = await evalJS(`(() => {
      document.getElementById('tabPractice').click();
      const q = AlgoPick.S.cur;
      document.querySelectorAll('[data-opt]').forEach(el => { if (q.answer.includes(el.dataset.opt)) el.click(); });
      document.querySelector('[data-act="submit"]').click();
      const pill = document.querySelector('.pill[data-learn]');
      if (!pill) return { err: '结果里没有算法名' };
      const want = pill.textContent.trim();
      pill.click();
      return { want, shown: document.getElementById('viewLearn').style.display !== 'none',
               title: (document.querySelector('#learnMain h2')||{}).textContent };
    })()`);
    check('点算法名直接跳转到对应讲解', jump.shown && jump.title === jump.want, `${jump.want} → ${jump.title}`);

    const search = await evalJS(`(() => {
      const inp = document.getElementById('learnSearch');
      inp.value = 'dijkstra';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      return new Promise(r => setTimeout(() => r(document.querySelectorAll('#learnList .learn-item').length), 250));
    })()`);
    check('讲解列表可以搜索', search >= 1 && search <= 5, `搜 "dijkstra" 命中 ${search} 项`);

    /* ---- 输入框可读性（之前讲解区搜索框是浏览器默认样式，字看不清） ---- */
    const inputStyle = await evalJS(`(() => {
      const body = getComputedStyle(document.body).color;
      const ids = ['learnSearch', 'aiBase', 'fSearch'];
      const rows = ids.map(id => {
        const el = document.getElementById(id);
        if (!el) return id + ':missing';
        const cs = getComputedStyle(el);
        return { id, color: cs.color, bg: cs.backgroundColor, sameAsBody: cs.color === body };
      });
      return rows;
    })()`);
    const badInput = inputStyle.filter(r => typeof r === 'string' || !r.sameAsBody || /rgba\(0, 0, 0, 0\)/.test(r.bg));
    check('输入框文字颜色可见（不会白字白底）', badInput.length === 0,
      inputStyle.map(r => typeof r === 'string' ? r : `${r.id}=${r.color}/${r.bg}`).join('  '));

    /* ---- 没有题干时的两个入口 ---- */
    const stmtUI = await evalJS(`(() => {
      const q = AlgoPick.all().find(x => !x.statement && x.url);
      AlgoPick.S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: q.id };
      AlgoPick.S.pool = AlgoPick.all().filter(x => x.id === q.id);
      document.querySelector('[data-act="skip"]').click();
      const cur = AlgoPick.S.cur.id;
      const hasFetch = !!document.querySelector('[data-act="get-stmt"]');
      const hasPaste = !!document.querySelector('[data-act="paste-stmt"]');
      const wrapBefore = document.getElementById('stmtPasteWrap');
      const pasteBtn = document.querySelector('[data-act="paste-stmt"]');
      pasteBtn.click();
      const wrapAfter = document.getElementById('stmtPasteWrap');
      const afterDisplay = wrapAfter ? wrapAfter.style.display : null;   // 必须在点「取消」之前读
      const sameNode = wrapBefore === wrapAfter;
      const btn = document.querySelector('[data-act="cancel-paste"]');
      if (btn) btn.click();
      const wrapClosed = document.getElementById('stmtPasteWrap');
      const closedDisplay = wrapClosed ? wrapClosed.style.display : null;
      document.querySelector('[data-act="reveal"]').click();
      const revealed = !!document.querySelector('.verdict');
      return { cur, hasFetch, hasPaste, sameNode, revealed,
        before: wrapBefore ? wrapBefore.style.display : null,
        after: afterDisplay, closed: closedDisplay };
    })()`);
    check('没题干时提供「抓取并翻译」和「粘贴英文题干」两个入口',
      stmtUI.hasFetch && stmtUI.hasPaste && stmtUI.after === 'block' && stmtUI.closed === 'none',
      `抓取=${stmtUI.hasFetch} 粘贴=${stmtUI.hasPaste} 展开=${stmtUI.after} 收起=${stmtUI.closed} 同节点=${stmtUI.sameNode} 委托可用=${stmtUI.revealed}`);

    /* ---- 单独翻译英文原文（需要本地服务） ---- */
    if (String(PAGE).startsWith('http')) {
      const tr = await evalJS(`fetch('/api/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Given an array of integers, return the maximum subarray sum and its length.' })
      }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) }))`);
      check('英文原文能单独交给翻译（AI 或机翻）',
        !!(tr && tr.ok && /[\u4e00-\u9fff]/.test(tr.text)),
        tr && tr.ok ? `来源=${tr.from} → ${String(tr.text).slice(0, 50)}` : (tr && tr.error));
    } else {
      check('单独翻译英文原文（需本地服务，file:// 下跳过）', true, '跳过一次');
    }
    await evalJS('document.getElementById("btnResetFilter").click()');

    /* ---- 公式渲染 + 手动修改题干 ---- */
    const mathBank = JSON.stringify([{
      id: 'smoke-test-formula',
      title: '公式渲染测试题',
      statement: '给定 $n$ 个整数，求 $\\sum_{i=1}^{n} a_i^2$ 的最小值，要求 $O(n\\log n)$ 时间，其中 $1 \\le n \\le 10^5$。',
      answer: ['sort'], difficulty: 'easy',
      explain: '直接计算是 $O(n)$，排序后是 $O(n\\log n)$。'
    }]);
    const mathTest = await evalJS(`(() => {
      document.getElementById('pasteImport').value = ${JSON.stringify(mathBank)};
      document.getElementById('doImport').click();
      const q = AlgoPick.all().find(x => x.title === '公式渲染测试题');
      if (!q) return { err: '导入失败' };
      AlgoPick.S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: q.title };
      AlgoPick.S.pool = AlgoPick.all().filter(x => x.id === q.id);
      document.getElementById('tabPractice').click();
      document.querySelector('[data-act="skip"]').click();
      const st = document.querySelector('.statement');
      return {
        id: q.id,
        katex: document.querySelectorAll('.statement .katex').length,
        rawLeft: st ? st.querySelectorAll('.tex-raw').length : -1,
        text: st ? st.textContent.trim().slice(0, 40) : ''
      };
    })()`);
    check('题干里的 LaTeX 被渲染成公式（KaTeX）',
      !mathTest.err && mathTest.katex >= 3 && mathTest.rawLeft === 0,
      `识别到 ${mathTest.katex} 个公式，残留源码 ${mathTest.rawLeft} 个 :: ${mathTest.text}`);

    const editTest = await evalJS(`(() => {
      const btn = document.querySelector('[data-act="edit-stmt"]');
      if (!btn) return { err: '没有修改按钮' };
      btn.click();
      const wrap = document.getElementById('stmtEditWrap');
      const ta = document.getElementById('stmtEdit');
      const opened = wrap.style.display === 'block' && ta.value.length > 0;
      const before = ta.value;
      ta.value = '【手动改过】' + before + ' 补充：注意 n=1 的边界。';
      document.querySelector('[data-act="save-stmt"]').click();
      const st = document.querySelector('.statement').textContent;
      const saved = JSON.parse(localStorage.getItem('algopick.v1.stmt') || '{}')[AlgoPick.S.cur.id];
      return {
        opened, beforeLen: before.length,
        after: st.trim().slice(0, 12),
        savedLen: saved ? String(saved[0]).length : 0,
        hasRestore: !!document.querySelector('[data-act="restore-stmt"]'),
        katexAfter: document.querySelectorAll('.statement .katex').length
      };
    })()`);
    check('翻译/抓取后的题干可以手动修改并保存',
      !editTest.err && editTest.opened && editTest.after.indexOf('【手动改过】') === 0 && editTest.savedLen > 0 && editTest.hasRestore,
      `编辑器打开=${editTest.opened} 保存后开头="${editTest.after}" 本地长度=${editTest.savedLen} 有恢复按钮=${editTest.hasRestore}`);
    check('手动改过的内容依然渲染公式', editTest.katexAfter >= 3, `${editTest.katexAfter} 个公式`);

    const restoreTest = await evalJS(`(() => {
      document.querySelector('[data-act="restore-stmt"]').click();
      const st = document.querySelector('.statement').textContent.trim();
      return { after: st.slice(0, 12), hasRestore: !!document.querySelector('[data-act="restore-stmt"]') };
    })()`);
    check('可以恢复成自动抓取的版本',
      restoreTest.after.indexOf('【手动改过】') !== 0 && !restoreTest.hasRestore,
      `恢复后开头="${restoreTest.after}" 恢复按钮已消失=${!restoreTest.hasRestore}`);

    if (String(PAGE).startsWith('http')) {
      const latexTest = await evalJS(`(() => new Promise(res => {
        const sel = document.getElementById('mathMode');
        sel.value = 'latex';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        const q = AlgoPick.all().find(x => x.title === '公式渲染测试题');
        AlgoPick.S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: q.title };
        AlgoPick.S.pool = AlgoPick.all().filter(x => x.id === q.id);
        document.getElementById('tabPractice').click();
        document.querySelector('[data-act="skip"]').click();
        const slots = document.querySelectorAll('.tex-slot').length;
        setTimeout(() => {
          res({ slots, svg: document.querySelectorAll('.tex-slot svg').length,
                failed: document.querySelectorAll('.tex-slot.tex-failed').length });
          const s2 = document.getElementById('mathMode');
          s2.value = 'katex'; s2.dispatchEvent(new Event('change', { bubbles: true }));
        }, 8000);
      }))()`);
      check('「本机 LaTeX」模式能把公式编译成 SVG',
        latexTest.slots >= 3 && latexTest.svg >= 3 && latexTest.failed === 0,
        `占位 ${latexTest.slots} 个 → 成功渲染 ${latexTest.svg} 个，失败 ${latexTest.failed} 个`);
    } else {
      check('「本机 LaTeX」模式（需本地服务，file:// 下跳过）', true, '跳过一次');
    }
    await evalJS('document.getElementById("btnResetFilter").click()');

    /* ---- 11. 无 JS 报错 ---- */
    check('运行期没有 JS 异常', errors.length === 0, errors.slice(0, 3).join(' | '));

    const failed = results.filter((r) => !r.ok);
    console.log(`\n${failed.length ? '❌' : '✅'} ${results.length - failed.length}/${results.length} 项通过`);
    process.exitCode = failed.length ? 1 : 0;
  } catch (e) {
    console.error('测试执行失败: ' + e.message);
    process.exitCode = 1;
  } finally {
    try { ws && ws.close(); } catch { /* ignore */ }
    proc.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
})();
