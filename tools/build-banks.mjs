#!/usr/bin/env node
/**
 * AlgoPick · 大题库生成器
 *
 *   node tools/build-banks.mjs            # Codeforces + LeetCode 全量
 *   node tools/build-banks.mjs --cf       # 只做 Codeforces
 *   node tools/build-banks.mjs --lc       # 只做 LeetCode
 *   node tools/build-banks.mjs --min 70   # 调高「标签信息量」门槛（题更少但更聚焦）
 *
 * 产出：
 *   data/bank-cf.js   window.BANK_CF
 *   data/bank-lc.js   window.BANK_LC
 * 生成后直接刷新 index.html 即可，无需任何后端。
 *
 * 说明：题目标签来自站点官方数据，本工具把它换算成自己的知识点体系：
 *   分值最高的标签 -> answer[0]（标准答案），其余标签 -> alternatives（也算对，但非最优）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

/* ============================================================
 * 站点标签 -> 本工具知识点 id，数字是「信息量/典型度」分值
 * 分值越高越可能成为标准答案；低于 --min 的题会被跳过。
 * ============================================================ */

// -------- Codeforces --------
const CF_MAP = {
  'dsu': ['dsu', 96],
  'flows': ['network-flow', 96],
  'graph matchings': ['bipartite', 95],
  '2-sat': ['diff-constraint', 94],
  'shortest paths': ['dijkstra', 92],
  'meet-in-the-middle': ['meet-in-middle', 92],
  'binary search': ['binary-search', 90],
  'ternary search': ['binary-search', 88],
  'two pointers': ['two-pointers', 90],
  'dp': ['linear-dp', 90],
  'divide and conquer': ['divide-conquer', 89],
  'bitmasks': ['bit-manipulation', 87],
  'graphs': ['graph-dfs', 86],
  'dfs and similar': ['graph-dfs', 86],
  'trees': ['tree-traversal', 84],
  'geometry': ['geometry', 86],
  'games': ['game-theory', 86],
  'matrices': ['matrix', 85],
  'number theory': ['number-theory', 85],
  'chinese remainder theorem': ['number-theory', 85],
  'combinatorics': ['combinatorics', 84],
  'probabilities': ['probability', 84],
  'hashing': ['string-hash', 84],
  'string suffix structures': ['string-misc', 84],
  'data structures': ['ds-misc', 83],
  'expression parsing': ['stack', 82],
  'fft': ['misc-math', 80],
  'constructive algorithms': ['construction', 80],
  'greedy': ['greedy', 78],
  'interactive': ['interactive', 78],
  'strings': ['string-misc', 72],
  'schedules': ['intervals-greedy', 72],
  'sortings': ['sort', 70],
  'communication': ['interactive', 70],
  'math': ['misc-math', 58],
  'brute force': ['enumeration', 50],
  'implementation': ['simulation', 42],
  '*special': ['special-misc', 20],
};

