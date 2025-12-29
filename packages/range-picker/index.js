import RangePicker from '../date-picker/src/picker/range-picker';

/* istanbul ignore next */
RangePicker.install = function(Vue) {
  Vue.component(RangePicker.name, RangePicker);
};

export default RangePicker;
