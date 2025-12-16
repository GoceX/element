/**
 * 远程请求与结果应用混入（Fetch Mixin）
 * 职责：
 * - 构造请求参数（分页/搜索/钩子）
 * - 执行接口调用并处理结果
 * - 异常捕获与错误事件通知
 * 性能与安全：
 * - 避免不必要的重复请求（依赖调用方控制）
 * - 捕获并记录异常，避免中断渲染
 */
import { createFetchParams, getByPath, ensureKeys as uEnsureKeys } from '../utils';

export default {
  methods: {
    /**
     * 为数据源补齐稳定的 key 字段
     * @param {Array<Object>} list 原始数据源
     * @returns {Array<Object>} 带 key 的数据源
     */
    ensureKeys(list) {
      return uEnsureKeys(list, this.autoCreateKey, this.rowKey); // 使用工具函数补齐 key
    },
    /**
     * 远程刷新数据（携带分页与搜索条件）
     * @param {Object} [extraParams={}] 额外参数（可包含 pagination/searchInfo）
     * @returns {void}
     */
    reload(extraParams = {}) {
      const requestApi = this.api; // 请求函数由外部传入
      if (typeof requestApi !== 'function') return; // 非函数时不执行
      this.internalLoading = true; // 开始 loading
      const currentPage = this.internalPagination.currentPage; // 当前页码
      const pageSize = this.internalPagination.pageSize; // 每页条数
      const formState = (this.formActions && typeof this.formActions.getFieldsValue === 'function')
        ? (this.formActions.getFieldsValue() || {})
        : (this.internalSearchInfo || {});
      const extra = extraParams || {}; // 额外参数对象
      const paginationPayload = (() => {
        const basePagination = { currentPage, pageSize }; // 基础分页信息
        if (extra && typeof extra.pagination === 'object') {
          return { ...basePagination, ...extra.pagination }; // 优先使用对象覆盖
        }
        if (typeof extra.currentPage === 'number' || typeof extra.pageSize === 'number') {
          const overridden = { ...basePagination }; // 单字段覆盖
          if (typeof extra.currentPage === 'number') {
            overridden.currentPage = extra.currentPage;
          }
          if (typeof extra.pageSize === 'number') {
            overridden.pageSize = extra.pageSize;
          }
          return overridden;
        }
        return basePagination; // 默认返回
      })();
      const searchPayload = (() => {
        if (extra && typeof extra.searchInfo === 'object') {
          return { ...formState, ...extra.searchInfo }; // 显式 searchInfo
        }
        if (extra && Object.keys(extra).length) {
          return { ...formState, ...extra }; // 其余字段并入
        }
        return { ...formState }; // 默认表单值
      })();
      const finalParams = createFetchParams({
        pagination: paginationPayload,
        fetchSetting: this.fetchSetting,
        searchInfo: searchPayload,
        beforeFetch: this.beforeFetch,
        handleSearchInfoFn: this.handleSearchInfoFn
      });
      try {
        const result = requestApi(finalParams); // 执行请求
        if (result && result.then) {
          result.then((response) => {
            return this.applyApiResult(typeof this.afterFetch === 'function' ? this.afterFetch(response) : response);
          }).catch((error) => {
            this.lastFetchError = error; // 记录最近错误
            this.$emit('fetch-error', error); // 对外通知错误
          }).finally(() => {
            this.internalLoading = false; // 结束 loading
          });
        } else {
          this.applyApiResult(typeof this.afterFetch === 'function' ? this.afterFetch(result) : result);
          this.internalLoading = false;
        }
      } catch (error) {
        this.lastFetchError = error; // 同步错误
        this.$emit('fetch-error', error); // 通知错误
        this.internalLoading = false; // 结束 loading
      }
    },
    /**
     * 应用接口返回数据至表格
     * @param {Object|Array} response 接口返回数据
     * @returns {void}
     */
    applyApiResult(response) {
      if (!response) {
        this.internalData = []; this.rawResult = response; return; // 空响应直接清空
      }
      if (Array.isArray(response)) {
        this.internalData = this.ensureKeys(response); // 直接数组时视为列表
        this.rawResult = response; // 记录原始返回
        return;
      }
      const { listField, totalField } = this.fetchSetting;
      const listByMapping = getByPath(response, listField); // 按映射读取列表
      const items = listByMapping != null ? listByMapping : (response.items || response.list || response.data || []); // 兼容多字段
      const totalByMapping = getByPath(response, totalField); // 按映射读取总数
      const total = totalByMapping != null ? totalByMapping : (response.page && response.page.total); // 兼容 page.total
      this.internalData = Array.isArray(items) ? this.ensureKeys(items) : []; // 应用 key
      if (typeof total === 'number') this.internalPagination.total = total; // 写入总数
      this.rawResult = response; // 记录原始返回
      this.$emit('fetch-success', { items: this.internalData, total: this.internalPagination.total }); // 对外通知成功
    }
  }
};
