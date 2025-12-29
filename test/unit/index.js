// async / await 支持
import 'regenerator-runtime/runtime'

// ⚠️ 测试环境一般不需要样式，如确实依赖再打开
import 'packages/theme-chalk/lib/index.css';

// TODO：1️⃣ 加载所有测试文件（必须是 .spec.js）
const testsContext = require.context('./specs', true, /date-picker-(datetime|panels)\.spec$/);
testsContext.keys().forEach(testsContext);

// 2️⃣ 加载 src 文件用于覆盖率（排除 main.js）
const srcContext = require.context('../../src', true, /^\.\/(?!main(\.js)?$)/);
srcContext.keys().forEach(srcContext);

// 3️⃣ 启动 Karma（⚠️ 必须在最后）
window.__karma__.start()