// -------- LeetCode --------
const LC_MAP = {
  'union-find': ['dsu', 96],
  'flow-network': ['network-flow', 96],
  'minimum-cost-flow': ['network-flow', 96],
  'successive-shortest-path-algorithm': ['network-flow', 94],
  'matching-graph': ['bipartite', 95],
  'hungarian-algorithm': ['bipartite', 95],
  'segment-tree': ['segment-tree', 94],
  'binary-indexed-tree': ['fenwick', 94],
  'sparse-table': ['sparse-table', 92],
  'range-minimum-maximum-query': ['sparse-table', 92],
  'trie': ['trie', 93],
  'monotonic-stack': ['monotonic-stack', 92],
  'monotonic-queue': ['monotonic-queue', 92],
  'heap-priority-queue': ['heap', 91],
  'topological-sort': ['topological-sort', 91],
  'directed-acyclic-graph': ['topological-sort', 88],
  'dijkstra': ['dijkstra', 92],
  'shortest-path': ['dijkstra', 90],
  'k-shortest-path': ['dijkstra', 90],
  'a-search': ['dijkstra', 88],
  'minimum-spanning-tree': ['mst', 92],
  'kruskals-algorithm': ['mst', 92],
  'prims-algorithm': ['mst', 92],
  'boruvkas-algorithm': ['mst', 90],
  'strongly-connected-component': ['scc', 92],
  'tarjans-scc-algorithm': ['scc', 92],
  'kosarajus-algorithm': ['scc', 92],
  'lowest-common-ancestor': ['lca', 92],
  'binary-lifting': ['lca', 92],
  'dp-on-trees': ['tree-dp', 91],
  'dynamic-programming': ['linear-dp', 90],
  'longest-common-subsequence': ['linear-dp', 88],
  'knapsack-problem': ['knapsack', 91],
  '0-1-knapsack': ['knapsack', 91],
  'complete-knapsack': ['knapsack', 91],
  'bitmask': ['bitmask-dp', 89],
  'memoization': ['memo-search', 85],
  'bit-manipulation': ['bit-manipulation', 87],
  'divide-and-conquer': ['divide-conquer', 88],
  'meet-in-the-middle': ['meet-in-middle', 90],
  'binary-search': ['binary-search', 90],
  'ternary-search': ['binary-search', 88],
  'two-pointers': ['two-pointers', 90],
  'sliding-window': ['sliding-window', 90],
  'prefix-sum': ['prefix-sum', 86],
  'hash-table': ['hash', 88],
  'hash-function': ['string-hash', 84],
  'rolling-hash': ['string-hash', 88],
  'depth-first-search': ['graph-dfs', 86],
  'breadth-first-search': ['graph-bfs', 88],
  'bidirectional-search': ['graph-bfs', 86],
  'graph': ['graph-dfs', 84],
  'backtracking': ['backtracking', 88],
  'algorithm-x': ['backtracking', 88],
  'dancing-links': ['backtracking', 90],
  'greedy': ['greedy', 80],
  'merge-sort': ['merge-sort', 84],
  'quicksort': ['sort', 80],
  'sorting': ['sort', 76],
  'counting-sort': ['sort', 76],
  'tournament-sort': ['sort', 76],
  'bubble-sort': ['sort', 60],
  'stack': ['stack', 76],
  'queue': ['queue', 76],
  'linked-list': ['linked-list', 82],
  'binary-search-tree': ['bst', 86],
  'binary-tree': ['tree-traversal', 82],
  'tree': ['tree-traversal', 78],
  'graph-coloring': ['special-misc', 72],
  'eulerian-circuit': ['graph-dfs', 86],
  'eulerian-path': ['graph-dfs', 86],
  'semi-eulerian-graph': ['graph-dfs', 82],
  'bipartite-graph': ['bipartite', 88],
  'articulation-point': ['ds-misc', 86],
  'ordered-set': ['ds-misc', 84],
  'design': ['ds-misc', 62],
  'data-stream': ['ds-misc', 62],
  'iterator': ['ds-misc', 60],
  'matrix': ['matrix', 80],
  'linear-algebra': ['matrix', 80],
  'combinatorics': ['combinatorics', 86],
  'number-theory': ['number-theory', 86],
  'greatest-common-divisor': ['number-theory', 84],
  'euclidean-algorithm': ['number-theory', 82],
  'fermats-little-theorem': ['number-theory', 84],
  'pigeonhole-principle': ['misc-math', 74],
  'newtons-method': ['misc-math', 70],
  'probability-and-statistics': ['probability', 86],
  'game-theory': ['game-theory', 86],
  'nim-game': ['game-theory', 88],
  'impartial-game': ['game-theory', 86],
  'sprague-grundy-theorem': ['game-theory', 88],
  'minimax-algorithm': ['game-theory', 84],
  'zero-sum-game': ['game-theory', 76],
  'randomized': ['randomized', 80],
  'reservoir-sampling': ['randomized', 84],
  'geometry': ['geometry', 88],
  'convex-hull': ['geometry', 90],
  'polygons': ['geometry', 82],
  'triangulation': ['geometry', 80],
  'knuth-morris-pratt-algorithm': ['kmp', 92],
  'z-algorithm': ['kmp', 90],
  'string-matching': ['string-misc', 84],
  'aho-corasick-algorithm': ['string-misc', 92],
  'suffix-array': ['string-misc', 92],
  'suffix-automaton': ['string-misc', 92],
  'suffix-tree': ['string-misc', 92],
  'boyer-moore-string-search-algorithm': ['string-misc', 88],
  'manacher': ['manacher', 92],
  'boyer-moore-majority-vote-algorithm': ['moore-vote', 88],
  'interactive': ['interactive', 78],
  'heuristic-search': ['special-misc', 72],
  'bracket-sequences': ['stack', 74],
  'brainteaser': ['special-misc', 56],
  'simulation': ['simulation', 48],
  'enumeration': ['enumeration', 46],
  'counting': ['hash', 50],
  'math': ['misc-math', 52],
  'string': ['special-misc', 40],
  'array': ['special-misc', 30],
  'database': null,
};

