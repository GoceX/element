// 工具函数集合：列映射、分页归一化、参数生成、数据补齐

// 根据点号路径从对象中获取嵌套值
export function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const keys = String(path).split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return undefined;
    result = result[key];
  }
  return result;
}

// 为数据源补齐稳定的 key 字段
export function ensureKeys(list, autoCreate = true, rowKey) {
  if (!Array.isArray(list)) return [];
  const hasKey = list.every((r) => r && (r.key !== undefined));
  if (hasKey || (!autoCreate && !rowKey)) return list;
  return list.map((r, idx) => ({ key: r.key != null ? r.key : (r.id != null ? r.id : idx + 1), ...r }));
}

// 归一化分页配置，提供默认值与安全检查
export function normalizePagination(p) {
  const src = p || {};
  /** 每页条数 */
  const pageSize = typeof src.pageSize === 'number' ? src.pageSize : 10;
  /** 当前页码 */
  const currentPage = typeof src.currentPage === 'number' ? src.currentPage : 1;
  return {
    /** 总条数 */
    total: typeof src.total === 'number' ? src.total : 0,
    /** 总页数（可选） */
    pageCount: typeof src.pageCount === 'number' ? src.pageCount : null,
    /** 每页条数 */
    pageSize,
    /** 当前页码 */
    currentPage,
    /** 分页器按钮数量 */
    pagerCount: typeof src.pagerCount === 'number' ? src.pagerCount : 5,
    /** 分页布局 */
    layout: src.layout || 'total, sizes, prev, pager, next, jumper',
    /** 可选的每页条数 */
    pageSizes: Array.isArray(src.pageSizes) ? src.pageSizes : [10, 20, 30, 40, 50, 100],
    /** 背景样式开关 */
    background: !!src.background,
    /** 单页隐藏分页器 */
    hideOnSinglePage: !!src.hideOnSinglePage,
    /** 小尺寸分页器 */
    small: !!src.small
  };
}

// 生成最终请求参数（分页 + 搜索 + 钩子）
export function createFetchParams({ pagination, fetchSetting, searchInfo, beforeFetch, handleSearchInfoFn }) {
  /** 字段映射 */
  const fs = fetchSetting || {};
  /** 页码字段名 */
  const pageField = fs.pageField || 'page';
  /** 页容量字段名 */
  const sizeField = fs.sizeField || 'pageSize';
  /** 基础分页参数 */
  let params = { [pageField]: pagination.currentPage, [sizeField]: pagination.pageSize };
  /** 搜索条件 */
  const si = searchInfo || {};
  /** 处理后的搜索条件 */
  const handledSI = typeof handleSearchInfoFn === 'function' ? handleSearchInfoFn(si) : si;
  /** 请求前处理 */
  params = Object.assign({}, handledSI, params);
  return typeof beforeFetch === 'function' ? beforeFetch(params) : params;
}

// 将列配置转换为渲染列（含前置特殊列）
export function mapColumns({ columns, ellipsis, showIndexColumn, indexColumnProps, rowSelection }) {
  const baseCols = (columns || []).map((c, i) => ({
    /** 渲染 key（优先 key/dataIndex；否则按序号） */
    key: c.key != null ? c.key : (c.dataIndex != null ? c.dataIndex : `col_${i}`),
    /** 表头文本（title/label） */
    title: c.title,
    label: c.label,
    /** 数据字段（prop/dataIndex） */
    prop: c.prop,
    dataIndex: c.dataIndex,
    /** 宽度/最小宽度 */
    width: c.width,
    minWidth: c.minWidth,
    /** 对齐方式/表头对齐 */
    align: c.align,
    headerAlign: c.headerAlign,
    /** 固定列（left/right） */
    fixed: c.fixed,
    /** 是否可排序 */
    sortable: c.sortable,
    /** 列类型（default/selection/index 等） */
    type: c.type,
    /** 具名插槽名称 */
    slot: c.slot,
    /** 溢出省略（优先列级；否则使用全局 ellipsis） */
    showOverflowTooltip: c.showOverflowTooltip != null ? c.showOverflowTooltip : !!ellipsis
  }));
  // 前置特殊列（索引、选择）
  const special = [];
  if (showIndexColumn) {
    special.push({
      key: '__index__',
      type: 'index',
      title: '',
      dataIndex: '',
      index: (indexColumnProps && indexColumnProps.index) || undefined,
      width: (indexColumnProps && indexColumnProps.width) || undefined,
      align: (indexColumnProps && indexColumnProps.align) || undefined
    });
  }
  if (rowSelection) {
    special.push({ key: '__selection__', type: 'selection', align: 'center', title: '', dataIndex: '' });
  }
  return special.concat(baseCols);
}
