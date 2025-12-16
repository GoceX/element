import { formatDate, isDateObject } from 'rowinself-ui/src/utils/date-util';

export default {
  computed: {
    effectiveSchemas() {
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
      const list = src.filter((schemaItem) => {
        if (typeof schemaItem.show === 'function') return !!schemaItem.show({ values: this.formModel });
        if (typeof schemaItem.ifShow === 'function') return !!schemaItem.ifShow({ values: this.formModel });
        return schemaItem.show !== false && schemaItem.ifShow !== false;
      }).map((schemaItem) => ({
        ...schemaItem,
        disabled: ('disabled' in schemaItem ? schemaItem.disabled : !!(schemaItem.componentProps && schemaItem.componentProps.disabled)),
        colProps: { ...((this._baseColProps || this.baseColProps) || {}), ...(schemaItem.colProps || {}) }
      }));
      if (this.showAdvancedButton && !this.advancedOpen) {
        const keep = Math.max(this.alwaysShowLines, this.autoAdvancedLine);
        return list.slice(0, keep);
      }
      return list;
    },
    computedActionColOptions() { return this._actionColOptions || this.actionColOptions || null; },
    computedShowAdvancedButton() { return !!this.showAdvancedButton; },
    computedShowSubmitButton() { return this._showSubmitButton != null ? this._showSubmitButton : this.showSubmitButton; },
    computedShowResetButton() { return this._showResetButton != null ? this._showResetButton : this.showResetButton; },
    computedSubmitButtonOptions() { return this.submitButtonOptions || {}; },
    computedResetButtonOptions() { return this.resetButtonOptions || {}; },
    computedSubmitButtonText() { return this._submitButtonText || this.submitButtonText; },
    computedResetButtonText() { return this._resetButtonText || this.resetButtonText; },
    computedActionCustomButtons() { return this.actionButton || null; },
    computedFormActionType() {
      return {
        setProps: this.setProps,
        getFieldsValue: this.getFieldsValue,
        setFieldsValue: this.setFieldsValue,
        resetFields: this.resetFields,
        validateFields: this.validateFields,
        validate: this.validate,
        submit: this.submit,
        clearValidate: this.clearValidate,
        scrollToField: this.scrollToField,
        removeSchemaByField: this.removeSchemaByField,
        appendSchemaByField: this.appendSchemaByField,
        updateSchema: this.updateSchema
      };
    }
  },
  watch: {
    schemas: {
      immediate: true,
      handler(val) {
        const next = {};
        (val || []).forEach((schemaItem) => {
          let init = schemaItem.defaultValue !== undefined ? schemaItem.defaultValue : this.formModel[schemaItem.field];
          const comp = schemaItem.component;
          if (init === undefined) {
            if (comp === 'CheckboxGroup' || comp === 'CheckboxButtonGroup' || comp === 'Upload') init = [];
            if (comp === 'Checkbox') init = false;
            if (comp === 'InputNumber') init = 0;
          }
          next[schemaItem.field] = init;
        });
        if (!this.model) {
          Object.keys(next).forEach((fieldName) => {
            if (this.internalModel[fieldName] === undefined) this.$set(this.internalModel, fieldName, next[fieldName]);
          });
          Object.keys(this.internalModel).forEach((fieldName) => {
            if (!(fieldName in next)) this.$delete(this.internalModel, fieldName);
          });
        }
      }
    },
    rules: {
      immediate: true,
      handler(val) {
        this.formRules = val || {};
      }
    }
  },
  methods: {
    normalizeWidth(val) {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return `${val}px`;
      return val;
    },
    mapFieldToTime(values) {
      const output = { ...values };
      try {
        (this.fieldMapToTime || []).forEach((item) => {
          const [srcField, startField, endField, fmt] = item;
          const val = output[srcField];
          if (Array.isArray(val) && val.length >= 2) {
            const startValue = isDateObject(val[0]) ? formatDate(val[0], fmt || 'yyyy-MM-dd') : val[0];
            const endValue = isDateObject(val[1]) ? formatDate(val[1], fmt || 'yyyy-MM-dd') : val[1];
            output[startField] = startValue;
            output[endField] = endValue;
            delete output[srcField];
          }
        });
      } catch (err) {
        console.error('[ElBasicForm] mapFieldToTime error:', err);
      }
      return output;
    },
    mergePayload(values) {
      const extra = this._mergeDynamicData != null ? this._mergeDynamicData : (this.mergeDynamicData || {});
      return { ...extra, ...values };
    },
    toggleAdvanced() {
      this.advancedOpen = !this.advancedOpen;
    },
    getFieldsValue() { return { ...this.formModel }; },
    setFieldsValue(values) { Object.keys(values || {}).forEach((fieldName) => { this.$set(this.formModel, fieldName, values[fieldName]); }); },
    resetFields() { this.reset(); },
    validateFields(nameList) {
      const ref = this.$refs.formRef; if (!ref) return (window && window.Promise) ? window.Promise.resolve(true) : true;
      if (window && window.Promise) {
        return new window.Promise((resolve) => { ref.validateField(nameList || [], (msg) => resolve(!msg)); });
      }
      let ok = true;
      ref.validateField(nameList || [], (msg) => { ok = !msg; });
      return ok;
    },
    validate(nameList) {
      const ref = this.$refs.formRef; if (!ref) return (window && window.Promise) ? window.Promise.resolve(true) : true;
      if (window && window.Promise) {
        return new window.Promise((resolve) => { ref.validate((valid) => resolve(valid)); });
      }
      let ok = true;
      ref.validate((valid) => { ok = !!valid; });
      return ok;
    },
    clearValidate(name) { const ref = this.$refs.formRef; if (!ref) return; ref.clearValidate(name); },
    scrollToField(name, options) {
      const el = this.$el && this.$el.querySelector && this.$el.querySelector(`[for="${name}"]`);
      const target = el || (this.$el && this.$el.querySelector && this.$el.querySelector(`.el-form-item__content [name='${name}']`));
      if (target && target.scrollIntoView) target.scrollIntoView(options || { behavior: 'smooth', block: 'center' });
    },
    setProps(formProps) {
      const nextProps = formProps || {};
      if ('actionColOptions' in nextProps) this._actionColOptions = nextProps.actionColOptions;
      if ('baseColProps' in nextProps) this._baseColProps = nextProps.baseColProps;
      if ('mergeDynamicData' in nextProps) this._mergeDynamicData = nextProps.mergeDynamicData;
      if ('autoSubmitOnEnter' in nextProps) this._autoSubmitOnEnter = nextProps.autoSubmitOnEnter;
      if ('rulesMessageJoinLabel' in nextProps) this._rulesMessageJoinLabel = nextProps.rulesMessageJoinLabel;
      if ('showSubmitButton' in nextProps) this._showSubmitButton = nextProps.showSubmitButton;
      if ('showResetButton' in nextProps) this._showResetButton = nextProps.showResetButton;
      if ('submitButtonText' in nextProps) this._submitButtonText = nextProps.submitButtonText;
      if ('resetButtonText' in nextProps) this._resetButtonText = nextProps.resetButtonText;
    },
    removeSchemaByField(field) {
      const names = Array.isArray(field) ? field : [field];
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
      this.internalSchemas = src.filter((schemaItem) => names.indexOf(schemaItem.field) === -1);
    },
    appendSchemaByField(schema, prefixField, first) {
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas.slice() : ((this.schemas || []).slice());
      const item = { ...(schema || {}) };
      if (first) {
        src.unshift(item);
      } else if (prefixField) {
        const idx = src.findIndex((schemaItem) => schemaItem.field === prefixField);
        if (idx !== -1) src.splice(idx + 1, 0, item); else src.push(item);
      } else {
        src.push(item);
      }
      this.internalSchemas = src;
    },
    updateSchema(data) {
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas.slice() : ((this.schemas || []).slice());
      const items = Array.isArray(data) ? data : [data];
      const patchMap = Object.create(null);
      items.forEach((patchSchema) => { if (patchSchema && patchSchema.field) patchMap[patchSchema.field] = patchSchema; });
      this.internalSchemas = src.map((schemaItem) => (patchMap[schemaItem.field] ? { ...schemaItem, ...patchMap[schemaItem.field] } : schemaItem));
    },
    submit() {
      const ref = this.$refs.formRef;
      if (!ref) return;
      const doSubmit = () => {
        const payload = this.mergePayload(this.mapFieldToTime({ ...this.formModel }));
        this.$emit('submit', payload);
      };
      if (typeof this.submitFunc === 'function') {
        try {
          if (window && window.Promise) {
            window.Promise.resolve(this.submitFunc()).then(() => doSubmit()).catch((err) => {
              console.error('[ElBasicForm] submitFunc rejected:', err);
            });
          } else {
            this.submitFunc();
            doSubmit();
          }
        } catch (err) {
          console.error('[ElBasicForm] submitFunc error:', err);
        }
        return;
      }
      ref.validate((valid) => { if (valid) doSubmit(); });
    },
    reset() {
      const ref = this.$refs.formRef;
      if (!ref) return;
      const doReset = () => {
        ref.resetFields();
        const next = {};
        (this.schemas || []).forEach((schemaItem) => {
          let init = schemaItem.defaultValue;
          if (init === undefined) {
            const comp = schemaItem.component;
            if (comp === 'CheckboxGroup' || comp === 'CheckboxButtonGroup' || comp === 'Upload') init = [];
            if (comp === 'Checkbox') init = false;
            if (comp === 'InputNumber') init = 0;
          }
          next[schemaItem.field] = init;
        });
        this.internalModel = { ...next };
        this.$emit('reset', this.mergePayload(this.mapFieldToTime({ ...this.formModel })));
      };
      if (typeof this.resetFunc === 'function') {
        try {
          if (window && window.Promise) {
            window.Promise.resolve(this.resetFunc()).then(() => doReset()).catch((err) => {
              console.error('[ElBasicForm] resetFunc rejected:', err);
            });
          } else {
            this.resetFunc();
            doReset();
          }
        } catch (err) {
          console.error('[ElBasicForm] resetFunc error:', err);
        }
        return;
      }
      doReset();
    }
  }
};