/* ---------------- 参数 ---------------- */
const argv = process.argv.slice(2);
const onlyCF = argv.includes('--cf');
const onlyLC = argv.includes('--lc');
const minIdx = argv.indexOf('--min');
const MIN_PRIO = minIdx >= 0 ? Number(argv[minIdx + 1]) : 60;
const doCF = onlyLC ? false : true;
const doLC = onlyCF ? false : true;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, opts, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, opts);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === tries) throw e;
      process.stderr.write(`  ! 第 ${i} 次失败(${e.message})，${i * 1200}ms 后重试…\n`);
      await sleep(i * 1200);
    }
  }
}

function convert(tags, map) {
  const hits = [];
  for (const t of tags || []) {
    const m = map[t];
    if (!m) continue;
    const [id, prio] = m;
    if (hits.some((h) => h.id === id)) continue;
    hits.push({ id, prio });
  }
  hits.sort((a, b) => b.prio - a.prio);
  if (!hits.length || hits[0].prio < MIN_PRIO) return null;
  return { answer: hits[0].id, alts: hits.slice(1, 4).map((h) => h.id) };
}

function emit(name, rows, meta) {
  if (!rows.length) {
    console.log(`  · ${name}: 0 条，跳过写入`);
    return;
  }
  const body = rows.map((r) => JSON.stringify(r)).join(',\n');
  const src = `/* AlgoPick 自动生成的大题库 —— 请勿手工编辑，重新运行 tools/build-banks.mjs 即可更新。
 * 生成时间: ${new Date().toISOString()}
 * 来源: ${meta.source}
 * 条目: ${rows.length}
 * 格式: [题号, 题名, 难度或rating, [标签...], 原题URL]
 */
window.${name} = [
${body}
].map(function (r) {
  return {
    id: r[5], src: r[6], srcId: String(r[0]), title: r[1],
    difficulty: r[2], rating: typeof r[3] === 'number' ? r[3] : null,
    url: r[4], answer: [r[7][0]], alternatives: r[7].slice(1),
    statement: ''
  };
});
`;
  const file = path.join(DATA, name === 'BANK_CF' ? 'bank-cf.js' : 'bank-lc.js');
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(file, src, 'utf8');
  const kb = (Buffer.byteLength(src, 'utf8') / 1024).toFixed(0);
  console.log(`  ✓ ${path.relative(ROOT, file)}  ${rows.length} 题  ${kb} KB`);
}

