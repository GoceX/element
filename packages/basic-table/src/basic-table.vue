<template>
  <div class="el-basic-table">
    <div v-if="useSearchForm" class="el-basic-table__form">
      <el-basic-form
        v-bind="formConfig || {}"
        :table-action="tableActionContext"
        @submit="onFormSubmit"
        @register="onFormRegister"
      />
    </div>
    <!-- v-if="title || titleHelpMessage" -->
    <div class="el-basic-table__header">
      <div class="el-basic-table__title">{{ title }}</div>
      <div v-if="titleHelpMessage" class="el-basic-table__help">{{ titleHelpMessage }}</div>
      <div class="el-basic-table__toolbar">
        <slot name="toolbar"></slot>
      </div>
    </div>
    <el-table
      ref="tableRef"
      v-loading="internalLoading"
      :data="internalData"
      :stripe="striped"
      :border="bordered"
      :max-height="maxHeight"
      :size="size"
      :row-key="rowKey"
      :tree-props="treeProps"
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
      <!-- <template v-if="$slots.append" slot="append">
        <slot name="append"></slot>
      </template>
      <template v-if="$slots.empty" slot="empty">
        <slot name="empty"></slot>
      </template> -->
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
import ElTable from 'rowinself-ui/packages/table';
import ElPagination from 'rowinself-ui/packages/pagination';
import ElBasicForm from 'rowinself-ui/packages/basic-form';
import ElBasicTableColumn from './basic-table-column.vue';
import actions from './actions';
import { ensureKeys as uEnsureKeys, normalizePagination as uNormalizePagination, mapColumns, createFetchParams, getByPath } from './utils';

