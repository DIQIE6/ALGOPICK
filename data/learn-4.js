/* AlgoPick 知识点讲解 · 第 4 组 */
window.LEARN_4 = {
  "knapsack": {
    intro: "在容量限制下决定每个物品选或不选，是最经典的一类 DP，关键是把「容量」当成维度。",
    identify: ["容量/预算有限，要求收益最大", "每个物品选或不选", "求方案数或可行性"],
    ops: [
      { name: "状态定义", py: ["dp[j]  # 容量 j 时的最大价值"].join("\n"), note: "一维滚动数组省空间" },
      { name: "0/1 背包", py: ["for w, v in items:", "    for j in range(cap, w - 1, -1):", "        dp[j] = max(dp[j], dp[j - w] + v)"].join("\n"), note: "容量必须倒序，保证每件只用一次" },
      { name: "完全背包", py: ["for w, v in items:", "    for j in range(w, cap + 1):", "        dp[j] = max(dp[j], dp[j - w] + v)"].join("\n"), note: "容量正序，每件物品可用无限次" },
      { name: "求方案数", py: ["dp[0] = 1", "for w in items:", "    for j in range(cap, w - 1, -1):", "        dp[j] += dp[j - w]"].join("\n"), note: "初值 dp[0]=1 表示空集一种方案" },
      { name: "恰好装满", py: ["dp = [float('-inf')] * (cap + 1)", "dp[0] = 0  # 只有容量 0 合法"].join("\n"), note: "用 -inf 表示装不满的状态" }
    ],
    template: ["def knapsack(items, cap):", "    # items: [(weight, value), ...]", "    dp = [0] * (cap + 1)", "    for w, v in items:", "        for j in range(cap, w - 1, -1):", "            dp[j] = max(dp[j], dp[j - w] + v)", "    return dp[cap]", "", "if __name__ == '__main__':", "    # 采药：容量 10，三件物品", "    print(knapsack([(3, 5), (4, 6), (5, 8)], 10))"].join("\n"),
    complexity: "时间 O(n·cap)，空间 O(cap)",
    applications: ["0/1 背包", "完全背包（零钱兑换）", "子集和问题", "分割等和子集"],
    pitfalls: ["0/1 背包容量要倒序遍历，正序会变成完全背包", "求方案数时初值 dp[0]=1"],
    links: [
      { t: "B站 · 背包九讲", u: "https://search.bilibili.com/all?keyword=背包九讲" },
      { t: "OI Wiki · 背包 DP", u: "https://oi-wiki.org/dp/knapsack/" },
      { t: "CP-Algorithms · Knapsack", u: "https://cp-algorithms.com/dynamic_programming/knapsack.html" },
      { t: "洛谷 · P1048 采药", u: "https://www.luogu.com.cn/problem/P1048" }
    ]
  },
  "interval-dp": {
    intro: "区间 DP 把答案建立在子区间上，按区间长度从小到大枚举，用小区间的最优值合并出大区间的最优值，本质是分治式的状态转移。",
    identify: ["答案由子区间合并而来", "常见于合并石子、括号匹配", "枚举区间长度与分割点"],
    ops: [
      { name: "状态定义", py: ["dp[i][j]  # 区间 [i, j] 的最优值"].join("\n"), note: "维度是区间的两个端点" },
      { name: "枚举长度", py: ["for length in range(2, n + 1):", "    for i in range(0, n - length + 1):", "        j = i + length - 1"].join("\n"), note: "长度必须从小到大，否则子区间没算好" },
      { name: "枚举分割点", py: ["for k in range(i, j):", "    dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j])"].join("\n"), note: "枚举最后一次合并的位置" },
      { name: "区间和预处理", py: ["pre[i + 1] = pre[i] + nums[i]", "total = pre[j + 1] - pre[i]"].join("\n"), note: "前缀和把区间求和降到 O(1)" },
      { name: "边界初始化", py: ["dp[i][i] = 0  # 单元素区间无需合并"].join("\n"), note: "长度 1 的区间是递归出口" }
    ],
    template: ["def interval_dp(nums):", "    # 石子合并：合并成一堆的最小代价", "    n = len(nums)", "    pre = [0] * (n + 1)", "    for i in range(n):", "        pre[i + 1] = pre[i] + nums[i]", "    dp = [[0] * n for _ in range(n)]", "    for length in range(2, n + 1):", "        for i in range(0, n - length + 1):", "            j = i + length - 1", "            dp[i][j] = float('inf')", "            for k in range(i, j):", "                cost = dp[i][k] + dp[k + 1][j]", "                if cost < dp[i][j]:", "                    dp[i][j] = cost", "            dp[i][j] += pre[j + 1] - pre[i]", "    return dp[0][n - 1]", "", "if __name__ == '__main__':", "    print(interval_dp([4, 5, 9, 4]))"].join("\n"),
    complexity: "时间 O(n^3)，空间 O(n^2)",
    applications: ["石子合并", "括号匹配最长子序列", "矩阵链乘法", "多边形三角剖分"],
    pitfalls: ["区间长度必须从小到大枚举，不能按 i 随意遍历", "合并代价用前缀和算，别在循环里重复求和"],
    links: [
      { t: "B站 · 区间DP", u: "https://search.bilibili.com/all?keyword=区间DP" },
      { t: "OI Wiki · 区间 DP", u: "https://oi-wiki.org/dp/interval/" },
      { t: "CP-Algorithms · Intro to DP", u: "https://cp-algorithms.com/dynamic_programming/intro-to-dp.html" },
      { t: "洛谷 · P1880 石子合并", u: "https://www.luogu.com.cn/problem/P1880" }
    ]
  },
  "bitmask-dp": {
    intro: "把「每个元素选没选」压缩成一个二进制整数当作状态，用位运算枚举子集并转移，适合规模在 20 以内的组合最优化问题。",
    identify: ["元素个数 n 不超过 20", "状态是集合而非下标", "用二进制位表示选或没选"],
    ops: [
      { name: "状态压缩", py: ["mask >> i & 1  # 第 i 个元素是否已选"].join("\n"), note: "一个整数表示一个集合" },
      { name: "枚举全部状态", py: ["for mask in range(1 << n):", "    # 处理该集合对应的答案"].join("\n"), note: "共 2^n 个集合状态" },
      { name: "加入元素", py: ["nmask = mask | (1 << v)"].join("\n"), note: "或运算把元素并进集合" },
      { name: "枚举子集", py: ["sub = mask", "while sub:", "    sub = (sub - 1) & mask"].join("\n"), note: "经典技巧，总复杂度 O(3^n)" },
      { name: "去掉元素", py: ["mask & ~(1 << v)"].join("\n"), note: "与上取反即把该位清零" }
    ],
    template: ["def tsp(dist):", "    # 状压 DP：旅行商最短回路，dist 为邻接矩阵", "    n = len(dist)", "    INF = float('inf')", "    dp = [[INF] * n for _ in range(1 << n)]", "    dp[1][0] = 0  # 从 0 号点出发，集合只含 0", "    for mask in range(1 << n):", "        for u in range(n):", "            if dp[mask][u] == INF:", "                continue", "            for v in range(n):", "                if mask >> v & 1:", "                    continue", "                nmask = mask | (1 << v)", "                nd = dp[mask][u] + dist[u][v]", "                if nd < dp[nmask][v]:", "                    dp[nmask][v] = nd", "    full = (1 << n) - 1", "    return min(dp[full][u] + dist[u][0] for u in range(n))", "", "if __name__ == '__main__':", "    g = [[0, 2, 9], [1, 0, 6], [3, 4, 0]]", "    print(tsp(g))"].join("\n"),
    complexity: "时间 O(2^n·n^2)，空间 O(2^n·n)",
    applications: ["旅行商 TSP", "集合覆盖与匹配", "棋盘轮廓线 DP", "任务分配问题"],
    pitfalls: ["状态数组开 1<<n，注意内存随 n 指数增长", "起始集合要写成 1<<起点，别忘了初始化"],
    links: [
      { t: "B站 · 状压DP", u: "https://search.bilibili.com/all?keyword=状压DP" },
      { t: "OI Wiki · 状态压缩 DP", u: "https://oi-wiki.org/dp/state/" },
      { t: "CP-Algorithms · Profile Dynamics", u: "https://cp-algorithms.com/dynamic_programming/profile-dynamics.html" },
      { t: "洛谷 · P1171 售货员的难题", u: "https://www.luogu.com.cn/problem/P1171" }
    ]
  },
  "digit-dp": {
    intro: "按十进制位从高到低逐位确定数字，用「是否贴着上界」等标记记录限制，把区间内的计数问题转化成对每一位的枚举。",
    identify: ["统计区间内满足条件的数的个数", "条件与数位形态有关", "常配前缀思想求 [l, r]"],
    ops: [
      { name: "状态定义", py: ["dfs(pos, tight)  # 当前位与上界标记"].join("\n"), note: "pos 从高位往低位推进" },
      { name: "上界限制", py: ["limit = int(s[pos]) if tight else 9"].join("\n"), note: "贴紧上界时当前位不能超过 n 的该位" },
      { name: "枚举当前位", py: ["for d in range(limit + 1):", "    if d == 4:", "        continue"].join("\n"), note: "按题目条件过滤非法数字" },
      { name: "传递限制", py: ["dfs(pos + 1, tight and d == limit)"].join("\n"), note: "只有一直贴着上界，tight 才保持真" },
      { name: "记忆化", py: ["@lru_cache(maxsize=None)"].join("\n"), note: "tight 为假的状态可复用，为真时别缓存" }
    ],
    template: ["from functools import lru_cache", "", "def digit_dp(n):", "    # 统计 [0, n] 中十进制表示不含数字 4 的数的个数", "    if n < 0:", "        return 0", "    s = str(n)", "", "    @lru_cache(maxsize=None)", "    def dfs(pos, tight):", "        # tight 为真表示前缀与 n 完全相同", "        if pos == len(s):", "            return 1", "        limit = int(s[pos]) if tight else 9", "        total = 0", "        for d in range(limit + 1):", "            if d == 4:", "                continue", "            total += dfs(pos + 1, tight and d == limit)", "        return total", "", "    return dfs(0, True)", "", "if __name__ == '__main__':", "    print(digit_dp(100) - digit_dp(9))  # [10, 100] 的答案"].join("\n"),
    complexity: "时间 O(位数 × 状态数)，空间 O(位数 × 状态数)",
    applications: ["统计不含某数字的个数", "数位和相关的计数", "区间内整除计数", "数字游戏类问题"],
    pitfalls: ["求 [l, r] 要用 f(r) - f(l - 1)，注意 l=0 的边界", "tight 为真时不能直接查缓存，否则答案会错"],
    links: [
      { t: "B站 · 数位DP", u: "https://search.bilibili.com/all?keyword=数位DP" },
      { t: "OI Wiki · 数位 DP", u: "https://oi-wiki.org/dp/number/" },
      { t: "Python 文档 · functools", u: "https://docs.python.org/zh-cn/3/library/functools.html" },
      { t: "洛谷 · P2602 数字计数", u: "https://www.luogu.com.cn/problem/P2602" }
    ]
  },
  "memo-search": {
    intro: "自顶向下地拆解问题，用缓存记住每个子问题的答案，避免重复计算，写起来比递推更贴近暴力搜索的思路。",
    identify: ["子问题会被重复求解", "转移顺序不直观或依赖复杂", "递归写起来自然"],
    ops: [
      { name: "定义递归", py: ["def dfs(state):", "    # 返回 state 下的最优值"].join("\n"), note: "参数就是状态本身" },
      { name: "查缓存", py: ["if state in memo:", "    return memo[state]"].join("\n"), note: "命中直接返回，省掉整棵子树" },
      { name: "递归求解", py: ["res = min(dfs(nxt) for nxt in moves(state))"].join("\n"), note: "把子问题结果组合成当前答案" },
      { name: "写缓存", py: ["memo[state] = res", "return res"].join("\n"), note: "算完立刻存，别漏写" },
      { name: "装饰器写法", py: ["@lru_cache(maxsize=None)", "def dfs(state):", "    ..."].join("\n"), note: "numpy 数组等不可哈希参数不能用" }
    ],
    template: ["import sys", "from functools import lru_cache", "", "sys.setrecursionlimit(300000)  # 递归深度大时防爆栈", "", "@lru_cache(maxsize=None)", "def fib(n):", "    # 记忆化搜索求斐波那契第 n 项", "    if n <= 1:", "        return n", "    return fib(n - 1) + fib(n - 2)", "", "def dfs(n, memo=None):", "    # 手写字典缓存的等价写法", "    if memo is None:", "        memo = {}", "    if n in memo:", "        return memo[n]", "    if n <= 1:", "        return n", "    memo[n] = dfs(n - 1, memo) + dfs(n - 2, memo)", "    return memo[n]", "", "if __name__ == '__main__':", "    print(fib(50), dfs(50))"].join("\n"),
    complexity: "时间 O(状态数 × 转移数)，空间 O(状态数)",
    applications: ["棋盘/网格路径计数", "博弈类搜索", "递归树上的最优值", "复杂约束下的 DP"],
    pitfalls: ["缓存键必须包含所有影响答案的参数", "递归太深要调大 recursionlimit 或改写成迭代"],
    links: [
      { t: "B站 · 记忆化搜索", u: "https://search.bilibili.com/all?keyword=记忆化搜索" },
      { t: "OI Wiki · 记忆化搜索", u: "https://oi-wiki.org/dp/memo/" },
      { t: "CP-Algorithms · Intro to DP", u: "https://cp-algorithms.com/dynamic_programming/intro-to-dp.html" },
      { t: "Python 文档 · functools", u: "https://docs.python.org/zh-cn/3/library/functools.html" }
    ]
  },
  "tree-shape-dp": {
    intro: "把状态挂在树的节点上，子树的信息在回溯时向上合并，父节点的答案由若干子节点的答案汇总而成，也常用二次扫描来优化。",
    identify: ["对象是一棵树或森林", "答案由子树信息汇总", "常用后序遍历自底向上"],
    ops: [
      { name: "建图", py: ["graph = [[] for _ in range(n + 1)]", "graph[u].append(v)", "graph[v].append(u)"].join("\n"), note: "无向树两个方向都要加边" },
      { name: "递归定义", py: ["def dfs(u, parent):", "    # 处理以 u 为根的子树"].join("\n"), note: "传入父节点避免回头走" },
      { name: "初始化节点", py: ["dp[u][1] = value[u]", "dp[u][0] = 0"].join("\n"), note: "先设好只含自己一个点的状态" },
      { name: "合并子节点", py: ["for v in graph[u]:", "    if v != parent:", "        dfs(v, u)", "        dp[u] += dp[v]"].join("\n"), note: "回溯时把子节点答案并上来" },
      { name: "二次扫描换根", py: ["def dfs2(u, parent):", "    # 用父节点答案推出子节点答案"].join("\n"), note: "把 O(n^2) 换根优化成 O(n)" }
    ],
    template: ["import sys", "", "def tree_size(n, edges):", "    # 求每个节点子树大小，dp[u] 为 u 的子树节点数", "    sys.setrecursionlimit(300000)  # 深链树防爆栈", "    graph = [[] for _ in range(n + 1)]", "    for u, v in edges:", "        graph[u].append(v)", "        graph[v].append(u)", "    dp = [0] * (n + 1)", "", "    def dfs(u, parent):", "        dp[u] = 1", "        for v in graph[u]:", "            if v == parent:", "                continue", "            dfs(v, u)", "            dp[u] += dp[v]", "", "    dfs(1, 0)", "    return dp", "", "if __name__ == '__main__':", "    print(tree_size(5, [(1, 2), (1, 3), (3, 4), (3, 5)]))"].join("\n"),
    complexity: "时间 O(n)，空间 O(n)（通常带常数维度）",
    applications: ["子树大小/深度统计", "树上最大独立集", "树的直径", "树上背包"],
    pitfalls: ["递归深度可达 n，必须调大 recursionlimit", "多叉树合并子节点时注意背包容量要倒序"],
    links: [
      { t: "B站 · 树形DP", u: "https://search.bilibili.com/all?keyword=树形DP" },
      { t: "OI Wiki · 树形 DP", u: "https://oi-wiki.org/dp/tree/" },
      { t: "Python 文档 · sys", u: "https://docs.python.org/zh-cn/3/library/sys.html" },
      { t: "洛谷 · P1352 没有上司的舞会", u: "https://www.luogu.com.cn/problem/P1352" }
    ]
  },
  "graph-dfs": {
    intro: "沿着一条边走到底再回退，用访问标记避免重复，天然适合连通性判断、环检测、路径枚举与回溯类问题。",
    identify: ["需要走遍所有可达点", "关心连通性、环或路径", "可用递归或显式栈"],
    ops: [
      { name: "访问标记", py: ["seen = [False] * (n + 1)"].join("\n"), note: "防止在有环图里无限绕圈" },
      { name: "递归函数", py: ["def dfs(u):", "    seen[u] = True", "    for v in graph[u]:", "        if not seen[v]:", "            dfs(v)"].join("\n"), note: "进入时立刻标记" },
      { name: "防爆栈", py: ["sys.setrecursionlimit(300000)"].join("\n"), note: "深图递归会超过默认 1000 层" },
      { name: "统计连通块", py: ["for u in range(1, n + 1):", "    if not seen[u]:", "        dfs(u)"].join("\n"), note: "每个未访问点启动一次就是一块" },
      { name: "回溯撤销", py: ["path.append(u)", "dfs(u)", "path.pop()  # 枚举所有路径时撤销选择"].join("\n"), note: "搜索路径方案时别忘了还原状态" }
    ],
    template: ["import sys", "", "def dfs_order(n, graph, start):", "    # 返回从 start 出发的 DFS 遍历顺序", "    sys.setrecursionlimit(300000)  # 图很深时防止栈溢出", "    seen = [False] * (n + 1)", "    order = []", "", "    def dfs(u):", "        seen[u] = True", "        order.append(u)", "        for v in graph[u]:", "            if not seen[v]:", "                dfs(v)", "", "    dfs(start)", "    return order", "", "if __name__ == '__main__':", "    g = [[], [2, 3], [4], [], [1]]", "    print(dfs_order(4, g, 1))"].join("\n"),
    complexity: "邻接表 O(n + m)，邻接矩阵 O(n^2)",
    applications: ["连通块计数", "环检测", "二分图染色", "路径枚举与回溯"],
    pitfalls: ["要在进入节点时标记，否则环上会重复入栈", "递归深度可能等于 n，需要调大 recursionlimit"],
    links: [
      { t: "B站 · 图的DFS遍历", u: "https://search.bilibili.com/all?keyword=图的DFS遍历" },
      { t: "OI Wiki · DFS", u: "https://oi-wiki.org/graph/dfs/" },
      { t: "CP-Algorithms · Depth First Search", u: "https://cp-algorithms.com/graph/depth-first-search.html" },
      { t: "Python 文档 · sys", u: "https://docs.python.org/zh-cn/3/library/sys.html" }
    ]
  },
  "graph-bfs": {
    intro: "用队列按层向外扩散，第一次到达某个点时的步数就是无权图里的最短距离，天然带有层次与最短路信息。",
    identify: ["边权都为 1 或步数相同", "要求最少步数/最短层数", "可以多源一起入队"],
    ops: [
      { name: "队列初始化", py: ["from collections import deque", "q = deque([start])"].join("\n"), note: "用 deque 而不是 list，popleft 是 O(1)" },
      { name: "距离数组", py: ["dist = [-1] * (n + 1)", "dist[start] = 0"].join("\n"), note: "-1 同时充当未访问标记" },
      { name: "出队扩展", py: ["while q:", "    u = q.popleft()", "    for v in graph[u]:"].join("\n"), note: "按层序依次处理每个点" },
      { name: "首次访问即最短", py: ["if dist[v] == -1:", "    dist[v] = dist[u] + 1", "    q.append(v)"].join("\n"), note: "第一次到达的层数一定最小" },
      { name: "多源 BFS", py: ["q = deque(sources)", "for s in sources:", "    dist[s] = 0"].join("\n"), note: "把所有源点同时入队即可" }
    ],
    template: ["from collections import deque", "", "def bfs_dist(n, graph, start):", "    # 无权图单源最短路：dist[v] 为 start 到 v 的最少边数", "    dist = [-1] * (n + 1)", "    dist[start] = 0", "    q = deque([start])", "    while q:", "        u = q.popleft()", "        for v in graph[u]:", "            if dist[v] == -1:", "                dist[v] = dist[u] + 1", "                q.append(v)", "    return dist", "", "if __name__ == '__main__':", "    g = [[], [2, 3], [1, 4], [1], [2]]", "    print(bfs_dist(4, g, 1))"].join("\n"),
    complexity: "时间 O(n + m)，空间 O(n)",
    applications: ["无权图最短路", "迷宫最少步数", "多源扩散问题", "层次遍历"],
    pitfalls: ["list.pop(0) 是 O(n)，必须用 collections.deque", "入队时就要标记距离，不能等出队再标"],
    links: [
      { t: "B站 · BFS 最短路", u: "https://search.bilibili.com/all?keyword=BFS最短路" },
      { t: "OI Wiki · BFS", u: "https://oi-wiki.org/graph/bfs/" },
      { t: "CP-Algorithms · Breadth First Search", u: "https://cp-algorithms.com/graph/breadth-first-search.html" },
      { t: "Python 文档 · collections", u: "https://docs.python.org/zh-cn/3/library/collections.html" }
    ]
  },
  "topological-sort": {
    intro: "不断取出入度为零的点，得到有向无环图中满足全部依赖关系的线性序列，也可以用 DFS 的出栈序反向得到。",
    identify: ["有向图且存在先后依赖", "要求给出合法处理顺序", "常用来判断有向环"],
    ops: [
      { name: "统计入度", py: ["for u, v in edges:", "    graph[u].append(v)", "    indeg[v] += 1"].join("\n"), note: "入度为零表示没有前置依赖" },
      { name: "入度为零入队", py: ["q = deque(u for u in range(1, n + 1) if indeg[u] == 0)"].join("\n"), note: "多个起点可以同时入队" },
      { name: "出队删边", py: ["u = q.popleft()", "order.append(u)", "for v in graph[u]:", "    indeg[v] -= 1", "    if indeg[v] == 0:", "        q.append(v)"].join("\n"), note: "删掉出边后入度归零即可入队" },
      { name: "判断有环", py: ["if len(order) != n:", "    print('存在环')"].join("\n"), note: "没排进序列的点都在环上" },
      { name: "DFS 实现", py: ["def dfs(u):", "    for v in graph[u]:", "        if not seen[v]:", "            dfs(v)", "    stack.append(u)  # 出栈序反转即拓扑序"].join("\n"), note: "配合访问中标记可检测环" }
    ],
    template: ["from collections import deque", "", "def topo_sort(n, edges):", "    # 返回一个拓扑序，若存在环则返回空列表", "    graph = [[] for _ in range(n + 1)]", "    indeg = [0] * (n + 1)", "    for u, v in edges:", "        graph[u].append(v)", "        indeg[v] += 1", "    q = deque(u for u in range(1, n + 1) if indeg[u] == 0)", "    order = []", "    while q:", "        u = q.popleft()", "        order.append(u)", "        for v in graph[u]:", "            indeg[v] -= 1", "            if indeg[v] == 0:", "                q.append(v)", "    return order if len(order) == n else []", "", "if __name__ == '__main__':", "    print(topo_sort(4, [(1, 2), (1, 3), (3, 4)]))"].join("\n"),
    complexity: "时间 O(n + m)，空间 O(n + m)",
    applications: ["课程表安排", "任务依赖调度", "有向图判环", "DAG 上递推 DP"],
    pitfalls: ["只能用于有向无环图，有环时序列不完整", "要求字典序最小时把队列换成小根堆"],
    links: [
      { t: "B站 · 拓扑排序", u: "https://search.bilibili.com/all?keyword=拓扑排序" },
      { t: "OI Wiki · 拓扑排序", u: "https://oi-wiki.org/graph/topo/" },
      { t: "CP-Algorithms · Topological Sorting", u: "https://cp-algorithms.com/graph/topological-sort.html" },
      { t: "力扣 · 拓扑排序题库", u: "https://leetcode.cn/problemset/?tags=topological-sort" }
    ]
  },
  "dijkstra": {
    intro: "从起点出发每次取出当前距离最小的未确定点并松弛它的出边，贪心地逐步确定单源最短路，要求所有边权非负。",
    identify: ["单源最短路且边权非负", "有向无向图都可以", "稠密图用朴素版，稀疏用堆"],
    ops: [
      { name: "初始化", py: ["dist = [float('inf')] * (n + 1)", "dist[start] = 0", "pq = [(0, start)]"].join("\n"), note: "堆里存 (距离, 点) 的元组" },
      { name: "取最小", py: ["d, u = heapq.heappop(pq)"].join("\n"), note: "每次弹出当前距离最小的点" },
      { name: "跳过过期条目", py: ["if d > dist[u]:", "    continue"].join("\n"), note: "同一点可能被多次入堆" },
      { name: "松弛出边", py: ["nd = d + w", "if nd < dist[v]:", "    dist[v] = nd", "    heapq.heappush(pq, (nd, v))"].join("\n"), note: "用更短的路径替换并重新入堆" },
      { name: "记录路径", py: ["pre[v] = u  # 松弛成功时记下前驱"].join("\n"), note: "从终点沿 pre 回溯即可还原路径" }
    ],
    template: ["import heapq", "", "def dijkstra(n, graph, start):", "    # graph[u] = [(v, w), ...]；返回 start 到各点的最短路", "    INF = float('inf')", "    dist = [INF] * (n + 1)", "    dist[start] = 0", "    pq = [(0, start)]  # 小根堆存 (距离, 点)", "    while pq:", "        d, u = heapq.heappop(pq)", "        if d > dist[u]:  # 过期条目直接跳过", "            continue", "        for v, w in graph[u]:", "            nd = d + w", "            if nd < dist[v]:", "                dist[v] = nd", "                heapq.heappush(pq, (nd, v))", "    return dist", "", "if __name__ == '__main__':", "    g = [[], [(2, 2), (3, 5)], [(3, 1)], []]", "    print(dijkstra(3, g, 1))"].join("\n"),
    complexity: "堆优化 O(m log n)，朴素 O(n^2)",
    applications: ["地图导航最短路", "网络时延最短路径", "费用最小的路由", "非负权图单源最短路"],
    pitfalls: ["边权为负时算法失效，要用 Bellman-Ford", "Python 堆是小根堆，别把距离取负数"],
    links: [
      { t: "B站 · Dijkstra 最短路", u: "https://search.bilibili.com/all?keyword=Dijkstra最短路" },
      { t: "OI Wiki · 最短路", u: "https://oi-wiki.org/graph/shortest-path/" },
      { t: "CP-Algorithms · Dijkstra", u: "https://cp-algorithms.com/graph/dijkstra.html" },
      { t: "洛谷 · P4779 单源最短路", u: "https://www.luogu.com.cn/problem/P4779" }
    ]
  },
  "floyd": {
    intro: "用中转点的思路做三重循环，逐个允许经过 k 号点来松弛任意两点之间的距离，代码极短且能一次求出全源最短路。",
    identify: ["要求任意两点间的最短路", "节点数较小（n ≤ 500）", "可处理负权但不能有负环"],
    ops: [
      { name: "初始化矩阵", py: ["dist = [[INF] * (n + 1) for _ in range(n + 1)]", "for i in range(1, n + 1):", "    dist[i][i] = 0"].join("\n"), note: "自己到自己的距离为 0" },
      { name: "读入边", py: ["dist[u][v] = min(dist[u][v], w)"].join("\n"), note: "重边取最小值" },
      { name: "三层循环", py: ["for k in range(1, n + 1):", "    for i in range(1, n + 1):", "        for j in range(1, n + 1):"].join("\n"), note: "中转点 k 必须放在最外层" },
      { name: "松弛", py: ["if dist[i][k] + dist[k][j] < dist[i][j]:", "    dist[i][j] = dist[i][k] + dist[k][j]"].join("\n"), note: "尝试用 k 作为中转点" },
      { name: "传递闭包", py: ["reach[i][j] = reach[i][j] or (reach[i][k] and reach[k][j])"].join("\n"), note: "把加法换成逻辑运算即求可达性" }
    ],
    template: ["def floyd(n, edges):", "    # 全源最短路，dist[i][j] 表示 i 到 j 的最短距离", "    INF = float('inf')", "    dist = [[INF] * (n + 1) for _ in range(n + 1)]", "    for i in range(1, n + 1):", "        dist[i][i] = 0", "    for u, v, w in edges:", "        if w < dist[u][v]:  # 处理重边", "            dist[u][v] = w", "    for k in range(1, n + 1):  # 中转点在最外层", "        for i in range(1, n + 1):", "            if dist[i][k] == INF:", "                continue", "            for j in range(1, n + 1):", "                nd = dist[i][k] + dist[k][j]", "                if nd < dist[i][j]:", "                    dist[i][j] = nd", "    return dist", "", "if __name__ == '__main__':", "    d = floyd(3, [(1, 2, 2), (2, 3, 3), (1, 3, 9)])", "    print(d[1][3])"].join("\n"),
    complexity: "时间 O(n^3)，空间 O(n^2)",
    applications: ["多源最短路查询", "传递闭包与可达性", "最小环检测", "图的小规模全源距离"],
    pitfalls: ["k 必须是最外层循环，写错顺序结果会错", "n 超过 500 时三重循环会超时，改用 Dijkstra"],
    links: [
      { t: "B站 · Floyd 算法", u: "https://search.bilibili.com/all?keyword=Floyd算法" },
      { t: "OI Wiki · 最短路", u: "https://oi-wiki.org/graph/shortest-path/" },
      { t: "CP-Algorithms · Floyd-Warshall", u: "https://cp-algorithms.com/graph/floyd_warshall_algorithm.html" },
      { t: "力扣 · 最短路题库", u: "https://leetcode.cn/problemset/?tags=shortest-path" }
    ]
  },
  "bellman": {
    intro: "对所有边反复做松弛，最多 n-1 轮就能收敛到最短路，可以处理负权边，多跑一轮还能判断是否存在负环。",
    identify: ["边权可能为负", "需要判断负环", "支持限制边数的最短路"],
    ops: [
      { name: "初始化", py: ["dist = [float('inf')] * (n + 1)", "dist[start] = 0"].join("\n"), note: "起点距离为 0，其余未知" },
      { name: "枚举轮数", py: ["for _ in range(n - 1):", "    updated = False"].join("\n"), note: "最短路最多 n-1 条边" },
      { name: "松弛所有边", py: ["for u, v, w in edges:", "    if dist[u] + w < dist[v]:", "        dist[v] = dist[u] + w", "        updated = True"].join("\n"), note: "每轮遍历全部边一次" },
      { name: "提前退出", py: ["if not updated:", "    break"].join("\n"), note: "某轮没有更新说明已经收敛" },
      { name: "判断负环", py: ["for u, v, w in edges:", "    if dist[u] + w < dist[v]:", "        return None  # 还能松弛说明有负环"].join("\n"), note: "第 n 轮仍可松弛即为负环" }
    ],
    template: ["from collections import deque", "", "def spfa(n, graph, start):", "    # SPFA 求单源最短路，存在负环时返回 None", "    INF = float('inf')", "    dist = [INF] * (n + 1)", "    inq = [False] * (n + 1)", "    cnt = [0] * (n + 1)  # 入队次数，用于判负环", "    dist[start] = 0", "    q = deque([start])", "    inq[start] = True", "    while q:", "        u = q.popleft()", "        inq[u] = False", "        for v, w in graph[u]:", "            if dist[u] + w < dist[v]:", "                dist[v] = dist[u] + w", "                cnt[v] = cnt[u] + 1", "                if cnt[v] >= n:  # 松弛超过 n-1 次", "                    return None", "                if not inq[v]:", "                    q.append(v)", "                    inq[v] = True", "    return dist", "", "if __name__ == '__main__':", "    g = [[], [(2, -1)], [(3, 2)], []]", "    print(spfa(3, g, 1))"].join("\n"),
    complexity: "Bellman-Ford O(n·m)，SPFA 平均更快最坏 O(n·m)",
    applications: ["含负权边的最短路", "负环检测", "差分约束系统", "限制边数的最短路"],
    pitfalls: ["SPFA 在网格图上会被卡，能不用就不用", "距离能无限减小才是负环，注意判断条件"],
    links: [
      { t: "B站 · Bellman-Ford 与 SPFA", u: "https://search.bilibili.com/all?keyword=Bellman-Ford算法" },
      { t: "OI Wiki · 最短路", u: "https://oi-wiki.org/graph/shortest-path/" },
      { t: "CP-Algorithms · Bellman-Ford", u: "https://cp-algorithms.com/graph/bellman_ford.html" },
      { t: "洛谷 · P3385 负环", u: "https://www.luogu.com.cn/problem/P3385" }
    ]
  }
};
