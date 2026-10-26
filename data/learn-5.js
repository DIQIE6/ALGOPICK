/* AlgoPick 知识点讲解 · 第 5 组 */
window.LEARN_5 = {
  "mst": {
    intro: "在带权无向图里挑出 n-1 条边连通所有点，使边权和最小；核心是贪心，每次选不构成环的最轻边加入森林。",
    identify: ["要求连通所有点、总代价最小", "给定带权无向边，n 个点选 n-1 条", "可能出现负权边"],
    ops: [
      { name: "Kruskal", py: ["edges.sort()", "# 按边权从小到大依次尝试加入并查集"].join("\n"), note: "稀疏图首选，O(m log m)" },
      { name: "Prim", py: ["import heapq", "# 从任意点出发，用小根堆取最小边向外扩展"].join("\n"), note: "稠密图或堆优化版本" },
      { name: "并查集 find", py: ["def find(x):", "    return x if parent[x] == x else find(parent[x])"].join("\n"), note: "判环与合并的核心结构" },
      { name: "连通判定", py: ["ok = (count == n - 1)"].join("\n"), note: "选不满 n-1 条说明图不连通" },
      { name: "次小生成树", py: ["# 枚举每条非树边，替换环上的最大边"].join("\n"), note: "在最小生成树基础上只改一条边" }
    ],
    template: ["def kruskal(n, edges):", "    # edges: (w, u, v)，返回最小生成树总权，不连通返回 -1", "    parent = list(range(n))", "", "    def find(x):", "        while parent[x] != x:", "            parent[x] = parent[parent[x]]", "            x = parent[x]", "        return x", "", "    edges.sort()", "    total = 0", "    count = 0", "    for w, u, v in edges:", "        ru, rv = find(u), find(v)", "        if ru == rv:", "            continue", "        parent[ru] = rv", "        total += w", "        count += 1", "        if count == n - 1:", "            break", "    return total if count == n - 1 else -1"].join("\n"),
    complexity: "Kruskal O(m log m)，Prim 堆优化 O(m log n)",
    applications: ["村庄修路最省花费", "网络布线", "次小生成树", "最小瓶颈路", "聚类分析"],
    pitfalls: ["图不连通时选不满边，要返回 -1 而不是 total", "Kruskal 只适用无向图，有向图要用最小树形图"],
    links: [
      { t: "OI Wiki · 最小生成树", u: "https://oi-wiki.org/graph/mst/" },
      { t: "CP-Algorithms · 最小生成树", u: "https://cp-algorithms.com/graph/mst_kruskal.html" },
      { t: "B站 · 最小生成树", u: "https://search.bilibili.com/all?keyword=最小生成树" },
      { t: "B站 · Kruskal 算法", u: "https://search.bilibili.com/all?keyword=Kruskal 算法" }
    ]
  },
  "scc": {
    intro: "把有向图中能互相到达的点缩成一个点，得到一张 DAG；Tarjan 用一次 DFS 的 dfn 与 low 找环，是缩点的标准做法。",
    identify: ["有向图、存在环或互相可达关系", "要把环缩成点变成 DAG", "统计入度出度、找必经点"],
    ops: [
      { name: "Tarjan 求 dfn/low", py: ["dfn[u] = low[u] = timer", "for v in g[u]:", "    if dfn[v] == 0: tarjan(v)"].join("\n"), note: "一次 DFS 拿到所有环的信息" },
      { name: "栈与在栈标记", py: ["stack.append(u)", "in_stk[u] = True"].join("\n"), note: "low[u] == dfn[u] 时弹栈成一个 SCC" },
      { name: "缩点重建图", py: ["for u in range(n):", "    for v in g[u]:", "        if belong[u] != belong[v]: dag[belong[u]].append(belong[v])"].join("\n"), note: "去掉分量内部的边" },
      { name: "统计入度出度", py: ["indeg[belong[v]] += 1"].join("\n"), note: "缩点后常用来数源点汇点" },
      { name: "DAG 上 DP", py: ["# 按拓扑序在缩点图上求最长路 / 方案数"].join("\n"), note: "缩点的常见后续步骤" }
    ],
    template: ["import sys", "def scc(n, g):", "    # 返回每个点所属的强连通分量编号", "    sys.setrecursionlimit(10 ** 6)", "    dfn, low, belong = [0] * n, [0] * n, [-1] * n", "    stack, in_stk, timer, cnt = [], [False] * n, 0, 0", "    def tarjan(u):", "        nonlocal timer, cnt", "        timer += 1", "        dfn[u] = low[u] = timer", "        stack.append(u); in_stk[u] = True", "        for v in g[u]:", "            if dfn[v] == 0:", "                tarjan(v)", "                low[u] = min(low[u], low[v])", "            elif in_stk[v]:", "                low[u] = min(low[u], dfn[v])", "        if low[u] == dfn[u]:", "            while True:", "                x = stack.pop(); in_stk[x] = False", "                belong[x] = cnt", "                if x == u: break", "            cnt += 1", "    for i in range(n):", "        if dfn[i] == 0: tarjan(i)", "    return belong"].join("\n"),
    complexity: "Tarjan O(n + m)，缩点重建 O(n + m)",
    applications: ["缩点后做 DAG DP", "2-SAT 判可行", "找环与必经点", "受欢迎的牛计数", "传递闭包简化"],
    pitfalls: ["递归深度不够要先调高 recursionlimit", "只在栈中的点才能用 dfn 更新 low，别写错条件"],
    links: [
      { t: "OI Wiki · 强连通分量", u: "https://oi-wiki.org/graph/scc/" },
      { t: "CP-Algorithms · 强连通分量", u: "https://cp-algorithms.com/graph/strongly-connected-components.html" },
      { t: "B站 · 强连通分量 缩点", u: "https://search.bilibili.com/all?keyword=强连通分量 缩点" },
      { t: "B站 · Tarjan 算法", u: "https://search.bilibili.com/all?keyword=Tarjan 算法" }
    ]
  },
  "bipartite": {
    intro: "二分图的最大匹配是找最多的不共端点边对；匈牙利算法沿增广路不断改进，是理解匹配与网络流的入门模型。",
    identify: ["把点分成两组，组内没有边", "求最多配对 / 能不能全部配对", "存在增广路可以改进"],
    ops: [
      { name: "染色判定", py: ["color = [-1] * n", "# DFS 交替染 0/1，冲突就不是二分图"].join("\n"), note: "先确认是二分图再匹配" },
      { name: "匈牙利匹配", py: ["for u in range(n):", "    seen = [False] * m", "    if dfs(u, seen): res += 1"].join("\n"), note: "左部每个点都尝试找增广路" },
      { name: "match 数组", py: ["match = [-1] * m", "if match[v] == -1 or dfs(match[v], seen): match[v] = u"].join("\n"), note: "记录右部点匹配到的左部点" },
      { name: "按时间戳去重", py: ["seen[v] = True", "# 每次增广路搜索要清空 seen"].join("\n"), note: "防止同一次搜索重复访问" },
      { name: "最小点覆盖", py: ["# 二分图最小点覆盖大小 == 最大匹配大小"].join("\n"), note: "Konig 定理，最常用的推论" }
    ],
    template: ["def max_match(n, m, g):", "    # 左部 n 个点，右部 m 个点，g[i] 是左点 i 能连的右点", "    match = [-1] * m", "    def dfs(u, seen):", "        for v in g[u]:", "            if seen[v]:", "                continue", "            seen[v] = True", "            if match[v] == -1 or dfs(match[v], seen):", "                match[v] = u", "                return True", "        return False", "    res = 0", "    for u in range(n):", "        seen = [False] * m", "        if dfs(u, seen):", "            res += 1", "    return res"].join("\n"),
    complexity: "匈牙利 O(n * m)，Dinic 版 O(m * sqrt(n))",
    applications: ["任务分配", "课程与教室配对", "棋盘覆盖", "最小点覆盖", "DAG 最小路径覆盖"],
    pitfalls: ["每次找增广路都要清空 seen 数组", "最小点覆盖与最大独立集都能由最大匹配推出"],
    links: [
      { t: "OI Wiki · 二分图", u: "https://oi-wiki.org/graph/bi-graph/" },
      { t: "CP-Algorithms · 二分图最大匹配", u: "https://cp-algorithms.com/graph/kuhn_maximum_bipartite_matching.html" },
      { t: "B站 · 二分图匹配", u: "https://search.bilibili.com/all?keyword=二分图匹配 匈牙利算法" },
      { t: "B站 · 最小点覆盖", u: "https://search.bilibili.com/all?keyword=二分图 最小点覆盖" }
    ]
  },
  "network-flow": {
    intro: "在有向带容量图上求最大可行流量；Dinic 用 BFS 分层加多路增广，一次把残量网络上的增广路找完。",
    identify: ["有源点汇点、边有容量限制", "求最大流 / 最小割 / 费用流", "问题能建模成供需与管道"],
    ops: [
      { name: "建边与反向边", py: ["g[u].append([v, cap, len(g[v])])", "g[v].append([u, 0, len(g[u]) - 1])"].join("\n"), note: "反向边容量为 0，两者互为 rev" },
      { name: "BFS 分层", py: ["level[v] = level[u] + 1", "if level[t] < 0: return flow"].join("\n"), note: "汇点不可达就说明没有增广路" },
      { name: "DFS 多路增广", py: ["d = dfs(v, min(f, cap))", "e[1] -= d; g[v][rev][1] += d"].join("\n"), note: "正向减多少，反向就加多少" },
      { name: "当前弧优化", py: ["it = [0] * n", "while it[u] < len(g[u]): it[u] += 1"].join("\n"), note: "避免重复扫描已废的边" },
      { name: "最小割", py: ["# 最大流 == 最小割，割集是分层后一侧可达的点"].join("\n"), note: "最大流最小割定理" }
    ],
    template: ["from collections import deque", "def max_flow(n, s, t, g):", "    # g[u] 中每条边为 [v, cap, rev]", "    flow = 0", "    while True:", "        level = [-1] * n; level[s] = 0; q = deque([s])", "        while q:", "            u = q.popleft()", "            for v, cap, _ in g[u]:", "                if cap > 0 and level[v] < 0:", "                    level[v] = level[u] + 1; q.append(v)", "        if level[t] < 0: return flow", "        def dfs(u, f):", "            if u == t: return f", "            for e in g[u]:", "                v = e[0]", "                if e[1] > 0 and level[v] == level[u] + 1:", "                    d = dfs(v, min(f, e[1]))", "                    if d > 0:", "                        e[1] -= d; g[v][e[2]][1] += d; return d", "            return 0", "        while (f := dfs(s, 10 ** 18)) > 0:", "            flow += f"].join("\n"),
    complexity: "Dinic O(n^2 * m)，单位容量图 O(m * sqrt(n))",
    applications: ["二分图匹配", "最小割建模", "最大权闭合子图", "费用流", "上下界可行流"],
    pitfalls: ["反向边容量要同步增加，忘了会死循环", "整数容量别用 float('inf')，用 10 ** 18 更稳"],
    links: [
      { t: "OI Wiki · 网络流", u: "https://oi-wiki.org/graph/flow/" },
      { t: "CP-Algorithms · Dinic 算法", u: "https://cp-algorithms.com/graph/dinic.html" },
      { t: "B站 · 网络流 Dinic", u: "https://search.bilibili.com/all?keyword=网络流 Dinic 算法" },
      { t: "B站 · 最大流最小割", u: "https://search.bilibili.com/all?keyword=最大流 最小割" }
    ]
  },
  "diff-constraint": {
    intro: "把 x_j - x_i <= c 这一组不等式看成最短路约束，跑一遍最短路即可判定可行性并得到一组解；布尔条件则用 2-SAT。",
    identify: ["一堆形如 x_j - x_i <= c 的不等式", "求变量可行解 / 判定无解", "含布尔变量与或条件用 2-SAT"],
    ops: [
      { name: "建约束边", py: ["# x[j] - x[i] <= c 连边 i -> j 权 c，跑最短路", "g[i].append((j, c))"].join("\n"), note: "符号方向决定用最短路还是最长路" },
      { name: "超级源点", py: ["for i in range(n):", "    g[n].append((i, 0))"].join("\n"), note: "保证图连通，否则判不出环" },
      { name: "SPFA 判环", py: ["if cnt[v] > n: return None", "# 负环说明无解"].join("\n"), note: "最长路版本判定的是正环" },
      { name: "输出一组解", py: ["return dist[:n]", "# 初始化值可整体平移不改变可行性"].join("\n"), note: "dist 就是满足约束的一组解" },
      { name: "2-SAT 判矛盾", py: ["# 每个布尔变量拆成 x 与 not x 两个点", "if belong[x] == belong[not_x]: 无解"].join("\n"), note: "蕴含边建成有向边后缩点" }
    ],
    template: ["from collections import deque", "def diff_constraints(n, cons):", "    # cons: (i, j, c) 表示 x[j] - x[i] >= c，返回可行解或 None", "    g = [[] for _ in range(n + 1)]", "    for i, j, c in cons:", "        g[i].append((j, c))", "    for i in range(n):", "        g[n].append((i, 0))", "    dist = [0] * (n + 1)", "    cnt = [0] * (n + 1)", "    inq = [False] * (n + 1)", "    q = deque([n])", "    inq[n] = True", "    while q:", "        u = q.popleft()", "        inq[u] = False", "        for v, w in g[u]:", "            if dist[v] < dist[u] + w:", "                dist[v] = dist[u] + w", "                cnt[v] = cnt[u] + 1", "                if cnt[v] > n:", "                    return None", "                if not inq[v]:", "                    inq[v] = True", "                    q.append(v)", "    return dist[:n]"].join("\n"),
    complexity: "SPFA 最坏 O(n * m)，2-SAT 是 O(n + m)",
    applications: ["区间选点问题", "任务先后约束", "2-SAT 布尔方程", "线性规划特例"],
    pitfalls: ["<= 用最短路，>= 用最长路，方向别搞反", "必须加超级源点，否则不连通判不出环", "2-SAT 每条蕴含要连反向逆否边，别只加一边"],
    links: [
      { t: "OI Wiki · 差分约束", u: "https://oi-wiki.org/graph/diff-constraints/" },
      { t: "OI Wiki · 2-SAT", u: "https://oi-wiki.org/graph/2-sat/" },
      { t: "B站 · 差分约束系统", u: "https://search.bilibili.com/all?keyword=差分约束系统" },
      { t: "B站 · 2-SAT 问题", u: "https://search.bilibili.com/all?keyword=2-SAT 问题" }
    ]
  },
  "number-theory": {
    intro: "处理整除、质数、同余的数学分支，竞赛里最常见的三件事是筛质数、求 gcd、算组合数取模。",
    identify: ["涉及约数 / 质因数 / 同余", "要取模且出现除法", "需要筛出范围内的质数"],
    ops: [
      { name: "gcd", py: ["from math import gcd", "g = gcd(a, b)"].join("\n"), note: "内置函数，别手写" },
      { name: "欧拉筛", py: ["primes = []", "is_c = [False] * (n + 1)", "for i in range(2, n + 1):", "    if not is_c[i]: primes.append(i)", "    for p in primes:", "        if i * p > n: break", "        is_c[i * p] = True", "        if i % p == 0: break"].join("\n"), note: "线性筛，O(n)" },
      { name: "质因数分解", py: ["d = 2", "while d * d <= x:", "    while x % d == 0:", "        x //= d", "    d += 1"].join("\n"), note: "试除到根号即可，剩数大于 1 是质因子" },
      { name: "exgcd 求逆元", py: ["def exgcd(a, b):", "    if b == 0: return a, 1, 0", "    g, x, y = exgcd(b, a % b)", "    return g, y, x - a // b * y"].join("\n"), note: "模数非质数时用它求逆元" },
      { name: "python 内置逆元", py: ["inv = pow(a, -1, p)"].join("\n"), note: "Python 3.8+ 直接支持负数指数" }
    ],
    template: ["def sieve(n):", "    # 返回 1..n 中的所有质数", "    is_c = [False] * (n + 1)", "    primes = []", "    for i in range(2, n + 1):", "        if not is_c[i]:", "            primes.append(i)", "        for p in primes:", "            if i * p > n:", "                break", "            is_c[i * p] = True", "            if i % p == 0:", "                break", "    return primes"].join("\n"),
    complexity: "欧拉筛 O(n)，单个 gcd O(log n)",
    applications: ["质因数分解", "求约数个数", "同余方程", "组合数取模", "莫比乌斯反演"],
    pitfalls: ["取模下的除法要用逆元（pow(a, -1, p)）", "1 不是质数，0 和负数要特判"],
    links: [
      { t: "B站 · 数论基础", u: "https://search.bilibili.com/all?keyword=算法 数论基础" },
      { t: "OI Wiki · 数论", u: "https://oi-wiki.org/math/number-theory/basic/" },
      { t: "B站 · 质因数分解", u: "https://search.bilibili.com/all?keyword=质因数分解 算法" },
      { t: "Python 官方文档 · math", u: "https://docs.python.org/zh-cn/3/library/math.html" }
    ]
  },
  "fast-power": {
    intro: "把 a^b 按二进制拆成若干次平方的乘积，每次指数减半、底数平方，把 O(b) 降到 O(log b)。",
    identify: ["求 a^b mod p，b 很大", "递推式带幂次或需要预处理幂", "出现矩阵或多项式快速幂"],
    ops: [
      { name: "迭代快速幂", py: ["res = 1", "while b:", "    if b & 1: res = res * a % mod", "    a = a * a % mod", "    b >>= 1"].join("\n"), note: "按二进制位逐位累乘" },
      { name: "底数先取模", py: ["a %= mod", "res = 1 % mod"].join("\n"), note: "防止中间乘法溢出，也兼容 mod 为 1" },
      { name: "费马小定理求逆元", py: ["inv = pow(a, mod - 2, mod)"].join("\n"), note: "只在 mod 是质数且 a 不整除 mod 时可用" },
      { name: "推广到矩阵", py: ["# 把乘法换成矩阵乘法，单位元换成单位矩阵"].join("\n"), note: "矩阵快速幂求线性递推" },
      { name: "幂塔与降幂", py: ["# 指数很大时用欧拉定理降幂"].join("\n"), note: "扩展欧拉定理处理指数取模" }
    ],
    template: ["def fast_pow(a, b, mod):", "    # 迭代版快速幂，返回 a^b % mod", "    res = 1 % mod", "    a %= mod", "    while b > 0:", "        if b & 1:", "            res = res * a % mod", "        a = a * a % mod", "        b >>= 1", "    return res", "", "def inv(a, mod):", "    # mod 为质数时用费马小定理求逆元", "    return fast_pow(a, mod - 2, mod)"].join("\n"),
    complexity: "O(log b)，额外空间 O(1)",
    applications: ["组合数取模", "矩阵快速幂加速递推", "费马小定理求逆元", "大指数取模", "字符串哈希"],
    pitfalls: ["底数先取模，否则中间乘法可能溢出", "指数为 0 时结果应是 1 % mod 而不是 1"],
    links: [
      { t: "OI Wiki · 快速幂", u: "https://oi-wiki.org/math/binary-exponentiation/" },
      { t: "CP-Algorithms · 二分幂", u: "https://cp-algorithms.com/algebra/binary-exp.html" },
      { t: "B站 · 快速幂", u: "https://search.bilibili.com/all?keyword=快速幂 算法" },
      { t: "B站 · 矩阵快速幂", u: "https://search.bilibili.com/all?keyword=矩阵快速幂" }
    ]
  },
  "combinatorics": {
    intro: "研究计数与选取的学科；竞赛里最常做的是预处理阶乘与其逆元，把组合数查询压到 O(1)，再处理取模。",
    identify: ["数方案数 / 排列组合计数", "组合数要取模且模数是质数", "出现递推计数需要预处理"],
    ops: [
      { name: "阶乘预处理", py: ["fact = [1] * (n + 1)", "for i in range(1, n + 1): fact[i] = fact[i - 1] * i % mod"].join("\n"), note: "O(n) 建表" },
      { name: "阶乘逆元", py: ["inv_fact[n] = pow(fact[n], mod - 2, mod)", "for i in range(n, 0, -1): inv_fact[i - 1] = inv_fact[i] * i % mod"].join("\n"), note: "从后往前倒推，全表 O(n)" },
      { name: "O(1) 组合数", py: ["C = fact[n] * inv_fact[m] % mod * inv_fact[n - m] % mod"].join("\n"), note: "常用查询方式" },
      { name: "卢卡斯定理", py: ["# n, m 很大而 mod 较小时拆成 mod 进制递归"].join("\n"), note: "处理 n 超过 mod 的情况" },
      { name: "插板法", py: ["# n 个相同物品分给 k 组非空：C(n - 1, k - 1)"].join("\n"), note: "整数解的计数模板" }
    ],
    template: ["def init_fact(n, mod):", "    # 预处理阶乘与阶乘逆元，支持 O(1) 查询组合数", "    fact = [1] * (n + 1)", "    for i in range(1, n + 1):", "        fact[i] = fact[i - 1] * i % mod", "    inv_fact = [1] * (n + 1)", "    inv_fact[n] = pow(fact[n], mod - 2, mod)", "    for i in range(n, 0, -1):", "        inv_fact[i - 1] = inv_fact[i] * i % mod", "    return fact, inv_fact", "", "def comb(n, m, fact, inv_fact, mod):", "    # 从 n 个里选 m 个，取模", "    if m < 0 or m > n:", "        return 0", "    return fact[n] * inv_fact[m] % mod * inv_fact[n - m] % mod"].join("\n"),
    complexity: "预处理 O(n)，单次查询 O(1)",
    applications: ["数路径方案数", "可重集排列", "卡特兰数", "容斥计数", "插板法分物品"],
    pitfalls: ["模数不是质数时不能用费马小定理求逆元", "n 很大 m 很小时可以直接算下降幂，不必开大表"],
    links: [
      { t: "B站 · 组合数学基础", u: "https://search.bilibili.com/all?keyword=组合数学 排列组合" },
      { t: "B站 · 组合数取模", u: "https://search.bilibili.com/all?keyword=组合数取模" },
      { t: "B站 · 卢卡斯定理", u: "https://search.bilibili.com/all?keyword=卢卡斯定理 Lucas" },
      { t: "B站 · 卡特兰数", u: "https://search.bilibili.com/all?keyword=卡特兰数" }
    ]
  },
  "probability": {
    intro: "用概率描述随机事件的分布，期望是各取值的加权平均；竞赛常按状态列期望方程，或者正推概率逆推期望。",
    identify: ["事件带概率、求期望步数或得分", "状态转移构成方程需要高斯消元", "多次独立试验求概率"],
    ops: [
      { name: "定义状态与期望", py: ["dp = [0.0] * (n + 1)", "# dp[i] 表示从状态 i 出发的期望花费"].join("\n"), note: "先想清楚状态定义再推转移" },
      { name: "逆推期望", py: ["for i in range(n - 1, -1, -1):", "    dp[i] = 1 + sum(dp[j] for j in nxt[i]) / k"].join("\n"), note: "从终点往起点推最直观" },
      { name: "正推概率", py: ["p[i + 1] += p[i] * q", "p[i] += p[i] * (1 - q)"].join("\n"), note: "概率按转移分摊" },
      { name: "期望线性性", py: ["# E(X + Y) = E(X) + E(Y)，拆成独立部分分别算"].join("\n"), note: "不用管变量是否独立" },
      { name: "高斯消元", py: ["# 状态互相依赖时列方程解，复杂度 O(n^3)"].join("\n"), note: "有环的期望方程用消元" }
    ],
    template: ["def expected_steps(n):", "    # 每次等概率走 1..6 步，求从 0 走到 n 的期望次数", "    dp = [0.0] * (n + 1)", "    for i in range(n - 1, -1, -1):", "        s = 0.0", "        for step in range(1, 7):", "            s += dp[min(i + step, n)]", "        dp[i] = 1 + s / 6", "    return dp[0]", "", "if __name__ == '__main__':", "    print(round(expected_steps(3), 4))"].join("\n"),
    complexity: "O(n * 6)，空间 O(n)；消元版 O(n^3)",
    applications: ["期望步数", "抽卡概率", "随机游走", "期望得分", "条件概率"],
    pitfalls: ["期望的平方不等于平方的期望，别混用", "概率为 0 的状态要跳过，别除以零"],
    links: [
      { t: "B站 · 概率与期望 DP", u: "https://search.bilibili.com/all?keyword=概率与期望 DP" },
      { t: "B站 · 期望 DP 入门", u: "https://search.bilibili.com/all?keyword=期望 DP 入门" },
      { t: "B站 · 概率基础", u: "https://search.bilibili.com/all?keyword=概率 基础 算法竞赛" },
      { t: "B站 · 高斯消元", u: "https://search.bilibili.com/all?keyword=高斯消元 算法" }
    ]
  },
  "game-theory": {
    intro: "研究必胜必败局面的理论；公平组合游戏用 SG 函数把局面映射成一堆 Nim 石子，异或和非零即先手必胜。",
    identify: ["两人轮流操作、无法操作者输", "局面可分解成独立子游戏", "求先手胜负 / 必胜策略"],
    ops: [
      { name: "判断终局", py: ["if x == 0:", "    return 0"].join("\n"), note: "无法操作的局面 SG 为 0" },
      { name: "记忆化求 SG", py: ["if x in memo: return memo[x]", "# 否则枚举所有后继状态"].join("\n"), note: "同一局面只算一次" },
      { name: "mex 运算", py: ["seen = set()", "g = 0", "while g in seen: g += 1"].join("\n"), note: "取最小的未出现非负整数" },
      { name: "子游戏异或", py: ["res = 0", "for x in piles: res ^= sg(x)"].join("\n"), note: "SG 定理：异或和非零先手胜" },
      { name: "巴什博弈特判", py: ["# 取 1..m 个，n % (m + 1) != 0 时先手必胜"].join("\n"), note: "最基础的取石子结论" }
    ],
    template: ["def sg(x, moves, memo):", "    # moves 是单次可取的个数集合，返回局面 x 的 SG 值", "    if x in memo:", "        return memo[x]", "    seen = set()", "    for m in moves:", "        if m <= x:", "            seen.add(sg(x - m, moves, memo))", "    g = 0", "    while g in seen:", "        g += 1", "    memo[x] = g", "    return g", "", "def first_wins(piles, moves):", "    # 多堆石子各自独立，异或和非零先手必胜", "    memo = {}", "    res = 0", "    for x in piles:", "        res ^= sg(x, moves, memo)", "    return res != 0"].join("\n"),
    complexity: "单局面 O(状态数 * 转移数)",
    applications: ["Nim 取石子", "阶梯博弈", "翻硬币游戏", "有向图博弈", "巴什博弈"],
    pitfalls: ["SG 只适用公平组合游戏，有平局要另判", "终局 SG 为 0，mex 要从 0 开始找"],
    links: [
      { t: "OI Wiki · 博弈论", u: "https://oi-wiki.org/math/game-theory/" },
      { t: "CP-Algorithms · 图上博弈", u: "https://cp-algorithms.com/game_theory/games_on_graphs.html" },
      { t: "B站 · 博弈论 Nim", u: "https://search.bilibili.com/all?keyword=博弈论 Nim" },
      { t: "B站 · SG 函数", u: "https://search.bilibili.com/all?keyword=SG 函数 博弈论" }
    ]
  },
  "matrix": {
    intro: "把线性递推写成矩阵乘法，再用快速幂把第 n 项从 O(n) 降到 O(k^3 log n)，是加速递推的通法。",
    identify: ["递推式形如 f(n) 由前几项线性组合", "n 达到 1e9 以上", "要同时维护多个递推量"],
    ops: [
      { name: "矩阵乘法", py: ["C[i][j] = sum(A[i][k] * B[k][j] for k in range(m)) % mod"].join("\n"), note: "不满足交换律，注意顺序" },
      { name: "单位矩阵", py: ["R = [[1 if i == j else 0 for j in range(n)] for i in range(n)]"].join("\n"), note: "快速幂的初始值" },
      { name: "矩阵快速幂", py: ["while e:", "    if e & 1: R = mat_mul(R, A, mod)", "    A = mat_mul(A, A, mod)", "    e >>= 1"].join("\n"), note: "和整数快速幂结构完全一样" },
      { name: "构造转移矩阵", py: ["# 让状态向量乘一次矩阵就前进一维"].join("\n"), note: "先写出状态向量再填系数" },
      { name: "取单项", py: ["# 也可以只保留第一行，用向量乘矩阵省常数"].join("\n"), note: "只求一个值时更快" }
    ],
    template: ["def mat_mul(A, B, mod):", "    # 朴素矩阵乘法，A 是 n*m，B 是 m*p", "    n, m, p = len(A), len(B), len(B[0])", "    C = [[0] * p for _ in range(n)]", "    for i in range(n):", "        for k in range(m):", "            if A[i][k] == 0:", "                continue", "            aik = A[i][k]", "            for j in range(p):", "                C[i][j] = (C[i][j] + aik * B[k][j]) % mod", "    return C", "", "def mat_pow(A, e, mod):", "    # 矩阵快速幂，A 为方阵，返回 A^e", "    n = len(A)", "    R = [[1 if i == j else 0 for j in range(n)] for i in range(n)]", "    while e > 0:", "        if e & 1:", "            R = mat_mul(R, A, mod)", "        A = mat_mul(A, A, mod)", "        e >>= 1", "    return R"].join("\n"),
    complexity: "O(k^3 log n)，k 为矩阵阶数",
    applications: ["斐波那契第 n 项", "线性递推加速", "路径计数", "DP 转移加速", "图上定长路径数"],
    pitfalls: ["矩阵乘法不满足交换律，左右乘顺序不能反", "转移矩阵错一个元素结果全错，先小 n 对拍"],
    links: [
      { t: "OI Wiki · 矩阵", u: "https://oi-wiki.org/math/linear-algebra/matrix/" },
      { t: "B站 · 矩阵快速幂", u: "https://search.bilibili.com/all?keyword=矩阵快速幂 斐波那契" },
      { t: "B站 · 矩阵乘法", u: "https://search.bilibili.com/all?keyword=矩阵乘法 算法" },
      { t: "B站 · 线性递推加速", u: "https://search.bilibili.com/all?keyword=线性递推 矩阵加速" }
    ]
  },
  "geometry": {
    intro: "用向量与叉积处理平面几何；叉积的符号能判方向、判左右、求面积，是凸包与线段相交的基础。",
    identify: ["给点坐标问相对位置或面积", "求凸包 / 线段相交 / 多边形面积", "浮点比较要考虑精度"],
    ops: [
      { name: "向量点积", py: ["dot = (a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1])"].join("\n"), note: "判垂直与夹角大小" },
      { name: "叉积判方向", py: ["cr = cross(o, a, b)", "# cr > 0 表示 b 在 o->a 的左侧"].join("\n"), note: "计算几何最核心的工具" },
      { name: "多边形面积", py: ["s += x1 * y2 - x2 * y1", "area = abs(s) / 2"].join("\n"), note: "叉积累加，顶点按顺序给" },
      { name: "Andrew 凸包", py: ["pts = sorted(set(points))", "# 下凸壳与上凸壳各扫一遍"].join("\n"), note: "O(n log n)，常数小" },
      { name: "点在多边形内", py: ["# 射线法，数交点个数的奇偶性"].join("\n"), note: "注意射线过顶点的情况" }
    ],
    template: ["def cross(o, a, b):", "    # 叉积 (a-o) x (b-o)，正表示 b 在 o->a 左侧", "    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])", "", "def convex_hull(points):", "    # Andrew 算法求凸包，返回逆时针顶点，用叉积判拐向", "    pts = sorted(set(points))", "    if len(pts) <= 1:", "        return pts", "    lower = []", "    for p in pts:", "        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:", "            lower.pop()", "        lower.append(p)", "    upper = []", "    for p in reversed(pts):", "        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:", "            upper.pop()", "        upper.append(p)", "    return lower[:-1] + upper[:-1]", "", "def polygon_area(poly):", "    # 叉积累加求多边形面积", "    s = 0", "    for i in range(len(poly)):", "        x1, y1 = poly[i]", "        x2, y2 = poly[(i + 1) % len(poly)]", "        s += x1 * y2 - x2 * y1", "    return abs(s) / 2"].join("\n"),
    complexity: "凸包 O(n log n)，单次叉积 O(1)",
    applications: ["凸包面积与周长", "线段相交判定", "点在多边形内", "旋转卡壳", "最近点对"],
    pitfalls: ["叉积 <= 0 与 < 0 决定是否保留共线点", "浮点相等要写 abs(x) < 1e-9，不能直接用 =="],
    links: [
      { t: "OI Wiki · 二维计算几何", u: "https://oi-wiki.org/geometry/2d/" },
      { t: "CP-Algorithms · 基础几何", u: "https://cp-algorithms.com/geometry/basic-geometry.html" },
      { t: "B站 · 计算几何 叉积", u: "https://search.bilibili.com/all?keyword=计算几何 叉积" },
      { t: "B站 · 凸包", u: "https://search.bilibili.com/all?keyword=凸包 算法" }
    ]
  }
};
