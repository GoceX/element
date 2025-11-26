import ApiCascader from './src/api-cascader';

ApiCascader.install = function(Vue) {
  Vue.component(ApiCascader.name, ApiCascader);
};

export default ApiCascader;
