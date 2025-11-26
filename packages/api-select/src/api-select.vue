<template>
  <el-select v-bind="$attrs" v-on="$listeners" :loading="loading">
    <template v-for="item in items">
      <el-option-group v-if="item && item.children && item.children.length" :key="getItemKey(item)" :label="item.label">
        <el-option v-for="child in item.children" :key="getItemKey(child)" :label="child.label" :value="child.value" />
      </el-option-group>
      <el-option v-else :key="`single-${getItemKey(item)}`" :label="item.label" :value="item.value" />
    </template>
  </el-select>
</template>

<script type="text/babel">
import Select from '../../select/src/select.vue';
import Option from '../../select/src/option.vue';
import OptionGroup from '../../select/src/option-group.vue';
import { getValueByPath } from 'element-ui/src/utils/util';

export default {
  name: 'ElApiSelect',
  inheritAttrs: false,
  components: { ElSelect: Select, ElOption: Option, ElOptionGroup: OptionGroup },
  props: {
    api: { type: Function, required: true },
    params: { type: Object, default: () => ({}) },
    resultField: { type: String, default: '' },
    immediate: { type: Boolean, default: true },
    beforeFetch: { type: Function },
    afterFetch: { type: Function }
  },
  data() {
    return { items: [], loading: false };
  },
  watch: {
    params: {
      deep: true,
      handler() {
        this.loadOptions();
      }
    },
    api() {
      this.loadOptions();
    },
    resultField() {
      this.loadOptions();
    }
  },
  created() {
    if (this.immediate) this.loadOptions();
  },
  methods: {
    getItemKey(item) {
      return item && item.value !== undefined ? item.value : item && item.label ? item.label : JSON.stringify(item);
    },
    normalizeList(list) {
      const ensureArray = Array.isArray(list) ? list : [];
      return ensureArray.map(v => ({
        label: v && v.label !== undefined ? v.label : '',
        value: v && v.value !== undefined ? v.value : v,
        children: Array.isArray(v && v.children) ? v.children.map(c => ({
          label: c && c.label !== undefined ? c.label : '',
          value: c && c.value !== undefined ? c.value : c
        })) : []
      }));
    },
    extractResult(payload) {
      if (Array.isArray(payload)) return payload;
      if (!this.resultField) return [];
      const res = getValueByPath(payload, this.resultField);
      return Array.isArray(res) ? res : [];
    },
    loadOptions() {
      const safeParams = this.beforeFetch ? this.beforeFetch(this.params) : this.params;
      const apiFn = this.api;
      if (typeof apiFn !== 'function') {
        this.items = [];
        this.loading = false;
        return;
      }
      this.loading = true;
      const p = apiFn(safeParams);
      if (p && typeof p.then === 'function') {
        p
          .then(data => {
            const raw = this.extractResult(data);
            const processed = this.afterFetch ? this.afterFetch(raw) : raw;
            this.items = this.normalizeList(processed);
          })
          .catch(() => {
            this.items = [];
          })
          .then(() => {
            this.loading = false;
          });
      } else {
        const raw = this.extractResult(p);
        const processed = this.afterFetch ? this.afterFetch(raw) : raw;
        this.items = this.normalizeList(processed);
        this.loading = false;
      }
    }
  }
};
</script>
