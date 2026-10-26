/* AlgoPick 知识点讲解 · 第 1 组 */
window.LEARN_1 = {
  "simulation": {
    intro: "不找捷径，直接按题目给出的规则和步骤一步步执行，用代码把整个过程原样搬运出来，正确性最容易保证。",
    identify: ["题目把规则和步骤写得很清楚", "数据范围很小，允许逐步模拟", "要求输出过程或中间状态", "规则是确定性的，没有最优选择"],
    ops: [
      { name: "读入全部数据", py: ["data = list(map(int, sys.stdin.read().split()))"].join("\n"), note: "一次性读入比逐行 input 快" },
      { name: "初始化状态", py: ["pos = 0", "state = [0] * n"].join("\n"), note: "把关键变量先摆清楚再动手" },
      { name: "按规则推进", py: ["while pos < n:", "    pos = nxt[pos]"].join("\n"), note: "循环终止条件最容易写错" },
      { name: "方向数组", py: ["dx = [0, 1, 0, -1]", "dy = [1, 0, -1, 0]"].join("\n"), note: "网格类模拟的常用技巧" },
      { name: "输出结果", py: ["print(' '.join(map(str, ans)))"].join("\n"), note: "输出格式要和题目完全一致" }
    ],
    template: ["def simulate(n, ops):", "    # 按题意逐步模拟，返回每一步的位置", "    pos = 0", "    path = [pos]", "    for op in ops:", "        if op == 'L':", "            pos = max(0, pos - 1)", "        elif op == 'R':", "            pos = min(n - 1, pos + 1)", "        path.append(pos)", "    return path", "", "", "if __name__ == '__main__':", "    print(simulate(5, 'RRL'))"].join("\n"),
    complexity: "时间与步数成正比，空间 O(1) 或 O(n)",
    applications: ["机器人行走模拟", "扫雷 / 生命游戏", "约瑟夫环问题", "大数加法逐位模拟", "栈模拟表达式求值"],
    pitfalls: ["边界条件和终止条件最容易写错", "状态多时先列清楚变量再写代码", "别忘了题目要求的取模或输出格式"],
    links: [
      { t: "B站 · 模拟算法讲解", u: "https://search.bilibili.com/all?keyword=模拟算法 讲解" },
      { t: "B站 · 洛谷模拟题", u: "https://search.bilibili.com/all?keyword=洛谷 模拟题" },
      { t: "B站 · Python 模拟算法题", u: "https://search.bilibili.com/all?keyword=Python 模拟 算法题" },
      { t: "B站 · 约瑟夫环 Python", u: "https://search.bilibili.com/all?keyword=约瑟夫环 Python" },
      { t: "Python 文档 · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" }
    ]
  },
  "enumeration": {
    intro: "枚举所有可能的候选答案并逐一检查，用时间换正确性，是数据范围很小时最稳妥、也最容易写对的兜底做法。",
    identify: ["数据范围很小，n 在 20 左右", "要求找出满足条件的全部方案", "想不出更快的思路先写暴力", "答案空间有限可以全部检查"],
    ops: [
      { name: "单层枚举", py: ["for i in range(n):", "    check(i)"].join("\n"), note: "最简单的遍历检查" },
      { name: "双重枚举", py: ["for i in range(n):", "    for j in range(i + 1, n):", "        check(i, j)"].join("\n"), note: "两两配对问题 O(n^2)" },
      { name: "位运算枚举子集", py: ["for mask in range(1 << n):", "    for i in range(n):", "        if mask >> i & 1: pass"].join("\n"), note: "n 不超过 20 时可用" },
      { name: "组合枚举", py: ["from itertools import combinations", "for comb in combinations(nums, 2):"].join("\n"), note: "省去手写下标循环" },
      { name: "提前剪枝", py: ["if cur + rest <= best:", "    continue"].join("\n"), note: "能剪枝就别硬算" }
    ],
    template: ["def max_subarray_brute(nums):", "    # 枚举所有区间，返回最大子数组和", "    best = nums[0]", "    n = len(nums)", "    for i in range(n):", "        total = 0", "        for j in range(i, n):", "            total += nums[j]", "            if total > best:", "                best = total", "    return best", "", "", "if __name__ == '__main__':", "    print(max_subarray_brute([-2, 1, -3, 4, -1, 2, 1, -5, 4]))"].join("\n"),
    complexity: "时间 O(n^2) 或 O(2^n)，空间 O(n)",
    applications: ["两数之和暴力版", "全排列与子集枚举", "最大子数组 O(n^2)", "n 皇后暴力搜索"],
    pitfalls: ["暴力不剪枝在 n=30 时会超时", "枚举下标时注意不要重复计算", "组合问题要保证不重不漏"],
    links: [
      { t: "B站 · 枚举算法讲解", u: "https://search.bilibili.com/all?keyword=枚举算法 讲解" },
      { t: "B站 · 暴力枚举算法", u: "https://search.bilibili.com/all?keyword=暴力枚举 算法" },
      { t: "B站 · 子集枚举位运算", u: "https://search.bilibili.com/all?keyword=子集枚举 位运算" },
      { t: "Python 文档 · itertools", u: "https://docs.python.org/zh-cn/3/library/itertools.html" },
      { t: "Python 文档 · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" }
    ]
  },
  "prefix-sum": {
    intro: "预先算出前 i 项之和，把区间求和从每次 O(n) 降到 O(1)，是处理区间和与子数组问题最基础的一把刀。",
    identify: ["多次询问同一数组的区间和", "统计子数组和等于 K 的个数", "二维矩阵区域求和", "需要快速比较两段区间之和"],
    ops: [
      { name: "建一维前缀和", py: ["pre = [0] * (n + 1)", "for i, x in enumerate(a):", "    pre[i + 1] = pre[i] + x"].join("\n"), note: "pre[i] 表示前 i 项之和" },
      { name: "区间求和", py: ["s = pre[r + 1] - pre[l]"].join("\n"), note: "闭区间 [l, r] 的和" },
      { name: "哈希表配合计数", py: ["from collections import defaultdict", "cnt = defaultdict(int)", "cnt[0] = 1"].join("\n"), note: "统计和为 K 的子数组个数" },
      { name: "建二维前缀和", py: ["pre[i + 1][j + 1] = a[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j]"].join("\n"), note: "容斥原理，别漏减项" },
      { name: "子矩阵求和", py: ["s = pre[x2][y2] - pre[x1][y2] - pre[x2][y1] + pre[x1][y1]"].join("\n"), note: "下标按左上开区间理解" }
    ],
    template: ["from collections import defaultdict", "", "", "def subarray_sum(nums, k):", "    # 前缀和 + 哈希表统计和为 k 的子数组个数", "    pre = 0", "    cnt = defaultdict(int)", "    cnt[0] = 1", "    ans = 0", "    for x in nums:", "        pre += x", "        ans += cnt[pre - k]", "        cnt[pre] += 1", "    return ans", "", "", "if __name__ == '__main__':", "    print(subarray_sum([1, 1, 1], 2))"].join("\n"),
    complexity: "预处理 O(n)，每次查询 O(1)，空间 O(n)",
    applications: ["区间和多次询问", "子数组和为 K", "二维矩阵区域和", "矩阵中 1 的个数", "和能被 K 整除的子数组"],
    pitfalls: ["前缀和用 pre[i+1] 存前 i 项", "区间和减的是 pre[l] 不是 pre[l+1]", "二维前缀和行列下标别写反"],
    links: [
      { t: "B站 · 前缀和 Python", u: "https://search.bilibili.com/all?keyword=前缀和 Python" },
      { t: "B站 · 前缀和与差分讲解", u: "https://search.bilibili.com/all?keyword=前缀和 差分 讲解" },
      { t: "B站 · 子数组和为 K", u: "https://search.bilibili.com/all?keyword=子数组和为K" },
      { t: "OI Wiki · 前缀和与差分", u: "https://oi-wiki.org/basic/prefix-sum/" },
      { t: "Python 文档 · collections", u: "https://docs.python.org/zh-cn/3/library/collections.html" }
    ]
  },
  "difference": {
    intro: "用差分数组把「区间整体加同一个数」拆成两个端点的修改，最后做一次前缀和就能还原出最终数组。",
    identify: ["多次对区间统一加或减同一个值", "只关心全部操作完的最终数组", "需要统计每个位置被覆盖的次数", "区间修改比单点查询多得多"],
    ops: [
      { name: "建差分数组", py: ["diff = [0] * (n + 1)"].join("\n"), note: "多开一位避免越界" },
      { name: "区间加值", py: ["diff[l] += v", "diff[r + 1] -= v"].join("\n"), note: "左闭右闭区间" },
      { name: "前缀和还原", py: ["cur = 0", "for i in range(n):", "    cur += diff[i]", "    a[i] = cur"].join("\n"), note: "扫一遍即得原数组" },
      { name: "二维差分", py: ["d[x1][y1] += v", "d[x2 + 1][y1] -= v", "d[x1][y2 + 1] -= v", "d[x2 + 1][y2 + 1] += v"].join("\n"), note: "四个角，顺序别搞错" }
    ],
    template: ["def range_add(n, queries):", "    # 对区间整体加 v，返回最终数组", "    diff = [0] * (n + 1)", "    for l, r, v in queries:", "        diff[l] += v", "        diff[r + 1] -= v", "    res = []", "    cur = 0", "    for i in range(n):", "        cur += diff[i]", "        res.append(cur)", "    return res", "", "", "if __name__ == '__main__':", "    print(range_add(5, [(0, 2, 1), (1, 4, 2)]))"].join("\n"),
    complexity: "每次区间修改 O(1)，还原 O(n)，空间 O(n)",
    applications: ["区间批量加一", "航班预订统计", "拼车区间覆盖次数", "一维数组还原", "花期内花的数目"],
    pitfalls: ["r+1 会越界，差分数组要开 n+1", "只查询一次区间时不必用差分", "差分通常配合前缀和一起用"],
    links: [
      { t: "B站 · 差分数组 Python", u: "https://search.bilibili.com/all?keyword=差分数组 Python" },
      { t: "B站 · 差分算法讲解", u: "https://search.bilibili.com/all?keyword=差分 算法 讲解" },
      { t: "B站 · 区间加 差分", u: "https://search.bilibili.com/all?keyword=区间加 差分" },
      { t: "OI Wiki · 前缀和与差分", u: "https://oi-wiki.org/basic/prefix-sum/" },
      { t: "Python 文档 · 内置类型", u: "https://docs.python.org/zh-cn/3/library/stdtypes.html" }
    ]
  },
  "two-pointers": {
    intro: "用两个指针同向或对撞地扫过数组，借助单调性省掉一层循环，把很多 O(n^2) 的双重枚举优化成 O(n)。",
    identify: ["有序数组里找两数之和", "原地删除、去重或分区", "左右两端向中间收缩", "快慢指针判断环或找中点"],
    ops: [
      { name: "对撞指针", py: ["l, r = 0, n - 1", "while l < r:", "    pass"].join("\n"), note: "两端向中间走" },
      { name: "同向快慢指针", py: ["slow = 0", "for fast in range(n):", "    pass"].join("\n"), note: "慢指针记录写入位置" },
      { name: "判断该动哪边", py: ["if a[l] + a[r] < target:", "    l += 1", "else:", "    r -= 1"].join("\n"), note: "靠单调性决定方向" },
      { name: "原地交换写入", py: ["a[slow], a[fast] = a[fast], a[slow]", "slow += 1"].join("\n"), note: "原地操作省空间" }
    ],
    template: ["def two_sum_sorted(nums, target):", "    # 有序数组找两数之和，返回下标", "    l, r = 0, len(nums) - 1", "    while l < r:", "        s = nums[l] + nums[r]", "        if s == target:", "            return [l, r]", "        if s < target:", "            l += 1", "        else:", "            r -= 1", "    return []", "", "", "if __name__ == '__main__':", "    print(two_sum_sorted([1, 2, 4, 7, 11], 9))"].join("\n"),
    complexity: "时间 O(n)，额外空间 O(1)",
    applications: ["有序数组两数之和", "移除元素", "三数之和", "反转字符串", "环形链表判环"],
    pitfalls: ["对撞指针通常要求数组有序", "移动哪一侧必须靠单调性判断", "注意 l < r 还是 l <= r"],
    links: [
      { t: "B站 · 双指针 Python", u: "https://search.bilibili.com/all?keyword=双指针 Python" },
      { t: "B站 · 双指针算法讲解", u: "https://search.bilibili.com/all?keyword=双指针 算法 讲解" },
      { t: "B站 · 三数之和双指针", u: "https://search.bilibili.com/all?keyword=三数之和 双指针" },
      { t: "B站 · 快慢指针", u: "https://search.bilibili.com/all?keyword=快慢指针" },
      { t: "Python 文档 · 内置类型", u: "https://docs.python.org/zh-cn/3/library/stdtypes.html" }
    ]
  },
  "sliding-window": {
    intro: "维护一个满足约束的连续区间，右端点负责扩张、左端点负责收缩，均摊 O(n) 求出最优的窗口。",
    identify: ["求最长或最短的连续子数组", "窗口内元素要满足某个约束", "连续子串且左右边界单调", "定长窗口内的统计量"],
    ops: [
      { name: "右端点扩张", py: ["for r, x in enumerate(nums):", "    window[x] += 1"].join("\n"), note: "先把新元素纳入窗口" },
      { name: "左端点收缩", py: ["while not ok():", "    window[nums[l]] -= 1", "    l += 1"].join("\n"), note: "不合法就一直缩" },
      { name: "更新答案", py: ["ans = max(ans, r - l + 1)"].join("\n"), note: "在窗口合法时更新" },
      { name: "定长窗口滑出", py: ["if r >= k:", "    window[nums[r - k]] -= 1"].join("\n"), note: "窗口长度固定为 k" },
      { name: "用 Counter 维护", py: ["from collections import Counter", "need = Counter(t)"].join("\n"), note: "字符计数型窗口常用" }
    ],
    template: ["def longest_unique(s):", "    # 无重复字符的最长子串", "    last = {}", "    l = 0", "    ans = 0", "    for r, ch in enumerate(s):", "        if ch in last and last[ch] >= l:", "            l = last[ch] + 1", "        last[ch] = r", "        ans = max(ans, r - l + 1)", "    return ans", "", "", "if __name__ == '__main__':", "    print(longest_unique('abcabcbb'))"].join("\n"),
    complexity: "时间均摊 O(n)，空间 O(字符集大小)",
    applications: ["无重复最长子串", "最小覆盖子串", "定长子数组最大和", "长度最小的子数组", "窗口内最多 K 个不同字符"],
    pitfalls: ["收缩窗口时别忘了同步更新计数", "先保证窗口合法再更新答案", "左指针只能前进不能回退"],
    links: [
      { t: "B站 · 滑动窗口 Python", u: "https://search.bilibili.com/all?keyword=滑动窗口 Python" },
      { t: "B站 · 滑动窗口算法讲解", u: "https://search.bilibili.com/all?keyword=滑动窗口 算法 讲解" },
      { t: "B站 · 无重复字符的最长子串", u: "https://search.bilibili.com/all?keyword=无重复字符的最长子串" },
      { t: "B站 · 最小覆盖子串", u: "https://search.bilibili.com/all?keyword=最小覆盖子串" },
      { t: "Python 文档 · collections", u: "https://docs.python.org/zh-cn/3/library/collections.html" }
    ]
  },
  "coordinate-compression": {
    intro: "把稀疏的大坐标映射成紧凑的名次，只保留元素之间的相对大小关系，从而能在小值域上开数组处理。",
    identify: ["坐标值很大但元素个数不多", "只关心相对大小和先后顺序", "值域开数组内存不够", "要在坐标上建树状数组或线段树"],
    ops: [
      { name: "排序去重", py: ["vals = sorted(set(nums))"].join("\n"), note: "得到所有出现过的值" },
      { name: "二分查名次", py: ["import bisect", "i = bisect.bisect_left(vals, x)"].join("\n"), note: "查不到时返回插入位置" },
      { name: "建映射字典", py: ["rank = {v: i for i, v in enumerate(vals)}"].join("\n"), note: "查询 O(1)，但要额外空间" },
      { name: "名次还原真值", py: ["real = vals[i]"].join("\n"), note: "输出答案时别忘还原" }
    ],
    template: ["import bisect", "", "", "def compress(nums):", "    # 返回每个元素的名次和去重后的值表", "    vals = sorted(set(nums))", "    rank = {v: i for i, v in enumerate(vals)}", "    return [rank[x] for x in nums], vals", "", "", "def query(vals, x):", "    # 二分求 x 压缩后的下标", "    return bisect.bisect_left(vals, x)", "", "", "if __name__ == '__main__':", "    a, v = compress([100, 5, 100, 50])", "    print(a, v, query(v, 50))"].join("\n"),
    complexity: "排序 O(n log n)，查询 O(log n)，空间 O(n)",
    applications: ["树状数组求逆序对", "稀疏坐标建数组", "区间查询离线处理", "离散化后二分查找", "统计坐标覆盖"],
    pitfalls: ["映射要基于去重排序后的值表", "bisect_left 和 bisect_right 别混用", "压缩后要记得把答案还原"],
    links: [
      { t: "B站 · 离散化算法", u: "https://search.bilibili.com/all?keyword=离散化 算法" },
      { t: "B站 · 离散化 树状数组", u: "https://search.bilibili.com/all?keyword=离散化 树状数组" },
      { t: "B站 · 逆序对 离散化", u: "https://search.bilibili.com/all?keyword=逆序对 离散化" },
      { t: "Python 文档 · bisect", u: "https://docs.python.org/zh-cn/3/library/bisect.html" },
      { t: "Python 文档 · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" }
    ]
  },
  "interval-merge": {
    intro: "先把所有区间按左端点排序，再从左到右线性扫描，把重叠的部分不断并成一段，是区间问题的通用预处理。",
    identify: ["给出若干区间要合并或求交", "判断两个区间是否重叠", "求区间覆盖的总长度", "插入一个新区间到已有区间里"],
    ops: [
      { name: "按左端点排序", py: ["intervals.sort(key=lambda x: x[0])"].join("\n"), note: "必须先排序才能线性合并" },
      { name: "判断是否重叠", py: ["if l <= cur[1]:", "    cur[1] = max(cur[1], r)"].join("\n"), note: "重叠就延长右端点" },
      { name: "开新的一段", py: ["res.append(cur)", "cur = [l, r]"].join("\n"), note: "不重叠就另起一段" },
      { name: "判两区间相交", py: ["if a[1] < b[0] or b[1] < a[0]:", "    pass"].join("\n"), note: "左闭右闭时的写法" }
    ],
    template: ["def merge(intervals):", "    # 合并所有重叠区间", "    if not intervals:", "        return []", "    intervals = sorted(intervals, key=lambda x: x[0])", "    res = [list(intervals[0])]", "    for l, r in intervals[1:]:", "        if l <= res[-1][1]:", "            res[-1][1] = max(res[-1][1], r)", "        else:", "            res.append([l, r])", "    return res", "", "", "if __name__ == '__main__':", "    print(merge([[1, 3], [2, 6], [8, 10], [15, 18]]))"].join("\n"),
    complexity: "排序 O(n log n)，合并 O(n)，空间 O(n)",
    applications: ["合并重叠区间", "插入区间", "无重叠区间个数", "区间列表的交集", "会议室安排问题"],
    pitfalls: ["要按左端点排序而不是右端点", "合并时右端点取 max 不是直接覆盖", "左闭右开和左闭右闭要统一"],
    links: [
      { t: "B站 · 区间合并算法", u: "https://search.bilibili.com/all?keyword=区间合并 算法" },
      { t: "B站 · 合并区间 Python", u: "https://search.bilibili.com/all?keyword=合并区间 Python" },
      { t: "B站 · 区间问题贪心", u: "https://search.bilibili.com/all?keyword=区间问题 贪心" },
      { t: "Python 文档 · 内置类型", u: "https://docs.python.org/zh-cn/3/library/stdtypes.html" },
      { t: "Python 文档 · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" }
    ]
  },
  "sweep-line": {
    intro: "把每个区间拆成进入和离开两个事件，按坐标排序后扫一遍，用计数器维护当前活跃的区间数量。",
    identify: ["求同时重叠的最大区间数", "带时间或坐标的增减事件", "矩形面积并或覆盖次数", "需要按坐标逐个处理事件"],
    ops: [
      { name: "构造事件", py: ["events.append((l, 1))", "events.append((r, -1))"].join("\n"), note: "进入加一，离开减一" },
      { name: "事件排序", py: ["events.sort()"].join("\n"), note: "按坐标从小到大" },
      { name: "扫描累加", py: ["cur += delta", "best = max(best, cur)"].join("\n"), note: "cur 是当前活跃数" },
      { name: "同坐标定序", py: ["events.sort(key=lambda e: (e[0], e[1]))"].join("\n"), note: "先离开还是先进入要统一" }
    ],
    template: ["def max_overlap(intervals):", "    # 扫描线求最大重叠区间数", "    events = []", "    for l, r in intervals:", "        events.append((l, 1))", "        events.append((r, -1))", "    events.sort(key=lambda e: (e[0], e[1]))", "    cur = 0", "    best = 0", "    for _, delta in events:", "        cur += delta", "        best = max(best, cur)", "    return best", "", "", "if __name__ == '__main__':", "    print(max_overlap([[1, 3], [2, 6], [4, 5]]))"].join("\n"),
    complexity: "排序 O(n log n)，扫描 O(n)，空间 O(n)",
    applications: ["最大重叠区间数", "矩形面积并", "天际线问题", "区间覆盖染色", "会议室数量"],
    pitfalls: ["同一坐标的事件先后顺序要想清楚", "左闭右开和左闭右闭必须统一", "事件数通常是区间数的两倍"],
    links: [
      { t: "B站 · 扫描线算法", u: "https://search.bilibili.com/all?keyword=扫描线 算法" },
      { t: "B站 · 扫描线 线段树", u: "https://search.bilibili.com/all?keyword=扫描线 线段树" },
      { t: "B站 · 矩形面积并", u: "https://search.bilibili.com/all?keyword=矩形面积并" },
      { t: "B站 · 最大重叠区间", u: "https://search.bilibili.com/all?keyword=最大重叠区间" },
      { t: "Python 文档 · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" }
    ]
  },
  "binary-search": {
    intro: "在有序数组或具有单调性的答案空间上不断折半，把逐一的线性查找换成 O(log n) 的判定式搜索。",
    identify: ["求最小或最大满足条件的值", "答案有单调性，可以写 check", "有序数组里定位或找插入位置", "极大化最小值这类最值问题"],
    ops: [
      { name: "标准查找", py: ["l, r = 0, n - 1", "while l <= r:", "    mid = (l + r) // 2"].join("\n"), note: "闭区间写法，找到即返回" },
      { name: "库函数定位", py: ["import bisect", "i = bisect.bisect_left(a, x)"].join("\n"), note: "第一个大于等于 x 的位置" },
      { name: "二分答案", py: ["while l < r:", "    mid = (l + r) // 2", "    if check(mid):", "        r = mid", "    else:", "        l = mid + 1"].join("\n"), note: "找最小的可行解" },
      { name: "浮点二分", py: ["for _ in range(60):", "    mid = (l + r) / 2"].join("\n"), note: "固定迭代次数代替 eps" },
      { name: "上界写法", py: ["l, r = 0, n", "while l < r:", "    mid = (l + r) // 2"].join("\n"), note: "左闭右开不易写错" }
    ],
    template: ["import bisect", "", "", "def lower_bound(a, x):", "    # 手写二分：第一个大于等于 x 的下标", "    l, r = 0, len(a)", "    while l < r:", "        mid = (l + r) // 2", "        if a[mid] < x:", "            l = mid + 1", "        else:", "            r = mid", "    return l", "", "", "if __name__ == '__main__':", "    a = [1, 3, 3, 5, 7]", "    print(lower_bound(a, 3), bisect.bisect_left(a, 3))"].join("\n"),
    complexity: "时间 O(log n)，空间 O(1)",
    applications: ["有序数组查找", "第一个错误的版本", "分割数组的最大值", "求平方根", "爱吃香蕉的珂珂"],
    pitfalls: ["mid 用 (l+r)//2，边界左右要对应", "二分答案前先确认 check 单调", "手写二分注意死循环，区间要真的缩小"],
    links: [
      { t: "B站 · 二分查找 Python", u: "https://search.bilibili.com/all?keyword=二分查找 Python" },
      { t: "B站 · 二分答案讲解", u: "https://search.bilibili.com/all?keyword=二分答案 讲解" },
      { t: "B站 · 二分查找边界", u: "https://search.bilibili.com/all?keyword=二分查找 边界" },
      { t: "OI Wiki · 二分", u: "https://oi-wiki.org/basic/binary/" },
      { t: "Python 文档 · bisect", u: "https://docs.python.org/zh-cn/3/library/bisect.html" },
      { t: "Python 文档 · 内置函数", u: "https://docs.python.org/zh-cn/3/library/functions.html" }
    ]
  },
  "sort": {
    intro: "按关键字重新排列元素，让顺序变单调、相等的元素聚到一起，往往是双指针、二分和贪心能用的前提。",
    identify: ["需要按大小或自定义规则排列", "要先排序再去重或找相邻重复", "贪心要按关键字排序后依次选", "统计类问题先排序再计数"],
    ops: [
      { name: "基础排序", py: ["a.sort()", "b = sorted(a, reverse=True)"].join("\n"), note: "sort 原地，sorted 返回新表" },
      { name: "按关键字排序", py: ["a.sort(key=lambda x: x[1])"].join("\n"), note: "key 比 cmp 快得多" },
      { name: "多关键字排序", py: ["a.sort(key=lambda x: (x[0], -x[1]))"].join("\n"), note: "负号实现降序" },
      { name: "自定义比较", py: ["from functools import cmp_to_key", "a.sort(key=cmp_to_key(cmp))"].join("\n"), note: "只有在没法写 key 时才用" },
      { name: "计数排序", py: ["from collections import Counter", "for v in sorted(cnt):", "    pass"].join("\n"), note: "值域小时比比较排序快" }
    ],
    template: ["from functools import cmp_to_key", "", "", "def largest_number(nums):", "    # 自定义比较：拼接后更大的排在前面", "    strs = [str(x) for x in nums]", "", "    def cmp(a, b):", "        if a + b > b + a:", "            return -1", "        return 1 if a + b < b + a else 0", "", "    strs.sort(key=cmp_to_key(cmp))", "    res = ''.join(strs)", "    return '0' if res[0] == '0' else res", "", "", "if __name__ == '__main__':", "    print(largest_number([10, 2, 9]))"].join("\n"),
    complexity: "比较排序 O(n log n)，空间 O(log n) 到 O(n)",
    applications: ["合并区间前排序", "字母异位词分组", "最大数拼接", "按频率排序", "会议安排贪心"],
    pitfalls: ["sort 原地改原表，sorted 返回新表", "key 里别混入不可比较的 None", "多关键字降序要用负号或 reverse 分段"],
    links: [
      { t: "B站 · 排序算法 Python", u: "https://search.bilibili.com/all?keyword=排序算法 Python" },
      { t: "B站 · 快速排序讲解", u: "https://search.bilibili.com/all?keyword=快速排序 讲解" },
      { t: "B站 · 归并排序 Python", u: "https://search.bilibili.com/all?keyword=归并排序 Python" },
      { t: "OI Wiki · 排序简介", u: "https://oi-wiki.org/basic/sort-intro/" },
      { t: "Python 文档 · 排序指南", u: "https://docs.python.org/zh-cn/3/howto/sorting.html" },
      { t: "洛谷 · P1177 快速排序", u: "https://www.luogu.com.cn/problem/P1177" }
    ]
  },
  "quickselect": {
    intro: "借用快速排序的分区思想，每次只递归包含目标的那一侧，期望在 O(n) 时间内求出第 K 大或第 K 小。",
    identify: ["只要第 K 大或第 K 小，不必全排序", "数据量大且允许期望复杂度", "求中位数或最小的 K 个数", "需要 O(n) 级别的选择算法"],
    ops: [
      { name: "分区", py: ["p = partition(a, l, r)"].join("\n"), note: "小于主元的放左边" },
      { name: "命中即返回", py: ["if p == k:", "    return a[p]"].join("\n"), note: "下标恰好是第 k 小" },
      { name: "只走一侧", py: ["if k < p:", "    r = p - 1", "else:", "    l = p + 1"].join("\n"), note: "这是比快排快的关键" },
      { name: "三路分区", py: ["lt, gt = l, r", "while lt <= gt:", "    pass"].join("\n"), note: "大量重复元素时更快" },
      { name: "堆的替代写法", py: ["import heapq", "heapq.nlargest(k, a)"].join("\n"), note: "k 很小时堆更省心" }
    ],
    template: ["import random", "", "", "def quickselect(a, k):", "    # 返回第 k 小（k 从 0 开始）的元素", "    l, r = 0, len(a) - 1", "    while True:", "        p = random.randint(l, r)", "        a[l], a[p] = a[p], a[l]", "        pivot = a[l]", "        i = l", "        for j in range(l + 1, r + 1):", "            if a[j] < pivot:", "                i += 1", "                a[i], a[j] = a[j], a[i]", "        a[l], a[i] = a[i], a[l]", "        if i == k:", "            return a[i]", "        if i < k:", "            l = i + 1", "        else:", "            r = i - 1", "", "", "if __name__ == '__main__':", "    print(quickselect([3, 2, 1, 5, 4], 2))"].join("\n"),
    complexity: "期望 O(n)，最坏 O(n^2)，空间 O(1)",
    applications: ["数组中的第 K 大元素", "前 K 个高频元素", "求中位数", "最小的 K 个数", "数据流的中位数"],
    pitfalls: ["最坏情况会退化成 O(n^2)", "随机选主元可避免被特意构造的数据卡", "注意第 K 大和第 K 小的下标换算"],
    links: [
      { t: "B站 · 快速选择算法", u: "https://search.bilibili.com/all?keyword=快速选择 算法" },
      { t: "B站 · 第K大元素", u: "https://search.bilibili.com/all?keyword=第K大 元素" },
      { t: "B站 · 快速排序分治", u: "https://search.bilibili.com/all?keyword=快速排序 分治" },
      { t: "Python 文档 · heapq", u: "https://docs.python.org/zh-cn/3/library/heapq.html" },
      { t: "Python 文档 · random", u: "https://docs.python.org/zh-cn/3/library/random.html" }
    ]
  }
};
