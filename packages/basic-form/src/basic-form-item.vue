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
        :disabled="computeDisabled(schema)" v-on="finalListeners(schema)">
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
    /**
     * 函数式组件：接收 `renderFn` 并执行，用于渲染自定义 VNode
     * 设计目的：让 schema/插槽可通过函数返回 VNode，统一渲染入口
     * 性能：函数式组件无状态、无实例，渲染轻量
     */
    RenderVNode: {
      functional: true,
      /** @type {{ renderFn: Function }} */
      props: { renderFn: Function },
      /**
       * 执行传入的渲染函数
       * @param {Function} createElement - Vue 的 `createElement`
       * @param {{ props: { renderFn: Function } }} ctx - 渲染上下文
       * @returns {*|null} - 返回渲染结果或 `null`
       */
      render(createElement, ctx) {
        try {
          const fn = ctx.props.renderFn;
          return typeof fn === 'function' ? fn(createElement) : null;
        } catch (err) {
          console.error('[ElBasicFormItem/RenderVNode] render error:', err);
          return null;
        }
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
    globalDisabled: Boolean,
    // 自动设置支持组件的 clearable
    globalAutoSetClearable: Boolean,
    tableAction: Object,
    formActionType: Object
  },
  computed: {
    /**
     * 生成 `el-form-item` 的属性对象
     * - 动态 required/rules 计算
     * - labelWidth 统一格式
     * @returns {Object} - 符合 ElementUI `el-form-item` 的 props
     */
    itemProps() {
      const schema = this.schema || {};
      const required = this.evalMaybeFn(schema.required);
      const rulesSource = Array.isArray(schema.dynamicRules)
        ? schema.dynamicRules
        : (typeof schema.dynamicRules === 'function' ? schema.dynamicRules(this.itemCtx) : (schema.rules || []));
      const joinLabel = this.globalRulesMessageJoinLabel || !!schema.rulesMessageJoinLabel;
      const label = schema.label || '';
      const rules = joinLabel
        ? (rulesSource || []).map(rule => ({ ...rule, message: rule && rule.message ? `${label}${rule.message}` : rule.message }))
        : (rulesSource || []);
      const elFormItemProps = {
        label: schema.label,
        prop: schema.field,
        rules,
        labelWidth: schema.disabledLabelWidth ? null : this.normalizeItemLabelWidth(schema.labelWidth),
        required,
        inlineMessage: schema.inlineMessage,
        showMessage: schema.showMessage,
        size: schema.size,
        error: schema.error,
        validateStatus: schema.validateStatus,
        for: (() => {
          const component = schema.component;
          const isRange = component === 'RangePicker' || (component === 'DatePicker' && ((schema.componentProps && ['daterange', 'datetimerange'].includes(schema.componentProps.type))));
          return isRange ? null : (schema.for || schema.field);
        })()
      };
      if (schema.itemProps && typeof schema.itemProps === 'object') Object.assign(elFormItemProps, schema.itemProps);
      return elFormItemProps;
    },
    /**
     * 合并出最终传入组件的 props，并清理事件键（事件通过 `v-on` 绑定）
     * @returns {Object}
     */
    finalComponentProps() {
      const schema = this.schema || {};
      const mergedProps = this.getComponentPropsMerged(schema);
      const extractedListeners = this.extractEventListeners(mergedProps);
      Object.keys(extractedListeners).forEach((listenerKey) => { if (listenerKey in mergedProps) delete mergedProps[listenerKey]; });
      return mergedProps;
    },
    /**
     * 规范化帮助信息文本
     * @returns {string}
     */
    helpMessageText() {
      const schema = this.schema || {};
      const helpMessage = schema.helpMessage;
      if (!helpMessage) return '';
      if (Array.isArray(helpMessage)) return helpMessage.join(' ');
      return String(helpMessage);
    },
    /**
     * 帮助信息样式生成
     * @returns {Object}
     */
    helpStyle() {
      const helpComponentProps = (this.schema && this.schema.helpComponentProps) || {};
      const style = {};
      if (helpComponentProps.maxWidth) style.maxWidth = helpComponentProps.maxWidth;
      if (helpComponentProps.color) style.color = helpComponentProps.color;
      if (helpComponentProps.fontSize) style.fontSize = helpComponentProps.fontSize;
      return style;
    },
    /**
     * 提供给 `render/slot` 的上下文对象
     * @returns {{ model: Object, field: string, schema: Object, h: Function }}
     */
    itemCtx() {
      const schema = this.schema || {};
      return { model: this.formModel, field: schema.field, schema: schema, h: this.$createElement };
    }
  },
  methods: {
    /**
     * 合并并规范化组件 props（支持对象或函数返回）
     * - 自动设置 placeholder/clearable/size/name/type 等通用属性
     * - 异常安全：动态函数执行失败时回退为空对象
     * @param {Object} s - 当前项的 schema
     * @returns {Object} - 组件最终 props
     */
    getComponentPropsMerged(schema) {
      const componentPropsBase = schema.componentProps || {};
      const componentPropsExtra = typeof schema.componentProps === 'function' ? (() => {
        try {
          return schema.componentProps({
            schema: schema,
            tableAction: this.tableAction || null,
            formActionType: this.formActionType || null,
            formModel: this.formModel
          }) || {};
        } catch (err) {
          console.error('[ElBasicFormItem/getComponentPropsMerged] componentProps fn error:', err);
          return {};
        }
      })() : {};
      const mergedProps = { ...(typeof componentPropsBase === 'object' ? componentPropsBase : {}), ...(typeof componentPropsExtra === 'object' ? componentPropsExtra : {}) };
      if (this.globalAutoSetPlaceHolder && mergedProps.placeholder == null) {
        const component = schema.component;
        if (component === 'Input' || component === 'InputNumber' || component === 'el-input') mergedProps.placeholder = '请输入';
        if (component === 'Select' || component === 'el-select' || component === 'el-cascader') mergedProps.placeholder = '请选择';
      }
      if (this.globalAutoSetClearable && mergedProps.clearable == null) {
        const component = schema.component;
        const supportsClearable = (
          component === 'Input' || component === 'el-input' ||
          component === 'Select' || component === 'el-select' || component === 'ApiSelect' ||
          component === 'TreeSelect' ||
          component === 'Cascader' || component === 'el-cascader' || component === 'ApiCascader' ||
          component === 'DatePicker' || component === 'MonthPicker' || component === 'RangePicker' || component === 'WeekPicker' || component === 'el-date-picker' ||
          component === 'TimePicker' || component === 'el-time-picker'
        );
        if (supportsClearable) mergedProps.clearable = true;
      }
      if (mergedProps.size == null && this.globalSize) mergedProps.size = this.globalSize;
      if (mergedProps.name == null && schema.field) mergedProps.name = schema.field;
      const component = schema.component;
      if (component === 'InputPassword') mergedProps.type = mergedProps.type || 'password';
      if (component === 'InputTextArea') mergedProps.type = mergedProps.type || 'textarea';
      if (component === 'MonthPicker') mergedProps.type = mergedProps.type || 'month';
      if (component === 'RangePicker') mergedProps.type = mergedProps.type || 'daterange';
      if (component === 'WeekPicker') mergedProps.type = mergedProps.type || 'week';
      return mergedProps;
    },

    /**
     * 生成最终事件监听：合并 props 中的事件与 schema 自定义事件
     * @param {Object} schema - 当前项的 schema
     * @returns {Object}
     */
    finalListeners(schema) {
      const mergedProps = this.getComponentPropsMerged(schema || {});
      const listenersFromProps = this.extractEventListeners(mergedProps);
      const listenersFromSchema = this.customListeners(schema);
      return Object.assign({}, listenersFromProps, listenersFromSchema);
    },
    /**
     * 从 props 中提取事件监听（支持 `onXxx` 风格与常见事件名）
     * @param {Object} props - 组件 props
     * @returns {Object} - 事件监听对象
     */
    extractEventListeners(props) {
      const listeners = {};
      const isFn = (valueCandidate) => typeof valueCandidate === 'function';
      const camelToKebab = (camelCaseText) => camelCaseText.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      try {
        Object.keys(props || {}).forEach((key) => {
          const val = props[key];
          if (/^on[A-Z]/.test(key) && isFn(val)) {
            const eventName = camelToKebab(key.slice(2));
            listeners[eventName] = val;
          }
          if (isFn(val)) {
            if (key === 'change' || key === 'blur' || key === 'focus' || key === 'clear') listeners[key] = val;
            if (key === 'visibleChange') listeners['visible-change'] = val;
            if (key === 'removeTag') listeners['remove-tag'] = val;
            if (key === 'visible-change' || key === 'remove-tag') listeners[key] = val;
          }
        });
      } catch (err) {
        console.error('[ElBasicFormItem/extractEventListeners] error:', err);
      }
      return listeners;
    },
    /**
     * 将简写组件名映射到 ElementUI 组件标签
     * @param {string} name - 简写名称
     * @returns {string} - 实际组件标签
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
     * - 优先用户自定义 `renderComponentContent`
     * - 其次根据 options/type 生成默认 children
     * @param {Object} schema - 当前项 schema
     * @returns {Object} - 插槽字典，如 { default, suffix }
     */
    renderComponentContent(schema) {
      // 1) 先取用户自定义插槽（安全执行）
      const slots = schema && schema.renderComponentContent
        ? (() => { try { return (schema.renderComponentContent({ model: this.formModel, field: schema.field }) || {}); } catch (err) { console.error('[ElBasicFormItem/renderComponentContent] renderComponentContent fn error:', err); return {}; } })()
        : {};
      // 2) 根据组件类型与 options 生成默认 children（default 插槽）
      const componentType = schema && schema.component;
      const options = (schema && schema.options) || (schema && schema.componentProps && schema.componentProps.options) || [];
      const createElement = this.$createElement;
      const slotChildren = [];
      if (Array.isArray(options) && options.length) {
        if (componentType === 'Select') {
          options.forEach(option => slotChildren.push(createElement('el-option', { props: { label: option.label, value: option.value, disabled: !!option.disabled } })));
        }
        if (componentType === 'RadioGroup') {
          options.forEach(option => slotChildren.push(createElement('el-radio', { props: { label: option.value, disabled: !!option.disabled } }, option.label)));
        }
        if (componentType === 'RadioButtonGroup') {
          options.forEach(option => slotChildren.push(createElement('el-radio-button', { props: { label: option.value, disabled: !!option.disabled } }, option.label)));
        }
        if (componentType === 'CheckboxGroup') {
          options.forEach(option => slotChildren.push(createElement('el-checkbox', { props: { label: option.value, disabled: !!option.disabled } }, option.label)));
        }
        if (componentType === 'CheckboxButtonGroup') {
          options.forEach(option => slotChildren.push(createElement('el-checkbox-button', { props: { label: option.value, disabled: !!option.disabled } }, option.label)));
        }
      }
      if (slotChildren.length) slots.default = () => slotChildren;
      if (schema && schema.suffix) {
        const suffix = schema.suffix;
        slots.suffix = typeof suffix === 'function' ? (ctx) => { try { return suffix(this.itemCtx); } catch (err) { console.error('[ElBasicFormItem/renderComponentContent] suffix fn error:', err); return null; } } : suffix;
      }
      return slots;
    },
    /**
     * 解析 schema.slot 对应的渲染函数
     * @param {Object} schema - 当前项 schema
     * @returns {(function(*): any)|null}
     */
    resolveSlotRender(schema) {
      const slotName = schema && schema.slot;
      if (!slotName) return null;
      const slotFn = this.findScopedSlot(slotName);
      if (typeof slotFn === 'function') {
        return (h) => {
          try {
            return slotFn(this.itemCtx);
          } catch (err) {
            console.error('[ElBasicFormItem/resolveSlotRender] slot fn error:', err);
            return null;
          }
        };
      }
      return null;
    },
    /**
     * 向上查找父级作用域插槽
     * @param {string} name - 插槽名
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
     * 统一宽度格式为字符串（如 100 -> '100px'）
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
      if (schema && ('disabled' in schema)) {
        try {
          return this.evalMaybeFn(schema.disabled);
        } catch (err) {
          console.error('[ElBasicFormItem/computeDisabled] disabled eval error:', err);
        }
      }
      if (typeof schema.dynamicDisabled === 'function') {
        try {
          return !!schema.dynamicDisabled({ values: this.formModel });
        } catch (err) {
          console.error('[ElBasicFormItem/computeDisabled] dynamicDisabled fn error:', err);
          return !!(schema.componentProps && schema.componentProps.disabled);
        }
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
        try {
          const resultValue = val(this.itemCtx);
          return !!resultValue;
        } catch (err) {
          console.error('[ElBasicFormItem/evalMaybeFn] fn error:', err);
          return false;
        }
      }
      return !!val;
    },
    /**
     * 自定义事件变更处理
     * @param {Object} schema
     * @param {*} e
     * @returns {void}
     */
    onCustomChange(schema, event) {
      if (!schema || !schema.changeEvent) return;
      const fieldName = schema.field;
      let value = event;
      if (event && event.target && 'value' in event.target) value = event.target.value;
      try {
        this.$set(this.formModel, fieldName, value);
      } catch (err) {
        console.error('[ElBasicFormItem/onCustomChange] set value error:', err);
      }
    },
    /**
     * 生成组件自定义监听对象
     * @param {Object} schema
     * @returns {Object}
     */
    customListeners(schema) {
      const eventName = schema && schema.changeEvent;
      if (!eventName) return {};
      const self = this;
      const listeners = {};
      listeners[eventName] = function(event) { self.onCustomChange(schema, event); };
      return listeners;
    }
  }
};
</script>
