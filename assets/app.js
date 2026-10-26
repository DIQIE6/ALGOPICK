/*!
 * AlgoPick · 算法/数据结构选择训练器
 * 纯前端、可离线（file:// 直接双击打开即可用）。
 */
(function () {
  'use strict';

  /* ============================================================
   * 0. 常量与工具
   * ============================================================ */
  var PATTERNS = window.PATTERNS || [];
  var PMAP = window.PATTERN_MAP || {};
  var ALL_IDS = PATTERNS.map(function (p) { return p.id; });
  var ID_SET = ALL_IDS.reduce(function (m, id) { m[id] = 1; return m; }, {});
  var CATS = [];
  PATTERNS.forEach(function (p) { if (CATS.indexOf(p.cat) < 0) CATS.push(p.cat); });

  var DIFFS = [
    { id: 'easy', zh: '简单' },
    { id: 'medium', zh: '中等' },
    { id: 'hard', zh: '困难' }
  ];
  var STATES = [
    { id: 'all', zh: '全部' },
    { id: 'new', zh: '没做过' },
    { id: 'wrong', zh: '做错的' },
    { id: 'partial', zh: '半对的' },
    { id: 'due', zh: '该复习' },
    { id: 'mastered', zh: '已掌握' }
  ];
  var BOX_DAYS = [0, 1, 3, 7, 16, 35, 70];
  var DAY = 86400000;

  var LS_PROGRESS = 'algopick.v1.progress';
  var LS_SETTINGS = 'algopick.v1.settings';
  var LS_USERBANK = 'algopick.v1.userbank';
  var LS_STMT = 'algopick.v1.stmt';
  var STMT_CACHE_MAX = 500;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var now = function () { return Date.now(); };
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var s = {}; a.forEach(function (x) { s[x] = 1; });
    return b.every(function (x) { return s[x]; });
  }
  function toast(msg, ms) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, ms || 1900);
  }
  function readLS(k, dflt) {
    try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : dflt; } catch (e) { return dflt; }
  }
  function writeLS(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { toast('浏览器存储写入失败：' + e.message, 3200); return false; }
  }

  /* --------- 标签别名索引（支持中文名 / 英文名 / 站方标签导入） --------- */
  var ALIAS = {};
  (function () {
    function put(k, id) { if (k) ALIAS[String(k).toLowerCase().trim()] = id; }
    PATTERNS.forEach(function (p) {
      put(p.id, p.id); put(p.zh, p.id); put(p.en, p.id);
      put(p.zh.replace(/[\s\/·、,，]/g, ''), p.id);
      put(p.en.replace(/[\s\/-]/g, ''), p.id);
      (p.aliases || []).forEach(function (a) { put(a, p.id); });
    });
    // 常见站方标签兜底
    var extra = {
      'hash table': 'hash', 'hash-table': 'hash', 'hashmap': 'hash', 'map': 'hash', 'set': 'hash',
      'array': 'simulation', 'string': 'simulation', 'math': 'misc-math', 'sorting': 'sort',
      'depth-first search': 'graph-dfs', 'breadth-first search': 'graph-bfs', 'dfs': 'graph-dfs', 'bfs': 'graph-bfs',
      'dynamic programming': 'linear-dp', 'dp': 'linear-dp', 'binary search': 'binary-search',
      'two pointers': 'two-pointers', 'sliding window': 'sliding-window', 'union find': 'dsu',
      'priority queue': 'heap', 'monotonic stack': 'monotonic-stack', 'binary indexed tree': 'fenwick',
      'segment tree': 'segment-tree', 'linked list': 'linked-list', 'recursion': 'recursion',
      'backtracking': 'backtracking', 'bit manipulation': 'bit-manipulation', 'trie': 'trie',
      'topological sort': 'topological-sort', 'shortest path': 'dijkstra', 'minimum spanning tree': 'mst',
      'divide and conquer': 'divide-conquer', 'greedy': 'greedy', 'brainteaser': 'special-misc',
      'simulation': 'simulation', 'counting': 'hash', 'prefix sum': 'prefix-sum', 'matrix': 'matrix',
      'geometry': 'geometry', 'number theory': 'number-theory', 'game theory': 'game-theory',
      'probability': 'probability', 'randomized': 'randomized', 'interactive': 'interactive',
      'constructive algorithms': 'construction', 'data structures': 'ds-misc', 'graphs': 'graph-dfs',
      'trees': 'tree-traversal', 'strings': 'string-misc', 'brute force': 'enumeration',
      'meet in the middle': 'meet-in-middle', 'memoization': 'memo-search', 'queue': 'queue',
      'stack': 'stack', 'heap': 'heap', 'tree': 'tree-traversal', 'graph': 'graph-dfs',
      'binary tree': 'tree-traversal', 'binary search tree': 'bst', 'quickselect': 'quickselect',
      'moore voting': 'moore-vote', 'sweep line': 'sweep-line', 'line sweep': 'sweep-line'
    };
    Object.keys(extra).forEach(function (k) { put(k, extra[k]); });
  })();

  function normTag(t) {
    if (t == null) return null;
    var s = String(t).trim();
    if (!s) return null;
    if (ID_SET[s]) return s;
    var k = s.toLowerCase();
    if (ALIAS[k]) return ALIAS[k];
    var compact = k.replace(/[\s\/·、,，_-]/g, '');
    if (ALIAS[compact]) return ALIAS[compact];
    return null;
  }
  function normTagList(arr) {
    var out = [];
    (arr || []).forEach(function (t) { var id = normTag(t); if (id && out.indexOf(id) < 0) out.push(id); });
    return out;
  }

  /* ============================================================
   * 1. 状态
   * ============================================================ */
  var all = [];
  var byId = {};
  var progress = readLS(LS_PROGRESS, {});
  var settings = Object.assign({
    theme: 'dark', optionCount: 5, decoy: 'smart', blurTitle: false,
    sessionCap: 40, autoNext: false, autoStmt: true, mathMode: 'katex'
  }, readLS(LS_SETTINGS, {}));
  var userBank = readLS(LS_USERBANK, []);
  var stmtCache = readLS(LS_STMT, {});   // { id: [中文题干, 来源] }

  var S = {
    pool: [],
    cur: null,
    selected: [],
    revealed: false,
    myOptions: [],
    hintLevel: 0,
    lastId: null,
    session: { seen: 0, correct: 0, partial: 0, streak: 0, best: 0 },
    stmtCount: 0,
    filters: { src: {}, diff: {}, tag: {}, state: 'all', q: '' },
    sources: []
  };

  function persistSettings() { writeLS(LS_SETTINGS, settings); }
  function persistProgress() { writeLS(LS_PROGRESS, progress); }

  function rec(id) {
    if (!progress[id]) progress[id] = { seen: 0, correct: 0, partial: 0, wrong: 0, box: 0, last: 0, due: 0 };
    return progress[id];
  }

  /* ============================================================
   * 2. 题库归一化
   * ============================================================ */

  /* --------- 题干库：window.STMT_*（预取）+ localStorage（按需抓取） --------- */
  var STMT_LABEL = {
    'leetcode-cn': 'LeetCode 官方中文', 'leetcode-en': 'LeetCode 英文原文',
    'luogu': '洛谷中文翻译', 'codeforces': 'Codeforces 原文',
    'codeforces-mirror': 'Codeforces 镜像原文', 'vjudge': 'VJudge 原文'
  };
  function sourceLabel(from) {
    if (!from) return '';
    if (/\+edit$/.test(from)) return sourceLabel(from.replace(/\+edit$/, '')) + ' · 已手动修改';
    if (/\+ai$/.test(from)) return (STMT_LABEL[from.slice(0, -3)] || from.slice(0, -3)) + ' · AI 翻译';
    if (/\+mt$/.test(from)) return (STMT_LABEL[from.slice(0, -3)] || from.slice(0, -3)) + ' · 机器翻译';
    return STMT_LABEL[from] || from;
  }

  /* ============================================================
   * 2.5 数学公式渲染
   *   默认 KaTeX（本地内置，离线可用，毫秒级）
   *   可选本机 LaTeX（服务端编译成 SVG，最保真，支持 amsmath 全部环境）
   *   KaTeX 解析失败的公式会自动退回本机 LaTeX
   * ============================================================ */
  var hasKatex = typeof window.katex !== 'undefined' && typeof window.katex.renderToString === 'function';
  var texMem = {};       // "tex|display" -> svg，本次会话内已渲染过的公式
  var texSeq = 0;

  /** 把一段文本切成 [{t:'普通文本'} | {math:'公式', d:是否行间}] */
  function splitMath(text) {
    var s = String(text == null ? '' : text);
    var out = [], buf = '', i = 0, n = s.length;
    function flushMath(tex, d) {
      if (buf) { out.push({ t: buf }); buf = ''; }
      out.push({ math: tex, d: d });
    }
    while (i < n) {
      var c = s[i];
      if (c === '$' && s[i + 1] === '$') {
        var e1 = s.indexOf('$$', i + 2);
        if (e1 > i + 1 && s.slice(i + 2, e1).trim()) { flushMath(s.slice(i + 2, e1).trim(), true); i = e1 + 2; continue; }
      }
      if (c === '$') {
        var j = i + 1, close = -1;
        while (j < n) {
          if (s[j] === '\\') { j += 2; continue; }
          if (s[j] === '$') { close = j; break; }
          if (s[j] === '\n') break;             // 行内公式不跨行
          j++;
        }
        if (close > i + 1) {
          var inner = s.slice(i + 1, close);
          // 开头结尾不能是空格，避免把 "$5 和 $10" 这种当成公式
          if (inner.trim() && !/^\s/.test(inner) && !/\s$/.test(inner) && !/^\s*\$/.test(inner)) {
            flushMath(inner.trim(), false);
            i = close + 1;
            continue;
          }
        }
      }
      if (c === '\\' && (s[i + 1] === '(' || s[i + 1] === '[')) {
        var closeCh = s[i + 1] === '(' ? ')' : ']';
        var e2 = s.indexOf('\\' + closeCh, i + 2);
        if (e2 > i) { flushMath(s.slice(i + 2, e2).trim(), s[i + 1] === '['); i = e2 + 2; continue; }
      }
      buf += c; i++;
    }
    if (buf) out.push({ t: buf });
    return out;
  }

  function texSlot(tex, display) {
    texSeq++;
    var id = 'texslot-' + texSeq;
    return '<span class="tex-slot" id="' + id + '" data-tex="' + esc(tex) + '" data-d="' + (display ? 1 : 0) + '">' +
      '<code class="tex-raw">' + esc((display ? '$$' : '$') + tex + (display ? '$$' : '$')) + '</code></span>';
  }

  function renderOneMath(tex, display) {
    var mode = settings.mathMode || 'katex';
    if (mode === 'off') return '<code class="tex-raw">' + esc((display ? '$$' : '$') + tex + (display ? '$$' : '$')) + '</code>';
    if (mode === 'katex' && hasKatex) {
      try {
        return window.katex.renderToString(tex, { displayMode: !!display, throwOnError: true, strict: false });
      } catch (e) {
        // KaTeX 搞不定（自定义宏、复杂环境…）→ 留给本机 LaTeX
        return texSlot(tex, display);
      }
    }
    return texSlot(tex, display);
  }

  /** 转义 + 渲染公式，返回 HTML */
  function mathHtml(text) {
    var parts = splitMath(text);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].t !== undefined) out += esc(parts[i].t);
      else out += renderOneMath(parts[i].math, parts[i].d);
    }
    return out;
  }

  /** 把还没渲染的公式占位符交给本机 LaTeX（需要本地服务） */
  function hydrateTex() {
    var slots = $$('.tex-slot[data-tex]');
    for (var i = 0; i < slots.length; i++) {
      (function (el) {
        if (el.getAttribute('data-done')) return;
        el.setAttribute('data-done', '1');
        var tex = el.getAttribute('data-tex');
        var display = el.getAttribute('data-d') === '1';
        var key = tex + '|' + display;
        if (texMem[key]) { el.innerHTML = texMem[key]; return; }
        if (!AI.isServedLocally()) return;      // 离线时保留原始 TeX 文本，至少能读
        fetch('/api/tex', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tex: tex, display: display })
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (!j || !j.ok || !j.svg) throw new Error((j && j.error) || 'LaTeX 渲染失败');
          texMem[key] = j.svg;
          if (document.body.contains(el)) el.innerHTML = j.svg;
        }).catch(function () {
          if (document.body.contains(el)) el.classList.add('tex-failed');
        });
      })(slots[i]);
    }
  }

  function collectStatements() {
    var m = {};
    Object.keys(window).forEach(function (k) {
      if (!/^STMT_[A-Z0-9_]+$/.test(k)) return;
      var obj = window[k];
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(function (id) {
        var v = obj[id];
        var text = Array.isArray(v) ? v[0] : v;
        var from = Array.isArray(v) ? v[1] : (k === 'STMT_LC' ? 'leetcode-cn' : '');
        if (text && String(text).trim()) m[id] = { zh: String(text), from: from };
      });
    });
    Object.keys(stmtCache).forEach(function (id) {
      var v = stmtCache[id];
      if (v && v[0]) m[id] = { zh: v[0], from: v[1] || '', local: true };
    });
    return m;
  }

  var stmts = {};
  var stmtTried = {};        // 本轮已尝试过的题，避免重复请求
  var stmtFailStreak = 0;    // 连续失败次数，达到 3 次就暂停自动抓取

  function saveStmtCache() {
    var keys = Object.keys(stmtCache);
    if (keys.length > STMT_CACHE_MAX) {
      keys.slice(0, keys.length - STMT_CACHE_MAX).forEach(function (k) { delete stmtCache[k]; });
    }
    writeLS(LS_STMT, stmtCache);
  }

  function cfRatingToDiff(r) {
    if (!r) return 'medium';
    if (r < 1300) return 'easy';
    if (r <= 1900) return 'medium';
    return 'hard';
  }

  function normalize(q) {
    if (!q || (!q.statement && !q.title)) return null;
    var src = q.src || q.source || '自定义';
    var srcId = q.srcId || q.srcid || q.frontendQuestionId || '';
    var id = q.id || (src + '-' + (srcId || Math.random().toString(36).slice(2, 8)));
    var answer = normTagList(q.answer || q.tags || q.topics || []);
    // 若标签里只有无信息量的「模拟」，就丢掉
    if (answer.length > 1) answer = answer.filter(function (x) { return x !== 'simulation'; });
    if (!answer.length) return null;

    var diff = q.difficulty;
    if (diff) {
      diff = String(diff).toLowerCase();
      if (diff === 'easy' || diff === '简单' || diff === '入门') diff = 'easy';
      else if (diff === 'medium' || diff === '中等') diff = 'medium';
      else if (diff === 'hard' || diff === '困难') diff = 'hard';
      else diff = null;
    }
    if (!diff && q.rating) diff = cfRatingToDiff(q.rating);
    if (!diff) diff = 'medium';

    var alts = normTagList(q.alternatives || []).filter(function (t) { return answer.indexOf(t) < 0; });

    return {
      id: id, src: src, srcId: String(srcId || ''), title: q.title || '',
      url: q.url || q.link || '',
      difficulty: diff, rating: q.rating || null,
      statement: String(q.statement || '').trim(),
      answer: answer, alternatives: alts,
      explain: String(q.explain || q.explanation || q.solution || '').trim(),
      cues: (q.cues || []).slice(0, 3),
      custom: !!q.custom
    };
  }

  function loadBanks() {
    // 自动发现所有 window.BANK_* 题库：新增题库文件时无需改代码，只要加一个 <script> 标签即可
    var raw = [];
    Object.keys(window).forEach(function (k) {
      if (/^BANK_[A-Z0-9_]+$/.test(k) && Array.isArray(window[k])) raw = raw.concat(window[k]);
    });
    raw = raw.concat(userBank || []);
    var seenCount = {}, dups = 0, dropped = 0, fromStmt = 0;
    stmts = collectStatements();
    all = [];
    raw.forEach(function (q) {
      var n = normalize(q);
      if (!n) { dropped++; return; }
      // 本地题库没有题干时，用预取/缓存来的中文题干（站点自带中文的直接用，其余是翻译）
      if (!n.statement && stmts[n.id]) {
        n.statement = stmts[n.id].zh;
        n.stmtFrom = stmts[n.id].from;
        fromStmt++;
      }
      var prev = seenCount[n.id];
      if (prev) {
        // 同一题号出现多次（例如精选题库与大题库收录了同一道题）：
        // 优先保留带题干的版本，另一条直接丢弃。
        dups++;
        if (!prev.statement && n.statement) {
          var idx = all.indexOf(prev);
          if (idx >= 0) all[idx] = n;
        }
        return;
      }
      seenCount[n.id] = n;
      all.push(n);
      if (!n.custom) n.custom = false;
    });
    byId = {};
    all.forEach(function (q) { byId[q.id] = q; });
    S.sources = [];
    all.forEach(function (q) { if (S.sources.indexOf(q.src) < 0) S.sources.push(q.src); });
    S.stmtCount = Object.keys(stmts).length;
    return { total: all.length, dropped: dropped, dups: dups, fromStmt: fromStmt };
  }

  /* ============================================================
   * 3. 筛选 & 抽题
   * ============================================================ */
  function isEmpty(obj) { for (var k in obj) if (obj[k]) return false; return true; }

  function filtered() {
    var f = S.filters;
    var q = f.q.trim().toLowerCase();
    return all.filter(function (it) {
      if (!isEmpty(f.src) && !f.src[it.src]) return false;
      if (!isEmpty(f.diff) && !f.diff[it.difficulty]) return false;
      if (!isEmpty(f.tag) && !it.answer.some(function (t) { return f.tag[t]; })) return false;
      if (q) {
        var hay = (it.id + ' ' + it.title + ' ' + it.srcId + ' ' + it.statement + ' ' + it.answer.join(' ')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      var p = progress[it.id];
      switch (f.state) {
        case 'new': if (p && p.seen) return false; break;
        case 'wrong': if (!p || !p.wrong) return false; break;
        case 'partial': if (!p || !p.partial) return false; break;
        case 'due': if (!p || !p.last || p.due > now()) return false; break;
        case 'mastered': if (!p || (p.box || 0) < 3) return false; break;
      }
      return true;
    });
  }

  function weightOf(q) {
    var p = progress[q.id];
    if (!p || !p.seen) return 6;
    if (p.wrong) return 5;
    if (p.due && p.due <= now()) return 4;
    if (p.partial) return 3;
    return 1.5;
  }

  function pickQuestion(avoid) {
    var pool = S.pool;
    if (!pool.length) return null;
    var total = 0, i;
    for (i = 0; i < pool.length; i++) total += weightOf(pool[i]);
    for (var attempt = 0; attempt < 8; attempt++) {
      var r = Math.random() * total, acc = 0, chosen = pool[pool.length - 1];
      for (i = 0; i < pool.length; i++) {
        acc += weightOf(pool[i]);
        if (r <= acc) { chosen = pool[i]; break; }
      }
      if (!avoid || chosen.id !== avoid || pool.length === 1) return chosen;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function buildOptions(q) {
    var n = Math.max(2, Math.min(9, settings.optionCount));
    var need = n - q.answer.length;
    var banned = {};
    q.answer.concat(q.alternatives).forEach(function (t) { banned[t] = 1; });

    var decoys = [];
    if (settings.decoy === 'smart') {
      // 优先从同一分类里挑，逼你真的区分相近方法
      var sameCat = [], other = [];
      var cats = {};
      q.answer.forEach(function (t) { if (PMAP[t]) cats[PMAP[t].cat] = 1; });
      PATTERNS.forEach(function (p) {
        if (banned[p.id]) return;
        (cats[p.cat] ? sameCat : other).push(p.id);
      });
      decoys = shuffle(sameCat).slice(0, Math.ceil(need * 0.7))
        .concat(shuffle(other).slice(0, need));
    } else {
      decoys = shuffle(ALL_IDS.filter(function (id) { return !banned[id]; }));
    }
    decoys = decoys.filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, need);
    return shuffle(q.answer.concat(decoys));
  }

  /* ============================================================
   * 4. 渲染：主区
   * ============================================================ */
  var KEYCAPS = '123456789';

  function diffLabel(q) {
    var d = DIFFS.filter(function (x) { return x.id === q.difficulty; })[0];
    return (d ? d.zh : q.difficulty) + (q.rating ? ' · ' + q.rating : '');
  }

  function renderQuestion() {
    var q = S.cur;
    var main = $('#main');
    if (!q) {
      main.innerHTML = '<div class="card"><div class="empty">当前筛选条件下没有题目了，试试放宽筛选条件。</div>' +
        '<div class="actions"><button class="btn" data-act="filter">打开筛选</button>' +
        '<button class="btn" data-act="resetfilter">重置筛选</button></div></div>';
      return;
    }

    var p = progress[q.id];
    var meta = '<div class="qmeta">' +
      '<span class="tag">' + esc(q.src) + (q.srcId ? ' #' + esc(q.srcId) : '') + '</span>' +
      '<span class="tag ' + q.difficulty + '">' + esc(diffLabel(q)) + '</span>' +
      '<span class="tag">' + q.answer.length + ' 个答案</span>' +
      (p && p.seen ? '<span class="tag">做过 ' + p.seen + ' 次 · 对 ' + p.correct + '</span>' : '<span class="tag">新题</span>') +
      (p && p.box >= 3 ? '<span class="tag easy">已掌握</span>' : '') +
      '</div>';

    var titleCls = (settings.blurTitle && !q.custom) ? 'qtitle blur' : 'qtitle';
    var title = q.title ? '<h2 class="' + titleCls + '" data-act="unblur" title="点击显示题名">' + esc(q.title) + '</h2>' : '';

    var stmt;
    if (q.statement) {
      stmt = '<div class="statement">' + mathHtml(q.statement) + '</div>';
      if (q.stmtFrom) {
        stmt += '<div class="stmt-src">📄 中文题干来自 <b>' + esc(sourceLabel(q.stmtFrom)) + '</b>' +
          (q.url ? ' · <a href="' + esc(q.url) + '" target="_blank" rel="noopener">打开原题核对</a>' : '') +
          '<span class="dim">（题面以原站为准）</span></div>';
      }
      var canRestore = !!(stmtCache[q.id] && stmtCache[q.id][2]);
      stmt += '<div class="actions" style="margin-top:10px">' +
        '<button class="btn sm" data-act="edit-stmt">✏️ 修改题干</button>' +
        (canRestore ? '<button class="btn sm ghost" data-act="restore-stmt">↩ 恢复自动版本</button>' : '') +
        '</div>' +
        '<div id="stmtEditWrap" style="display:none">' +
        '<textarea class="textarea" id="stmtEdit" style="min-height:150px" placeholder="在这里修改题干…"></textarea>' +
        '<div class="actions"><button class="btn primary" data-act="save-stmt">保存</button>' +
        '<button class="btn ghost" data-act="cancel-edit">取消</button>' +
        '<span class="note">公式可以写 LaTeX：<code>$x^2$</code> 行内、<code>$$…$$</code> 行间</span></div></div>';
    } else {
      stmt = stmtPanel(q);
    }

    main.innerHTML = '<div class="card">' + meta + title + stmt +
      '<div class="ask">这道题该用什么<b>数据结构 / 算法</b>？（可多选，选出你认为最核心的方法）</div>' +
      '<div class="options" id="options"></div>' +
      '<div class="actions">' +
      '<button class="btn primary" data-act="submit">提交答案 <kbd>Enter</kbd></button>' +
      '<button class="btn" data-act="hint">给我提示 <kbd>H</kbd></button>' +
      '<button class="btn ghost" data-act="reveal">不会，看答案</button>' +
      '<div class="spacer"></div>' +
      (q.url ? '<button class="btn ghost" data-act="open">打开原题 <kbd>R</kbd></button>' : '') +
      '<button class="btn ghost" data-act="skip">换一题 <kbd>Space</kbd></button>' +
      '</div><div id="result"></div></div>';

    renderOptions();
    updateKpis();
    hydrateTex();

    // 自动抓取中文题干（只在本地服务下可用，失败几次后本轮不再重试）
    if (!q.statement && settings.autoStmt && AI.isServedLocally() && !stmtTried[q.id] && stmtFailStreak < 3) {
      stmtTried[q.id] = 1;
      setTimeout(function () {
        if (S.cur && S.cur.id === q.id && !S.cur.statement) fetchStatement(q, true);
      }, 400);
    }
  }

  function renderOptions() {
    var q = S.cur, host = $('#options');
    if (!host) return;
    S.myOptions = S.myOptions.length && S.myOptions.length === settings.optionCount
      ? S.myOptions : buildOptions(q);
    host.innerHTML = S.myOptions.map(function (id, i) {
      var p = PMAP[id] || { zh: id, en: '' };
      var cls = 'opt' + (S.selected.indexOf(id) >= 0 ? ' sel' : '');
      if (S.revealed) {
        cls = 'opt';
        var isAns = q.answer.indexOf(id) >= 0;
        var isAlt = q.alternatives.indexOf(id) >= 0;
        var chose = S.selected.indexOf(id) >= 0;
        if (isAns) cls += ' right';
        else if (isAlt) cls += chose ? ' alt' : '';
        if (chose && !isAns && !isAlt) cls += ' wrong';
      }
      return '<button class="' + cls + '" data-opt="' + esc(id) + '"' + (S.revealed ? ' disabled' : '') + '>' +
        '<span class="k">' + (KEYCAPS[i] || (i + 1)) + '</span><span><b>' + esc(p.zh) + '</b>' +
        '<small>' + esc(p.en) + (S.revealed && q.alternatives.indexOf(id) >= 0 ? ' · 也可行但非最优' : '') + '</small></span></button>';
    }).join('');
  }

  /* ============================================================
   * 5. 判分与反馈
   * ============================================================ */
  function grade() {
    var q = S.cur;
    var sel = S.selected.slice();
    var A = q.answer, B = q.alternatives;
    var okSet = A.concat(B);
    if (sel.some(function (x) { return okSet.indexOf(x) < 0; })) return 'bad';
    if (!sel.some(function (x) { return A.indexOf(x) >= 0; })) return 'bad';
    return sameSet(sel, A) ? 'ok' : 'partial';
  }

  function submit(forceReveal) {
    if (!S.cur) return;
    if (S.revealed) { next(); return; }
    if (!S.selected.length && !forceReveal) { toast('先选一个方法再提交（或点「不会，看答案」）'); return; }

    var q = S.cur;
    var verdict = forceReveal ? 'bad' : grade();
    var p = rec(q.id);
    p.seen++; p.last = now();

    if (verdict === 'ok') {
      p.correct++; p.box = Math.min((p.box || 0) + 1, BOX_DAYS.length - 1);
      p.due = now() + BOX_DAYS[p.box] * DAY;
      S.session.correct++;
      S.session.streak++;
    } else if (verdict === 'partial') {
      p.partial++;
      p.due = now() + 1 * DAY;
      S.session.partial++;
      S.session.streak = 0;
    } else {
      p.wrong++; p.box = 0; p.due = now() + 0.5 * DAY;
      S.session.streak = 0;
    }
    S.session.seen++;
    S.session.best = Math.max(S.session.best, S.session.streak);
    persistProgress();

    S.revealed = true;
    renderOptions();
    renderResult(verdict, forceReveal);
    updateKpis();
    renderBars();
    if (settings.autoNext && verdict === 'ok') setTimeout(next, 900);
  }

  function pills(ids, cls) {
    return ids.map(function (id) {
      var p = PMAP[id] || { zh: id };
      return '<span class="pill ' + (cls || '') + '" data-learn="' + esc(id) + '" title="点击看这个知识点的讲解">' + esc(p.zh) + '</span>';
    }).join('');
  }

  function renderResult(verdict, forceReveal) {
    var q = S.cur;
    var p = progress[q.id] || {};
    var host = $('#result');
    var vTxt = { ok: '✅ 完全正确', partial: '🟡 半对 —— 你的选择可行，但不是最典型/最优的组合', bad: '❌ 不对' }[verdict];
    if (forceReveal && verdict === 'bad') vTxt = '📖 已直接看答案';

    // 识别信号：优先用题目自带，否则用知识点表的通用信号
    var cueList = (q.cues && q.cues.length) ? q.cues.slice() : [];
    if (!cueList.length) {
      q.answer.forEach(function (t) { if (PMAP[t] && PMAP[t].cues) cueList = cueList.concat(PMAP[t].cues.slice(0, 2)); });
    }

    host.innerHTML = '<div class="result">' +
      '<div class="verdict ' + (verdict === 'ok' ? 'ok' : verdict === 'partial' ? 'partial' : 'bad') + '">' + vTxt + '</div>' +
      '<div class="block"><h4>标准答案</h4><div>' + pills(q.answer) +
      (q.alternatives.length ? '<span style="color:var(--text-faint);font-size:13px;margin-left:6px">其他可行：</span>' + pills(q.alternatives, 'alt') : '') + '</div></div>' +
      '<div class="block"><h4>你的选择</h4><div>' + (S.selected.length ? pills(S.selected) : '<span class="empty">没有选择</span>') + '</div></div>' +
      (q.explain ? '<div class="block"><h4>为什么</h4><div class="explain">' + mathHtml(q.explain) + '</div></div>' : '') +
      (cueList.length ? '<div class="block"><h4>下次这样识别它</h4><ul class="cues">' +
        cueList.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="block"><h4>AI 教练（可选）</h4>' +
      '<div class="actions" style="margin-top:0">' +
      '<button class="btn sm ai" data-act="ai-explain">用大白话讲一遍</button>' +
      '<button class="btn sm ai" data-act="ai-hint2">再给个提示</button>' +
      '<button class="btn sm ai" data-act="ai-judge">点评我的思路</button>' +
      '</div>' +
      '<textarea class="textarea" id="myIdea" style="margin-top:10px;min-height:70px" placeholder="（选填）用一两句话写下你的思路，再点「点评我的思路」，AI 会指出你的盲点"></textarea>' +
      '<div class="ai-out" id="aiOut"></div></div>' +
      '<div class="actions">' +
      '<button class="btn primary" data-act="next">下一题 <kbd>Enter</kbd></button>' +
      '<button class="btn" data-act="learn">📖 讲解「' + esc((PMAP[q.answer[0]] || { zh: q.answer[0] }).zh) + '」</button>' +
      (q.url ? '<button class="btn ghost" data-act="open">打开原题 <kbd>R</kbd></button>' : '') +
      '<button class="btn ghost" data-act="wrong-report" title="标为做错，进入错题本">标为做错</button>' +
      '</div></div>';

    hydrateTex();
    if (!AI.ready()) {
      var box = $('#aiOut');
      if (box) box.innerHTML = '<span class="thinking">未配置 AI。点右上角「AI 设置」可以接入 DeepSeek / OpenAI / 本机 Ollama，就能用这里的三个按钮。</span>';
    }
  }

  /* --------- 手动修改题干（译文/抓来的题干都能改） --------- */
  function saveStatement(q, text, from, autoText) {
    text = String(text || '').trim();
    if (!text) { toast('内容不能为空'); return false; }
    var entry = [text, from || 'manual'];
    if (autoText) entry.push(autoText);
    stmtCache[q.id] = entry;
    saveStmtCache();
    q.statement = text;
    q.stmtFrom = from || 'manual';
    delete q.stmtRaw;
    delete q.stmtRawFrom;
    // 同步到服务端，这样会一起写进 data/stmt-cache.js（离线题库）
    if (AI.isServedLocally()) {
      fetch('/api/save-statement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, text: text, from: from || 'manual' })
      }).catch(function () { /* 服务不在也没关系，本地已存 */ });
    }
    return true;
  }

  function currentStatement(q) {
    return q.statement || q.stmtRaw || '';
  }

  function aiCall(btn, fn, outEl) {
    var out = outEl || $('#aiOut');
    if (!out) return;
    if (!AI.ready()) { out.innerHTML = '<span class="thinking">还没有配置 AI，请点右上角「AI 设置」。</span>'; return; }
    out.innerHTML = '<span class="thinking">AI 思考中…</span>';
    if (btn) btn.disabled = true;
    fn().then(function (txt) {
      out.textContent = txt || '（AI 没有返回内容）';
    }).catch(function (e) {
      out.innerHTML = '<span style="color:var(--bad)">调用失败：' + esc(e.message) + '</span>';
    }).then(function () { if (btn) btn.disabled = false; });
  }

  /* ============================================================
   * 6. 流程控制
   * ============================================================ */
  function next() {
    var prev = S.cur ? S.cur.id : null;
    S.pool = filtered();
    var q = pickQuestion(prev);
    S.cur = q;
    S.selected = [];
    S.myOptions = [];
    S.revealed = false;
    S.hintLevel = 0;
    renderQuestion();
    updateKpis();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleOption(id) {
    if (S.revealed) return;
    var i = S.selected.indexOf(id);
    if (i >= 0) S.selected.splice(i, 1); else S.selected.push(id);
    renderOptions();
  }

  function openOriginal() {
    if (S.cur && S.cur.url) window.open(S.cur.url, '_blank', 'noopener');
    else toast('这道题没有原题链接');
  }

  /* --------- 题干面板：抓取 / 翻译 / 手动粘贴 --------- */
  function stmtPanel(q) {
    var canFetch = AI.isServedLocally();
    var h = '<div class="statement"><div class="hintbox">这道题来自 ' + esc(q.src) + '，本地还没有收录题干。<br>';
    if (canFetch) {
      h += '自动流程：<b>先抓原站（原站自带中文就直接拉中文）→ 抓到英文就交给 AI 翻译</b>。';
      if (!AI.ready()) {
        h += '<br>⚠ 还没有可用的 AI，会退回免费机器翻译，可能较慢或失败。' +
          ' <a href="#" data-act="open-ai">去「AI 设置」填一个 Key →</a>';
      }
    } else {
      h += '抓取需要本地服务：运行 <code>node tools/serve.mjs</code>，改用 <code>http://127.0.0.1:8787</code> 打开本页。';
    }
    h += '</div>';

    // 已经抓到英文原文、但没翻成中文：把原文留着，让用户一键翻
    if (q.stmtRaw) {
      h += '<div class="rawbox">' +
        '<div class="rawhead"><span>已抓到英文原文，但翻译没成功</span>' +
        '<button class="btn sm ai" data-act="translate-raw">翻译成中文</button></div>' +
        '<pre class="rawtext">' + esc(q.stmtRaw) + '</pre>' +
        '<div class="note">也可以直接读英文，或点上面的按钮重试翻译。</div></div>';
    }

    h += '<div class="actions" style="margin-top:12px">' +
      '<button class="btn primary" data-act="get-stmt"' + (canFetch ? '' : ' disabled') + '>抓取并翻译</button>' +
      '<button class="btn" data-act="paste-stmt">粘贴英文题干，自己翻</button>' +
      '</div>';

    h += '<div id="stmtPasteWrap"' + (q.stmtRaw ? '' : ' style="display:none"') + '>' +
      '<textarea class="textarea" id="stmtPaste" style="margin-top:10px" ' +
      'placeholder="模拟题原站打不开时：把英文题干（含输入输出说明）粘贴到这里，AI 会翻译成中文并保存到这道题上，下次直接显示。"></textarea>' +
      '<div class="actions"><button class="btn primary" data-act="translate-paste">翻译并保存</button>' +
      '<button class="btn ghost" data-act="cancel-paste">取消</button></div></div>';

    h += '<div class="stmt-status" id="stmtStatus"></div><div id="stmtTried"></div></div>';
    return h;
  }

  function setStmtStatus(html) {
    var el = $('#stmtStatus');
    if (el && document.body.contains(el)) el.innerHTML = html;
  }

  function aiPayload() {
    if (AI.cfg.mode === 'off' || !AI.cfg.key) return null;
    return { baseUrl: AI.cfg.base, apiKey: AI.cfg.key, model: AI.cfg.model };
  }

  /** 已经拿到原文 → 只要翻译（自动抓取失败后重试 / 手动粘贴，都走这里） */
  function translateAndStore(q, text, label) {
    text = String(text || '').trim();
    if (!text) { toast('先把英文题干粘贴进去'); return Promise.resolve(false); }
    if (!AI.isServedLocally()) { toast('翻译需要本地服务：先运行 node tools/serve.mjs'); return Promise.resolve(false); }
    if (!AI.ready()) {
      toast('还没有可用的 AI —— 会先试用免费机器翻译。建议先在右上角「AI 设置」里填 Key。', 4200);
    }
    setStmtStatus('<span class="thinking">正在翻译' + (label ? '（' + esc(label) + '）' : '') + '…一般 3~20 秒</span>');
    // 带上题号和原始来源，服务端会把结果一起存进离线题库
    var body = { text: text, id: q.id, from: q.stmtRawFrom || 'manual' };
    var ai = aiPayload();
    if (ai) body.ai = ai;
    return fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { throw new Error('服务端返回异常 HTTP ' + r.status); });
    }).then(function (j) {
      if (!j || !j.ok || !j.text) throw new Error((j && j.error) || '翻译失败');
      if (!/[\u4e00-\u9fff]/.test(j.text)) throw new Error('翻译结果里没有中文，请检查 AI 设置（模型名 / Key 是否正确）');
      var from = (q.stmtRawFrom || 'manual') + '+' + (j.from === 'ai' ? 'ai' : 'mt');
      stmtCache[q.id] = [j.text, from];
      saveStmtCache();
      q.statement = j.text;
      q.stmtFrom = from;
      delete q.stmtRaw;
      delete q.stmtRawFrom;
      stmtFailStreak = 0;
      if (S.cur && S.cur.id === q.id) renderQuestion();
      toast('已翻译并保存（' + sourceLabel(from) + '），以后直接显示中文', 3200);
      return true;
    }).catch(function (e) {
      setStmtStatus('<span style="color:var(--bad)">翻译失败：' + esc(e.message) + '</span>');
      return false;
    });
  }

  /* --------- 自动抓取原站题干（有中文直拉中文，英文再翻译） --------- */
  function fetchStatement(q, silent) {
    if (!AI.isServedLocally()) {
      if (!silent) toast('抓取题干需要本地服务：运行 node tools/serve.mjs 后从 http://127.0.0.1:8787 打开本页', 5200);
      return Promise.resolve(false);
    }
    var btns = $$('#main [data-act="get-stmt"]');
    btns.forEach(function (b) { b.disabled = true; });
    setStmtStatus('<span class="thinking">正在抓取原站题干…（自带中文直接拉，只有英文才翻译；首次约 3~20 秒）</span>');
    var triedBox = $('#stmtTried');
    if (triedBox) triedBox.innerHTML = '';

    var payload = { id: q.id, url: q.url, src: q.src };
    var ai = aiPayload();
    if (ai) payload.ai = ai;

    return fetch('/api/statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { throw new Error('服务端返回异常 HTTP ' + r.status); });
    }).then(function (j) {
      if (!j || !j.ok || !j.text) {
        var err = new Error((j && j.error) || '抓取失败');
        err.tried = (j && j.tried) || [];
        throw err;
      }
      var isZh = /[\u4e00-\u9fff]/.test(j.text);
      if (isZh || j.translated) {
        // 成功拿到中文：缓存下来，以后直接显示
        stmtCache[q.id] = [j.text, j.from || ''];
        saveStmtCache();
        q.statement = j.text;
        q.stmtFrom = j.from || '';
        delete q.stmtRaw;
        delete q.stmtRawFrom;
        if (S.cur && S.cur.id === q.id) renderQuestion();
        toast('已获取中文题干（' + sourceLabel(q.stmtFrom) + '）', 2600);
      } else {
        // 只抓到英文、翻译没成功：留着原文，给一键翻译
        q.stmtRaw = j.text;
        q.stmtRawFrom = j.from || '';
        if (S.cur && S.cur.id === q.id) renderQuestion();
        toast('抓到了英文原文，但翻译没成功 —— 点「翻译成中文」重试', 4600);
      }
      stmtFailStreak = 0;
      return true;
    }).catch(function (e) {
      btns.forEach(function (b) { b.disabled = false; });
      var tips = AI.ready() ? '' : '<br>没抓到又能怎样：先在 <a href="#" data-act="open-ai">AI 设置</a>里填个 Key，或直接把英文题干粘到下面让 AI 翻。';
      setStmtStatus('<span style="color:var(--bad)">自动抓取失败：' + esc(e.message) + '</span>' + tips);
      // 把每个来源的失败原因摊开给用户看
      var box = $('#stmtTried');
      if (box && e.tried && e.tried.length) {
        box.innerHTML = '<details class="tried"><summary>看看每个来源分别为什么失败（' + e.tried.length + ' 个）</summary><ul>' +
          e.tried.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';
      }
      // 自动展开手动粘贴通道
      var wrap = $('#stmtPasteWrap');
      if (wrap) wrap.style.display = 'block';
      if (silent) {
        stmtFailStreak++;
        if (stmtFailStreak === 3) toast('连续抓取失败，已暂停自动抓取。可手动重试、粘贴题干，或直接「打开原题」。', 5200);
      } else {
        toast('抓取失败：' + e.message, 4200);
      }
      return false;
    });
  }

  /* ============================================================
   * 7. 侧栏与统计
   * ============================================================ */
  function updateKpis() {
    var pool = S.pool.length ? S.pool : filtered();
    $('#kSeen').textContent = S.session.seen;
    var acc = S.session.seen ? Math.round(S.session.correct / S.session.seen * 100) : null;
    $('#kAcc').textContent = acc == null ? '–' : acc + '%';
    $('#kStreak').textContent = S.session.streak;
    $('#kPool').textContent = pool.length;
    var total = all.length;
    $('#poolInfo').textContent = pool.length === total
      ? ('共 ' + total + ' 道题')
      : (pool.length + ' / ' + total + ' 道题可选');
  }

  function mastery() {
    var m = {};
    Object.keys(progress).forEach(function (id) {
      var q = byId[id], p = progress[id];
      if (!q || !p.seen) return;
      q.answer.forEach(function (t) {
        if (!m[t]) m[t] = { seen: 0, correct: 0 };
        m[t].seen++; if (p.box >= 3 || (p.correct > p.wrong && p.correct > 0)) m[t].correct++;
      });
    });
    return m;
  }

  function barsHtml(m) {
    var rows = Object.keys(m).map(function (t) {
      return { t: t, seen: m[t].seen, correct: m[t].correct, rate: m[t].correct / m[t].seen };
    }).sort(function (a, b) { return a.rate - b.rate; });
    if (!rows.length) return '<div class="empty">还没有作答记录。</div>';
    return rows.map(function (r) {
      var zh = (PMAP[r.t] || { zh: r.t }).zh;
      var pct = Math.round(r.rate * 100);
      var cls = pct >= 80 ? 'good' : pct < 40 ? 'bad' : '';
      return '<div class="bar ' + cls + '" data-learn="' + esc(r.t) + '" title="点击看「' + esc(zh) + '」的讲解">' +
        '<div class="lbl"><span>' + esc(zh) + '</span>' +
        '<span>' + r.correct + '/' + r.seen + ' · ' + pct + '%</span></div>' +
        '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div></div>';
    }).join('');
  }

  function renderBars() { $('#barsAll').innerHTML = barsHtml(mastery()); }

  function renderStatsModal() {
    var m = mastery();
    var ids = Object.keys(progress);
    var seen = ids.filter(function (i) { return progress[i].seen; }).length;
    var correct = ids.reduce(function (s, i) { return s + progress[i].correct; }, 0);
    var partial = ids.reduce(function (s, i) { return s + (progress[i].partial || 0); }, 0);
    var wrong = ids.reduce(function (s, i) { return s + progress[i].wrong; }, 0);
    var answered = correct + partial + wrong;
    $('#statsSummary').innerHTML =
      '题库 <b>' + all.length + '</b> 道（已生成的大题库 + 自建）。<br>练过 <b>' + seen + '</b> 道题，共作答 <b>' + answered +
      '</b> 次：完全正确 <b style="color:var(--ok)">' + correct + '</b>，半对 <b style="color:var(--warn)">' + partial +
      '</b>，错误 <b style="color:var(--bad)">' + wrong + '</b>。' +
      (answered ? '总体正确率 <b>' + Math.round(correct / answered * 100) + '%</b>。' : '');
    $('#statsBars').innerHTML = barsHtml(m);

    var wrongIds = ids.filter(function (i) { return progress[i].wrong > 0 && progress[i].box < 3; })
      .sort(function (a, b) { return progress[b].wrong - progress[a].wrong; }).slice(0, 30);
    $('#wrongList').innerHTML = wrongIds.length ? wrongIds.map(function (i) {
      var q = byId[i]; if (!q) return '';
      return '· ' + (q.url ? '<a href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(q.title || q.srcId) + '</a>' : esc(q.title)) +
        ' <span style="color:var(--text-faint)">' + esc(q.src) + ' · 错 ' + progress[i].wrong + ' 次 · 应选 ' +
        esc(q.answer.map(function (t) { return (PMAP[t] || { zh: t }).zh; }).join('、')) + '</span>';
    }).join('<br>') : '还没有错题，或者错题都已掌握 👍';
  }

  /* ============================================================
   * 8. 筛选 UI
   * ============================================================ */
  function chips(host, items, group, labelFn) {
    $(host).innerHTML = items.map(function (it) {
      var id = typeof it === 'string' ? it : it.id;
      var label = labelFn ? labelFn(it) : (it.zh || it);
      var on = !!S.filters[group][id];
      return '<span class="chip' + (on ? ' on' : '') + '" data-group="' + group + '" data-val="' + esc(id) + '">' + esc(label) + '</span>';
    }).join('');
  }

  var tagShownAll = false;
  function renderFilters() {
    chips('#fSource', S.sources, 'src');
    chips('#fDiff', DIFFS, 'diff');
    var tagIds = ALL_IDS.slice().sort(function (a, b) {
      var x = PMAP[a], y = PMAP[b];
      return x.cat === y.cat ? x.zh.localeCompare(y.zh, 'zh') : CATS.indexOf(x.cat) - CATS.indexOf(y.cat);
    });
    var list = tagShownAll ? tagIds : tagIds.slice(0, 24);
    chips('#fTag', list, 'tag', function (id) { return (PMAP[id] || { zh: id }).zh; });
    $('#fTag').innerHTML += '<span class="chip" id="tagMore">' + (tagShownAll ? '收起 ▲' : '展开全部 ' + tagIds.length + ' 个 ▾') + '</span>';
    // state 是单选，单独渲染
    $('#fState').innerHTML = STATES.map(function (s) {
      return '<span class="chip' + (S.filters.state === s.id ? ' on' : '') + '" data-state="' + s.id + '">' + s.zh + '</span>';
    }).join('');
    $('#fSearch').value = S.filters.q;
    var n = Object.keys(S.filters.src).length + Object.keys(S.filters.diff).length + Object.keys(S.filters.tag).length;
    $('#btnFilter').textContent = n ? ('筛选 · ' + n) : '筛选';
  }

  /* ============================================================
   * 9. 导入 / 导出
   * ============================================================ */
  function parseCsv(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return [];
    var head = lines[0].split(',').map(function (h) { return h.trim().toLowerCase(); });
    return lines.slice(1).map(function (l) {
      var cells = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || [];
      var row = {};
      head.forEach(function (h, i) {
        var v = (cells[i] || '').replace(/,$/, '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
        row[h] = v;
      });
      return row;
    });
  }

  function importText(text) {
    text = String(text || '').trim();
    if (!text) throw new Error('内容为空');
    var arr;
    if (text[0] === '{' || text[0] === '[') {
      var data = JSON.parse(text);
      arr = Array.isArray(data) ? data : (data.questions || data.data || data.problems);
    } else {
      arr = parseCsv(text);
    }
    if (!Array.isArray(arr)) throw new Error('没找到题目数组，JSON 里需要是数组或 { questions: [...] }');
    // CSV 的 tags 可能是 "a;b" 字符串
    arr = arr.map(function (o) {
      var c = Object.assign({}, o);
      c.custom = true;
      ['answer', 'alternatives', 'tags', 'topics'].forEach(function (k) {
        if (typeof c[k] === 'string') c[k] = c[k].split(/[;|、]/).map(function (s) { return s.trim(); }).filter(Boolean);
      });
      if (!c.answer && c.tags) c.answer = c.tags;
      return c;
    });
    var good = [], bad = 0;
    arr.forEach(function (o) { var n = normalize(o); if (n) { n.custom = true; good.push(n); } else bad++; });
    if (!good.length) throw new Error('没有解析出有效题目（必须在 answer/tags 里给出至少一个合法知识点 id）');
    return { good: good, bad: bad };
  }

  function doImport(text) {
    var r = importText(text);
    userBank = userBank.concat(r.good.map(function (q) {
      return {
        id: q.id, src: q.src, srcId: q.srcId, title: q.title, url: q.url,
        difficulty: q.difficulty, rating: q.rating, statement: q.statement,
        answer: q.answer, alternatives: q.alternatives, explain: q.explain, cues: q.cues, custom: true
      };
    }));
    if (!writeLS(LS_USERBANK, userBank)) {
      userBank = userBank.slice(0, Math.max(0, userBank.length - r.good.length));
      throw new Error('浏览器本地存储已满，无法保存。可以改成用 tools/build-banks.mjs 生成题库文件。');
    }
    loadBanks(); renderFilters(); S.pool = filtered(); next();
    toast('成功导入 ' + r.good.length + ' 道题' + (r.bad ? '（跳过 ' + r.bad + ' 条无效数据）' : ''), 3000);
  }

  function download(name, content) {
    var blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  }

  /* ============================================================
   * 10. AI 弹窗
   * ============================================================ */
  function syncAiForm() {
    $('#aiMode').value = AI.cfg.mode;
    $('#aiBase').value = AI.cfg.base || '';
    $('#aiKey').value = AI.cfg.key || '';
    $('#aiModel').value = AI.cfg.model || '';
    $('#aiProxyNote').style.display = AI.cfg.mode === 'proxy' ? 'block' : 'none';
    var cb = $('#aiAutoStmt');
    if (cb) {
      cb.checked = !!settings.autoStmt;
      if (!cb._bound) {
        cb._bound = true;
        cb.addEventListener('change', function () {
          settings.autoStmt = cb.checked;
          persistSettings();
          toast(cb.checked ? '已开启：遇到英文题干会自动抓取并翻译' : '已关闭自动抓取，可手动点「获取中文题干」');
        });
      }
    }
    var note = $('#stmtPrefetchNote');
    if (note) note.textContent = S.stmtCount ? ('已预取 ' + S.stmtCount + ' 道中文题干') : '还没有预取题库（可运行 node tools/fetch-statements.mjs --lc）';

    var mm = $('#mathMode');
    if (mm) {
      mm.value = settings.mathMode || 'katex';
      if (!mm._bound) {
        mm._bound = true;
        mm.addEventListener('change', function () {
          settings.mathMode = mm.value;
          persistSettings();
          updateMathNote();
          if (S.cur) renderQuestion();
          toast(mm.value === 'latex' ? '已切换为「本机 LaTeX」渲染，第一个公式会慢一点，之后走缓存'
            : mm.value === 'off' ? '已关闭公式渲染' : '已切换为 KaTeX 渲染');
        });
      }
    }
    updateMathNote();
  }

  function updateMathNote() {
    var n = $('#mathNote');
    if (!n) return;
    var served = AI.isServedLocally();
    if (settings.mathMode === 'latex') {
      n.innerHTML = served
        ? '公式交给本机 LaTeX 编译成 SVG，首次每个约 1~2 秒，之后命中缓存基本瞬开。'
        : '⚠ 这个模式需要本地服务：先运行 <code>node tools/serve.mjs</code>，否则公式会一直显示原始代码。';
    } else if (settings.mathMode === 'off') {
      n.textContent = '公式会原样显示，不做渲染。';
    } else {
      n.innerHTML = '本地内置 KaTeX，离线也能渲染。<b>KaTeX 解析不了的公式会自动改用本机 LaTeX</b>' +
        (served ? '（本机 LaTeX 已就绪）' : '（需要本地服务，否则显示原始代码）') + '。';
    }
  }

  function bindAi() {
    syncAiForm();
    $('#aiMode').addEventListener('change', function () {
      AI.save({ mode: this.value }); syncAiForm();
    });
    $('#aiPreset').addEventListener('change', function () {
      var p = AI.preset(this.value);
      if (!p) return;
      $('#aiBase').value = p.base;
      $('#aiModel').value = p.model;
    });
    $('#aiSave').addEventListener('click', function () {
      AI.save({
        mode: $('#aiMode').value, base: $('#aiBase').value.trim(),
        key: $('#aiKey').value.trim(), model: $('#aiModel').value.trim()
      });
      toast('AI 设置已保存：' + AI.describe());
    });
    $('#aiTest').addEventListener('click', function () {
      var out = $('#aiTestOut');
      var btn = this;
      AI.save({
        mode: $('#aiMode').value, base: $('#aiBase').value.trim(),
        key: $('#aiKey').value.trim(), model: $('#aiModel').value.trim()
      });
      out.innerHTML = '<span class="thinking">正在测试…</span>';
      btn.disabled = true;
      AI.test().then(function (s) {
        out.textContent = s;
      }).catch(function (e) {
        out.textContent = '❌ ' + e.message + '\n\n排查建议：\n· 本地代理模式需先运行 node tools/serve.mjs，并从 http://127.0.0.1:8787 打开本页\n· 直连模式多数服务商不允许浏览器跨域，建议改用本地代理\n· 检查 Base URL 是否包含 /v1';
      }).then(function () { btn.disabled = false; });
    });
  }

  /* ============================================================
   * 11. 事件绑定
   * ============================================================ */
  function openModal(sel) { $(sel).classList.add('open'); }
  function closeModals() { $$('.modal').forEach(function (m) { m.classList.remove('open'); }); }

  function bind() {
    // 主区委托
    $('#main').addEventListener('click', function (e) {
      var opt = e.target.closest('[data-opt]');
      if (opt) { toggleOption(opt.getAttribute('data-opt')); return; }
      var lrn = e.target.closest('[data-learn]');
      if (lrn) { openLearn(lrn.getAttribute('data-learn')); return; }
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      switch (act) {
        case 'submit': submit(false); break;
        case 'reveal': submit(true); break;
        case 'skip': next(); break;
        case 'next': next(); break;
        case 'learn': if (S.cur) openLearn(S.cur.answer[0]); break;
        case 'open': openOriginal(); break;
        case 'get-stmt': fetchStatement(S.cur, false); break;
        case 'paste-stmt': {
          var w = $('#stmtPasteWrap');
          if (w) { w.style.display = 'block'; var ta = $('#stmtPaste'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); } }
          break;
        }
        case 'cancel-paste': {
          var w2 = $('#stmtPasteWrap');
          if (w2) w2.style.display = 'none';
          break;
        }
        case 'translate-paste': {
          var ta2 = $('#stmtPaste');
          translateAndStore(S.cur, ta2 ? ta2.value : '', '粘贴的内容');
          break;
        }
        case 'translate-raw': translateAndStore(S.cur, S.cur.stmtRaw, '英文原文'); break;
        case 'edit-stmt': {
          var ew = $('#stmtEditWrap'), et = $('#stmtEdit');
          if (ew && et) {
            et.value = currentStatement(S.cur);
            ew.style.display = 'block';
            et.focus();
            et.scrollIntoView({ block: 'center' });
          }
          break;
        }
        case 'cancel-edit': {
          var ew2 = $('#stmtEditWrap');
          if (ew2) ew2.style.display = 'none';
          break;
        }
        case 'save-stmt': {
          var q = S.cur, et2 = $('#stmtEdit');
          var txt = et2 ? et2.value : '';
          if (!txt.trim()) { toast('内容不能为空'); break; }
          var prev = stmtCache[q.id];
          // 「自动版本」= 上次记录的原始文本 → 缓存里的上一条 → 这次编辑前的文本
          var auto = (prev && prev[2]) || (prev && prev[0]) || currentStatement(q);
          var base = String(q.stmtFrom || 'manual').replace(/\+edit$/, '');
          if (auto === txt.trim()) auto = '';        // 改回原样就不用留恢复点了
          if (saveStatement(q, txt, base + '+edit', auto)) {
            renderQuestion();
            toast('已保存，以后打开就是这份内容', 2600);
          }
          break;
        }
        case 'restore-stmt': {
          var q2 = S.cur, p2 = stmtCache[q2.id];
          if (p2 && p2[2]) {
            var base2 = String(p2[1] || 'manual').replace(/\+edit$/, '');
            saveStatement(q2, p2[2], base2, '');
            renderQuestion();
            toast('已恢复成自动抓取的版本');
          } else { toast('没有可恢复的自动版本'); }
          break;
        }
        case 'open-ai': e.preventDefault(); syncAiForm(); openModal('#mAI'); break;
        case 'unblur': btn.classList.remove('blur'); break;
        case 'filter': $('#filters').classList.add('open'); break;
        case 'resetfilter': resetFilters(); break;
        case 'wrong-report':
          if (S.cur) {
            var p = progress[S.cur.id] || rec(S.cur.id);
            p.wrong = (p.wrong || 0) + 1; p.box = 0; p.due = now() + 0.5 * DAY;
            persistProgress(); toast('已加入错题本'); renderBars();
          }
          break;
        case 'ai-explain': aiCall(btn, function () { return AI.explain(S.cur, S.selected); }); break;
        case 'ai-hint2': aiCall(btn, function () { return AI.hint(S.cur, 2); }); break;
        case 'ai-judge':
          aiCall(btn, function () { return AI.judge(S.cur, $('#myIdea') ? $('#myIdea').value : ''); });
          break;
      }
    });

    $('#main').addEventListener('click', function (e) {
      var t = e.target.closest('.qtitle.blur');
      if (t) t.classList.remove('blur');
    });

    // 筛选
    $('#filters').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      if (chip.id === 'tagMore') { tagShownAll = !tagShownAll; renderFilters(); return; }
      var st = chip.getAttribute('data-state');
      if (st) { S.filters.state = st; renderFilters(); S.pool = filtered(); next(); return; }
      var g = chip.getAttribute('data-group'), v = chip.getAttribute('data-val');
      if (!g || !v) return;
      S.filters[g][v] = !S.filters[g][v];
      if (!S.filters[g][v]) delete S.filters[g][v];
      renderFilters();
      S.pool = filtered();
      next();
    });
    var t;
    $('#fSearch').addEventListener('input', function () {
      var v = this.value;
      clearTimeout(t);
      t = setTimeout(function () {
        S.filters.q = v; S.pool = filtered(); next();
      }, 260);
    });

    function resetFilters() {
      S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: '' };
      renderFilters(); S.pool = filtered(); next(); toast('筛选已重置');
    }
    $('#btnResetFilter').addEventListener('click', resetFilters);
    $('#btnFilter').addEventListener('click', function () { $('#filters').classList.toggle('open'); });

    // 弹窗
    $('#btnImport').addEventListener('click', function () { openModal('#mImport'); });
    $('#btnAI').addEventListener('click', function () { syncAiForm(); openModal('#mAI'); });
    $('#btnStats').addEventListener('click', function () { renderStatsModal(); openModal('#mStats'); });
    // 侧栏掌握度：点某个知识点直接跳到讲解
    $('#barsAll').addEventListener('click', function (e) {
      var b = e.target.closest('[data-learn]');
      if (b) openLearn(b.getAttribute('data-learn'));
    });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m || e.target.closest('[data-close]')) closeModals();
      });
    });

    // 导入导出
    $('#doImport').addEventListener('click', function () {
      try {
        var txt = $('#pasteImport').value;
        if (!txt.trim()) throw new Error('请先选择文件或粘贴 JSON');
        doImport(txt);
        closeModals();
      } catch (e) { toast('导入失败：' + e.message, 4000); }
    });
    $('#fileImport').addEventListener('change', function () {
      var f = this.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try { doImport(fr.result); closeModals(); }
        catch (e) { toast('导入失败：' + e.message, 4000); }
      };
      fr.readAsText(f);
    });
    $('#doExport').addEventListener('click', function () {
      download('algopick-bank.json', JSON.stringify(userBank.length ? userBank : all, null, 2));
    });
    $('#doExportProgress').addEventListener('click', function () {
      download('algopick-progress.json', JSON.stringify({ exportedAt: new Date().toISOString(), progress: progress }, null, 2));
    });
    $('#doReset').addEventListener('click', function () {
      if (!confirm('确定清空全部作答记录和错题本吗？此操作不可撤销。')) return;
      progress = {}; persistProgress(); S.session = { seen: 0, correct: 0, partial: 0, streak: 0, best: 0 };
      renderBars(); renderStatsModal(); updateKpis(); toast('进度已清空');
    });

    // 主题
    $('#btnTheme').addEventListener('click', function () {
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', settings.theme);
      persistSettings();
    });

    // AI 出题
    var gen = $('#btnGen');
    if (gen) gen.addEventListener('click', function () {
      if (!AI.ready()) { syncAiForm(); openModal('#mAI'); return; }
      var tags = Object.keys(S.filters.tag);
      var diff = Object.keys(S.filters.diff);
      var btn = this;
      btn.disabled = true; btn.textContent = 'AI 出题中…';
      AI.generate({
        n: 5, topic: tags.length ? tags.map(function (t) { return (PMAP[t] || { zh: t }).zh; }).join('、') : '',
        difficulty: diff.length === 1 ? diff[0] : 'any'
      }).then(function (list) {
        var added = 0;
        list.forEach(function (o) {
          o.src = 'AI 生成'; o.custom = true; o.id = 'ai-' + now() + '-' + (added++);
        });
        userBank = userBank.concat(list);
        writeLS(LS_USERBANK, userBank);
        loadBanks();
        S.filters = { src: { 'AI 生成': true }, diff: {}, tag: {}, state: 'all', q: '' };
        renderFilters(); S.pool = filtered(); next();
        toast('AI 生成了 ' + added + ' 道新题');
      }).catch(function (e) {
        toast('AI 出题失败：' + e.message, 4000);
      }).then(function () { btn.disabled = false; btn.textContent = 'AI 出题'; });
    });

    // 快捷键
    document.addEventListener('keydown', function (e) {
      var tgt = e.target;
      if (tgt && tgt.matches && tgt.matches('input, textarea, select')) return;
      if (e.key === 'Escape') { closeModals(); return; }
      if ($$('.modal.open').length) return;
      var idx = KEYCAPS.indexOf(e.key);
      if (idx >= 0 && !S.revealed && S.myOptions[idx]) { toggleOption(S.myOptions[idx]); e.preventDefault(); return; }
      if (e.key === 'Enter') { e.preventDefault(); if (S.revealed) next(); else submit(false); return; }
      var k = e.key.toLowerCase();
      if (k === 'h' && !S.revealed) {
        if (!AI.ready()) { toast('提示功能需要先配置 AI（右上角「AI 设置」）'); return; }
        S.hintLevel = Math.min(3, S.hintLevel + 1);
        var host = $('#hintOut');
        if (!host) {
          host = document.createElement('div');
          host.id = 'hintOut';
          host.className = 'ai-out';
          host.style.marginTop = '14px';
          var anchor = $('#result') || $('#main');
          if (anchor) anchor.appendChild(host);
        }
        aiCall(null, function () { return AI.hint(S.cur, S.hintLevel); }, host);
      }
      if (k === ' ') { e.preventDefault(); next(); }
      if (k === 'r') openOriginal();
      if (k === 'f') $('#filters').classList.toggle('open');
    });
  }

  /* ============================================================
   * 13. 知识点讲解（基本操作 / Python 实现 / 应用 / 如何识别 / 链接）
   * ============================================================ */
  var learn = {};
  var learnCur = null;

  function collectLearn() {
    var m = {};
    Object.keys(window).forEach(function (k) {
      if (!/^LEARN_[A-Z0-9_]+$/.test(k)) return;
      var o = window[k];
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach(function (id) { if (o[id] && typeof o[id] === 'object') m[id] = o[id]; });
    });
    return m;
  }

  function kindOf(u) {
    if (/bilibili\.com/.test(u)) return 'B站';
    if (/oi-wiki\.org/.test(u)) return 'OI Wiki';
    if (/cp-algorithms\.com/.test(u)) return 'CP-Alg';
    if (/runoob\.com/.test(u)) return '菜鸟教程';
    if (/docs\.python\.org/.test(u)) return 'Py 文档';
    if (/leetcode\.cn/.test(u)) return '力扣';
    if (/luogu\.com\.cn/.test(u)) return '洛谷';
    if (/wikipedia\.org/.test(u)) return '维基';
    return '链接';
  }

  function safeUrl(u) {
    u = String(u || '').trim();
    if (!/^https?:\/\//i.test(u)) return '';
    try { return encodeURI(u); } catch (e) { return u; }
  }

  function genericLinks(p) {
    return [
      { t: 'B站 · ' + p.zh + ' 讲解', u: 'https://search.bilibili.com/all?keyword=' + p.zh },
      { t: 'B站 · ' + p.en + ' tutorial', u: 'https://search.bilibili.com/all?keyword=' + p.en },
      { t: '力扣 · 按标签刷「' + p.zh + '」', u: 'https://leetcode.cn/problemset/?tags=' + p.id }
    ];
  }

  function sec(title, body, sub) {
    return '<div class="learn-sec"><h4>' + title + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</h4>' + body + '</div>';
  }
  function ulist(arr) {
    return '<ul class="learn-ul">' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  }
  function codeBlock(src) {
    return '<pre class="code"><code>' + esc(Array.isArray(src) ? src.join('\n') : String(src || '')) + '</code></pre>';
  }

  function renderLearnList() {
    var q = ($('#learnSearch').value || '').toLowerCase().trim();
    var html = '';
    CATS.forEach(function (cat) {
      var items = PATTERNS.filter(function (p) {
        return p.cat === cat && (!q || (p.zh + ' ' + p.en + ' ' + p.id).toLowerCase().indexOf(q) >= 0);
      });
      if (!items.length) return;
      html += '<div class="learn-cat">' + esc(cat) + '</div>';
      items.forEach(function (p) {
        html += '<div class="learn-item' + (p.id === learnCur ? ' on' : '') + '" data-learn-item="' + esc(p.id) + '">' +
          '<span>' + esc(p.zh) + '</span>' + (learn[p.id] ? '<span class="have" title="已有讲解">●</span>' : '') + '</div>';
      });
    });
    $('#learnList').innerHTML = html || '<div class="learn-empty" style="padding:12px">没有匹配的知识点</div>';
  }

  function renderLearnDetail(id) {
    var p = PMAP[id];
    if (!p) { $('#learnMain').innerHTML = '<div class="learn-empty">没有这个知识点。</div>'; return; }
    var d = learn[id] || {};
    var html = '<div class="learn-h"><h2>' + esc(p.zh) + '</h2><span class="en">' + esc(p.en) + '</span>' +
      '<span class="tag">' + esc(p.cat) + '</span>' + (learn[id] ? '' : '<span class="tag">暂无详细讲解，下面是通用入口</span>') + '</div>';
    if (d.intro) html += '<div class="learn-intro">' + esc(d.intro) + '</div>';

    var idList = (d.identify && d.identify.length) ? d.identify : (p.cues || []);
    html += sec('如何识别它 <span class="sub">看到题干里这些特征，就该想到它</span>', ulist(idList));

    if (d.ops && d.ops.length) {
      html += sec('基本操作', '<div class="learn-ops">' + d.ops.map(function (o) {
        return '<div class="learn-op"><div class="nm">' + esc(o.name || '') + '</div><div>' +
          codeBlock(o.py) + (o.note ? '<div class="note">' + esc(o.note) + '</div>' : '') + '</div></div>';
      }).join('') + '</div>');
    }

    if (d.template) html += sec('Python 模板', codeBlock(d.template), d.complexity || '');

    if (d.applications && d.applications.length) html += sec('常见应用', ulist(d.applications));
    if (d.pitfalls && d.pitfalls.length) html += sec('容易踩的坑', ulist(d.pitfalls));

    var links = (d.links && d.links.length) ? d.links : genericLinks(p);
    html += sec('学习链接', '<div class="learn-links">' + links.map(function (l) {
      var u = safeUrl(l.u || l.url);
      var t = l.t || l.title || u || '链接';
      if (!u) return '';
      return '<a class="learn-link" href="' + esc(u) + '" target="_blank" rel="noopener">' +
        '<span class="kind">' + esc(kindOf(u)) + '</span><span class="t">' + esc(t) + '</span><span class="go">↗</span></a>';
    }).join('') + '</div>');

    html += '<div class="learn-actions">' +
      '<button class="btn primary" data-learn-practice="' + esc(id) + '">✏️ 专门刷这个知识点</button>' +
      '<button class="btn ghost" data-learn-all="1">看全部知识点</button></div>';

    $('#learnMain').innerHTML = html;
    $('#learnMain').scrollTop = 0;
  }

  var curView = 'practice';
  function showView(v) {
    curView = v === 'learn' ? 'learn' : 'practice';
    $('#viewPractice').style.display = curView === 'practice' ? '' : 'none';
    $('#viewLearn').style.display = curView === 'learn' ? '' : 'none';
    $('#tabPractice').classList.toggle('on', curView === 'practice');
    $('#tabLearn').classList.toggle('on', curView === 'learn');
    $('#practiceTools').style.display = curView === 'practice' ? 'contents' : 'none';
    closeModals();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openLearn(id) {
    if (!PATTERNS.length) { toast('知识点表没有加载'); return; }
    if (Object.keys(learn).length === 0) learn = collectLearn();
    var changed = !!(id && PMAP[id] && id !== learnCur);
    learnCur = (id && PMAP[id]) ? id : (learnCur || PATTERNS[0].id);
    renderLearnList();
    renderLearnDetail(learnCur);
    showView('learn');
    var have = Object.keys(learn).length;
    $('#learnBadge').textContent = have ? ' · ' + have : '';
    $('#learnCount').textContent = '共 ' + PATTERNS.length + ' 个知识点，已收录详细讲解 ' + have + ' 个';
    if (changed) {
      var el = $('#learnList').querySelector('.learn-item.on');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }
  }

  function practicePattern(id) {
    if (!PMAP[id]) return;
    S.filters = { src: {}, diff: {}, tag: {}, state: 'all', q: '' };
    S.filters.tag[id] = true;
    tagShownAll = true;
    renderFilters();
    S.pool = filtered();
    next();
    showView('practice');
    toast('已切换到「' + PMAP[id].zh + '」专项练习，共 ' + S.pool.length + ' 道题');
  }

  function bindLearn() {
    $('#tabLearn').addEventListener('click', function () { openLearn(null); });
    $('#tabPractice').addEventListener('click', function () { showView('practice'); });
    $('#learnList').addEventListener('click', function (e) {
      var it = e.target.closest('[data-learn-item]');
      if (!it) return;
      learnCur = it.getAttribute('data-learn-item');
      renderLearnList();
      renderLearnDetail(learnCur);
    });
    var t;
    $('#learnSearch').addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(renderLearnList, 120);
    });
    $('#learnMain').addEventListener('click', function (e) {
      var pr = e.target.closest('[data-learn-practice]');
      if (pr) { practicePattern(pr.getAttribute('data-learn-practice')); return; }
      if (e.target.closest('[data-learn-all]')) {
        learnCur = null; $('#learnSearch').value = ''; renderLearnList();
        toast('左边就是全部 ' + PATTERNS.length + ' 个知识点');
      }
    });
  }

  /* ============================================================
   * 14. 启动
   * ============================================================ */
  function boot() {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    AI.load();
    var info = loadBanks();

    // 提示条：题库偏小 / AI 未配置时给出下一步指引
    var tips = [];
    if (all.length < 500) {
      tips.push('运行 <code>node tools/build-banks.mjs</code> 可从 Codeforces + LeetCode 拉取 <b>一万多道</b>题目标签，生成大题库。');
    }
    if (!AI.ready()) {
      tips.push('需要 AI 出题 / 判题 / 提示时：运行 <code>node tools/serve.mjs</code>，改用 <code>http://127.0.0.1:8787</code> 打开本页，再点右上角「AI 设置」。');
    }
    if (tips.length) {
      var b = $('#banner');
      b.style.display = 'block';
      b.innerHTML = '💡 ' + tips.map(function (t) { return '· ' + t; }).join('<br>💡 ');
    }

    if (!all.length) {
      $('#main').innerHTML = '<div class="card"><h2 class="qtitle">题库是空的</h2>' +
        '<div class="statement">本工具需要题库数据文件。请确认以下文件存在：<br>' +
        '<code>data/bank-a1.js</code> ~ <code>data/bank-a3.js</code>、<code>data/bank-b.js</code>（配套精选题库）<br>' +
        '或运行 <code>node tools/build-banks.mjs</code> 生成 <code>data/bank-cf.js</code> / <code>data/bank-lc.js</code>（一万多道）。</div>' +
        '<div class="actions"><button class="btn primary" data-act="import2" id="btnImport2">手动导入题库</button></div></div>';
      var b2 = $('#btnImport2');
      if (b2) b2.addEventListener('click', function () { openModal('#mImport'); });
      $('#poolInfo').textContent = '题库为空';
      return;
    }
    renderFilters();
    renderBars();
    bind();
    bindAi();
    learn = collectLearn();
    bindLearn();
    $('#learnBadge').textContent = Object.keys(learn).length ? ' · ' + Object.keys(learn).length : '';
    $('#learnCount').textContent = '共 ' + PATTERNS.length + ' 个知识点，已收录详细讲解 ' + Object.keys(learn).length + ' 个';
    S.pool = filtered();
    next();
    if (info.dropped) console.info('[AlgoPick] 忽略 ' + info.dropped + ' 条无法识别的题库数据');
    if (info.dups) console.info('[AlgoPick] 合并 ' + info.dups + ' 条重复题目（保留带题干的那份）');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // 暴露给控制台调试
  window.AlgoPick = {
    S: S,
    all: function () { return all; },
    progress: function () { return progress; },
    learn: function () { return learn; },
    openLearn: openLearn,
    showView: showView
  };
})();
