<template>
  <div class="el-basic-table">
    <div v-if="useSearchForm" class="el-basic-table__form">
      <el-basic-form
        v-bind="formConfig || {}"
        @submit="onFormSubmit"
        @register="onFormRegister"
      />
    </div>
    <div v-if="title || titleHelpMessage" class="el-basic-table__header">
      <div class="el-basic-table__title">{{ title }}</div>
      <div v-if="titleHelpMessage" class="el-basic-table__help">{{ titleHelpMessage }}</div>
      <div class="el-basic-table__toolbar"><slot name="toolbar"></slot></div>
    </div>
    <el-table
      ref="tableRef"
      :data="internalData"
      :stripe="striped"
      :border="bordered"
      :max-height="maxHeight"
      :size="size"
      :row-key="rowKey"
      :highlight-current-row="highlightCurrentRow"
      :empty-text="emptyText"
      :show-summary="showSummary"
      :summary-method="summaryMethod"
      @selection-change="onSelectionChange"
      @row-click="onRowClick"
    >
      
      <el-basic-table-column
        v-for="(col, idx) in normalizedColumns"
        :key="col.key || col.prop || idx"
        :column="col"
        :ellipsis="ellipsis"
      />
      <template v-if="$slots.append" slot="append">
        <slot name="append"></slot>
      </template>
      <template v-if="$slots.empty" slot="empty">
        <slot name="empty"></slot>
      </template>
    </el-table>
    <div v-if="showPagination" class="el-basic-table__pagination">
      <el-pagination
        v-bind="internalPagination"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>
<script>
// 依赖组件：基础表格、分页、搜索表单与列渲染子组件
// 文件职能：封装基础表格行为（列配置、分页、远程加载、选择行、搜索联动），暴露完整方法集供外部按需控制
import ElTable from 'element-ui/packages/table';
import ElPagination from 'element-ui/packages/pagination';
import ElBasicForm from 'element-ui/packages/basic-form';
import ElBasicTableColumn from './basic-table-column.vue';
import actions from './actions';
import { ensureKeys as uEnsureKeys, normalizePagination as uNormalizePagination, mapColumns, createFetchParams } from './utils';

