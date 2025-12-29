import TimeSelect from '../date-picker/src/picker/time-select.vue';

/* istanbul ignore next */
TimeSelect.install = function(Vue) {
  Vue.component(TimeSelect.name, TimeSelect);
};

export default TimeSelect;
