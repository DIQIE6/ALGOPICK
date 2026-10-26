/*!
 * 知识点 / 算法 / 数据结构 主表（唯一事实来源）
 * 浏览器: <script src="assets/patterns.js"> -> window.PATTERNS / window.PATTERN_MAP
 * Node   : require('./assets/patterns.js')
 *
 * 字段说明:
 *   id      : 稳定英文标识，题库 answer 字段只允许使用这里的 id
 *   zh      : 中文显示名
 *   en      : 英文显示名
 *   cat     : 分类（用于筛选与统计）
 *   cues    : 识别信号（讲解时展示："看到这些特征就该想到它"）
 *   aliases : 别名 / 常见叫法（题库 tags 模糊匹配用）
 */
(function (root, factory) {
  var PATTERNS = factory();
  root.PATTERNS = PATTERNS;
  root.PATTERN_MAP = PATTERNS.reduce(function (m, p) { m[p.id] = p; return m; }, {});
  if (typeof module !== 'undefined' && module.exports) module.exports = PATTERNS;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return [
    /* ---------------- 基础与数组 ---------------- */
    { id: 'simulation', zh: '模拟 / 直接实现', en: 'Simulation', cat: '基础', cues: ['题目直接描述了一个过程，按步骤照着做即可', '没有需要优化的数据结构，难点在细节与边界'] },
    { id: 'enumeration', zh: '枚举 / 暴力', en: 'Brute Force', cat: '基础', cues: ['数据范围很小（n ≤ 20 或 n² 可过）', '可以先写出朴素做法再考虑优化'] },
    { id: 'prefix-sum', zh: '前缀和', en: 'Prefix Sum', cat: '数组与字符串', cues: ['多次询问「区间和」且数组不变', '把区间求和变成两个前缀相减 O(1)'] },
    { id: 'difference', zh: '差分', en: 'Difference Array', cat: '数组与字符串', cues: ['多次「区间加同一个数」，最后统一询问', '把区间修改变成两个点的修改'] },
    { id: 'two-pointers', zh: '双指针', en: 'Two Pointers', cat: '数组与字符串', cues: ['有序数组里找一对/一段满足条件', '左右指针根据单调性向内收或同向滑动'] },
    { id: 'sliding-window', zh: '滑动窗口', en: 'Sliding Window', cat: '数组与字符串', cues: ['求「最长/最短的连续子数组」满足某条件', '窗口扩大后条件单调变化，可以用左右边界推进'] },
    { id: 'coordinate-compression', zh: '离散化', en: 'Coordinate Compression', cat: '技巧', cues: ['数值范围极大（1e9）但只出现 n 个不同值', '只关心相对大小，可以映射到 1..n'] },
    { id: 'interval-merge', zh: '区间合并', en: 'Merge Intervals', cat: '技巧', cues: ['给一堆区间，求合并后的不重叠区间', '按左端点排序后依次合并'] },
    { id: 'sweep-line', zh: '扫描线', en: 'Sweep Line', cat: '技巧', cues: ['事件按坐标排序后扫过去，用结构维护当前状态', '矩形面积并、区间覆盖次数'] },

    /* ---------------- 查找与排序 ---------------- */
    { id: 'binary-search', zh: '二分查找 / 二分答案', en: 'Binary Search', cat: '查找与排序', cues: ['答案具有单调性：「能/不能」的边界', '求「最小化的最大值」「最大化的最小值」', '在有序结构里定位'] },
    { id: 'sort', zh: '排序', en: 'Sorting', cat: '查找与排序', cues: ['排序后相邻元素才有可比性', '按关键字排序后贪心'] },
    { id: 'quickselect', zh: '第 K 大 / 快速选择', en: 'Quickselect', cat: '查找与排序', cues: ['只要第 k 个元素，不需要整体有序', '堆也能做，但要 O(n) 就用快选'] },
    { id: 'merge-sort', zh: '归并排序 / 逆序对', en: 'Merge Sort', cat: '查找与排序', cues: ['统计逆序对、偏序关系的数量', '分治合并时顺带统计'] },
    { id: 'divide-conquer', zh: '分治', en: 'Divide and Conquer', cat: '查找与排序', cues: ['问题能拆成同构的子问题再合并', '合并代价可控，复杂度 O(n log n)'] },

    /* ---------------- 线性数据结构 ---------------- */
    { id: 'hash', zh: '哈希表 / 集合', en: 'Hash Map / Set', cat: '线性结构', cues: ['需要 O(1) 判断「某个值是否出现过」「计数」', '两数之和、去重、分组归类'] },
    { id: 'stack', zh: '栈', en: 'Stack', cat: '线性结构', cues: ['括号匹配、表达式求值', '后进先出，最近未处理的元素'] },
    { id: 'monotonic-stack', zh: '单调栈', en: 'Monotonic Stack', cat: '线性结构', cues: ['求每个元素左边/右边第一个比它大（小）的元素', '柱状图最大矩形、接雨水'] },
    { id: 'queue', zh: '队列', en: 'Queue', cat: '线性结构', cues: ['先进先出，按层处理', 'BFS 的骨架'] },
    { id: 'monotonic-queue', zh: '单调队列', en: 'Monotonic Queue', cat: '线性结构', cues: ['滑动窗口内的最大值/最小值', '窗口移动时用双端队列淘汰过期元素'] },
    { id: 'heap', zh: '堆 / 优先队列', en: 'Heap / Priority Queue', cat: '线性结构', cues: ['动态地反复取当前最大/最小', '合并 K 个有序序列、带权最短路、任务调度'] },
    { id: 'linked-list', zh: '链表', en: 'Linked List', cat: '线性结构', cues: ['题目直接给链表结构', '需要在 O(1) 空间原地改指针、判断环、反转'] },
    { id: 'dsu', zh: '并查集', en: 'Union-Find / DSU', cat: '线性结构', cues: ['动态合并集合、判断连通性/是否同组', '无向图的连通块、Kruskal'] },

    /* ---------------- 树与高级结构 ---------------- */
    { id: 'tree-traversal', zh: '二叉树遍历', en: 'Tree Traversal', cat: '树与堆', cues: ['题目给二叉树，要求按深度/层处理', '前中后序、层序遍历的变形'] },
    { id: 'bst', zh: '二叉搜索树', en: 'Binary Search Tree', cat: '树与堆', cues: ['利用中序有序的性质', '验证/恢复二叉搜索树'] },
    { id: 'tree-dp', zh: '树形 DP', en: 'Tree DP', ca: '', cat: '树与堆', cues: ['在树上做选择，子节点状态决定父节点', '求树上的最大独立集、换根 DP'] },
    { id: 'lca', zh: '最近公共祖先 / 倍增', en: 'LCA / Binary Lifting', cat: '树与堆', cues: ['树上两点路径、距离、第 k 个祖先', '把向上的 k 步拆成二进制'] },
    { id: 'trie', zh: '字典树 Trie', en: 'Trie', cat: '树与堆', cues: ['大量字符串的前缀匹配/检索', '最大异或对、单词搜索'] },
    { id: 'segment-tree', zh: '线段树', en: 'Segment Tree', cat: '高级结构', cues: ['区间修改 + 区间查询，且数据在变', '需要维护区间最大/最小/和，可带懒标记'] },
    { id: 'fenwick', zh: '树状数组', en: 'Fenwick / BIT', cat: '高级结构', cues: ['单点修改 + 前缀查询，或求逆序对', '比线段树更短，但要求可差分'] },
    { id: 'sparse-table', zh: '稀疏表 / RMQ', en: 'Sparse Table', cat: '高级结构', cues: ['数组静止不变，多次询问区间最值', 'O(1) 查询，预处理 O(n log n)'] },
    { id: 'ds-misc', zh: '数据结构综合 / 平衡树', en: 'Advanced DS', cat: '高级结构', cues: ['需要动态第 k 大、区间第 k 小等复杂查询', '平衡树、可持久化结构、分块'] },

    /* ---------------- 搜索与回溯 ---------------- */
    { id: 'recursion', zh: '递归', en: 'Recursion', cat: '搜索与回溯', cues: ['问题天然可以拆成规模更小的同类问题', '递归出口 + 递推关系'] },
    { id: 'backtracking', zh: '回溯 / DFS 搜索', en: 'Backtracking', cat: '搜索与回溯', cues: ['要求枚举全部方案（排列、组合、子集）', '带剪枝的暴力搜索，n 通常 ≤ 20'] },
    { id: 'bit-manipulation', zh: '位运算', en: 'Bit Manipulation', cat: '搜索与回溯', cues: ['把状态压成整数集合', '异或、lowbit、子集枚举'] },
    { id: 'meet-in-middle', zh: '折半搜索', en: 'Meet in the Middle', cat: '搜索与回溯', cues: ['n ≈ 40 的枚举问题，2^n 太大但 2^(n/2) 可接受', '拆成两半分别枚举后合并'] },

    /* ---------------- 动态规划 ---------------- */
    { id: 'linear-dp', zh: '线性 DP', en: 'Linear DP', cat: '动态规划', cues: ['按顺序做决策，当前状态只依赖前面若干状态', '最长上升子序列、股票买卖、编辑距离'] },
    { id: 'knapsack', zh: '背包问题', en: 'Knapsack', cat: '动态规划', cues: ['在容量/预算限制下选择物品使价值最大', '每个物品选或不选（0/1）、可重复拿（完全）'] },
    { id: 'interval-dp', zh: '区间 DP', en: 'Interval DP', cat: '动态规划', cues: ['由小区间合并成大区间，如石子合并', '状态是 dp[l][r]'] },
    { id: 'bitmask-dp', zh: '状压 DP', en: 'Bitmask DP', cat: '动态规划', cues: ['n ≤ 20 且要表示「哪些元素已被使用」', 'dp[mask] 表示集合状态的最优解'] },
    { id: 'digit-dp', zh: '数位 DP', en: 'Digit DP', cat: '动态规划', cues: ['统计 [L, R] 中满足条件的数的个数', '按位枚举，用 tight 标记是否贴着上界'] },
    { id: 'memo-search', zh: '记忆化搜索', en: 'Memoized Search', cat: '动态规划', cues: ['状态转移带分支，用递归写更自然', '把已经算过的状态存起来避免重复'] },
    { id: 'tree-shape-dp', zh: 'DP 优化', en: 'DP Optimization', cat: '动态规划', cues: ['转移是 O(n²) 需要优化到 O(n log n)', '单调队列 / 斜率优化 / 四边形不等式'] },

    /* ---------------- 图论 ---------------- */
    { id: 'graph-dfs', zh: '图的遍历 DFS', en: 'Graph DFS', cat: '图论', cues: ['连通性、环检测、岛屿问题', '递归/栈深入到底再回溯'] },
    { id: 'graph-bfs', zh: 'BFS / 无权最短路', en: 'BFS', cat: '图论', cues: ['边权相同或为 1，求最少步数', '一层一层扩散，第一次到达即最短'] },
    { id: 'topological-sort', zh: '拓扑排序', en: 'Topological Sort', cat: '图论', cues: ['有向无环图上的先后依赖关系', '课程表、任务调度、判环'] },
    { id: 'dijkstra', zh: '最短路 Dijkstra', en: 'Dijkstra', cat: '图论', cues: ['非负边权单源最短路', '配合优先队列贪心扩展'] },
    { id: 'floyd', zh: 'Floyd / 全源最短路', en: 'Floyd-Warshall', cat: '图论', cues: ['n ≤ 500，要求任意两点间最短路', '三重循环，也能求传递闭包'] },
    { id: 'bellman', zh: 'Bellman-Ford / SPFA', en: 'Bellman-Ford', cat: '图论', cues: ['边权可能为负，或要判断负环', '分层松弛 k 次表示最多经过 k 条边'] },
    { id: 'mst', zh: '最小生成树', en: 'MST', cat: '图论', cues: ['用最小代价把所有点连起来', 'Kruskal + 并查集 或 Prim + 堆'] },
    { id: 'scc', zh: '强连通分量 / 缩点', en: 'SCC', cat: '图论', cues: ['有向图里互相可达的极大点集', 'Tarjan，缩点后变成 DAG'] },
    { id: 'bipartite', zh: '二分图匹配', en: 'Bipartite Matching', cat: '图论', cues: ['把问题建模成两组点之间的配对', '匈牙利算法 / 最大流'] },
    { id: 'network-flow', zh: '网络流', en: 'Network Flow', cat: '图论', cues: ['带容量限制的分配、最大收益问题', '最大流 = 最小割，Dinic 实现'] },
    { id: 'diff-constraint', zh: '差分约束 / 2-SAT', en: 'Constraints', cat: '图论', cues: ['一堆形如 x - y ≤ c 的不等式', '布尔变量二选一的逻辑关系'] },

    /* ---------------- 数学 ---------------- */
    { id: 'number-theory', zh: '数论 / 质因数', en: 'Number Theory', cat: '数学', cues: ['约数、gcd/lcm、质数筛、同余', '取模运算与逆元'] },
    { id: 'fast-power', zh: '快速幂', en: 'Fast Exponentiation', cat: '数学', cues: ['求 a^b mod p，b 很大', '把指数二进制拆分'] },
    { id: 'combinatorics', zh: '组合数学', en: 'Combinatorics', cat: '数学', cues: ['计数问题：方案数、排列组合', '预处理阶乘与逆元做 C(n,k)'] },
    { id: 'probability', zh: '概率与期望', en: 'Probability / Expectation', cat: '数学', cues: ['求随机过程下的期望值', '期望的线性性质、概率 DP'] },
    { id: 'game-theory', zh: '博弈论', en: 'Game Theory', cat: '数学', cues: ['双方轮流操作、最优策略下谁赢', 'Nim 异或、SG 函数、必胜必败态'] },
    { id: 'matrix', zh: '矩阵 / 矩阵快速幂', en: 'Matrix Exponentiation', cat: '数学', cues: ['线性递推式求第 n 项，n 极大', '把转移写成矩阵再快速幂'] },
    { id: 'geometry', zh: '计算几何', en: 'Computational Geometry', cat: '数学', cues: ['点线面关系、凸包、多边形面积', '叉积判方向，避免除法'] },
    { id: 'misc-math', zh: '数学综合 / 找规律', en: 'Math Misc', cat: '数学', cues: ['先打表找规律再证明', '构造、进制、公式化简'] },

    /* ---------------- 字符串 ---------------- */
    { id: 'kmp', zh: 'KMP / 字符串匹配', en: 'KMP', cat: '字符串', cues: ['在一个串里找另一个串的所有出现位置', '求最长 border、循环节'] },
    { id: 'string-hash', zh: '字符串哈希', en: 'Rolling Hash', cat: '字符串', cues: ['需要 O(1) 判断两个子串是否相等', '回文、重复子串、最长公共子串'] },
    { id: 'manacher', zh: 'Manacher 回文', en: 'Manacher', ca: '', cat: '字符串', cues: ['求最长回文子串 O(n)', '对称扩展 + 利用已有回文半径'] },
    { id: 'string-misc', zh: '字符串综合', en: 'String Algorithms', cat: '字符串', cues: ['AC 自动机、后缀数组、子序列自动机', '多模式串匹配'] },

    /* ---------------- 技巧与题型 ---------------- */
    { id: 'greedy', zh: '贪心', en: 'Greedy', cat: '技巧与题型', cues: ['每一步取局部最优能推出全局最优', '常配合排序/堆，需要说明交换论证'] },
    { id: 'construction', zh: '构造', en: 'Constructive', cat: '技巧与题型', cues: ['要你给出一个满足条件的方案而非最优值', '手玩小样例找构造规律'] },
    { id: 'interactive', zh: '交互题', en: 'Interactive', cat: '技巧与题型', cues: ['通过询问接口获取信息后作答', '注意询问次数上限与刷新缓冲区'] },
    { id: 'moore-vote', zh: '摩尔投票', en: 'Boyer-Moore Vote', cat: '技巧与题型', cues: ['找出出现次数超过一半的元素', '相同加一不同抵消，O(1) 空间'] },
    { id: 'randomized', zh: '随机化 / 哈希技巧', en: 'Randomized', cat: '技巧与题型', cues: ['用随机权值给元素赋值来比较集合', '蒙特卡洛判定、洗牌'] },
    { id: 'intervals-greedy', zh: '区间贪心', en: 'Interval Scheduling', cat: '技巧与题型', cues: ['选择最多不重叠的区间', '按右端点排序后贪心选'] },
    { id: 'special-misc', zh: '综合 / 其他', en: 'Misc', cat: '技巧与题型', cues: ['不属于以上任何一类，或需要多种方法组合', '读题仔细，注意特判'] }
  ];
});
