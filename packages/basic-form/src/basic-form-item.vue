<template>
  <!-- 列内容插槽：若提供 renderColContent/colSlot，则在列级别渲染自定义内容 -->
  <el-col v-if="schema && (schema.renderColContent || schema.colSlot)" v-bind="schema.colProps || { span: 24 }">
    <RenderVNode v-if="schema.renderColContent" :render-fn="() => schema.renderColContent(itemCtx)" />
    <slot v-else :name="schema.colSlot" v-bind="itemCtx" />
  </el-col>
  <!-- 分割线组件：占满一行，并在标签右侧显示可选的帮助信息 -->
  <el-col v-else-if="schema && schema.component === 'Divider'" v-bind="schema.colProps || { span: 24 }">
    <el-divider>
      {{ schema.label }}
      <span v-if="helpMessageText" style="margin-left:8px;color:#909399;">{{ helpMessageText }}</span>
    </el-divider>
  </el-col>
  <!-- 常规表单项：统一包裹在 el-col 中，默认 span:24 -->
  <el-col v-else v-bind="(schema && schema.colProps) ? schema.colProps : { span: 24 }">
    <!-- 表单项容器：根据 itemProps 驱动标签、校验、宽度等配置 -->
    <el-form-item v-bind="itemProps">
      <!-- 自定义标签：支持主标签与副标签 -->
      <template v-if="schema.subLabel" slot="label">
        <span>{{ schema.label }}</span>
        <span style="margin-left:8px;color:#909399;">{{ schema.subLabel }}</span>
      </template>
      <!-- 优先：解析具名插槽对应的渲染函数，使用 RenderVNode 渲染 -->
      <RenderVNode v-if="schema.slot && resolveSlotRender(schema)" :render-fn="resolveSlotRender(schema)" />
      <!-- 其次：直接渲染具名插槽，透传 model 与 field -->
      <slot v-else-if="schema.slot" :name="schema.slot" :model="formModel" :field="schema.field" />
      <!-- 其三：使用 schema.render(h,ctx) 渲染自定义内容 -->
      <RenderVNode v-else-if="schema.render" :render-fn="(h) => schema.render(itemCtx)" />
      <!-- 默认：按 componentTag 生成具体组件，v-model 双向绑定到 formModel[field] -->
      <component v-else :is="componentTag(schema.component)" v-model="formModel[schema.field]" v-bind="finalComponentProps"
        :disabled="computeDisabled(schema)" v-on="customListeners(schema)">
        <!-- 组件内部插槽：根据 options/自定义生成 default/suffix 等插槽 -->
        <template v-for="(slotRender, slotName) in renderComponentContent(schema)" v-slot:[slotName]>
          <RenderVNode v-if="typeof slotRender === 'function'" :render-fn="(h) => slotRender(itemCtx)" />
          <span v-else>{{ slotRender }}</span>
        </template>
      </component>
      <!-- 帮助信息提示：展示在表单项底部，可配置样式 -->
      <div v-if="helpMessageText" class="el-form-item__extra" :style="helpStyle">{{ helpMessageText }}</div>
    </el-form-item>
  </el-col>
  <!-- 说明：以上渲染分支顺序保证了最大灵活性：列级插槽 > Divider > 常规组件 -->
