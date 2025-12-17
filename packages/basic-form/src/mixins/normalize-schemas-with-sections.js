/**
 * 将带有多级 sections 结构的 form schema 做“规范化处理”，但**不再负责扁平化**。
 *
 * 说明：
 * - 早期版本中，这个函数同时承担了“样式继承 + 结构扁平化”的职责；
 * - 为了降低耦合、避免工具方法过度复杂，现在不在这里做扁平化；
 * - 目前仅作为一个轻量工具函数存在，直接返回传入的 schema 数组；
 * - 若后续需要在不改变树形结构的前提下做属性补全/规范化，可以在此函数内部扩展。
 *
 * @param {Array<object>} src 原始的 schema 数组（可能包含嵌套的 sections）
 * @returns {Array<object>} 规范化后的 schema 数组（当前实现为按原样返回）
 */
export function normalizeSchemasWithSections(src) {
  // 为避免调用方因传入非法类型导致运行时错误，这里做一个最小的类型保护
  if (!Array.isArray(src)) return [];
  // 当前版本不做任何结构变更或扁平化，直接返回原数组引用
  return src;
}

export function flattenSchemasWithSections(src) {
  if (!Array.isArray(src)) return [];

  const result = [];
  const seen = Object.create(null);

  const pushItem = (item) => {
    if (!item || !item.field) return;
    const key = String(item.field);
    if (seen[key]) return;
    seen[key] = true;
    result.push(item);
  };

  const stack = src.slice();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (Array.isArray(cur)) {
      for (let idx = cur.length - 1; idx >= 0; idx -= 1) {
        stack.push(cur[idx]);
      }
      continue;
    }
    if (Array.isArray(cur.sections)) {
      stack.push(cur.sections);
      continue;
    }
    pushItem(cur);
  }

  return result;
}
