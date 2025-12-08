<template>
  <el-select ref="selectRef" :value="value" v-bind="$attrs" v-on="$listeners" :loading="computedLoading" @input="$emit('input', $event)">
    <template v-if="$slots.prefix" slot="prefix">
      <slot name="prefix"></slot>
    </template>
    <template v-for="item in items">
      <el-option-group v-if="item && item.children && item.children.length" :key="getItemKey(item)" :label="item.label">
        <el-option v-for="child in item.children" :key="getItemKey(child)" :label="child.label" :value="child.value" />
      </el-option-group>
      <el-option v-else :key="`single-${getItemKey(item)}`" :label="item.label" :value="item.value" />
    </template>
    <template v-if="$slots.empty" slot="empty">
      <slot name="empty"></slot>
    </template>
  </el-select>
</template>

<script type="text/babel">
import Select from '../../select/src/select.vue';
import Option from '../../select/src/option.vue';
import OptionGroup from '../../select/src/option-group.vue';
import { getValueByPath } from 'rowinself-ui/src/utils/util';

export default {
  name: 'ElApiSelect',
  inheritAttrs: false,
  components: { ElSelect: Select, ElOption: Option, ElOptionGroup: OptionGroup },
  props: {
    value: {},
    api: { type: Function, default: null },
    params: { type: Object, default: () => ({}) },
    resultField: { type: String, default: '' },
    immediate: { type: Boolean, default: true },
    beforeFetch: { type: Function },
    afterFetch: { type: Function }
  },
  data() {
    return { items: [], loading: false };
  },
  computed: {
    computedLoading() {
      const a = this.$attrs || {};
      return !!(a.loading) || this.loading;
    }
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
        label:
          v && v.label !== undefined ? v.label
            : (v && v.name !== undefined ? v.name
              : (v && v.role_name !== undefined ? v.role_name : '')),
        value:
          v && v.value !== undefined ? v.value
            : (v && v.id !== undefined ? v.id
              : (v && v.role_id !== undefined ? v.role_id : v)),
        children: Array.isArray(v && v.children) ? v.children.map(c => ({
          label: c && c.label !== undefined ? c.label : (c && c.name !== undefined ? c.name : ''),
          value: c && c.value !== undefined ? c.value : (c && c.id !== undefined ? c.id : c)
        })) : []
      }));
    },
    extractResult(payload) {
      if (Array.isArray(payload)) return payload;
      if (this.resultField) {
        const res = getValueByPath(payload, this.resultField);
        if (Array.isArray(res)) return res;
        // 回退：当 resultField 指向非数组时，尝试常见位置
      }
      const d = payload && payload.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.list)) return d.list;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.list)) return payload.list;
      return [];
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
            let processed = this.afterFetch ? this.afterFetch(raw) : raw;
            if (!Array.isArray(processed)) processed = raw;
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
        let processed = this.afterFetch ? this.afterFetch(raw) : raw;
        if (!Array.isArray(processed)) processed = raw;
        this.items = this.normalizeList(processed);
        this.loading = false;
      }
    },
    focus() {
      const r = this.$refs && this.$refs.selectRef;
      if (r && typeof r.focus === 'function') r.focus();
    },
    blur() {
      const r = this.$refs && this.$refs.selectRef;
      if (r && typeof r.blur === 'function') r.blur();
    }
  }
};
</script>
