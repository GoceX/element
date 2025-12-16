/**
 * 分页行为混入（Pagination Mixin）
 * 职责：
 * - 归一化分页配置
 * - 控制分页展示开关
 * - 处理页码与页容量变化事件
 * 类型提示：
 * - 使用 JSDoc 描述参数与返回值，便于编辑器类型推断
 */
import { normalizePagination as uNormalizePagination } from '../utils';

export default {
  computed: {
    /**
     * 是否显示分页组件
     * @returns {boolean}
     */
    showPagination() {
      if (!this.showPaginationFlag) return false; // 显示开关为否时直接不显示
      const p = this.internalPagination; // 读取内部分页状态
      return !!p && (p.total != null || p.pageCount != null); // 只有在存在总数或页数时显示
    }
  },
  methods: {
    /**
     * 归一化分页配置
     * @param {Object} paginationConfig 原始分页配置
     * @returns {Object} 规范化后的分页配置
     */
    normalizePagination(paginationConfig) {
      return uNormalizePagination(paginationConfig); // 调用工具函数进行安全归一化
    },
    /**
     * 处理页码变化
     * @param {number} nextPage 新页码
     * @returns {void}
     */
    handlePageChange(nextPage) {
      this.internalPagination.currentPage = nextPage; // 更新页码
      if (this.clearSelectOnPageChange) this.clearSelectedRowKeys(); // 清空选中行（可选）
      this.reload(); // 重新请求数据
      this.$emit('page-change', nextPage); // 对外通知
    },
    /**
     * 处理每页容量变化
     * @param {number} nextPageSize 新的每页容量
     * @returns {void}
     */
    handlePageSizeChange(nextPageSize) {
      this.internalPagination.pageSize = nextPageSize; // 更新容量
      this.internalPagination.currentPage = 1; // 重置到第 1 页
      if (this.clearSelectOnPageChange) this.clearSelectedRowKeys(); // 清空选中行（可选）
      this.reload(); // 重新请求数据
      this.$emit('page-size-change', nextPageSize); // 对外通知
    }
  }
};
