<template>
  <el-tree ref="tree" v-bind="tree_bindings" v-on="$listeners" :data="items" />
</template>

<script>
import Tree from '../../tree/src/tree.vue';
import { getValueByPath } from 'rowinself-ui/src/utils/util';

const get_tree_props = () => {
  const tree_props = (Tree && (Tree.options && Tree.options.props ? Tree.options.props : Tree.props)) || {};
  const merged = Object.assign({}, tree_props);
  delete merged.data;
  return merged;
};

const EL_TREE_PROPS = get_tree_props();
const EL_TREE_PROP_KEYS = Object.keys(EL_TREE_PROPS);

export default {
  name: 'ElApiTree',
  inheritAttrs: false,
  components: { ElTree: Tree },
  props: {
    ...EL_TREE_PROPS,
    api: { type: Function, required: true },
    params: { type: Object, default: () => ({}) },
    resultField: { type: String, default: '' },
    fieldLabel: { type: String, default: 'label' },
    fieldValue: { type: String, default: 'value' },
    fieldChildren: { type: String, default: 'children' },
    immediate: { type: Boolean, default: true },
    beforeFetch: { type: Function },
    afterFetch: { type: Function }
  },
  data() {
    return { items: [] };
  },
  computed: {
    tree_bindings() {
      const bindings = Object.assign({}, this.$attrs);
      for (let i = 0; i < EL_TREE_PROP_KEYS.length; i++) {
        const k = EL_TREE_PROP_KEYS[i];
        if (this[k] !== undefined) bindings[k] = this[k];
      }
      return bindings;
    }
  },
  watch: {
    params: { deep: true, handler() { this.loadData(); } },
    api() { this.loadData(); },
    resultField() { this.loadData(); },
    fieldLabel() { this.loadData(); },
    fieldValue() { this.loadData(); },
    fieldChildren() { this.loadData(); }
  },
  created() {
    if (this.immediate) this.loadData();
  },
  methods: {
    getCheckedKeys() {
      const tree = this.$refs && this.$refs.tree;
      return tree && typeof tree.getCheckedKeys === 'function' ? tree.getCheckedKeys.apply(tree, arguments) : [];
    },
    getHalfCheckedKeys() {
      const tree = this.$refs && this.$refs.tree;
      return tree && typeof tree.getHalfCheckedKeys === 'function' ? tree.getHalfCheckedKeys.apply(tree, arguments) : [];
    },
    normalizeNode(node) {
      const origin = node;
      const isObject = !!(origin && typeof origin === 'object');
      const labelKey = this.fieldLabel || 'label';
      const valueKey = this.fieldValue || 'value';
      const childrenKey = this.fieldChildren || 'children';
      const children = isObject
        ? (Array.isArray(origin[childrenKey]) ? origin[childrenKey] : (Array.isArray(origin.children) ? origin.children : []))
        : [];

      const label = isObject
        ? (origin[labelKey] !== undefined ? origin[labelKey] : (origin.label !== undefined ? origin.label : ''))
        : '';

      const value = isObject
        ? (origin[valueKey] !== undefined
          ? origin[valueKey]
          : (origin.value !== undefined
            ? origin.value
            : (origin.id !== undefined ? origin.id : origin)))
        : origin;

      const normalized = {
        label,
        value
      };
      if (children.length) {
        normalized.children = children.map(c => this.normalizeNode(c));
      }
      return normalized;
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
