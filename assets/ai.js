/*!
 * AlgoPick · 可选 AI 层（OpenAI 兼容接口）
 * 不配置也能正常使用全部刷题功能。
 */
(function (root) {
  'use strict';

  var PRESETS = {
    deepseek: { base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    zhipu: { base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
    moonshot: { base: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
    ollama: { base: 'http://localhost:11434/v1', model: 'qwen2.5:7b' }
  };

  var LS_KEY = 'algopick.v1.ai';
  var cfg = { mode: 'proxy', base: '', key: '', model: '' };

  function isServedLocally() {
    return /^https?:$/.test(location.protocol) &&
      /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) cfg = Object.assign(cfg, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    // file:// 下没有本地代理可用，自动切直连
    if (!isServedLocally() && cfg.mode === 'proxy') cfg.mode = 'direct';
    return cfg;
  }

  function save(next) {
    cfg = Object.assign(cfg, next || {});
    try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    return cfg;
  }

  function preset(name) { return PRESETS[name] || null; }

  function ready() {
    if (cfg.mode === 'off') return false;
    if (cfg.mode === 'proxy') return true;              // 代理端可读环境变量里的 key
    return !!(cfg.base && cfg.model && cfg.key);
  }

  function describe() {
    if (cfg.mode === 'off') return 'AI 已关闭';
    if (cfg.mode === 'proxy') return '本地代理 · ' + (cfg.model || 'deepseek-chat');
    return (cfg.model || '未指定模型') + (cfg.key ? '' : '（缺少 Key）');
  }

  function trimBase(b) { return String(b || '').replace(/\/+$/, ''); }

  function chat(messages, opts) {
    opts = opts || {};
    var body = { messages: messages, model: cfg.model || 'deepseek-chat', temperature: opts.temperature == null ? 0.4 : opts.temperature };
    var url;
    if (cfg.mode === 'proxy') {
      url = '/api/llm';
      body.baseUrl = trimBase(cfg.base);
      body.apiKey = cfg.key;
    } else {
      if (!cfg.base) throw new Error('还没有填写 API Base URL');
      if (!cfg.key) throw new Error('还没有填写 API Key');
      url = trimBase(cfg.base) + '/chat/completions';
      body.stream = false;
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cfg.mode === 'direct' ? { Authorization: 'Bearer ' + cfg.key } : {}) },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' · ' + t.slice(0, 300));
        var data;
        try { data = JSON.parse(t); } catch (e) { throw new Error('返回内容不是 JSON：' + t.slice(0, 200)); }
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        var msg = data.choices && data.choices[0] && data.choices[0].message;
        if (!msg) throw new Error('返回结构异常：' + t.slice(0, 200));
        return msg.content || '';
      });
    });
  }

  /* ---------- prompt 组装 ---------- */

  function qContext(q, includeAnswer) {
    var lines = [];
    lines.push('【来源】' + (q.src || '本地题库') + (q.srcId ? ' #' + q.srcId : '') + (q.url ? '（' + q.url + '）' : ''));
    lines.push('【题名】' + (q.title || '（未命名）'));
    lines.push('【难度】' + (q.difficulty || '-') + (q.rating ? ' / rating ' + q.rating : ''));
    lines.push('【题干】' + (q.statement || '（本地题库未收录题干，用户需在原站阅读）'));
    if (includeAnswer) {
      lines.push('【标准答案】' + (q.answer || []).join('、') + (q.alternatives && q.alternatives.length ? '（其他可行：' + q.alternatives.join('、') + '）' : ''));
      lines.push('【解析】' + (q.explain || ''));
    }
    return lines.join('\n');
  }

  var TAXONOMY_HINT = (root.PATTERNS || []).map(function (p) { return p.id + '(' + p.zh + ')'; }).join(', ');

  function parseJsonLoose(text) {
    var t = String(text).trim();
    var fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    var a = t.indexOf('['), b = t.lastIndexOf(']');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }

  /* ---------- 能力 ---------- */

  function test() {
    return chat([
      { role: 'system', content: '你是一个只说真话的连通性测试助手。' },
      { role: 'user', content: '回复两个字：可用' }
    ], { temperature: 0 }).then(function (s) { return '✅ 连接成功，模型回复：' + s.trim().slice(0, 60); });
  }

  function explain(q, userChoice) {
    return chat([
      { role: 'system', content: '你是算法教练。用中文、口语化、由浅入深地讲解，允许打比方，不要写完整代码，最多 260 字。' },
      { role: 'user', content: '学生在做一道「判断该用什么数据结构/算法」的练习题。\n' + qContext(q, true) +
        (userChoice && userChoice.length ? '\n【学生选的】' + userChoice.join('、') : '') +
        '\n请用最容易懂的方式解释：为什么应该用标准答案的方法？看到题干里哪些字眼就该联想到它？学生容易踩什么坑？' }
    ]);
  }

  function hint(q, level) {
    var lv = level || 1;
    var instr = lv <= 1
      ? '只给第一层提示：指出题干里值得注意的 1~2 个关键词或数据范围，绝对不要说出方法名称。'
      : lv === 2
        ? '给第二层提示：说出方法所属的「大类」（例如「跟区间查询有关的数据结构」），但仍不要直接说出名字。'
        : '给第三层提示：说出方法名称，并说明为什么它适用。';
    return chat([
      { role: 'system', content: '你是算法教练，只给提示不直接给完整答案。中文，60 字以内。' },
      { role: 'user', content: qContext(q, false) + '\n' + instr }
    ], { temperature: 0.5 });
  }

  function judge(q, userText) {
    return chat([
      { role: 'system', content: '你是严格的算法面试官，用中文点评。先给结论，再给理由，最后一条改进建议。不超过 220 字。' },
      { role: 'user', content: qContext(q, true) +
        '\n【学生的思路】\n' + (userText || '（空）') +
        '\n请判断：1) 学生选的算法能否正确解决问题？2) 复杂度是否可接受？3) 有没有更优/更典型的选择？4) 一句话指出思维盲点。' }
    ]);
  }

  function generate(opts) {
    opts = opts || {};
    var n = opts.n || 5;
    var topic = opts.topic ? ('围绕知识点：' + opts.topic + '（主题目必须是这个知识点，干扰项选相近但不同的方法）') : '知识点请随机分散';
    var diff = opts.difficulty && opts.difficulty !== 'any' ? ('难度：' + opts.difficulty) : '难度：easy/medium/hard 混合';
    var src = opts.style ? ('风格参考：' + opts.style) : '风格：通用笔试/竞赛风格';
    var sys = '你是算法题库作者，输出严格 JSON，不要任何解释文字。';
    var usr = [
      '请出 ' + n + ' 道「给出题目、让学生判断该用哪种数据结构或算法」的单选题素材。',
      diff + '；' + src + '；' + topic,
      '答案 id 必须从这个白名单里选：' + TAXONOMY_HINT,
      '题干要求：中文，自包含（写清输入输出与数据范围），60~200 字，不要出现方法名称，也不要写出解决方法。',
      '输出 JSON 数组，每个元素字段：',
      '{"title":"短标题","statement":"题干","difficulty":"easy|medium|hard","answer":["id1"],"alternatives":["id2"],"explain":"80~150字解析","cues":["识别信号1","识别信号2"]}',
      'answer 里的 id 必须是白名单中的合法值。只输出 JSON 数组。'
    ].join('\n');
    return chat([{ role: 'system', content: sys }, { role: 'user', content: usr }], { temperature: 0.9 })
      .then(function (text) {
        var arr = parseJsonLoose(text);
        if (!Array.isArray(arr)) throw new Error('AI 没有返回数组');
        return arr.filter(function (o) { return o && o.statement && o.answer && o.answer.length; });
      });
  }

  root.AI = {
    PRESETS: PRESETS, cfg: cfg, load: load, save: save, preset: preset, ready: ready,
    describe: describe, test: test, explain: explain, hint: hint, judge: judge,
    generate: generate, chat: chat, isServedLocally: isServedLocally
  };
})(window);
