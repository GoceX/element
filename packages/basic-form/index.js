// 导出主组件：ElBasicForm
import ElBasicForm from './src/basic-form.vue';

/* istanbul ignore next */
// 提供按需注册的 install 方法，供 Vue.use() 使用
ElBasicForm.install = function(Vue) {
  // 以组件名进行全局注册
  Vue.component(ElBasicForm.name, ElBasicForm);
};

// 默认导出组件，支持 ES 模块导入
export default ElBasicForm;
