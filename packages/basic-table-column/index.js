import ElBasicTableColumn from '../basic-table/src/basic-table-column';

ElBasicTableColumn.install = function(Vue) {
  Vue.component(ElBasicTableColumn.name, ElBasicTableColumn);
};

export default ElBasicTableColumn;
