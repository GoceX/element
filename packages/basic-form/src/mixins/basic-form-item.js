export default {
  methods: {
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
    finalListeners(schema) {
      const mergedProps = this.getComponentPropsMerged(schema || {});
      const listenersFromProps = this.extractEventListeners(mergedProps);
      const listenersFromSchema = this.customListeners(schema);
      return Object.assign({}, listenersFromProps, listenersFromSchema);
    },
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
    findScopedSlot(name) {
      let ctx = this;
      while (ctx) {
        const slots = ctx.$scopedSlots;
        if (slots && typeof slots[name] === 'function') return slots[name];
        ctx = ctx.$parent;
      }
      return null;
    },
    normalizeWidth(val) {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return `${val}px`;
      return val;
    },
    normalizeItemLabelWidth(val) {
      return this.normalizeWidth(val);
    },
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