export default {
  name: 'ElBasicTable',
  components: { ElTable, ElPagination, ElBasicForm, ElBasicTableColumn },
  provide() {
    return {
      // 提供一个函数来获取最新的 $scopedSlots，保证响应性
      getBasicTableSlots: () => this.$scopedSlots
    };
  },
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
    clickToRowSelect: { type: Boolean, default: false },
    /** 翻页是否清空勾选 */
    clearSelectOnPageChange: { type: Boolean, default: false },
    // 搜索表单
    /** 是否启用搜索表单 */
    useSearchForm: { type: Boolean, default: false },
    /** 搜索表单配置（透传给 ElBasicForm） */
    formConfig: Object,
    // 树形表格
    /** 树形表格子项字段名与是否有子项标志 */
    treeProps: {
      type: Object,
      default: () => ({
        /** 子项字段名 */
        children: 'children',
        /** 是否有子项标志 */
        hasChildren: 'hasChildren'
      })
    },
    // 请求钩子与映射
    /** 请求前对参数处理 */
    beforeFetch: Function,
    /** 请求后对返回值处理 */
    afterFetch: Function,
    /** 搜索条件处理钩子 */
    handleSearchInfoFn: Function,
    /** 字段映射：pageField/sizeField/listField/totalField */
    fetchSetting: {
      type: Object,
      default: () => ({
        /** 列表字段名 */
        listField: 'list',
        /** 总数字段名（支持点号路径如 page.totalRowNum） */
        totalField: 'page.totalRowNum',
        /** 当前页码字段名 */
        pageField: 'page.perPage',
        /** 每页条数字段名 */
        sizeField: 'page.pageNum'
      })
    },
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
    },
    tableActionContext() {
      return {
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
      };
    }
  },
  watch: {
    dataSource: {
      immediate: true,
      /**
       * 监听本地数据源变更，补齐 key 后写入内部态
       * @param {Array<Object>} nextDataSource 新数据源
       */
      handler(nextDataSource) {
        this.internalData = Array.isArray(nextDataSource) ? this.ensureKeys(nextDataSource) : [];
      }
    },
    columns: {
      immediate: true,
      /** 监听列配置变更，写入内部态 */
      handler(nextColumns) {
        this.internalColumns = Array.isArray(nextColumns) ? nextColumns : [];
      }
    },
    loading: {
      immediate: true,
      /** 监听外部 loading 状态 */
      handler(nextLoading) {
        this.internalLoading = !!nextLoading;
      }
    },
    pagination: {
      immediate: true,
      /** 监听分页配置变更，归一化后写入内部态 */
      handler(nextPagination) {
        this.internalPagination = this.normalizePagination(nextPagination);
      }
    },
    searchInfo: {
      immediate: true,
      /** 监听外部搜索条件（受控） */
      handler(nextSearchInfo) {
        this.internalSearchInfo = nextSearchInfo || {};
      }
    }
  },
  methods: {
    /**
     * 为数据源补齐稳定的行键（key）
     * @param {Array<Object>} list 原始数据源
     * @returns {Array<Object>} 带有 key 的数据源
     */
    ensureKeys(list) {
      return uEnsureKeys(list, this.autoCreateKey, this.rowKey);
    },
    ...actions,
    /**
     * 归一化分页配置，提供默认值与安全检查
     * @param {Object} p 原始分页配置
     * @returns {Object} 规范化后的分页配置
     */
    normalizePagination(paginationConfig) {
      return uNormalizePagination(paginationConfig);
    },
    /**
     * 处理页码变更，支持翻页时清空选中行
     * @param {number} page 新页码
     */
    handlePageChange(nextPage) {
      this.internalPagination.currentPage = nextPage;
      if (this.clearSelectOnPageChange) this.clearSelectedRowKeys();
      this.reload();
      this.$emit('page-change', nextPage);
    },
    /**
     * 处理页容量变更，重置到第 1 页并刷新
     * @param {number} size 新页容量
     */
    handlePageSizeChange(nextPageSize) {
      this.internalPagination.pageSize = nextPageSize;
      this.internalPagination.currentPage = 1;
      if (this.clearSelectOnPageChange) this.clearSelectedRowKeys();
      this.reload();
      this.$emit('page-size-change', nextPageSize);
    },
    /**
     * 运行时设置表格属性（列/数据/loading/分页/选中/索引列/标题/搜索条件等）
     * @param {Object} nextProps 需更新的属性集合
     */
    setProps(nextProps) {
      const propsToUpdate = nextProps || {};
      if ('columns' in propsToUpdate) this.internalColumns = Array.isArray(propsToUpdate.columns) ? propsToUpdate.columns : [];
      if ('dataSource' in propsToUpdate) this.internalData = Array.isArray(propsToUpdate.dataSource) ? propsToUpdate.dataSource : [];
      if ('loading' in propsToUpdate) this.internalLoading = !!propsToUpdate.loading;
      if ('pagination' in propsToUpdate) this.internalPagination = this.normalizePagination(propsToUpdate.pagination);
      if ('rowSelection' in propsToUpdate) this.$emit('update:rowSelection', propsToUpdate.rowSelection);
      if ('showIndexColumn' in propsToUpdate) this.$emit('update:showIndexColumn', !!propsToUpdate.showIndexColumn);
      if ('searchInfo' in propsToUpdate) { this.internalSearchInfo = propsToUpdate.searchInfo || {}; this.$emit('update:searchInfo', propsToUpdate.searchInfo); }
      if ('title' in propsToUpdate) this.$emit('update:title', propsToUpdate.title);
    },
    setLoading(loading) { this.internalLoading = !!loading; },
    setColumns(nextColumns) { this.internalColumns = Array.isArray(nextColumns) ? nextColumns : []; },
    setDataSource(nextDataSource) { this.internalData = Array.isArray(nextDataSource) ? this.ensureKeys(nextDataSource) : []; },
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
    reload(extraParams = {}) {
      const requestApi = this.api;
      if (typeof requestApi !== 'function') return;
      this.internalLoading = true;
      const currentPage = this.internalPagination.currentPage;
      const pageSize = this.internalPagination.pageSize;
      const formState = (this.formActions && typeof this.formActions.getFieldsValue === 'function')
        ? (this.formActions.getFieldsValue() || {})
        : (this.internalSearchInfo || {});

      /** 额外参数 */
      const extra = extraParams || {};
      /**
       * 合并分页参数
       * 优先使用 extraParams 中的分页信息
       * 其次使用 extraParams 中的 currentPage/pageSize
       * 最后使用内部分页
       */
      const paginationPayload = (() => {
        // 基础分页信息：当前页码与每页条数
        const basePagination = { currentPage, pageSize };
        // 若 extraParams 中提供了 pagination 对象 优先使用
        if (extra && typeof extra.pagination === 'object') {
          return { ...basePagination, ...extra.pagination };
        }
        // 若 extraParams 中单独提供了 currentPage 或 pageSize 覆盖对应字段
        if (typeof extra.currentPage === 'number' || typeof extra.pageSize === 'number') {
          const overridden = { ...basePagination };
          if (typeof extra.currentPage === 'number') {
            overridden.currentPage = extra.currentPage;
          }
          if (typeof extra.pageSize === 'number') {
            overridden.pageSize = extra.pageSize;
          }
          return overridden;
        }
        // 否则直接返回基础分页信息
        return basePagination;
      })();
      /**
       * 合并搜索条件
       * 优先使用 extraParams 中的 searchInfo 对象
       * 其次将 extraParams 自身作为搜索参数
       * 最后使用表单值
       */
      const searchPayload = (() => {
        // 若 extraParams 中显式提供了 searchInfo 对象 与表单值合并
        if (extra && typeof extra.searchInfo === 'object') {
          return { ...formState, ...extra.searchInfo };
        }
        // 若 extraParams 中存在任意字段 将其整体作为搜索参数与表单值合并
        if (extra && Object.keys(extra).length) {
          return { ...formState, ...extra };
        }
        return { ...formState };
      })();
      // 构造最终请求参数对象 包含分页、搜索条件及钩子函数
      const finalParams = createFetchParams({
        pagination: paginationPayload,
        fetchSetting: this.fetchSetting,
        searchInfo: searchPayload,
        beforeFetch: this.beforeFetch,
        handleSearchInfoFn: this.handleSearchInfoFn
      });
      try {
        const result = requestApi(finalParams);
        if (result && result.then) {
          result.then((response) => {
            return this.applyApiResult(typeof this.afterFetch === 'function' ? this.afterFetch(response) : response);
          }).catch((error) => {
            this.lastFetchError = error;
            this.$emit('fetch-error', error);
          }).finally(() => {
            this.internalLoading = false;
          });
        } else {
          this.applyApiResult(typeof this.afterFetch === 'function' ? this.afterFetch(result) : result);
          this.internalLoading = false;
        }
      } catch (error) {
        this.lastFetchError = error;
        this.$emit('fetch-error', error);
        this.internalLoading = false;
      }
    },
    /**
     * 应用接口返回数据至表格
     * @param {Object|Array} res 接口返回数据
     * @returns {void}
     */
    applyApiResult(response) {
    // 应用接口返回数据至表格
      if (!response) {
        this.internalData = []; this.rawResult = response; return;
      }
      if (Array.isArray(response)) {
        this.internalData = this.ensureKeys(response);
        this.rawResult = response;
        return;
      }
      /** 字段映射 列表字段名 总数字段名 */
      const { listField, totalField } = this.fetchSetting;
      /** 数据列表 优先取 listField 字段 其次取 items/list/data 字段 */
      const listByMapping = getByPath(response, listField);
      const items = listByMapping != null ? listByMapping : (response.items || response.list || response.data || []);
      /** 总条数 取值 优先取 totalField 字段 其次取 page.total 字段 */
      const totalByMapping = getByPath(response, totalField);
      const total = totalByMapping != null ? totalByMapping : (response.page && response.page.total);
      this.internalData = Array.isArray(items) ? this.ensureKeys(items) : [];
      if (typeof total === 'number') this.internalPagination.total = total;
      this.rawResult = response;
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
      this.reload({});
    }
  },
  mounted() {
    this.$emit('register', this.tableActionContext);
    if (this.immediate && typeof this.api === 'function') this.reload();
  }
};
</script>
