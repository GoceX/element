<template>
  <el-select ref="selectRef" :value="value" v-bind="$attrs" v-on="$listeners" :loading="computedLoading" @input="$emit('input', $event)">
    <template v-if="$slots.prefix" slot="prefix">
      <span class="el-api-select__prefix">
        <slot name="prefix"></slot>
      </span>
    </template>
    <template v-for="item in items">
      <el-option-group v-if="item && item.children && item.children.length" :key="getItemKey(item)" :label="item.label" :disabled="item.disabled">
        <el-option v-for="child in item.children" :key="getItemKey(child)" :label="child.label" :value="child.value" :disabled="child.disabled">
          <template v-if="$scopedSlots.option">
            <slot name="option" :item="child"></slot>
          </template>
        </el-option>
      </el-option-group>
      <el-option v-else :key="`single-${getItemKey(item)}`" :label="item.label" :value="item.value" :disabled="item.disabled">
        <template v-if="$scopedSlots.option">
          <slot name="option" :item="item"></slot>
        </template>
      </el-option>
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

/**
 * 组件: ElApiSelect
 * 功能: 通过传入的 `api` 方法按需获取选项数据并渲染到 `el-select`
 * 说明: 支持自定义参数、结果字段提取、前后置处理钩子等
 */

export default {
  name: 'ElApiSelect',
  components: { ElSelect: Select, ElOption: Option, ElOptionGroup: OptionGroup },
  inheritAttrs: false,
  props: {
    value: { required: true, type: [String, Number, Object, Array, Boolean] },
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
    /**
     * 计算下拉的加载状态
     * @returns {boolean} 当外部通过 `loading` 传入或内部正在加载时返回 true
     */
    computedLoading() {
      const attrs = this.$attrs || {};
      return !!(attrs.loading) || this.loading;
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
    /**
     * 获取选项唯一 key
     * @param {Object} item 选项对象
     * @returns {string|number} 用于 v-for 的唯一标识
     */
    getItemKey(item) {
      const value = item && item.value;
      const label = item && item.label;
      const isPrimitive = (v) => v == null || ['string', 'number', 'boolean'].includes(typeof v);
      if (isPrimitive(value)) return value;
      if (isPrimitive(label)) return label;
      try {
        return JSON.stringify(item);
      } catch (err) {
        return String(label || '');
      }
    },
    /**
     * 规范化接口返回的列表数据为统一结构
     * @param {Array|*} list 原始列表数据
     * @returns {Array} 形如 { label, value, children } 的数组
     */
    normalizeList(list) {
      const ensureArray = Array.isArray(list) ? list : [];
      const isPrimitive = (v) => v == null || ['string', 'number', 'boolean'].includes(typeof v);
      const normalizeValue = (val, fallbackLabel) => {
        if (isPrimitive(val)) return val;
        if (isPrimitive(fallbackLabel)) return fallbackLabel;
        try {
          return JSON.stringify(val);
        } catch (err) {
          return '';
        }
      };
      return ensureArray.map(entry => {
        const label =
          entry && entry.label !== undefined ? entry.label
            : (entry && entry.name !== undefined ? entry.name
              : (entry && entry.role_name !== undefined ? entry.role_name : ''));

        const disabled = !!(entry && entry.disabled);

        const children = Array.isArray(entry && entry.children)
          ? entry.children.map(child => {
            const childLabel = child && child.label !== undefined ? child.label : (child && child.name !== undefined ? child.name : '');
            const childValue = child && child.value !== undefined ? child.value : (child && child.id !== undefined ? child.id : child);
            return {
              label: childLabel,
              value: normalizeValue(childValue, childLabel),
              disabled: !!(child && child.disabled)
            };
          })
          : [];

        const rawValue = entry && entry.value !== undefined ? entry.value
          : (entry && entry.id !== undefined ? entry.id
            : (entry && entry.role_id !== undefined ? entry.role_id : entry));

        return {
          label,
          value: normalizeValue(rawValue, label),
          children,
          disabled
        };
      });
    },
    /**
     * 提取接口返回中实际的结果数组
     * @param {*} payload 接口返回的原始数据
     * @returns {Array} 结果数组，无法提取时返回空数组
     */
    extractResult(payload) {
      if (Array.isArray(payload)) return payload;
      if (this.resultField) {
        const res = getValueByPath(payload, this.resultField);
        if (Array.isArray(res)) return res;
        // 回退：当 resultField 指向非数组时，尝试常见位置
      }
      const payloadData = payload && payload.data;
      if (Array.isArray(payloadData)) return payloadData;
      if (payloadData && Array.isArray(payloadData.list)) return payloadData.list;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.list)) return payload.list;
      return [];
    },
    /**
     * 加载下拉选项
     * 根据 props.api 与 props.params 发起请求，支持前后置处理钩子
     * @returns {void}
     */
    loadOptions() {
      const safeParams = this.beforeFetch ? this.beforeFetch(this.params) : this.params;
      const apiFn = this.api;
      if (typeof apiFn !== 'function') {
        this.items = [];
        this.loading = false;
        return;
      }
      this.loading = true;
      const maybePromise = apiFn(safeParams);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise
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
        const raw = this.extractResult(maybePromise);
        let processed = this.afterFetch ? this.afterFetch(raw) : raw;
        if (!Array.isArray(processed)) processed = raw;
        this.items = this.normalizeList(processed);
        this.loading = false;
      }
    },
    /**
     * 聚焦到内部的 el-select
     * @returns {void}
     */
    focus() {
      const selectRef = this.$refs && this.$refs.selectRef;
      if (selectRef && typeof selectRef.focus === 'function') selectRef.focus();
    },
    /**
     * 使内部的 el-select 失焦
     * @returns {void}
     */
    blur() {
      const selectRef = this.$refs && this.$refs.selectRef;
      if (selectRef && typeof selectRef.blur === 'function') selectRef.blur();
    }
  }
};
</script>
