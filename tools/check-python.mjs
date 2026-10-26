#!/usr/bin/env node
/**
 * AlgoPick · 讲解区 Python 模板检查
 *
 *   node tools/check-python.mjs           # 把 72 个模板导出到 .tmp-pytpl/ 并打印路径
 *   node tools/check-python.mjs --run     # 顺带调用 python 做语法编译检查
 *
 * 讲解里的 template 承诺是「能直接跑通的 Python」，这个脚本把它落成真正的 .py 文件，
 * 再用 python -m compileall 逐个编译，确保不是伪代码。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.tmp-pytpl');

const learn = {};
for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter((x) => /^learn-\d+\.js$/.test(x)).sort()) {
  const w = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))(w);
  const key = Object.keys(w).find((k) => /^LEARN_/.test(k));
  Object.assign(learn, w[key]);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const ids = Object.keys(learn).sort();
for (const id of ids) {
  fs.writeFileSync(path.join(OUT, id.replace(/[^a-z0-9-]/gi, '_') + '.py'), String(learn[id].template || '') + '\n', 'utf8');
}
console.log(`已导出 ${ids.length} 个 Python 模板到 ${path.relative(ROOT, OUT)}/`);

if (!process.argv.includes('--run')) {
  console.log('加 --run 参数可以做语法编译检查。');
  process.exit(0);
}

const py = process.env.PYTHON || 'python';
const r = spawnSync(py, ['-m', 'compileall', '-q', OUT], { encoding: 'utf8' });
if (r.error) {
  console.error('调用 python 失败: ' + r.error.message);
  process.exit(2);
}
const out = (r.stdout || '') + (r.stderr || '');
if (r.status === 0) {
  console.log(`✅ ${ids.length} 个模板全部通过 Python 语法检查`);
} else {
  console.error('❌ 有模板不是合法 Python：\n' + out);
}
console.log('模板目录保留在 ' + path.relative(ROOT, OUT) + '/，可自行打开查看。');
process.exit(r.status === 0 ? 0 : 1);
