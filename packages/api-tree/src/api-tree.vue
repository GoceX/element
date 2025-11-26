<template>
  <el-tree v-bind="$attrs" v-on="$listeners" :data="items" />
</template>

<script>
import Tree from '../../tree/src/tree.vue';
import { getValueByPath } from 'element-ui/src/utils/util';

export default {
  name: 'ElApiTree',
  inheritAttrs: false,
  components: { ElTree: Tree },
  props: {
    api: { type: Function, required: true },
    params: { type: Object, default: () => ({}) },
    resultField: { type: String, default: '' },
    immediate: { type: Boolean, default: true },
    beforeFetch: { type: Function },
    afterFetch: { type: Function }
  },
  data() {
    return { items: [] };
  },
  watch: {
    params: { deep: true, handler() { this.loadData(); } },
    api() { this.loadData(); },
    resultField() { this.loadData(); }
  },
  created() {
    if (this.immediate) this.loadData();
  },
  methods: {
    normalizeNode(node) {
      const children = Array.isArray(node && node.children) ? node.children : [];
      return {
        label: node && node.label !== undefined ? node.label : '',
        value: node && node.value !== undefined ? node.value : node,
        children: children.map(c => this.normalizeNode(c))
      };
    },
    normalizeList(list) {
      const arr = Array.isArray(list) ? list : [];
      return arr.map(n => this.normalizeNode(n));
    },
    extractResult(payload) {
      if (Array.isArray(payload)) return payload;
      if (!this.resultField) return [];
      const res = getValueByPath(payload, this.resultField);
      return Array.isArray(res) ? res : [];
    },
    loadData() {
      const safeParams = this.beforeFetch ? this.beforeFetch(this.params) : this.params;
      const apiFn = this.api;
      if (typeof apiFn !== 'function') { this.items = []; return; }
      const p = apiFn(safeParams);
      if (p && typeof p.then === 'function') {
        p
          .then(data => {
            const raw = this.extractResult(data);
            const processed = this.afterFetch ? this.afterFetch(raw) : raw;
            this.items = this.normalizeList(processed);
          })
          .catch(() => { this.items = []; });
      } else {
        const raw = this.extractResult(p);
        const processed = this.afterFetch ? this.afterFetch(raw) : raw;
        this.items = this.normalizeList(processed);
      }
    }
  }
};
</script>
