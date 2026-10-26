/* AlgoPick 知识点讲解 · 第 3 组 */
window.LEARN_3 = {
  "tree-dp": {
    intro: "在树上自底向上合并子树信息：把「以某节点为根的子树」当作子问题，DFS 后序时把儿子的答案汇总给父亲。",
    identify: ["状态挂在子树上，父子间有转移", "求树上最大独立集/直径/选点", "可自底向上合并、无后效性"],
    ops: [
      { name: "建树", py: ["g = [[] for _ in range(n)]", "for a, b in edges:", "    g[a].append(b)", "    g[b].append(a)"].join("\n"), note: "邻接表存无向边" },
      { name: "后序 DFS", py: ["def dfs(u, fa):", "    res = base(u)", "    for v in g[u]:", "        if v == fa:", "            continue", "        res = merge(res, dfs(v, u))", "    return res"].join("\n"), note: "先算完儿子再算自己" },
      { name: "设计状态", py: ["take = 1        # 选 u", "skip = 0        # 不选 u"].join("\n"), note: "选与不选两套值" },
      { name: "合并转移", py: ["take += sv      # 选 u 时儿子不能选", "skip += max(tv, sv)"].join("\n"), note: "按题意取 max 或求和" },
      { name: "换根", py: ["def reroot(u, fa, from_fa):", "    dp[u] = merge(dp[u], from_fa)", "    for v in g[u]:", "        if v != fa:", "            reroot(v, u, up_part(u, v))"].join("\n"), note: "第二次 DFS 修正父方向贡献" }
    ],
    template: ["import sys", "def max_independent_set(n, edges):", "    g = [[] for _ in range(n)]", "    for a, b in edges:", "        g[a].append(b)", "        g[b].append(a)", "    sys.setrecursionlimit(300000)", "    def dfs(u, fa):", "        take, skip = 1, 0          # 选 u / 不选 u", "        for v in g[u]:", "            if v == fa:", "                continue", "            tv, sv = dfs(v, u)", "            take += sv             # 选 u 则儿子都不能选", "            skip += max(tv, sv)    # 不选 u 则儿子随意", "        return take, skip", "    t, s = dfs(0, -1)", "    return max(t, s)"].join("\n"),
    complexity: "时间 O(n)，空间 O(n)，递归栈最深 O(n)",
    applications: ["树上最大独立集", "树的直径与重心", "树上背包", "换根 DP 求最远点", "树上方案计数"],
    pitfalls: ["递归太深要调大 setrecursionlimit", "换根时别漏掉父方向的那部分贡献"],
    links: [
      { t: "B站 · 树形DP 入门", u: "https://search.bilibili.com/all?keyword=树形DP 入门" },
      { t: "OI Wiki · 树形DP", u: "https://oi-wiki.org/dp/tree/" },
      { t: "洛谷 · P1352 没有上司的舞会", u: "https://www.luogu.com.cn/problem/P1352" },
      { t: "LeetCode · 动态规划题单", u: "https://leetcode.cn/problemset/?tags=dynamic-programming" }
    ]
  },
  "lca": {
    intro: "预处理每个点向上 2^k 级祖先构成倍增表，查询时先把两点抬到同一深度，再一起向上跳，得到最近公共祖先。",
    identify: ["树上两点路径或距离问题", "反复询问最近公共祖先", "需要在线 O(log n) 回答"],
    ops: [
      { name: "建图", py: ["g = [[] for _ in range(n)]", "for a, b in edges:", "    g[a].append(b)", "    g[b].append(a)"].join("\n"), note: "无向树邻接表" },
      { name: "求深度", py: ["dep = [-1] * n", "dep[root] = 0", "order = [root]", "for u in order:", "    for v in g[u]:", "        if dep[v] < 0:", "            dep[v] = dep[u] + 1"].join("\n"), note: "层序或 DFS 都行" },
      { name: "倍增表", py: ["L = n.bit_length()", "up = [[root] * n for _ in range(L)]", "for k in range(1, L):", "    for v in range(n):", "        up[k][v] = up[k - 1][up[k - 1][v]]"].join("\n"), note: "up[k][v] 是 2^k 级祖先" },
      { name: "抬到同深", py: ["if dep[u] < dep[v]:", "    u, v = v, u", "d = dep[u] - dep[v]", "for k in range(L):", "    if d >> k & 1:", "        u = up[k][u]"].join("\n"), note: "先按二进制差跳" },
      { name: "一起上跳", py: ["for k in range(L - 1, -1, -1):", "    if up[k][u] != up[k][v]:", "        u, v = up[k][u], up[k][v]", "return up[0][u]"].join("\n"), note: "跳到 LCA 的儿子" }
    ],
    template: ["def solve(n, edges, queries, root=0):", "    g = [[] for _ in range(n)]", "    for a, b in edges:", "        g[a].append(b)", "        g[b].append(a)", "    L = max(1, n.bit_length())", "    up = [[root] * n for _ in range(L)]", "    dep = [-1] * n", "    dep[root] = 0", "    order = [root]", "    for u in order:                    # 层序求父亲与深度", "        for v in g[u]:", "            if dep[v] < 0:", "                dep[v] = dep[u] + 1", "                up[0][v] = u", "                order.append(v)", "    for k in range(1, L):              # 递推 2^k 级祖先", "        for v in range(n):", "            up[k][v] = up[k - 1][up[k - 1][v]]", "    def lca(u, v):", "        if dep[u] < dep[v]:", "            u, v = v, u", "        d = dep[u] - dep[v]", "        for k in range(L):             # 抬到同一深度", "            if d >> k & 1:", "                u = up[k][u]", "        if u == v:", "            return u", "        for k in range(L - 1, -1, -1): # 再一起向上跳", "            if up[k][u] != up[k][v]:", "                u, v = up[k][u], up[k][v]", "        return up[0][u]", "    return [lca(u, v) for u, v in queries]"].join("\n"),
    complexity: "预处理 O(n log n)，每次询问 O(log n)，空间 O(n log n)",
    applications: ["树上两点距离", "树上路径最值/计数", "虚树与树上差分", "判断祖先关系"],
    pitfalls: ["抬升时要先用变量存住深度差", "根的父亲要指向自己，别用 -1 越界"],
    links: [
      { t: "OI Wiki · 最近公共祖先", u: "https://oi-wiki.org/graph/lca/" },
      { t: "cp-algorithms · LCA 与倍增", u: "https://cp-algorithms.com/graph/lca_binary_lifting.html" },
      { t: "洛谷 · P3379 模板 最近公共祖先", u: "https://www.luogu.com.cn/problem/P3379" },
      { t: "B站 · LCA 倍增讲解", u: "https://search.bilibili.com/all?keyword=最近公共祖先 LCA 倍增" }
    ]
  },
  "trie": {
    intro: "把字符当作边的多叉树存放字符串集合，公共前缀共享同一条路径，沿边走到底就能查询或统计前缀。",
    identify: ["大量字符串前缀查询/统计", "异或最大对、单词替换", "需要按字符逐步匹配"],
    ops: [
      { name: "新建节点", py: ["nxt = [[-1] * 26]", "end = [False]"].join("\n"), note: "26 个小写字母" },
      { name: "插入", py: ["cur = 0", "for ch in w:", "    c = ord(ch) - 97", "    if nxt[cur][c] < 0:", "        nxt[cur][c] = len(nxt)", "        nxt.append([-1] * 26)", "        end.append(False)", "    cur = nxt[cur][c]", "end[cur] = True"].join("\n"), note: "边走边开节点" },
      { name: "查询前缀", py: ["node = 0", "for ch in p:", "    c = ord(ch) - 97", "    if nxt[node][c] < 0:", "        return False", "    node = nxt[node][c]", "return True"].join("\n"), note: "走不动说明不存在" },
      { name: "统计前缀个数", py: ["cnt = [0] * len(nxt)", "# 插入时对每个经过的节点 cnt[cur] += 1", "# 查询时返回 cnt[node]"].join("\n"), note: "节点上挂计数" },
      { name: "01 Trie", py: ["# 把整数按二进制位从高到低插入", "for b in range(30, -1, -1):", "    c = (x >> b) & 1", "    if nxt[cur][c] < 0:", "        nxt[cur][c] = len(nxt)", "        nxt.append([-1, -1])", "    cur = nxt[cur][c]"].join("\n"), note: "求最大异或对" }
    ],
    template: ["def build(words):", "    nxt = [[-1] * 26]", "    end = [False]", "    for w in words:", "        cur = 0", "        for ch in w:", "            c = ord(ch) - 97", "            if nxt[cur][c] < 0:      # 新建节点", "                nxt[cur][c] = len(nxt)", "                nxt.append([-1] * 26)", "                end.append(False)", "            cur = nxt[cur][c]", "        end[cur] = True               # 单词结尾标记", "    return nxt, end", "def has_prefix(nxt, end, prefix):", "    node = 0", "    for ch in prefix:", "        c = ord(ch) - 97", "        if nxt[node][c] < 0:", "            return False", "        node = nxt[node][c]", "    return True"].join("\n"),
    complexity: "插入/查询 O(L)，L 为串长；空间 O(总字符数 × 字符集)",
    applications: ["前缀匹配与自动补全", "单词是否存在与前缀计数", "最大异或对", "字符串排序去重"],
    pitfalls: ["结尾标记要单独存，不能只看有子节点", "字符集大时改字典存儿子省空间"],
    links: [
      { t: "OI Wiki · 字典树 Trie", u: "https://oi-wiki.org/string/trie/" },
      { t: "LeetCode · 字典树题单", u: "https://leetcode.cn/problemset/?tags=trie" },
      { t: "洛谷 · P8306 模板 字典树", u: "https://www.luogu.com.cn/problem/P8306" },
      { t: "B站 · 字典树 Trie 讲解", u: "https://search.bilibili.com/all?keyword=字典树 Trie 讲解" }
    ]
  },
  "segment-tree": {
    intro: "把区间不断二分建成完全二叉树，每个节点维护对应区间的信息，从而支持区间查询与单点或区间修改。",
    identify: ["区间查询且元素会修改", "维护区间和/最值/计数", "需要 O(log n) 的区间合并"],
    ops: [
      { name: "建树", py: ["# 迭代版：size 取 2 的幂", "for i, x in enumerate(a):", "    tree[size + i] = x", "for i in range(size - 1, 0, -1):", "    tree[i] = tree[2 * i] + tree[2 * i + 1]"].join("\n"), note: "自底向上合并" },
      { name: "单点修改", py: ["p = size + i", "tree[p] = val", "p >>= 1", "while p:", "    tree[p] = tree[2 * p] + tree[2 * p + 1]", "    p >>= 1"].join("\n"), note: "改完向上更新" },
      { name: "区间查询", py: ["l += size", "r += size", "while l <= r:", "    if l & 1:", "        res += tree[l]; l += 1", "    if not r & 1:", "        res += tree[r]; r -= 1", "    l >>= 1; r >>= 1"].join("\n"), note: "左闭右闭区间" },
      { name: "懒标记", py: ["def push(p):", "    tree[2 * p] += lazy[p]", "    lazy[2 * p] += lazy[p]", "    tree[2 * p + 1] += lazy[p]", "    lazy[2 * p + 1] += lazy[p]", "    lazy[p] = 0"].join("\n"), note: "区间修改时延迟下推" },
      { name: "合并信息", py: ["# 求和：tree[p] = tree[2*p] + tree[2*p+1]", "# 求最值：tree[p] = max(tree[2*p], tree[2*p+1])"].join("\n"), note: "按题目换合并方式" }
    ],
    template: ["def build(a):", "    n = len(a)", "    size = 1", "    while size < n:", "        size <<= 1", "    tree = [0] * (2 * size)", "    for i, x in enumerate(a):          # 填叶子", "        tree[size + i] = x", "    for i in range(size - 1, 0, -1):   # 自底向上建树", "        tree[i] = tree[2 * i] + tree[2 * i + 1]", "    return size, tree", "def update(size, tree, i, val):", "    p = size + i", "    tree[p] = val                     # 改叶子", "    p >>= 1", "    while p:", "        tree[p] = tree[2 * p] + tree[2 * p + 1]", "        p >>= 1", "def query(size, tree, l, r):", "    res = 0", "    l += size", "    r += size", "    while l <= r:                     # 闭区间 [l, r]", "        if l & 1:", "            res += tree[l]", "            l += 1", "        if not r & 1:", "            res += tree[r]", "            r -= 1", "        l >>= 1", "        r >>= 1", "    return res"].join("\n"),
    complexity: "建树 O(n)，单点修改与区间查询 O(log n)，空间 O(n)",
    applications: ["区间和/最值查询", "区间加与区间求和", "区间染色与覆盖", "扫描线求矩形面积"],
    pitfalls: ["懒标记要连同父节点信息一起下推", "非 2 的幂长度时多出的叶子要设成单位元"],
    links: [
      { t: "OI Wiki · 线段树", u: "https://oi-wiki.org/ds/seg/" },
      { t: "cp-algorithms · Segment Tree", u: "https://cp-algorithms.com/data_structures/segment_tree.html" },
      { t: "洛谷 · P3372 模板 线段树 1", u: "https://www.luogu.com.cn/problem/P3372" },
      { t: "LeetCode · 线段树题单", u: "https://leetcode.cn/problemset/?tags=segment-tree" },
      { t: "B站 · 线段树入门", u: "https://search.bilibili.com/all?keyword=线段树 入门" }
    ]
  },
  "fenwick": {
    intro: "用 lowbit 把前缀和拆成若干不重叠的区间块，单点加与前缀和都只要 O(log n)，常数小、代码极短。",
    identify: ["只有单点修改加前缀和查询", "求逆序对/区间不同数", "需要极短模板与低常数"],
    ops: [
      { name: "单点加", py: ["i += 1", "while i <= n:", "    t[i] += v", "    i += i & -i"].join("\n"), note: "沿 lowbit 上跳" },
      { name: "前缀和", py: ["s = 0", "while i > 0:", "    s += t[i]", "    i -= i & -i", "return s"].join("\n"), note: "沿 lowbit 下跳" },
      { name: "区间和", py: ["prefix(r + 1) - prefix(l)"].join("\n"), note: "两次前缀和相减" },
      { name: "区间加单点查", py: ["# 用差分数组建树状数组", "add(l, v)", "add(r + 1, -v)", "# 单点值 = prefix(i)"].join("\n"), note: "差分思想" },
      { name: "求逆序对", py: ["cnt = 0", "for i in range(n - 1, -1, -1):", "    cnt += prefix(a[i] - 1)", "    add(a[i], 1)"].join("\n"), note: "从右往左统计更小值" }
    ],
    template: ["class Fenwick:", "    def __init__(self, n):", "        self.n = n", "        self.t = [0] * (n + 1)", "    def add(self, i, v):            # 单点加 v，下标 0 起", "        i += 1", "        while i <= self.n:", "            self.t[i] += v", "            i += i & -i", "    def prefix(self, i):            # 前缀和 [0, i)", "        s = 0", "        while i > 0:", "            s += self.t[i]", "            i -= i & -i", "        return s", "    def range_sum(self, l, r):      # 区间和 [l, r]", "        return self.prefix(r + 1) - self.prefix(l)"].join("\n"),
    complexity: "单点修改与前缀和均 O(log n)，空间 O(n)",
    applications: ["动态前缀和", "求逆序对个数", "区间加单点查", "区间不同元素计数"],
    pitfalls: ["内部 1 起下标，对外要加一减一", "树状数组不支持任意区间最值修改"],
    links: [
      { t: "OI Wiki · 树状数组", u: "https://oi-wiki.org/ds/fenwick/" },
      { t: "cp-algorithms · Fenwick Tree", u: "https://cp-algorithms.com/data_structures/fenwick.html" },
      { t: "洛谷 · P3374 模板 树状数组 1", u: "https://www.luogu.com.cn/problem/P3374" },
      { t: "LeetCode · 树状数组题单", u: "https://leetcode.cn/problemset/?tags=binary-indexed-tree" },
      { t: "B站 · 树状数组讲解", u: "https://search.bilibili.com/all?keyword=树状数组 讲解" }
    ]
  },
  "sparse-table": {
    intro: "预处理每个位置起长度为 2^k 的区间最值，查询时取覆盖区间的两块求最值，静态数据上做到 O(1)。",
    identify: ["数组静态不变、只查询", "区间最值 RMQ", "需要 O(1) 单次查询"],
    ops: [
      { name: "第 0 层", py: ["st = [a[:]]    # 长度为 1 的区间"].join("\n"), note: "长度 1 即原数组" },
      { name: "递推建表", py: ["for k in range(1, K):", "    half = 1 << (k - 1)", "    cur = [min(st[k-1][i], st[k-1][i+half])", "           for i in range(n - (1 << k) + 1)]", "    st.append(cur)"].join("\n"), note: "两块拼成一块" },
      { name: "查询", py: ["k = (r - l + 1).bit_length() - 1", "return min(st[k][l], st[k][r - (1 << k) + 1])"].join("\n"), note: "允许两块重叠" },
      { name: "求最值下标", py: ["# 表中存下标，比较时用 a[idx] 比大小", "i1 = st[k][l]", "i2 = st[k][r - (1 << k) + 1]", "return i1 if a[i1] <= a[i2] else i2"].join("\n"), note: "RMQ 下标版" },
      { name: "拓展", py: ["# 只有可重复贡献的运算能用（min/max/gcd/and/or）", "# 求和不可用稀疏表，请改前缀和或树状数组"].join("\n"), note: "注意适用运算" }
    ],
    template: ["import math", "def build(a):", "    n = len(a)", "    K = max(1, n.bit_length())", "    st = [a[:]]                        # 长度为 1 的区间", "    for k in range(1, K):", "        prev = st[k - 1]", "        half = 1 << (k - 1)", "        cur = [min(prev[i], prev[i + half])", "               for i in range(n - (1 << k) + 1)]", "        st.append(cur)", "    return st", "def query(st, l, r):                   # 闭区间 [l, r]", "    k = (r - l + 1).bit_length() - 1", "    return min(st[k][l], st[k][r - (1 << k) + 1])"].join("\n"),
    complexity: "预处理 O(n log n)，查询 O(1)，空间 O(n log n)",
    applications: ["静态区间最值", "区间 gcd / 按位与或", "滑动窗口最值", "求区间最值出现位置"],
    pitfalls: ["只适合静态数组，元素一变就失效", "求和这类不可重复贡献的运算不能用"],
    links: [
      { t: "OI Wiki · 稀疏表 ST", u: "https://oi-wiki.org/ds/sparse-table/" },
      { t: "cp-algorithms · Sparse Table", u: "https://cp-algorithms.com/data_structures/sparse-table.html" },
      { t: "洛谷 · P3865 模板 ST表", u: "https://www.luogu.com.cn/problem/P3865" },
      { t: "B站 · ST表 RMQ 讲解", u: "https://search.bilibili.com/all?keyword=ST表 RMQ" }
    ]
  },
  "ds-misc": {
    intro: "围绕有序集合与优先队列组合出的常用结构：堆维护极值、双堆维护中位数、平衡树维护第 k 小与前后驱。",
    identify: ["要动态取最大/最小或中位数", "需要第 k 小、前驱后继", "有序集合增删查都要快"],
    ops: [
      { name: "堆取极值", py: ["import heapq", "heapq.heappush(h, x)", "heapq.heappop(h)", "h[0]          # 最小值"].join("\n"), note: "大根堆存相反数" },
      { name: "双堆求中位数", py: ["heapq.heappush(lo, -x)", "heapq.heappush(hi, -heapq.heappop(lo))", "if len(hi) > len(lo):", "    heapq.heappush(lo, -heapq.heappop(hi))"].join("\n"), note: "左右两半各一个堆" },
      { name: "有序数组二分", py: ["import bisect", "i = bisect.bisect_left(a, x)", "a.insert(i, x)          # 注意 O(n) 搬移"].join("\n"), note: "静态或小数据够用" },
      { name: "平衡树操作", py: ["# Treap / Splay 支持：", "insert(x)  erase(x)", "kth(k)   rank(x)", "pre(x)    nxt(x)"].join("\n"), note: "全部 O(log n)" },
      { name: "懒惰删除", py: ["# 用堆 + 计数记录已删元素，", "# 取堆顶时把已删的弹掉即可"].join("\n"), note: "免去真正的删除" }
    ],
    template: ["import heapq", "class MedianFinder:", "    def __init__(self):", "        self.lo = []            # 大根堆，存相反数", "        self.hi = []            # 小根堆，存较大的一半", "    def add(self, x):", "        heapq.heappush(self.lo, -x)", "        heapq.heappush(self.hi, -heapq.heappop(self.lo))", "        if len(self.hi) > len(self.lo):   # 保持 lo 不小于 hi", "            heapq.heappush(self.lo, -heapq.heappop(self.hi))", "    def median(self):", "        if len(self.lo) > len(self.hi):", "            return -self.lo[0]", "        return (-self.lo[0] + self.hi[0]) / 2"].join("\n"),
    complexity: "堆操作 O(log n)；平衡树增删查 kth 均 O(log n)",
    applications: ["数据流中位数", "带删除的堆顶查询", "第 k 小元素查询", "滑动窗口最值"],
    pitfalls: ["Python 的 heapq 是小根堆，最大值要存相反数", "有序列表插入是 O(n)，别在大数据上乱用"],
    links: [
      { t: "OI Wiki · 平衡树 Treap", u: "https://oi-wiki.org/ds/treap/" },
      { t: "OI Wiki · 二叉堆", u: "https://oi-wiki.org/ds/heap/" },
      { t: "Python 文档 · heapq 堆队列", u: "https://docs.python.org/zh-cn/3/library/heapq.html" },
      { t: "LeetCode · 设计类题单", u: "https://leetcode.cn/problemset/?tags=design" },
      { t: "B站 · 平衡树 Treap 讲解", u: "https://search.bilibili.com/all?keyword=平衡树 Treap 讲解" }
    ]
  },
  "recursion": {
    intro: "把问题拆成规模更小的同类子问题，写清边界条件与状态含义后函数自己调用自己，注意栈深与重复子问题。",
    identify: ["问题可拆成同类更小规模", "树/分治结构天然递归", "需要回溯时天然配套栈"],
    ops: [
      { name: "定边界", py: ["if k < 2:", "    return k"].join("\n"), note: "最小子问题直接返回" },
      { name: "拆子问题", py: ["a = fib(k - 1)", "b = fib(k - 2)"].join("\n"), note: "规模必须变小" },
      { name: "合并结果", py: ["return a + b"].join("\n"), note: "把子答案组合起来" },
      { name: "记忆化", py: ["if k in memo:", "    return memo[k]", "memo[k] = v", "return v"].join("\n"), note: "避免重复计算" },
      { name: "加深度", py: ["import sys", "sys.setrecursionlimit(300000)"].join("\n"), note: "Python 默认栈较浅" }
    ],
    template: ["import sys", "def fib_list(n):", "    sys.setrecursionlimit(10000)", "    memo = {}", "    def fib(k):                 # 记忆化递归", "        if k < 2:               # 边界", "            return k", "        if k in memo:           # 已经算过", "            return memo[k]", "        memo[k] = fib(k - 1) + fib(k - 2)", "        return memo[k]", "    return [fib(i) for i in range(n + 1)]", "def depth(n):                   # 走到叶子的路径数", "    if n <= 1:", "        return 1", "    return depth(n - 1) + depth(n - 2)"].join("\n"),
    complexity: "取决于子问题个数；记忆化后每个状态只算一次",
    applications: ["树与图的深度遍历", "分治算法实现", "记忆化搜索", "汉诺塔与排列生成"],
    pitfalls: ["忘记写边界会导致栈溢出", "纯递归无记忆化会指数级重复计算"],
    links: [
      { t: "Python 文档 · 定义函数", u: "https://docs.python.org/zh-cn/3/tutorial/controlflow.html#defining-functions" },
      { t: "OI Wiki · 分治", u: "https://oi-wiki.org/basic/divide-and-conquer/" },
      { t: "LeetCode · 递归题单", u: "https://leetcode.cn/problemset/?tags=recursion" },
      { t: "B站 · 递归入门讲解", u: "https://search.bilibili.com/all?keyword=递归 入门 讲解" }
    ]
  },
  "backtracking": {
    intro: "按决策树一层层构造解，走不通就撤销这一步回到上一层，配合剪枝能大幅砍掉无效搜索分支。",
    identify: ["求所有排列/组合/子集", "棋盘类放置与路径搜索", "需要枚举可行解并剪枝"],
    ops: [
      { name: "选择", py: ["path.append(x)", "used[i] = True"].join("\n"), note: "进入下一层前做选择" },
      { name: "递归", py: ["dfs(i + 1)"].join("\n"), note: "把决策交给下一层" },
      { name: "撤销", py: ["path.pop()", "used[i] = False"].join("\n"), note: "回来时恢复现场" },
      { name: "收集答案", py: ["if 满足结束条件:", "    res.append(path[:])", "    return"].join("\n"), note: "一定要拷贝一份" },
      { name: "剪枝", py: ["if 已不可能满足条件:", "    return", "if i > 0 and a[i] == a[i-1] and not used[i-1]:", "    continue        # 去重"].join("\n"), note: "越早剪越好" }
    ],
    template: ["def permutations(nums):", "    n = len(nums)", "    used = [False] * n", "    path, res = [], []", "    def dfs():                    # 全排列", "        if len(path) == n:", "            res.append(path[:])   # 拷贝答案", "            return", "        for i in range(n):", "            if used[i]:", "                continue", "            used[i] = True", "            path.append(nums[i])", "            dfs()", "            path.pop()            # 撤销选择", "            used[i] = False", "    dfs()", "    return res", "def subsets(nums):", "    res, path = [], []", "    def dfs(i):                   # 子集：选或不选", "        if i == len(nums):", "            res.append(path[:])", "            return", "        dfs(i + 1)", "        path.append(nums[i])", "        dfs(i + 1)", "        path.pop()", "    dfs(0)", "    return res"].join("\n"),
    complexity: "全排列 O(n!·n)，子集 O(2^n)；空间 O(n) 递归栈",
    applications: ["全排列与组合枚举", "N 皇后与数独", "子集与目标和", "迷宫路径搜索"],
    pitfalls: ["忘记撤销选择会污染后续分支", "答案要拷贝 path，别直接存引用"],
    links: [
      { t: "OI Wiki · 回溯法", u: "https://oi-wiki.org/search/backtracking/" },
      { t: "LeetCode · 回溯题单", u: "https://leetcode.cn/problemset/?tags=backtracking" },
      { t: "洛谷 · P1706 全排列问题", u: "https://www.luogu.com.cn/problem/P1706" },
      { t: "B站 · 回溯算法 全排列", u: "https://search.bilibili.com/all?keyword=回溯算法 全排列" }
    ]
  },
  "bit-manipulation": {
    intro: "把整数看成二进制位的集合，用与或异或和移位做集合运算、提取最低位 1 与状态压缩，常数极小。",
    identify: ["状态可用二进制集合表示", "只关心奇偶/个数/成对抵消", "需要枚举子集或压缩状态"],
    ops: [
      { name: "lowbit", py: ["x & -x          # 取出最低位的 1"].join("\n"), note: "树状数组核心" },
      { name: "消 1", py: ["x &= x - 1      # 消掉最低位的 1"].join("\n"), note: "数一或删元素" },
      { name: "取某位", py: ["(x >> k) & 1", "x | (1 << k)    # 置 1", "x & ~(1 << k)   # 清 0", "x ^ (1 << k)    # 翻转"].join("\n"), note: "集合的四个基本操作" },
      { name: "枚举子集", py: ["s = mask", "while True:", "    ...", "    if s == 0:", "        break", "    s = (s - 1) & mask"].join("\n"), note: "遍历 mask 的所有子集" },
      { name: "异或技巧", py: ["x ^ x == 0", "# 成对元素异或后抵消，剩下的就是只出现一次的", "# 前缀异或可求区间异或"].join("\n"), note: "配对与区间异或" }
    ],
    template: ["def lowbit(x):", "    return x & -x                     # 最低位的 1", "def popcount(x):", "    c = 0", "    while x:", "        x &= x - 1                    # 每轮消掉一个 1", "        c += 1", "    return c", "def submasks(mask):", "    res = []", "    s = mask", "    while True:                       # 枚举所有子集", "        res.append(s)", "        if s == 0:", "            break", "        s = (s - 1) & mask", "    return res", "def single_number(nums):", "    x = 0", "    for v in nums:", "        x ^= v                        # 成对抵消", "    return x"].join("\n"),
    complexity: "位运算单次 O(1)；枚举子集总代价 O(3^n) 量级",
    applications: ["状态压缩 DP", "树状数组 lowbit", "只出现一次的数字", "枚举所有子集"],
    pitfalls: ["Python 整数无位数上限，注意取模与越界", "负数的补码表示别按位直接比较大小"],
    links: [
      { t: "OI Wiki · 位运算", u: "https://oi-wiki.org/math/bit/" },
      { t: "cp-algorithms · Bit manipulation", u: "https://cp-algorithms.com/algebra/bit-manipulation.html" },
      { t: "LeetCode · 位运算题单", u: "https://leetcode.cn/problemset/?tags=bit-manipulation" },
      { t: "Python 文档 · 内置类型与位运算", u: "https://docs.python.org/zh-cn/3/library/stdtypes.html" },
      { t: "B站 · 位运算技巧讲解", u: "https://search.bilibili.com/all?keyword=位运算 技巧 讲解" }
    ]
  },
  "meet-in-middle": {
    intro: "把 n 个物品分成两半各自枚举全部子集，再排序二分配对，用 2^(n/2) 的时间替代 2^n 的暴力搜索。",
    identify: ["n 约 30 到 45 的子集问题", "求目标和/异或最值", "暴力 2^n 超时但两半可枚举"],
    ops: [
      { name: "折半", py: ["half = n // 2", "left = nums[:half]", "right = nums[half:]"].join("\n"), note: "尽量均分" },
      { name: "枚举子集", py: ["sums = [0]", "for v in arr:", "    sums += [s + v for s in sums]"].join("\n"), note: "逐个元素倍增出新状态" },
      { name: "排序", py: ["right.sort()"].join("\n"), note: "为二分做准备" },
      { name: "二分配对", py: ["import bisect", "i = bisect.bisect_left(right, target - s)", "j = bisect.bisect_right(right, target - s)", "cnt += j - i"].join("\n"), note: "统计等于目标的对数" },
      { name: "去重与剪枝", py: ["# 有重复元素时对生成的和去重", "sums = sorted(set(sums))"].join("\n"), note: "减少规模" }
    ],
    template: ["import bisect", "def count_pairs(nums, target):", "    n = len(nums)", "    half = n // 2", "    def gen(arr):                     # 枚举所有子集和", "        sums = [0]", "        for v in arr:", "            sums += [s + v for s in sums]", "        return sums", "    left = gen(nums[:half])", "    right = gen(nums[half:])", "    right.sort()", "    cnt = 0", "    for s in left:                    # 左半每个和去右半找配对", "        need = target - s", "        cnt += bisect.bisect_right(right, need) - bisect.bisect_left(right, need)", "    return cnt"].join("\n"),
    complexity: "时间 O(2^(n/2) · n)，空间 O(2^(n/2))",
    applications: ["子集和等于目标计数", "子集异或最大/方案数", "大背包的暴力替代", "方程解计数"],
    pitfalls: ["n 超过 45 后 2^(n/2) 也太大", "重复元素建议先去重或改用去重枚举"],
    links: [
      { t: "B站 · 折半搜索 meet in the middle", u: "https://search.bilibili.com/all?keyword=折半搜索 meet in the middle" },
      { t: "洛谷 · P4799 世界冰球锦标赛", u: "https://www.luogu.com.cn/problem/P4799" },
      { t: "Python 文档 · bisect 二分查找", u: "https://docs.python.org/zh-cn/3/library/bisect.html" },
      { t: "LeetCode · 二分查找题单", u: "https://leetcode.cn/problemset/?tags=binary-search" }
    ]
  },
  "linear-dp": {
    intro: "状态沿着序列下标线性推进，每个位置只依赖前面若干个位置，适合求最优子段、子序列与方案计数。",
    identify: ["状态是下标 i 的前缀/结尾", "转移只依赖前几项", "求最大和/最长/方案数"],
    ops: [
      { name: "定义状态", py: ["dp[i] = 以 i 结尾的最优值"].join("\n"), note: "结尾式定义最常见" },
      { name: "写转移", py: ["dp[i] = max(dp[i - 1] + a[i], a[i])"].join("\n"), note: "接上前面或重新开始" },
      { name: "初始化", py: ["dp[0] = a[0]", "best = dp[0]"].join("\n"), note: "边界要单独设" },
      { name: "滚动数组", py: ["prev = a[0]", "for x in a[1:]:", "    prev = max(x, prev + x)"].join("\n"), note: "只留需要的几维" },
      { name: "贪心优化", py: ["import bisect", "i = bisect.bisect_left(tails, x)", "if i == len(tails):", "    tails.append(x)", "else:", "    tails[i] = x"].join("\n"), note: "LIS 的 O(n log n) 写法" }
    ],
    template: ["import bisect", "def lis(nums):", "    tails = []                        # tails[i] 长 i+1 的最小结尾", "    for x in nums:", "        i = bisect.bisect_left(tails, x)", "        if i == len(tails):", "            tails.append(x)", "        else:", "            tails[i] = x", "    return len(tails)", "def max_subarray(nums):", "    best = cur = nums[0]", "    for x in nums[1:]:                # 以当前位置结尾的最大和", "        cur = max(x, cur + x)         # 要么接上，要么重开", "        best = max(best, cur)", "    return best"].join("\n"),
    complexity: "O(n) 或 O(n log n)（LIS 贪心+二分），空间 O(n) 或 O(1)",
    applications: ["最大子段和", "最长递增子序列", "爬楼梯与打家劫舍", "数字三角形"],
    pitfalls: ["状态定义要写清「以 i 结尾」还是「前 i 个」", "答案是 dp 数组的最值，别只取 dp[n-1]"],
    links: [
      { t: "OI Wiki · 动态规划基础", u: "https://oi-wiki.org/dp/basic/" },
      { t: "LeetCode · 动态规划题单", u: "https://leetcode.cn/problemset/?tags=dynamic-programming" },
      { t: "洛谷 · P1216 数字三角形", u: "https://www.luogu.com.cn/problem/P1216" },
      { t: "B站 · 线性DP 最长上升子序列", u: "https://search.bilibili.com/all?keyword=线性DP 最长上升子序列" }
    ]
  }
};