/* ---------------- Codeforces ---------------- */
async function buildCF() {
  console.log('→ 拉取 Codeforces problemset…');
  const data = await getJSON('https://codeforces.com/api/problemset.problems');
  if (data.status !== 'OK') throw new Error('Codeforces API 返回 ' + data.status);
  const probs = data.result.problems;
  console.log(`  官方题目 ${probs.length} 道，开始筛选…`);
  const rows = [];
  const seen = new Set();
  const dropped = { noTag: 0, weak: 0, noRating: 0, noContest: 0, dup: 0 };
  for (const p of probs) {
    if (!p.contestId || !p.index) { dropped.noContest++; continue; }
    if (p.rating == null) { dropped.noRating++; continue; }
    if (!p.tags || !p.tags.length) { dropped.noTag++; continue; }
    const sid = p.contestId + p.index;
    if (seen.has(sid)) { dropped.dup++; continue; }   // 官方 API 存在重复条目
    const c = convert(p.tags, CF_MAP);
    if (!c) { dropped.weak++; continue; }
    seen.add(sid);
    const diff = p.rating < 1300 ? 'easy' : p.rating <= 1900 ? 'medium' : 'hard';
    rows.push([p.contestId + p.index, p.name, diff, p.rating,
      `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      'cf-' + sid, 'Codeforces', [c.answer, ...c.alts]]);
  }
  console.log(`  跳过: 无标签 ${dropped.noTag} / 标签信息量不足 ${dropped.weak} / 无难度 ${dropped.noRating} / 无编号 ${dropped.noContest} / 重复 ${dropped.dup}`);
  emit('BANK_CF', rows, { source: 'Codeforces official API (problemset.problems)' });
  return rows.length;
}

/* ---------------- LeetCode ---------------- */
const LC_QUERY = `query problemsetQuestionList($categorySlug:String,$limit:Int,$skip:Int,$filters:QuestionListFilterInput){questionList(categorySlug:$categorySlug,limit:$limit,skip:$skip,filters:$filters){total:totalNum data{difficulty frontendQuestionId:questionFrontendId title titleSlug paidOnly:isPaidOnly topicTags{slug name}}}}`;

async function buildLC() {
  console.log('→ 拉取 LeetCode 公开题库…');
  const rows = [];
  const PAGE = 100;
  let skip = 0, total = null;
  while (total === null || skip < total) {
    const body = JSON.stringify({ query: LC_QUERY, variables: { categorySlug: 'all-code-essentials', limit: PAGE, skip, filters: {} } });
    const j = await getJSON('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com/problemset/', 'User-Agent': 'Mozilla/5.0 (compatible; AlgoPick/1.0)' },
      body
    });
    const list = j.data && j.data.questionList;
    if (!list) throw new Error('LeetCode 返回结构异常: ' + JSON.stringify(j).slice(0, 300));
    total = list.total;
    for (const q of list.data) {
      if (q.paidOnly) continue;                       // 会员题无法阅读，跳过
      const slugs = (q.topicTags || []).map((t) => t.slug);
      const c = convert(slugs, LC_MAP);
      if (!c) continue;
      const diff = String(q.difficulty || 'Medium').toLowerCase();
      rows.push([q.frontendQuestionId, q.title, diff, null,
        `https://leetcode.cn/problems/${q.titleSlug}/`,
        'lc-' + q.frontendQuestionId, 'LeetCode', [c.answer, ...c.alts]]);
    }
    skip += PAGE;
    process.stdout.write(`\r  已处理 ${Math.min(skip, total)}/${total} 题，入选 ${rows.length} 道   `);
    await sleep(500);
  }
  process.stdout.write('\n');
  emit('BANK_LC', rows, { source: 'LeetCode public GraphQL problem list' });
  return rows.length;
}

/* ---------------- main ---------------- */
(async () => {
  console.log(`AlgoPick 题库生成器  (标签信息量门槛 = ${MIN_PRIO})`);
  let cf = 0, lc = 0;
  if (doCF) { try { cf = await buildCF(); } catch (e) { console.error('Codeforces 失败: ' + e.message); } }
  if (doLC) { try { lc = await buildLC(); } catch (e) { console.error('LeetCode 失败: ' + e.message); } }
  console.log(`\n完成：Codeforces ${cf} 题，LeetCode ${lc} 题，合计 ${cf + lc} 题。`);
  console.log('现在刷新 index.html 即可在「来源」筛选里看到这些题库。');
})();
