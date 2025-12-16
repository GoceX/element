/**
 * 搜索表单混入（Form Mixin）
 * 职责：
 * - 接收表单方法集（@register）
 * - 处理表单提交事件并触发数据刷新
 */
export default {
  methods: {
    /**
     * 表单注册回调
     * @param {Object} actions 表单方法集（含 getFieldsValue 等）
     * @returns {void}
     */
    onFormRegister(actions) {
      this.formActions = actions; // 缓存方法集以供 reload 使用
    },
    /**
     * 表单提交回调
     * @param {Object} payload 表单提交的搜索条件
     * @returns {void}
     */
    onFormSubmit(payload) {
      this.internalSearchInfo = payload || {}; // 写入内部搜索条件
      this.$emit('form-submit', payload); // 对外发出提交事件
      this.$emit('update:searchInfo', payload); // 支持 v-model:searchInfo
      this.reload({}); // 刷新数据
    }
  }
};
