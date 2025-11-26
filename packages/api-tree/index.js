import ApiTree from './src/api-tree';

ApiTree.install = function(Vue) {
  Vue.component(ApiTree.name, ApiTree);
};

export default ApiTree;
