import { createBasicFormRuntimeMixin } from './basic-form-runtime-factory';

/**
 * 普通模式运行时：
 * - schemas 视为一维字段数组
 * - normalize/flatten 均做最小类型保护，不做额外结构处理
 */
export default createBasicFormRuntimeMixin({
  normalizeSchemas: (src) => (Array.isArray(src) ? src : []),
  flattenSchemas: (src) => (Array.isArray(src) ? src : []),
  logScope: 'ElBasicForm'
});
