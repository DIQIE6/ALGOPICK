/* AlgoPick 知识点讲解 · 第 6 组 */
window.LEARN_6 = {
  "misc-math": {
    intro: "数学题常靠找规律、推导公式或枚举小数据猜结论，常用工具有 gcd、快速幂、素数筛、同余与组合计数，写代码前先手算小样例。",
    identify: ["小数据能手算并看出规律", "答案只与少量参数相关", "需要取模/大数运算", "涉及约数、质数、同余"],
    ops: [
      { name: "枚举小数据", py: ["for n in range(1, 11):", "    print(n, solve_small(n))"].join("\n"), note: "先打表观察规律" },
      { name: "最大公约数", py: ["def gcd(a, b):", "    while b:", "        a, b = b, a % b", "    return a"].join("\n"), note: "辗转相除，lcm 可由 gcd 推出" },
      { name: "快速幂", py: ["res = 1", "while n:", "    if n & 1:", "        res = res * a % mod", "    a = a * a % mod", "    n >>= 1"].join("\n"), note: "把指数二进制拆分，O(log n)" },
      { name: "素数筛", py: ["is_prime = [True] * (n + 1)", "for i in range(2, int(n ** 0.5) + 1):", "    if is_prime[i]:", "        for j in range(i * i, n + 1, i):", "            is_prime[j] = False"].join("\n"), note: "埃氏筛标记合数" },
      { name: "取模运算", py: ["MOD = 10 ** 9 + 7", "ans = (a * b) % MOD"].join("\n"), note: "减法后要 +MOD 再取模" },
      { name: "组合数", py: ["C = [[0] * (n + 1) for _ in range(n + 1)]", "for i in range(n + 1):", "    C[i][0] = 1", "    for j in range(1, i + 1):", "        C[i][j] = C[i - 1][j - 1] + C[i - 1][j]"].join("\n"), note: "杨辉三角递推，注意取模" }
    ],
    template: ["def gcd(a, b):", "    # 辗转相除求最大公约数", "    while b:", "        a, b = b, a % b", "    return a", "", "def quick_pow(a, n, mod):", "    # 快速幂：计算 a 的 n 次方对 mod 取模", "    res = 1", "    a %= mod", "    while n:", "        if n & 1:", "            res = res * a % mod", "        a = a * a % mod", "        n >>= 1", "    return res", "", "def sieve(n):", "    # 埃氏筛，返回不超过 n 的所有素数", "    is_prime = [True] * (n + 1)", "    is_prime[0] = is_prime[1] = False", "    for i in range(2, int(n ** 0.5) + 1):", "        if is_prime[i]:", "            for j in range(i * i, n + 1, i):", "                is_prime[j] = False", "    return [i for i, ok in enumerate(is_prime) if ok]", "", "if __name__ == '__main__':", "    print(gcd(12, 18), quick_pow(2, 10, 1000), sieve(10)[:5])"].join("\n"),
    complexity: "视具体公式而定，快速幂 O(log n)，筛法 O(n log log n)",
    applications: ["质因数分解", "快速幂求逆元", "组合计数取模", "斐波那契递推", "整除与同余判断"],
    pitfalls: ["乘法可能溢出，跨语言要提前取模", "筛法里 0 和 1 不是素数容易漏", "减法取模前要补加一个 MOD"],
    links: [
      { t: "B站 · 数论入门（质数·约数）", u: "https://search.bilibili.com/all?keyword=数论 入门 质数 约数" },
      { t: "B站 · 快速幂与取模", u: "https://search.bilibili.com/all?keyword=快速幂 取模" },
      { t: "OI Wiki · 数学部分", u: "https://oi-wiki.org/math/" },
      { t: "OI Wiki · 数论基础", u: "https://oi-wiki.org/math/number-theory/basic/" },
      { t: "cp-algorithms · 快速幂", u: "https://cp-algorithms.com/algebra/binary-exp.html" },
      { t: "LeetCode · 数学标签题库", u: "https://leetcode.cn/problemset/?tags=math" },
      { t: "洛谷 · 首页", u: "https://www.luogu.com.cn/" }
    ]
  },
  "kmp": {
    intro: "KMP 预处理模式串的 pi（next）数组记录最长相等前后缀，失配时让模式串跳回去而不是从头重来，从而把匹配做到线性时间。",
    identify: ["在长文本里找模式串出现位置", "需要线性而非 O(n*m) 匹配", "要用到前缀函数/周期性质", "求最小循环节或所有 border"],
    ops: [
      { name: "求 pi 数组", py: ["pi = [0] * len(p)", "j = 0", "for i in range(1, len(p)):", "    while j and p[i] != p[j]:", "        j = pi[j - 1]", "    if p[i] == p[j]:", "        j += 1", "    pi[i] = j"].join("\n"), note: "pi[i] 是前缀 i 的最长 border" },
      { name: "文本匹配", py: ["j = 0", "for i, ch in enumerate(s):", "    while j and ch != p[j]:", "        j = pi[j - 1]", "    if ch == p[j]:", "        j += 1", "    if j == len(p):", "        print(i - j + 1)", "        j = pi[j - 1]"].join("\n"), note: "匹配成功后沿 border 继续找" },
      { name: "最小循环节", py: ["n = len(s)", "period = n - pi[-1]", "if n % period == 0:", "    print(n // period)"].join("\n"), note: "n 是 period 的整数倍才是完整循环" },
      { name: "枚举 border", py: ["k = pi[-1]", "while k > 0:", "    print(k)", "    k = pi[k - 1]"].join("\n"), note: "不断跳 pi 可列出所有 border" },
      { name: "两串拼接", py: ["combined = p + '#' + s"].join("\n"), note: "用分隔符避免跨边界匹配" }
    ],
    template: ["def build_pi(p):", "    # pi[i] 表示 p[0..i] 的最长相等前后缀长度", "    pi = [0] * len(p)", "    j = 0", "    for i in range(1, len(p)):", "        while j > 0 and p[i] != p[j]:", "            j = pi[j - 1]", "        if p[i] == p[j]:", "            j += 1", "        pi[i] = j", "    return pi", "", "def kmp_search(s, p):", "    # 返回 p 在 s 中所有匹配的起始下标", "    if not p:", "        return []", "    pi = build_pi(p)", "    res = []", "    j = 0", "    for i, ch in enumerate(s):", "        while j > 0 and ch != p[j]:", "            j = pi[j - 1]", "        if ch == p[j]:", "            j += 1", "        if j == len(p):", "            res.append(i - len(p) + 1)", "            j = pi[j - 1]", "    return res"].join("\n"),
    complexity: "预处理 O(m)，匹配 O(n)，总时间 O(n + m)，空间 O(m)",
    applications: ["子串查找", "求最小循环节", "统计重复前缀", "字符串周期判定", "DNA 序列比对"],
    pitfalls: ["失配时用 pi[j-1] 而非 pi[j]，容易错位", "空模式串要特判，否则会越界", "pi 与 next 有两种定义，别混用"],
    links: [
      { t: "B站 · KMP 字符串匹配", u: "https://search.bilibili.com/all?keyword=KMP 字符串匹配" },
      { t: "B站 · KMP next 数组求法", u: "https://search.bilibili.com/all?keyword=KMP next数组 求法" },
      { t: "OI Wiki · KMP", u: "https://oi-wiki.org/string/kmp/" },
      { t: "cp-algorithms · Prefix function", u: "https://cp-algorithms.com/string/prefix-function.html" },
      { t: "runoob · Python 字符串", u: "https://www.runoob.com/python3/python3-string.html" },
      { t: "LeetCode · 字符串标签题库", u: "https://leetcode.cn/problemset/?tags=string" }
    ]
  },
  "string-hash": {
    intro: "字符串哈希把字符串映射成整数，通过前缀哈希与幂次相减，在 O(1) 内判断任意子串是否相等，常配合双模数降低碰撞概率。",
    identify: ["多次判断两个子串是否相等", "需要 O(1) 取子串哈希", "配合二分求最长公共前缀", "要防止被构造数据卡掉"],
    ops: [
      { name: "前缀哈希递推", py: ["h[i + 1] = (h[i] * BASE + ord(s[i])) % MOD"].join("\n"), note: "一遍扫描得到所有前缀哈希" },
      { name: "预处理幂次", py: ["p = [1] * (n + 1)", "for i in range(n):", "    p[i + 1] = p[i] * BASE % MOD"].join("\n"), note: "用于把高位对齐后相减" },
      { name: "取子串哈希", py: ["def get(l, r):", "    return (h[r + 1] - h[l] * p[r - l + 1]) % MOD"].join("\n"), note: "区间为闭区间 [l, r]" },
      { name: "双模数", py: ["MOD1, MOD2 = 10 ** 9 + 7, 10 ** 9 + 9", "key = (h1[i], h2[i])"].join("\n"), note: "两组模数同比较，碰撞概率极低" },
      { name: "最长公共前缀", py: ["lo, hi = 0, min(len(a), len(b))", "while lo < hi:", "    mid = (lo + hi + 1) // 2", "    if ha[0:mid] == hb[0:mid]:", "        lo = mid", "    else:", "        hi = mid - 1"].join("\n"), note: "哈希相等就把二分右移" },
      { name: "随机底数", py: ["import random", "BASE = random.randrange(256, 10 ** 5)"].join("\n"), note: "防止他人针对固定底数构造碰撞" }
    ],
    template: ["MOD1 = 10 ** 9 + 7", "MOD2 = 10 ** 9 + 9", "BASE = 131", "", "def build_hash(s):", "    # 双模数前缀哈希，返回 (h1, h2, pow1, pow2)", "    n = len(s)", "    h1 = [0] * (n + 1)", "    h2 = [0] * (n + 1)", "    p1 = [1] * (n + 1)", "    p2 = [1] * (n + 1)", "    for i, ch in enumerate(s, 1):", "        v = ord(ch)", "        h1[i] = (h1[i - 1] * BASE + v) % MOD1", "        h2[i] = (h2[i - 1] * BASE + v) % MOD2", "        p1[i] = p1[i - 1] * BASE % MOD1", "        p2[i] = p2[i - 1] * BASE % MOD2", "    return h1, h2, p1, p2", "", "def get_hash(h, p, l, r, mod):", "    # 取 s[l..r] 的哈希，下标从 0 开始且是闭区间", "    return (h[r + 1] - h[l] * p[r - l + 1]) % mod"].join("\n"),
    complexity: "预处理 O(n)，单次取子串哈希 O(1)，空间 O(n)",
    applications: ["判断子串是否相等", "最长公共前缀", "回文判定", "字符串去重", "O(1) 比较的 LCP"],
    pitfalls: ["单模数可能被卡，重要场合用双模数", "子串下标与幂次对齐容易差一位", "BASE 小于字符集时冲突概率上升"],
    links: [
      { t: "B站 · 字符串哈希", u: "https://search.bilibili.com/all?keyword=字符串哈希 算法" },
      { t: "OI Wiki · 字符串哈希", u: "https://oi-wiki.org/string/hash/" },
      { t: "cp-algorithms · String hashing", u: "https://cp-algorithms.com/string/string-hashing.html" },
      { t: "runoob · Python 字典", u: "https://www.runoob.com/python3/python3-dictionary.html" },
      { t: "docs.python · 内置函数 ord", u: "https://docs.python.org/zh-cn/3/library/functions.html" },
      { t: "LeetCode · 哈希表标签题库", u: "https://leetcode.cn/problemset/?tags=hash-table" }
    ]
  },
  "manacher": {
    intro: "Manacher 在插入分隔符后的串上维护当前最右回文边界，利用对称性把每个中心的回文半径均摊到 O(n) 求出，从而得到最长回文子串。",
    identify: ["求最长回文子串或回文个数", "需要 O(n) 而非中心扩展 O(n^2)", "利用回文半径与对称转移", "涉及字符串的回文结构性质"],
    ops: [
      { name: "插入分隔符", py: ["t = '^#' + '#'.join(s) + '#$'"].join("\n"), note: "统一奇偶回文，哨兵防越界" },
      { name: "初始化", py: ["n = len(t)", "p = [0] * n", "c = r = 0"].join("\n"), note: "c 是当前中心，r 是最右边界" },
      { name: "对称转移", py: ["if i < r:", "    p[i] = min(r - i, p[2 * c - i])"].join("\n"), note: "边界内直接继承镜像半径" },
      { name: "暴力扩展", py: ["while t[i + p[i] + 1] == t[i - p[i] - 1]:", "    p[i] += 1"].join("\n"), note: "超出已知范围只能继续比较" },
      { name: "更新中心与边界", py: ["if i + p[i] > r:", "    c, r = i, i + p[i]"].join("\n"), note: "只有右边界右移才更新" },
      { name: "还原答案", py: ["best = max(p)", "center = p.index(best)", "start = (center - best) // 2", "ans = s[start:start + best]"].join("\n"), note: "半径就是原串中的回文长度" }
    ],
    template: ["def manacher(s):", "    # 返回最长回文长度与对应的回文子串", "    t = '^#' + '#'.join(s) + '#$'", "    n = len(t)", "    p = [0] * n", "    c = r = 0", "    for i in range(1, n - 1):", "        if i < r:", "            p[i] = min(r - i, p[2 * c - i])", "        while t[i + p[i] + 1] == t[i - p[i] - 1]:", "            p[i] += 1", "        if i + p[i] > r:", "            c, r = i, i + p[i]", "    best = max(p)", "    center = p.index(best)", "    start = (center - best) // 2", "    return best, s[start:start + best]", "", "if __name__ == '__main__':", "    print(manacher('babad'))"].join("\n"),
    complexity: "时间 O(n)，空间 O(n)，分隔符后长度约为 2n + 3",
    applications: ["最长回文子串", "回文子串计数", "回文划分预处理", "双倍回文判定", "回文半径查询"],
    pitfalls: ["分隔符与哨兵要选串中不出现的字符", "半径含中心，换算下标容易差一", "忘记更新右边界会退化成暴力"],
    links: [
      { t: "B站 · Manacher 回文算法", u: "https://search.bilibili.com/all?keyword=Manacher 回文算法" },
      { t: "B站 · 最长回文子串", u: "https://search.bilibili.com/all?keyword=最长回文子串 算法" },
      { t: "OI Wiki · Manacher", u: "https://oi-wiki.org/string/manacher/" },
      { t: "cp-algorithms · Manacher", u: "https://cp-algorithms.com/string/manacher.html" },
      { t: "LeetCode · 字符串标签题库", u: "https://leetcode.cn/problemset/?tags=string" }
    ]
  },
  "string-misc": {
    intro: "字符串综合题涵盖 Z 函数、后缀数组、字典树、自动机与周期分析等工具，关键是先判断需要哪种信息，再选择对应的预处理。",
    identify: ["求与所有后缀的公共前缀", "多模式串匹配与前缀统计", "子串排名或后缀排序", "周期、border 等结构性质"],
    ops: [
      { name: "Z 函数", py: ["z = [0] * n", "l = r = 0", "for i in range(1, n):", "    if i < r:", "        z[i] = min(r - i, z[i - l])", "    while i + z[i] < n and s[z[i]] == s[i + z[i]]:", "        z[i] += 1", "    if i + z[i] > r:", "        l, r = i, i + z[i]"].join("\n"), note: "z[i] 是 s 与 s[i:] 的最长公共前缀" },
      { name: "拼接匹配", py: ["combined = p + chr(0) + s"].join("\n"), note: "用不会出现的分隔符隔开两串" },
      { name: "字典树插入", py: ["node = root", "for ch in word:", "    node = node.setdefault(ch, {})", "node['#'] = True"].join("\n"), note: "嵌套字典就能当简易 Trie" },
      { name: "回文判定", py: ["def is_pal(t):", "    return t == t[::-1]"].join("\n"), note: "切片反转是最简写法" },
      { name: "后缀排序（小数据）", py: ["sa = sorted(range(n), key=lambda i: s[i:])"].join("\n"), note: "O(n^2 log n)，只适合小规模" },
      { name: "字符频次", py: ["from collections import Counter", "cnt = Counter(s)"].join("\n"), note: "Counter 常用于异位词统计" }
    ],
    template: ["def z_function(s):", "    # z[i] 表示 s 与 s[i:] 的最长公共前缀长度", "    n = len(s)", "    z = [0] * n", "    l = r = 0", "    for i in range(1, n):", "        if i < r:", "            z[i] = min(r - i, z[i - l])", "        while i + z[i] < n and s[z[i]] == s[i + z[i]]:", "            z[i] += 1", "        if i + z[i] > r:", "            l, r = i, i + z[i]", "    return z", "", "def find_all(s, p):", "    # 用 Z 函数求 p 在 s 中所有出现位置", "    if not p:", "        return []", "    combined = p + chr(0) + s", "    z = z_function(combined)", "    return [i - len(p) - 1 for i in range(len(p) + 1, len(combined)) if z[i] >= len(p)]"].join("\n"),
    complexity: "Z 函数时间 O(n)、空间 O(n)，Trie 插入 O(串长)",
    applications: ["多模式串匹配", "最长公共前缀", "异位词分组", "后缀排序入门", "Trie 前缀统计"],
    pitfalls: ["拼接时的分隔符必须选串中不出现的字符", "切片排序后缀在大数据上会超时", "用 dict 实现 Trie 要注意内存占用"],
    links: [
      { t: "B站 · Z 函数（扩展 KMP）", u: "https://search.bilibili.com/all?keyword=Z函数 扩展KMP" },
      { t: "OI Wiki · 字符串专题", u: "https://oi-wiki.org/string/" },
      { t: "cp-algorithms · Z-function", u: "https://cp-algorithms.com/string/z-function.html" },
      { t: "cp-algorithms · Suffix array", u: "https://cp-algorithms.com/string/suffix-array.html" },
      { t: "docs.python · 内置类型方法", u: "https://docs.python.org/zh-cn/3/library/stdtypes.html" },
      { t: "LeetCode · 字符串标签题库", u: "https://leetcode.cn/problemset/?tags=string" }
    ]
  },
  "greedy": {
    intro: "贪心每一步都取当前看起来最优的选择，并用交换论证证明局部最优能推出全局最优，通常需要先排序再一遍扫描。",
    identify: ["每步只做一次局部最优决策", "交换论证能说明不劣于其他选择", "决策后不回退、不影响已定部分", "常先排序再按顺序处理"],
    ops: [
      { name: "排序", py: ["items.sort(key=lambda x: x[1])"].join("\n"), note: "按右端点/结束时间排序是常见套路" },
      { name: "贪心推进", py: ["for s, e in items:", "    if s >= last_end:", "        cnt += 1", "        last_end = e"].join("\n"), note: "能选就选，选完更新边界" },
      { name: "维护当前最优", py: ["best = max(best, cur)"].join("\n"), note: "一遍扫描时用变量记录最优值" },
      { name: "优先队列取最值", py: ["import heapq", "heapq.heappush(heap, x)", "cur = heapq.heappop(heap)"].join("\n"), note: "每步取当前最小或最大的可用元素" },
      { name: "反悔替换", py: ["if heap and x > heap[0]:", "    heapq.heapreplace(heap, x)"].join("\n"), note: "反悔贪心把较差的选择换掉" },
      { name: "补写证明", py: ["# 交换论证：设最优解第一步与贪心不同", "# 把它换成贪心的选择，答案不会更差"].join("\n"), note: "代码写完后补一段正确性说明" }
    ],
    template: ["def max_non_overlap(intervals):", "    # 贪心：按右端点升序，能选就选，选完更新边界", "    intervals.sort(key=lambda x: x[1])", "    cnt = 0", "    last_end = float('-inf')", "    for s, e in intervals:", "        if s >= last_end:", "            cnt += 1", "            last_end = e", "    return cnt", "", "", "if __name__ == '__main__':", "    print(max_non_overlap([(1, 3), (2, 4), (3, 5)]))"].join("\n"),
    complexity: "排序 O(n log n) 加上一遍扫描 O(n)，整体 O(n log n)",
    applications: ["区间调度", "会议室安排", "找零钱（面额合适时）", "跳跃游戏", "哈夫曼编码思想"],
    pitfalls: ["贪心必须能证明，举不出反例不代表正确", "排序关键字选错就全错（区间按右端点）", "反悔贪心需要额外的数据结构支持"],
    links: [
      { t: "B站 · 贪心算法讲解", u: "https://search.bilibili.com/all?keyword=贪心算法 区间调度" },
      { t: "OI Wiki · 贪心", u: "https://oi-wiki.org/basic/greedy/" },
      { t: "B站 · 反悔贪心", u: "https://search.bilibili.com/all?keyword=反悔贪心 算法" },
      { t: "B站 · 排序不等式与贪心", u: "https://search.bilibili.com/all?keyword=贪心 排序不等式" },
      { t: "LeetCode · 贪心标签题库", u: "https://leetcode.cn/problemset/?tags=greedy" }
    ]
  },
  "construction": {
    intro: "构造题要求直接给出一个满足条件的方案，常见思路是从特殊情形、极端情况或逐步调整入手，先判断无解条件再分情况构造。",
    identify: ["要求输出任意一个合法方案", "答案不唯一，可用特判与调整", "常先找无解的必要条件", "从递增/交错等特殊结构起步"],
    ops: [
      { name: "判断无解", py: ["if k < 0 or k > n * (n - 1) // 2:", "    return None"].join("\n"), note: "先确定必要条件的上下界" },
      { name: "基础排列起步", py: ["res = list(range(1, n + 1))"].join("\n"), note: "以最规整的答案作为出发点" },
      { name: "按量放置", py: ["idx = min(k, m)", "k -= idx", "res.append(remaining.pop(idx))"].join("\n"), note: "每步制造固定数量的贡献" },
      { name: "交换调整", py: ["res[i], res[j] = res[j], res[i]"].join("\n"), note: "局部交换可以微调计数" },
      { name: "奇偶交错", py: ["res = [x for pair in zip(odds, evens) for x in pair]"].join("\n"), note: "交错能保证相邻和或差的性质" },
      { name: "小规模验证", py: ["for n in range(1, 8):", "    print(n, construct(n))"].join("\n"), note: "枚举小数据确认构造合法" }
    ],
    template: ["def construct_inversions(n, k):", "    # 构造长度 n、恰好 k 个逆序对的排列（元素为 1..n）", "    if k < 0 or k > n * (n - 1) // 2:", "        return None", "    remaining = list(range(1, n + 1))", "    res = []", "    while remaining:", "        m = len(remaining) - 1", "        idx = min(k, m)   # 取第 idx+1 小的数，产生 idx 个逆序对", "        k -= idx", "        res.append(remaining.pop(idx))", "    return res", "", "", "if __name__ == '__main__':", "    print(construct_inversions(4, 3))"].join("\n"),
    complexity: "通常 O(n) 或 O(n log n)，只需构造出合法方案即可",
    applications: ["构造排列或数组", "构造满足计数的图", "构造合法括号串", "构造矩阵", "输出任意方案题"],
    pitfalls: ["边界 n=1 与 k=0 要单独考虑", "构造完最好写一个 checker 验证", "忽略无解条件会输出非法答案"],
    links: [
      { t: "B站 · 构造题技巧", u: "https://search.bilibili.com/all?keyword=构造题 技巧 算法竞赛" },
      { t: "B站 · 逆序对构造", u: "https://search.bilibili.com/all?keyword=逆序对 构造 排列" },
      { t: "OI Wiki · 基础篇索引", u: "https://oi-wiki.org/basic/" },
      { t: "LeetCode · 数组标签题库", u: "https://leetcode.cn/problemset/?tags=array" },
      { t: "洛谷 · 首页", u: "https://www.luogu.com.cn/" },
      { t: "B站 · 排列构造题", u: "https://search.bilibili.com/all?keyword=排列 构造题 讲解" }
    ]
  },
  "interactive": {
    intro: "交互题的程序需要边读入边输出并与评测器多轮通信，每次输出后必须 flush，同时把询问次数控制在题目给定的限额之内。",
    identify: ["题目要求与评测器多轮问答", "有明确的询问次数上限", "每次输出后需要 flush", "常用二分或三分减少询问"],
    ops: [
      { name: "输出并刷新", py: ["print(x)", "sys.stdout.flush()"].join("\n"), note: "不 flush 会让对方一直等待" },
      { name: "读入回答", py: ["ans = int(sys.stdin.readline().strip())"].join("\n"), note: "按行读入并转成需要的类型" },
      { name: "二分询问", py: ["mid = (lo + hi) // 2", "if ask(mid):", "    hi = mid", "else:", "    lo = mid + 1"].join("\n"), note: "每次询问砍掉一半区间" },
      { name: "提交最终答案", py: ["print('!', lo)", "sys.stdout.flush()"].join("\n"), note: "最终答案格式按题面要求" },
      { name: "结束程序", py: ["sys.exit(0)"].join("\n"), note: "输出答案后立刻退出" },
      { name: "本地模拟交互器", py: ["# 自己写一个判题脚本模拟对方回答", "# 记录询问次数是否超过上限"].join("\n"), note: "本地测试时也要模拟对方" }
    ],
    template: ["import sys", "", "def ask(x):", "    # 向交互器提问并立刻 flush，再读回一行答案", "    print(x)", "    sys.stdout.flush()", "    return int(sys.stdin.readline().strip())", "", "def answer(x):", "    # 输出最终答案，交互题通常到此结束", '    print("!", x)', "    sys.stdout.flush()", "    sys.exit(0)", "", "def main():", "    # 交互题骨架：读初始信息，再用二分逐步逼近答案", "    n = int(sys.stdin.readline().strip())", "    lo, hi = 1, n", "    while lo < hi:", "        mid = (lo + hi) // 2", "        if ask(mid) == 1:", "            hi = mid", "        else:", "            lo = mid + 1", "    answer(lo)", "", "main()"].join("\n"),
    complexity: "询问次数通常为 O(log n)，单次输入输出 O(1)",
    applications: ["猜数游戏", "二分交互题", "图上的询问式探索", "带次数限制的猜测", "自适应测试"],
    pitfalls: ["忘记 flush 会一直卡住评测", "询问次数超过上限直接判错", "读到 EOF 要能正常退出"],
    links: [
      { t: "B站 · 交互题入门", u: "https://search.bilibili.com/all?keyword=交互题 算法竞赛" },
      { t: "B站 · 交互题与二分", u: "https://search.bilibili.com/all?keyword=交互题 二分" },
      { t: "B站 · 交互题 flush 技巧", u: "https://search.bilibili.com/all?keyword=交互题 flush 输出" },
      { t: "docs.python · sys 模块", u: "https://docs.python.org/zh-cn/3/library/sys.html" },
      { t: "docs.python · 内置函数 print", u: "https://docs.python.org/zh-cn/3/library/functions.html" },
      { t: "洛谷 · 首页", u: "https://www.luogu.com.cn/" }
    ]
  },
  "moore-vote": {
    intro: "摩尔投票利用不同元素两两抵消的思想，用 O(1) 额外空间在 O(n) 时间里找出可能出现次数超过一半的候选元素。",
    identify: ["求出现次数超过一半的元素", "要求 O(n) 时间 O(1) 空间", "不同元素可以两两抵消", "可推广到超过 n/3 的候选"],
    ops: [
      { name: "初始化候选", py: ["cand, cnt = None, 0"].join("\n"), note: "候选为空时候选计数为 0" },
      { name: "抵消推进", py: ["for x in nums:", "    if cnt == 0:", "        cand, cnt = x, 1", "    elif x == cand:", "        cnt += 1", "    else:", "        cnt -= 1"].join("\n"), note: "相同加一，不同减一" },
      { name: "验证候选", py: ["if nums.count(cand) > len(nums) // 2:", "    return cand", "return None"].join("\n"), note: "投票只给出候选，不保证存在" },
      { name: "统计频次", py: ["from collections import Counter", "cnt = Counter(nums)"].join("\n"), note: "简单题直接用 Counter 更快" },
      { name: "双候选推广", py: ["c1 = c2 = None", "n1 = n2 = 0"].join("\n"), note: "超过 n/3 时最多两个候选" },
      { name: "随机化验证", py: ["import random", "x = random.choice(nums)"].join("\n"), note: "随机抽样也能高概率命中众数" }
    ],
    template: ["def majority_element(nums):", "    # 摩尔投票求出现次数超过一半的元素（不保证存在）", "    cand, cnt = None, 0", "    for x in nums:", "        if cnt == 0:", "            cand, cnt = x, 1", "        elif x == cand:", "            cnt += 1", "        else:", "            cnt -= 1", "    return cand", "", "def majority_element_verified(nums):", "    # 加上验证，不存在超过一半的元素时返回 None", "    cand = majority_element(nums)", "    if nums.count(cand) > len(nums) // 2:", "        return cand", "    return None", "", "", "if __name__ == '__main__':", "    print(majority_element_verified([1, 2, 1, 1, 3, 1]))"].join("\n"),
    complexity: "时间 O(n)，额外空间 O(1)，验证再花 O(n)",
    applications: ["求多数元素", "求超过 n/3 的元素", "流式数据众数", "选举过半判定", "内存受限的众数"],
    pitfalls: ["不验证时可能返回并不存在的候选", "次数条件是严格大于一半而非大于等于", "推广到 n/3 时两个候选都要验证"],
    links: [
      { t: "B站 · 摩尔投票求众数", u: "https://search.bilibili.com/all?keyword=摩尔投票 众数" },
      { t: "B站 · 求众数算法", u: "https://search.bilibili.com/all?keyword=求众数 算法 讲解" },
      { t: "OI Wiki · 杂项专题", u: "https://oi-wiki.org/misc/" },
      { t: "cp-algorithms · 首页", u: "https://cp-algorithms.com/" },
      { t: "LeetCode · 数组标签题库", u: "https://leetcode.cn/problemset/?tags=array" }
    ]
  },
  "randomized": {
    intro: "随机化用随机数打破最坏情况或降低碰撞概率，常见有随机底数哈希、随机主元的快速选择，以及蒙特卡洛与拉斯维加斯算法。",
    identify: ["固定策略会被构造数据卡掉", "允许可忽略的极小错误概率", "用随机主元避开最坏情况", "需要哈希或抽样做验证"],
    ops: [
      { name: "随机底数哈希", py: ["import random", "base = random.randrange(256, 10 ** 5)"].join("\n"), note: "让对手无法预先构造碰撞" },
      { name: "随机主元快选", py: ["pivot = random.choice(a)"].join("\n"), note: "期望 O(n) 求出第 k 小" },
      { name: "随机抽样验证", py: ["x = random.choice(nums)", "if nums.count(x) > len(nums) // 2:", "    return x"].join("\n"), note: "高概率找到众数" },
      { name: "洗牌打乱", py: ["random.shuffle(a)"].join("\n"), note: "打乱顺序消掉最坏输入结构" },
      { name: "多次运行", py: ["for _ in range(5):", "    check()"].join("\n"), note: "多跑几次降低偶然失败概率" },
      { name: "固定种子复现", py: ["random.seed(0)"].join("\n"), note: "本地复现问题时可以固定种子" }
    ],
    template: ["import random", "", "def randomized_hash(s, mod=2 ** 61 - 1):", "    # 随机底数的多项式哈希，降低被构造碰撞的风险", "    base = random.randrange(256, 100000)", "    h = 0", "    for ch in s:", "        h = (h * base + ord(ch)) % mod", "    return h", "", "def randomized_quickselect(a, k):", "    # 随机选主元求第 k 小（k 从 0 开始）", "    if len(a) == 1:", "        return a[0]", "    pivot = random.choice(a)", "    less = [x for x in a if x < pivot]", "    equal = [x for x in a if x == pivot]", "    greater = [x for x in a if x > pivot]", "    if k < len(less):", "        return randomized_quickselect(less, k)", "    if k < len(less) + len(equal):", "        return pivot", "    return randomized_quickselect(greater, k - len(less) - len(equal))"].join("\n"),
    complexity: "期望时间 O(n)，最坏仍可能退化，错误概率可忽略",
    applications: ["随机哈希防卡", "第 k 小元素", "随机化快排", "大数素性测试", "抽样验证"],
    pitfalls: ["随机化不保证最坏复杂度，卡常数要小心", "评测机种子不同可能表现不同", "不要用随机代替正确性证明"],
    links: [
      { t: "B站 · 随机化算法", u: "https://search.bilibili.com/all?keyword=随机化算法 哈希" },
      { t: "B站 · 快速选择求第 k 小", u: "https://search.bilibili.com/all?keyword=快速选择 第k小" },
      { t: "docs.python · random 模块", u: "https://docs.python.org/zh-cn/3/library/random.html" },
      { t: "OI Wiki · 杂项专题", u: "https://oi-wiki.org/misc/" },
      { t: "cp-algorithms · 首页", u: "https://cp-algorithms.com/" },
      { t: "LeetCode · 哈希表标签题库", u: "https://leetcode.cn/problemset/?tags=hash-table" }
    ]
  },
  "intervals-greedy": {
    intro: "区间贪心围绕区间的左右端点排序后扫描，解决选最多不重叠区间、合并重叠区间、最少点覆盖等问题，关键在排序关键字的选择。",
    identify: ["给出一堆区间要选/合并/覆盖", "答案与端点顺序强相关", "排序后一遍扫描即可完成", "需要维护当前右边界"],
    ops: [
      { name: "按左端点排序", py: ["intervals.sort(key=lambda x: x[0])"].join("\n"), note: "合并区间、求交集常用左端点" },
      { name: "按右端点排序", py: ["intervals.sort(key=lambda x: x[1])"].join("\n"), note: "选最多不重叠区间用右端点" },
      { name: "合并重叠", py: ["if res and s <= res[-1][1]:", "    res[-1][1] = max(res[-1][1], e)", "else:", "    res.append([s, e])"].join("\n"), note: "重叠就扩展右边界" },
      { name: "统计不重叠", py: ["if s >= last_end:", "    cnt += 1", "    last_end = e"].join("\n"), note: "能接上就选，选完更新右端" },
      { name: "最少点覆盖", py: ["points.append(e)", "last_end = e"].join("\n"), note: "按右端点贪心放点" },
      { name: "先去重", py: ["intervals = sorted(set(map(tuple, intervals)))"].join("\n"), note: "集合去重后再排序更稳" }
    ],
    template: ["def merge_intervals(intervals):", "    # 合并所有重叠区间，返回互不重叠的结果", "    intervals.sort(key=lambda x: x[0])", "    res = []", "    for s, e in intervals:", "        if res and s <= res[-1][1]:", "            res[-1][1] = max(res[-1][1], e)", "        else:", "            res.append([s, e])", "    return res", "", "", "if __name__ == '__main__':", "    print(merge_intervals([[1, 3], [2, 6], [8, 10]]))"].join("\n"),
    complexity: "排序 O(n log n) 加线性扫描 O(n)，空间 O(n) 存结果",
    applications: ["合并区间", "会议室安排", "最少箭矢引爆气球", "插入区间", "区间选点覆盖"],
    pitfalls: ["按左还是按右端点排序必须分清", "相等端点的开闭判断容易差一", "返回结果前注意是否还要排序"],
    links: [
      { t: "B站 · 区间贪心与调度", u: "https://search.bilibili.com/all?keyword=区间贪心 调度" },
      { t: "B站 · 合并区间", u: "https://search.bilibili.com/all?keyword=合并区间 算法" },
      { t: "OI Wiki · 贪心", u: "https://oi-wiki.org/basic/greedy/" },
      { t: "LeetCode · 贪心标签题库", u: "https://leetcode.cn/problemset/?tags=greedy" },
      { t: "LeetCode · 排序标签题库", u: "https://leetcode.cn/problemset/?tags=sorting" }
    ]
  },
  "special-misc": {
    intro: "综合杂项包括对拍、打表找规律、暴力验证、离线处理与调试技巧，遇到没思路的题先用小数据手推，往往能发现隐藏的结构。",
    identify: ["没有明显算法标签的综合题", "结论靠打表观察小数据得出", "需要暴力对拍来验证正解", "多种小技巧混合使用"],
    ops: [
      { name: "打表", py: ["for n in range(1, 11):", "    print(n, brute(n))"].join("\n"), note: "列出小规模答案找规律" },
      { name: "随机对拍", py: ["if brute(nums) != fast(nums):", "    print('diff:', nums)"].join("\n"), note: "发现反例就立刻打印用例" },
      { name: "断言调试", py: ["assert cond, 'unexpected state'"].join("\n"), note: "提前暴露被破坏的不变量" },
      { name: "排序后观察", py: ["nums.sort()", "print(nums)"].join("\n"), note: "排序后更容易看出配对结构" },
      { name: "前缀和预处理", py: ["pre = [0]", "for x in nums:", "    pre.append(pre[-1] + x)"].join("\n"), note: "区间求和的通用加速手段" },
      { name: "本地计时", py: ["import time", "t0 = time.time()", "# ... 运行待测代码", "print(time.time() - t0)"].join("\n"), note: "确认复杂度在数据范围内达标" }
    ],
    template: ["import sys", "", "def table(f, lo, hi):", "    # 打表：把小规模答案列出来找规律", "    for x in range(lo, hi + 1):", "        print(x, f(x))", "", "def check(cond, msg='FAIL'):", "    # 断言式调试，条件不满足立刻暴露问题", "    if not cond:", "        print(msg)", "        sys.exit(1)", "", "def solve_small(n):", "    # 小规模暴力，用于验证高效写法", "    return sum(1 for i in range(1, n + 1) if n % i == 0)", "", "if __name__ == '__main__':", "    table(solve_small, 1, 10)", "    check(solve_small(12) == 6)"].join("\n"),
    complexity: "视具体做法而定，打表和暴力只用于小数据验证",
    applications: ["对拍验证正解", "打表找规律", "离线查询处理", "前缀和与差分", "程序调试技巧"],
    pitfalls: ["对拍数据范围太小会漏掉反例", "打表结论要在更大数据上再验证", "本地计时结果受环境影响"],
    links: [
      { t: "B站 · 对拍技巧", u: "https://search.bilibili.com/all?keyword=对拍 算法竞赛 技巧" },
      { t: "B站 · 打表找规律", u: "https://search.bilibili.com/all?keyword=打表 找规律" },
      { t: "OI Wiki · 杂项专题", u: "https://oi-wiki.org/misc/" },
      { t: "docs.python · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" },
      { t: "runoob · Python3 教程", u: "https://www.runoob.com/python3/python3-tutorial.html" },
      { t: "洛谷 · 首页", u: "https://www.luogu.com.cn/" }
    ]
  }
};
