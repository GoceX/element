import { createBasicFormRuntimeMixin } from './basic-form-runtime-factory';
import { flattenSchemasWithSections, normalizeSchemasWithSections } from './normalize-schemas-with-sections';

/**
 * sections 模式运行时：
 * - 渲染阶段保留树形结构（用于分组展示）
 * - 初始化/重置/提交等需要字段列表时，通过 flattenSchemasWithSections 扁平化抽取字段
 */
export default createBasicFormRuntimeMixin({
  normalizeSchemas: normalizeSchemasWithSections,
  flattenSchemas: flattenSchemasWithSections,
  logScope: 'ElBasicFormSections'
});
