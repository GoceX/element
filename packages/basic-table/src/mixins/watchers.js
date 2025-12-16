/**
 * 响应式监听混入（Watchers Mixin）
 * 职责：
 * - 同步外部 props 变更到内部状态
 * - 保持组件受控/非受控的兼容性
 */
export default {
  watch: {
    dataSource: {
      immediate: true,
      /**
       * 监听数据源变更，补齐 key 后写入内部态
       * @param {Array<Object>} nextDataSource 新数据源
       */
      handler(nextDataSource) {
        this.internalData = Array.isArray(nextDataSource) ? this.ensureKeys(nextDataSource) : [];
      }
    },
    columns: {
      immediate: true,
      /**
       * 监听列配置变更，写入内部态
       * @param {Array<Object>} nextColumns 新列配置
       */
      handler(nextColumns) {
        this.internalColumns = Array.isArray(nextColumns) ? nextColumns : [];
      }
    },
    loading: {
      immediate: true,
      /**
       * 监听外部 loading 状态
       * @param {boolean} nextLoading 新的 loading 状态
       */
      handler(nextLoading) {
        this.internalLoading = !!nextLoading;
      }
    },
    pagination: {
      immediate: true,
      /**
       * 监听分页配置变更
       * @param {Object} nextPagination 新的分页配置
       */
      handler(nextPagination) {
        this.internalPagination = this.normalizePagination(nextPagination);
      }
    },
    searchInfo: {
      immediate: true,
      /**
       * 监听外部搜索条件（受控）
       * @param {Object} nextSearchInfo 新的搜索条件
       */
      handler(nextSearchInfo) {
        this.internalSearchInfo = nextSearchInfo || {};
      }
    }
  }
};
