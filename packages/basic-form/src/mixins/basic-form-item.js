import { normalizeWidth as normalizeWidthUtil } from './basic-form-runtime-factory';

export default {
  methods: {
    /**
     * 合并生成最终传入表单控件的 props：
     * - 支持 componentProps 为对象 / 函数两种形态
     * - 在全局开关开启时，自动补齐 placeholder / clearable
     * - 透传 globalSize，并为组件补齐 name
     *
     * @param {Object} schema 单个表单项 schema
     * @returns {Object} 合并后的 props
     */
    getComponentPropsMerged(schema) {
      // componentProps 可能是对象，也可能是函数（返回对象）
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

      // 合并两份 props：后者覆盖前者同名字段
      const mergedProps = { ...(typeof componentPropsBase === 'object' ? componentPropsBase : {}), ...(typeof componentPropsExtra === 'object' ? componentPropsExtra : {}) };

      // 自动补齐 placeholder：仅对常见输入类组件生效
      if (this.globalAutoSetPlaceHolder && mergedProps.placeholder == null) {
        const component = schema.component;
        if (component === 'Input' || component === 'InputNumber' || component === 'el-input') mergedProps.placeholder = '请输入';
        if (component === 'Select' || component === 'el-select' || component === 'el-cascader') mergedProps.placeholder = '请选择';
      }

      // 自动补齐 clearable：仅对支持 clearable 的组件生效
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

      // 全局 size 兜底
      if (mergedProps.size == null && this.globalSize) mergedProps.size = this.globalSize;

      // 为依赖 name 的组件补齐 name（例如表单自动补全/测试定位）
      if (mergedProps.name == null && schema.field) mergedProps.name = schema.field;

      // 兼容内部别名组件：把语义化组件名映射到真实输入类型
      const component = schema.component;
      if (component === 'InputPassword') mergedProps.type = mergedProps.type || 'password';
      if (component === 'InputTextArea') mergedProps.type = mergedProps.type || 'textarea';
      if (component === 'MonthPicker') mergedProps.type = mergedProps.type || 'month';
      if (component === 'RangePicker') mergedProps.type = mergedProps.type || 'daterange';
      if (component === 'WeekPicker') mergedProps.type = mergedProps.type || 'week';
      return mergedProps;
    },
    /**
     * 组装组件最终监听器：
     * - 从 props 中提取 onXxx / change 等事件
     * - 再叠加 schema.changeEvent 对应的自定义监听
     *
     * @param {Object} schema 单个表单项 schema
     * @returns {Object} 监听器对象
     */
    finalListeners(schema) {
      const mergedProps = this.getComponentPropsMerged(schema || {});
      const listenersFromProps = this.extractEventListeners(mergedProps);
      const listenersFromSchema = this.customListeners(schema);
      return Object.assign({}, listenersFromProps, listenersFromSchema);
    },
    /**
     * 从 props 中抽取事件监听器，避免与 v-bind 冲突：
     * - 支持 onXxx（驼峰）自动转为 kebab-case
     * - 同时兼容部分直接传入的事件名（如 change/blur/visibleChange 等）
     *
     * @param {Object} props 合并后的 props
     * @returns {Object} listeners
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
     * 将 schema.component 规范为可渲染的组件 tag。
     * @param {string} name schema.component
     * @returns {string}
     */
    componentTag(name) {
      const map = {
        Input: 'el-input',
        InputPassword: 'el-input',
        InputSearch: 'el-input',
        InputTextArea: 'el-input',
        InputNumber: 'el-input-number',
        InputAutoComplete: 'el-autocomplete',
        Select: 'el-select',
        ApiSelect: 'el-api-select',
        ApiTree: 'el-api-tree',
        ApiCascader: 'el-api-cascader',
        TreeSelect: 'el-cascader',
        Cascader: 'el-cascader',
        Radio: 'el-radio',
        RadioGroup: 'el-radio-group',
        RadioButtonGroup: 'el-radio-group',
        Checkbox: 'el-checkbox',
        CheckboxGroup: 'el-checkbox-group',
        CheckboxButtonGroup: 'el-checkbox-group',
        Switch: 'el-switch',
        Slider: 'el-slider',
        TimePicker: 'el-time-picker',
        DatePicker: 'el-date-picker',
        MonthPicker: 'el-date-picker',
        RangePicker: 'el-date-picker',
        WeekPicker: 'el-date-picker',
        Upload: 'el-upload',
        Rate: 'el-rate',
        ColorPicker: 'el-color-picker',
        Transfer: 'el-transfer',
        Divider: 'el-divider'
      };
      return map[name] || name || 'el-input';
    },
    /**
     * 生成组件内部插槽内容：
     * - options 生成 select/radio/checkbox 等的默认插槽
     * - 支持 renderComponentContent() 返回自定义插槽渲染函数
     * - 支持 schema.suffix 作为 suffix 插槽
     *
     * @param {Object} schema 单个表单项 schema
     * @returns {Object} slots 映射
     */
    renderComponentContent(schema) {
      const slots = schema && schema.renderComponentContent
        ? (() => { try { return (schema.renderComponentContent({ model: this.formModel, field: schema.field }) || {}); } catch (err) { console.error('[ElBasicFormItem/renderComponentContent] renderComponentContent fn error:', err); return {}; } })()
        : {};
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
     * 将具名插槽解析为可传给 RenderVNode 的 renderFn。
     * @param {Object} schema 单个表单项 schema
     * @returns {Function | null}
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
     * 向上查找 $scopedSlots：支持外层组件通过具名 scoped slot 注入渲染。
     * @param {string} name 插槽名
     * @returns {Function | null}
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
     * 标准化宽度：复用 runtime 的工具函数。
     * @param {string | number | null | undefined} val
     * @returns {string | null}
     */
    normalizeWidth(val) {
      return normalizeWidthUtil(val);
    },
    /**
     * 规范化单个表单项的 labelWidth。
     * @param {string | number | null | undefined} val
     * @returns {string | null}
     */
    normalizeItemLabelWidth(val) {
      return this.normalizeWidth(val);
    },
    /**
     * 计算最终 disabled：
     * - globalDisabled 最高优先级
     * - schema.disabled 支持布尔/函数
     * - schema.dynamicDisabled 为函数（带 values）
     * - 最后回退到 componentProps.disabled
     *
     * @param {Object} schema 单个表单项 schema
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
     * 兼容 schema 配置为“值或函数”：函数时传入 itemCtx。
     * @param {any} val 值或函数
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
     * 处理 schema.changeEvent 对应的自定义变更事件：
     * - 将事件值写回 formModel[field]
     *
     * @param {Object} schema 单个表单项 schema
     * @param {any} event 组件事件参数
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
     * 根据 schema.changeEvent 生成监听器映射。
     * @param {Object} schema 单个表单项 schema
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