export default {
  name: 'ElBasicTable',
  components: { ElTable, ElPagination, ElBasicForm, ElBasicTableColumn },
  props: {
    // 标题与提示
    /**
     * 表格标题
     * @type {String}
     */
    title: String,
    /**
     * 标题右侧提示文案
     * @type {String}
     */
    titleHelpMessage: String,
    // 列配置与数据
    /**
     * 列配置数组，映射到每个列的属性
     * @type {Array<Object>}
     */
    columns: { type: Array, default: () => [] },
    /**
     * 本地数据源（与 api 互斥时以 api 为准）
     * @type {Array<Object>}
     */
    dataSource: { type: Array, default: () => [] },
    // 远程加载
    /**
     * 远程数据请求函数 (params) => Promise<{items,total}> | Array
     * @type {Function}
     */
    api: Function,
    // 外观与行为
    /** 是否显示斑马纹 */
    striped: Boolean,
    /** 是否显示边框 */
    bordered: Boolean,
    /** 表格尺寸 (medium/small/mini) */
    size: String,
    /** 行主键，可为字段名或函数 */
    rowKey: [String, Function],
    /** 空数据文案 */
    emptyText: String,
    /** 高亮当前行 */
    highlightCurrentRow: Boolean,
    /** 是否显示合计 */
    showSummary: Boolean,
    /** 合计计算方法 */
    summaryMethod: Function,
    /** 分页配置对象，或 false 不显示 */
    pagination: Object,
    /** 表格 loading 状态 */
    loading: Boolean,
    /** 文本溢出省略（全局） */
    ellipsis: { type: Boolean, default: true },
    /** 自动为数据补充 key */
    autoCreateKey: { type: Boolean, default: true },
    /** 点击行是否切换勾选 */
    clickToRowSelect: { type: Boolean, default: true },
    /** 翻页是否清空勾选 */
    clearSelectOnPageChange: { type: Boolean, default: false },
    // 搜索表单
    /** 是否启用搜索表单 */
    useSearchForm: { type: Boolean, default: false },
    /** 搜索表单配置（透传给 ElBasicForm） */
    formConfig: Object,
    // 树形表格
    /** 是否使用树形表格 */
    isTreeTable: { type: Boolean, default: false },
    // 请求钩子与映射
    /** 请求前对参数处理 */
    beforeFetch: Function,
    /** 请求后对返回值处理 */
    afterFetch: Function,
    /** 搜索条件处理钩子 */
    handleSearchInfoFn: Function,
    /** 字段映射：pageField/sizeField/listField/totalField */
    fetchSetting: Object,
    /** 是否在挂载后立即请求 */
    immediate: { type: Boolean, default: true },
    /** 外部传入的搜索条件（受控） */
    searchInfo: Object,
    // 特殊列控制
    /** 是否显示索引列 */
    showIndexColumn: { type: Boolean, default: true },
    /** 索引列属性（宽度/对齐/index 回调） */
    indexColumnProps: Object,
    // 尺寸与滚动
    /** 最大高度，超出滚动 */
    maxHeight: Number,
    /** 选择列配置（true/对象） */
    rowSelection: [Boolean, Object]
  },
  data() {
    return {
      // 内部数据状态
      /** 当前渲染的数据源（应用了 ensureKeys） */
      internalData: this.dataSource || [],
      /** 当前 loading 状态 */
      internalLoading: !!this.loading,
      /** 当前列配置（内部副本） */
      internalColumns: this.columns || [],
      /** 当前分页配置（内部副本） */
      internalPagination: this.normalizePagination(this.pagination),
      /** 最后一次请求错误 */
      lastFetchError: null,
      /** 当前选中的行（表格事件同步） */
      selectedRows: [],
      /** 当前选中行的主键集合 */
      selectedRowKeys: [],
      /** 原始接口返回对象（最近一次） */
      rawResult: null,
      /** 是否显示分页（受控） */
      showPaginationFlag: this.pagination !== false,
      /** 表单动作对象（@register 注入） */
      formActions: null,
      /** 内部搜索条件，避免直接修改 prop */
      internalSearchInfo: this.searchInfo || {}
    };
  },
  computed: {
    /**
     * 组装最终用于渲染的列配置（前置特殊列 + 常规列）
     * @returns {Array<Object>} 渲染列数组
     */
    normalizedColumns() {
      return mapColumns({
        columns: this.internalColumns,
        ellipsis: this.ellipsis,
        showIndexColumn: this.showIndexColumn,
        indexColumnProps: this.indexColumnProps,
        rowSelection: this.rowSelection
      });
    },
    showPagination() {
      // 仅当显示标志为真且存在总数（或页数）时显示分页
      if (!this.showPaginationFlag) return false;
      const p = this.internalPagination;
      return !!p && (p.total != null || p.pageCount != null);
    }
  },
  watch: {
    dataSource: {
      immediate: true,
      /**
       * 监听本地数据源变更，补齐 key 后写入内部态
       * @param {Array<Object>} val 新数据源
       */
      handler(val) { this.internalData = Array.isArray(val) ? this.ensureKeys(val) : []; }
    },
    columns: {
      immediate: true,
      /** 监听列配置变更，写入内部态 */
      handler(val) { this.internalColumns = Array.isArray(val) ? val : []; }
    },
    loading: {
      immediate: true,
      /** 监听外部 loading 状态 */
      handler(val) { this.internalLoading = !!val; }
    },
    pagination: {
      immediate: true,
      /** 监听分页配置变更，归一化后写入内部态 */
      handler(val) { this.internalPagination = this.normalizePagination(val); }
    },
    searchInfo: {
      immediate: true,
      /** 监听外部搜索条件（受控） */
      handler(val) { this.internalSearchInfo = val || {}; }
    }
  },
  methods: {
    /**
     * 为数据源补齐稳定的行键（key）
     * @param {Array<Object>} list 原始数据源
     * @returns {Array<Object>} 带有 key 的数据源
     */
    ensureKeys(list) { return uEnsureKeys(list, this.autoCreateKey, this.rowKey); },
    ...actions,
    /**
     * 归一化分页配置，提供默认值与安全检查
     * @param {Object} p 原始分页配置
     * @returns {Object} 规范化后的分页配置
     */
    normalizePagination(p) { return uNormalizePagination(p); },
    /**
     * 处理页码变更，支持翻页时清空选中行
     * @param {number} page 新页码
     */
    handlePageChange(page) {
      this.internalPagination.currentPage = page;
      if (this.clearSelectOnPageChange) this.clearSelectedRowKeys();
      this.reload();
      this.$emit('page-change', page);
    },
    /**
     * 处理页容量变更，重置到第 1 页并刷新
     * @param {number} size 新页容量
     */
    handlePageSizeChange(size) {
      this.internalPagination.pageSize = size;
      this.internalPagination.currentPage = 1;
      if (this.clearSelectOnPageChange) this.clearSelectedRowKeys();
      this.reload();
      this.$emit('page-size-change', size);
    },
    /**
     * 运行时设置表格属性（列/数据/loading/分页/选中/索引列/标题/搜索条件等）
     * @param {Object} nextProps 需更新的属性集合
     */
    setProps(nextProps) {
      const p = nextProps || {};
      if ('columns' in p) this.internalColumns = Array.isArray(p.columns) ? p.columns : [];
      if ('dataSource' in p) this.internalData = Array.isArray(p.dataSource) ? p.dataSource : [];
      if ('loading' in p) this.internalLoading = !!p.loading;
      if ('pagination' in p) this.internalPagination = this.normalizePagination(p.pagination);
      if ('rowSelection' in p) this.$emit('update:rowSelection', p.rowSelection);
      if ('showIndexColumn' in p) this.$emit('update:showIndexColumn', !!p.showIndexColumn);
      if ('searchInfo' in p) { this.internalSearchInfo = p.searchInfo || {}; this.$emit('update:searchInfo', p.searchInfo); }
      if ('title' in p) this.$emit('update:title', p.title);
    },
    /** 设置 loading 状态 */
    setLoading(v) { this.internalLoading = !!v; },
    /** 设置列配置 */
    setColumns(cols) { this.internalColumns = Array.isArray(cols) ? cols : []; },
    /** 设置数据源（补齐 key） */
    setDataSource(list) { this.internalData = Array.isArray(list) ? this.ensureKeys(list) : []; },
    /** 获取当前数据源副本 */
    getDataSource() { return this.internalData.slice(); },
    /** 获取原始接口返回 */
    getRawDataSource() { return this.rawResult; },
    /** 获取当前列配置副本 */
    getColumns() { return (this.internalColumns || []).slice(); },
    /** 设置数据源（别名） */
    setTableData(values) { this.setDataSource(values); },
    /** 合并设置分页信息 */
    setPagination(info) { this.internalPagination = { ...this.internalPagination, ...(info || {}) }; },
    /**
     * 远程刷新数据（携带分页与搜索条件）
     * @returns {void}
     */
    reload() {
      // 远程刷新数据（携带分页与搜索条件）
      /** 请求函数 */
      const fn = this.api;
      if (typeof fn !== 'function') return;
      this.internalLoading = true;
      /** 当前页码 */
      const page = this.internalPagination.currentPage;
      /** 每页条数 */
      const pageSize = this.internalPagination.pageSize;
      const params = createFetchParams({
        pagination: { currentPage: page, pageSize },
        fetchSetting: this.fetchSetting,
        searchInfo: this.internalSearchInfo,
        beforeFetch: this.beforeFetch,
        handleSearchInfoFn: this.handleSearchInfoFn
      });
      try {
        const ret = fn(params);
        if (ret && ret.then) {
          ret.then((res) => this.applyApiResult(typeof this.afterFetch === 'function' ? this.afterFetch(res) : res)).catch((err) => {
            this.lastFetchError = err;
            this.$emit('fetch-error', err);
          }).finally(() => {
            this.internalLoading = false;
          });
        } else {
          this.applyApiResult(typeof this.afterFetch === 'function' ? this.afterFetch(ret) : ret);
          this.internalLoading = false;
        }
      } catch (err) {
        this.lastFetchError = err;
        this.$emit('fetch-error', err);
        this.internalLoading = false;
      }
    },
    /**
     * 应用接口返回数据至表格
     * @param {Object|Array} res 接口返回数据
     * @returns {void}
     */
    applyApiResult(res) {
      // 应用接口返回数据至表格
      if (!res) { this.internalData = []; this.rawResult = res; return; }
      if (Array.isArray(res)) {
        this.internalData = this.ensureKeys(res);
        this.rawResult = res;
        return;
      }
      /** 字段映射 */
      const fs = this.fetchSetting || {};
      /** 列表字段名 */
      const listField = fs.listField || 'items';
      /** 总数字段名 */
      const totalField = fs.totalField || 'total';
      /** 数据列表 */
      const list = res[listField] != null ? res[listField] : (res.items || res.list || res.data || []);
      /** 总条数 */
      const total = res[totalField] != null ? res[totalField] : (res.page && res.page.total);
      this.internalData = Array.isArray(list) ? this.ensureKeys(list) : [];
      if (typeof total === 'number') this.internalPagination.total = total;
      this.rawResult = res;
      this.$emit('fetch-success', { items: this.internalData, total: this.internalPagination.total });
    },
    /** 表单注册回调，保存表单动作对象 */
    onFormRegister(actions) { this.formActions = actions; },
    /**
     * 搜索表单提交，更新内部搜索条件并刷新
     * @param {Object} payload 表单提交的搜索条件
     */
    onFormSubmit(payload) {
      this.internalSearchInfo = payload || {};
      this.$emit('form-submit', payload);
      this.$emit('update:searchInfo', payload);
      this.reload();
    }
  },
  mounted() {
    this.$emit('register', {
      // 批量更新表格属性（列、数据、loading、分页、选中、索引列、标题、搜索条件等）
      setProps: this.setProps,
      // 设置表格 loading 状态
      setLoading: this.setLoading,
      // 重新加载数据（携带分页与搜索条件）
      reload: this.reload,
      // 获取当前表格数据源副本
      getDataSource: this.getDataSource,
      // 清空表格选中行（Element UI 原生方法）
      clearSelection: this.clearSelection,
      // 设置列配置
      setColumns: this.setColumns,
      // 设置数据源（自动补齐 key）
      setDataSource: this.setDataSource,
      // 获取最近一次接口返回的原始数据
      getRawDataSource: this.getRawDataSource,
      // 获取当前列配置副本
      getColumns: this.getColumns,
      // 设置表格数据（别名方法）
      setTableData: this.setTableData,
      // 设置分页信息
      setPagination: this.setPagination,
      // 根据主键删除已选中的某一行
      deleteSelectRowByKey: this.deleteSelectRowByKey,
      // 获取当前选中行的主键数组
      getSelectRowKeys: this.getSelectRowKeys,
      // 获取当前选中的行数据数组
      getSelectRows: this.getSelectRows,
      // 清空所有已选中的行主键
      clearSelectedRowKeys: this.clearSelectedRowKeys,
      // 手动设置选中行的主键数组
      setSelectedRowKeys: this.setSelectedRowKeys,
      // 获取分页组件实例引用
      getPaginationRef: this.getPaginationRef,
      // 获取当前是否显示分页
      getShowPagination: this.getShowPagination,
      // 设置是否显示分页
      setShowPagination: this.setShowPagination,
      // 获取行选择配置对象
      getRowSelection: this.getRowSelection,
      // 批量更新表格数据（按索引）
      updateTableData: this.updateTableData,
      // 更新指定行的数据
      updateTableDataRecord: this.updateTableDataRecord,
      // 删除指定行的数据
      deleteTableDataRecord: this.deleteTableDataRecord,
      // 插入新行数据
      insertTableDataRecord: this.insertTableDataRecord,
      // 获取搜索表单实例
      getForm: this.getForm,
      // 展开所有可展开的行（树形表格）
      expandAll: this.expandAll,
      // 收起所有展开的行（树形表格）
      collapseAll: this.collapseAll,
      // 重新计算表格高度
      redoHeight: this.redoHeight
    });
    if (this.immediate && typeof this.api === 'function') this.reload();
  }
};
</script>
<style scoped>
.el-basic-table__form { margin-bottom: 12px; }
.el-basic-table__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.el-basic-table__help { color: #909399; margin-left: 8px; }
.el-basic-table__toolbar { margin-left: auto; }
.el-basic-table__pagination { padding-top: 14px; display: flex; justify-content: center; }
</style>