</template>
<script>
export default {
  name: 'ElBasicFormItem',
  components: {
    // 函数式组件：接收 renderFn 并执行，用于渲染 VNode
    RenderVNode: {
      functional: true,
      props: { renderFn: Function },
      render(h, ctx) {
        const fn = ctx.props.renderFn;
        return typeof fn === 'function' ? fn(h) : null;
      }
    }
  },
  props: {
    // 单个表单项的配置 Schema
    schema: Object,
    // 来自父表单的响应式模型对象
    formModel: Object,
    // 是否为常见输入组件自动设置 placeholder
    globalAutoSetPlaceHolder: Boolean,
    // 规则消息是否拼接标签文本
    globalRulesMessageJoinLabel: Boolean,
    // 统一的组件尺寸
    globalSize: String,
    // 统一的禁用态（优先生效）
    globalDisabled: Boolean
  },
  computed: {
    itemProps() {
      const s = this.schema || {};
      const required = this.evalMaybeFn(s.required);
      const rulesIn = Array.isArray(s.dynamicRules) ? s.dynamicRules : (typeof s.dynamicRules === 'function' ? s.dynamicRules(this.itemCtx) : (s.rules || []));
      const joinLabel = this.globalRulesMessageJoinLabel || !!s.rulesMessageJoinLabel;
      const label = s.label || '';
      const rules = joinLabel ? (rulesIn || []).map(r => ({ ...r, message: r && r.message ? `${label}${r.message}` : r.message })) : (rulesIn || []);
      const ip = {
        label: s.label,
        prop: s.field,
        rules,
        labelWidth: s.disabledLabelWidth ? null : this.normalizeItemLabelWidth(s.labelWidth),
        required,
        inlineMessage: s.inlineMessage,
        showMessage: s.showMessage,
        size: s.size,
        error: s.error,
        validateStatus: s.validateStatus,
        for: (() => {
          const comp = s.component;
          const isRange = comp === 'RangePicker' || (comp === 'DatePicker' && ((s.componentProps && (s.componentProps.type === 'daterange' || s.componentProps.type === 'datetimerange'))));
          return isRange ? null : (s.for || s.field);
        })()
      };
      if (s.itemProps && typeof s.itemProps === 'object') Object.assign(ip, s.itemProps);
      return ip;
    },
    // 合并静态与动态 componentProps
    finalComponentProps() {
      const s = this.schema || {};
      const base = s.componentProps || {};
      const extra = typeof s.componentProps === 'function' ? s.componentProps(this.itemCtx) : {};
      const props = { ...(typeof base === 'object' ? base : {}), ...(typeof extra === 'object' ? extra : {}) };
      if (this.globalAutoSetPlaceHolder && props.placeholder == null) {
        const comp = s.component;
        if (comp === 'Input' || comp === 'InputNumber' || comp === 'el-input') props.placeholder = '请输入';
        if (comp === 'Select' || comp === 'el-select' || comp === 'el-cascader') props.placeholder = '请选择';
      }
      if (props.size == null && this.globalSize) props.size = this.globalSize;
      if (props.name == null && s.field) props.name = s.field;
      // 移除默认 id 赋值，避免组件内部产生重复 DOM id
      // 根据组件类型补齐默认属性
      const comp = s.component;
      if (comp === 'InputPassword') props.type = props.type || 'password';
      if (comp === 'InputTextArea') props.type = props.type || 'textarea';
      if (comp === 'MonthPicker') props.type = props.type || 'month';
      if (comp === 'RangePicker') props.type = props.type || 'daterange';
      if (comp === 'WeekPicker') props.type = props.type || 'week';
      return props;
    },
    helpMessageText() {
      const s = this.schema || {};
      const hm = s.helpMessage;
      if (!hm) return '';
      if (Array.isArray(hm)) return hm.join(' ');
      return String(hm);
    },
    helpStyle() {
      const p = (this.schema && this.schema.helpComponentProps) || {};
      const style = {};
      if (p.maxWidth) style.maxWidth = p.maxWidth;
      if (p.color) style.color = p.color;
      if (p.fontSize) style.fontSize = p.fontSize;
      return style;
    },
    // 提供给 render/slot 的上下文对象
    itemCtx() {
      const s = this.schema || {};
      return { model: this.formModel, field: s.field, schema: s, h: this.$createElement };
    }
  },
  methods: {
    /**
     * 将简写组件名映射为 Element 组件标签
     * @param {string} name
     * @returns {string}
     */
    componentTag(name) {
      // 组件类型映射，覆盖常见表单类型
      const map = {
        // 输入类
        Input: 'el-input',
        InputPassword: 'el-input',
        InputSearch: 'el-input',
        InputTextArea: 'el-input',
        InputNumber: 'el-input-number',
        InputAutoComplete: 'el-autocomplete',
        // 选择类
        Select: 'el-select',
        ApiSelect: 'el-api-select',
        ApiTree: 'el-api-tree',
        ApiCascader: 'el-api-cascader',
        TreeSelect: 'el-cascader',
        Cascader: 'el-cascader',
        // 单选/多选
        Radio: 'el-radio',
        RadioGroup: 'el-radio-group',
        RadioButtonGroup: 'el-radio-group',
        Checkbox: 'el-checkbox',
        CheckboxGroup: 'el-checkbox-group',
        CheckboxButtonGroup: 'el-checkbox-group',
        // 开关/滑块
        Switch: 'el-switch',
        Slider: 'el-slider',
        // 时间日期
        TimePicker: 'el-time-picker',
        DatePicker: 'el-date-picker',
        MonthPicker: 'el-date-picker',
        RangePicker: 'el-date-picker',
        WeekPicker: 'el-date-picker',
        // 其他
        Upload: 'el-upload',
        Rate: 'el-rate',
        ColorPicker: 'el-color-picker',
        Transfer: 'el-transfer',
        Divider: 'el-divider'
      };
      return map[name] || name || 'el-input';
    },
    /**
     * 生成组件内部插槽内容
     * @param {Object} schema
     * @returns {Object}
     */
    renderComponentContent(schema) {
      // 1) 先取用户自定义插槽
      const base = schema && schema.renderComponentContent ? (schema.renderComponentContent({ model: this.formModel, field: schema.field }) || {}) : {};
      // 2) 根据组件类型与 options 生成默认 children（default 插槽）
      const type = schema && schema.component;
      const opts = (schema && schema.options) || (schema && schema.componentProps && schema.componentProps.options) || [];
      const h = this.$createElement;
      const children = [];
      if (Array.isArray(opts) && opts.length) {
        if (type === 'Select') {
          opts.forEach(o => children.push(h('el-option', { props: { label: o.label, value: o.value, disabled: !!o.disabled } })));
        }
        if (type === 'RadioGroup') {
          opts.forEach(o => children.push(h('el-radio', { props: { label: o.value, disabled: !!o.disabled } }, o.label)));
        }
        if (type === 'RadioButtonGroup') {
          opts.forEach(o => children.push(h('el-radio-button', { props: { label: o.value, disabled: !!o.disabled } }, o.label)));
        }
        if (type === 'CheckboxGroup') {
          opts.forEach(o => children.push(h('el-checkbox', { props: { label: o.value, disabled: !!o.disabled } }, o.label)));
        }
        if (type === 'CheckboxButtonGroup') {
          opts.forEach(o => children.push(h('el-checkbox-button', { props: { label: o.value, disabled: !!o.disabled } }, o.label)));
        }
      }
      if (children.length) base.default = () => children;
      if (schema && schema.suffix) {
        const suf = schema.suffix;
        base.suffix = typeof suf === 'function' ? (ctx) => suf(this.itemCtx) : suf;
      }
      return base;
    },
    /**
     * 解析 schema.slot 对应的渲染函数
     * @param {Object} schema
     * @returns {(function(*): any)|null}
     */
    resolveSlotRender(schema) {
      const name = schema && schema.slot;
      if (!name) return null;
      const fn = this.findScopedSlot(name);
      if (typeof fn === 'function') {
        return (h) => fn(this.itemCtx);
      }
      return null;
    },
    /**
     * 向上查找父级作用域插槽
     * @param {string} name
     * @returns {Function|null}
     */
    findScopedSlot(name) {
      let ctx = this;
      while (ctx) {
        const slots = ctx.$scopedSlots;
        if (slots && typeof slots[name] === 'function') return slots[name];
        ctx = ctx.$parent;
      }
      return null;
    },
    /**
     * 统一宽度格式为字符串
     * @param {string|number|null|undefined} val
     * @returns {string|null}
     */
    normalizeWidth(val) {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return `${val}px`;
      return val;
    },
    /**
     * 适配 labelWidth
     * @param {string|number|null|undefined} val
     * @returns {string|null}
     */
    normalizeItemLabelWidth(val) {
      return this.normalizeWidth(val);
    },
    /**
     * 计算当前是否禁用
     * @param {Object} schema
     * @returns {boolean}
     */
    computeDisabled(schema) {
      if (this.globalDisabled) return true;
      if (typeof schema.dynamicDisabled === 'function') {
        return !!schema.dynamicDisabled({ values: this.formModel });
      }
      return !!(schema.componentProps && schema.componentProps.disabled);
    },
    /**
     * 统一将可能为函数的布尔值求值
     * @param {boolean|Function} val
     * @returns {boolean}
     */
    evalMaybeFn(val) {
      if (typeof val === 'function') {
        const r = val(this.itemCtx);
        return !!r;
      }
      return !!val;
    },
    /**
     * 自定义事件变更处理
     * @param {Object} schema
     * @param {*} e
     * @returns {void}
     */
    onCustomChange(schema, e) {
      if (!schema || !schema.changeEvent) return;
      const f = schema.field;
      let val = e;
      if (e && e.target && 'value' in e.target) val = e.target.value;
      this.$set(this.formModel, f, val);
    },
    /**
     * 生成组件自定义监听对象
     * @param {Object} schema
     * @returns {Object}
     */
    customListeners(schema) {
      const evt = schema && schema.changeEvent;
      if (!evt) return {};
      const self = this;
      const obj = {};
      obj[evt] = function(e) { self.onCustomChange(schema, e); };
      return obj;
    }
  }
};
</script>
