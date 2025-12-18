import { formatDate, isDateObject } from 'rowinself-ui/src/utils/date-util';

/**
 * @typedef {Record<string, any>} Recordable
 */

/**
 * @typedef {Object} BasicFormRuntimeFactoryOptions
 * @property {(schemas: any[]) => any[]} [normalizeSchemas]
 * @property {(schemas: any[]) => any[]} [flattenSchemas]
 * @property {string} [logScope]
 */

/**
 * 将宽度值标准化为 ElementUI 可识别的字符串。
 * @param {string | number | null | undefined} val
 * @returns {string | null}
 */
export function normalizeWidth(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return `${val}px`;
  return val;
}

/**
 * 根据组件类型推导缺省值。
 * @param {any} component
 * @returns {any}
 */
function inferDefaultValueByComponent(component) {
  if (component === 'CheckboxGroup' || component === 'CheckboxButtonGroup' || component === 'Upload') return [];
  if (component === 'Checkbox') return false;
  if (component === 'InputNumber') return 0;
  return undefined;
}

/**
 * 兼容性获取 Promise 构造器。
 * @returns {PromiseConstructor | null}
 */
function getPromiseCtor() {
  try {
    if (typeof window !== 'undefined' && window && window.Promise) return window.Promise;
  } catch (err) {
    return null;
  }
  return null;
}

/**
 * 执行外部 hook（可同步/异步），成功后继续执行 next。
 * @param {Function} hook
 * @param {Function} next
 * @param {string} logScope
 * @param {string} hookName
 */
function runHookThen(hook, next, logScope, hookName) {
  if (typeof hook !== 'function') {
    next();
    return;
  }
  const PromiseCtor = getPromiseCtor();
  try {
    if (PromiseCtor) {
      PromiseCtor.resolve(hook())
        .then(() => next())
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(`[${logScope}] ${hookName} rejected:`, err);
        });
      return;
    }
    hook();
    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[${logScope}] ${hookName} error:`, err);
  }
}

/**
 * 生成 schema -> 初始值的映射。
 * @param {any[]} schemaList
 * @param {Recordable} formModel
 * @returns {Recordable}
 */
function buildInitValues(schemaList, formModel) {
  const next = {};
  (schemaList || []).forEach((schemaItem) => {
    if (!schemaItem || typeof schemaItem !== 'object' || !schemaItem.field) return;
    let init = schemaItem.defaultValue !== undefined ? schemaItem.defaultValue : formModel[schemaItem.field];
    if (init === undefined) init = inferDefaultValueByComponent(schemaItem.component);
    next[schemaItem.field] = init;
  });
  return next;
}

/**
 * 将 next 的字段增量同步到 internalModel（仅在未传入外部 model 时生效）。
 * @param {any} vm Vue 实例
 * @param {Recordable} next
 */
function syncInternalModel(vm, next) {
  Object.keys(next).forEach((fieldName) => {
    if (vm.internalModel[fieldName] === undefined) vm.$set(vm.internalModel, fieldName, next[fieldName]);
  });
  Object.keys(vm.internalModel).forEach((fieldName) => {
    if (!(fieldName in next)) vm.$delete(vm.internalModel, fieldName);
  });
}

/**
 * 创建 runtime mixin：plain / sections 通过传入 schema 处理策略复用同一份运行时。
 * @param {BasicFormRuntimeFactoryOptions} [options]
 */
export function createBasicFormRuntimeMixin(options) {
  const normalizedOptions = options || {};
  const normalizeSchemas = typeof normalizedOptions.normalizeSchemas === 'function'
    ? normalizedOptions.normalizeSchemas
    : (src) => (Array.isArray(src) ? src : []);
  const flattenSchemas = typeof normalizedOptions.flattenSchemas === 'function'
    ? normalizedOptions.flattenSchemas
    : (src) => (Array.isArray(src) ? src : []);
  const logScope = normalizedOptions.logScope || 'ElBasicForm';

  return {
    computed: {
      effectiveSchemas() {
        const base = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
        const src = normalizeSchemas(base);

        const list = (src || [])
          .filter((schemaItem) => {
            if (!schemaItem || typeof schemaItem !== 'object') return false;
            if (typeof schemaItem.show === 'function') return !!schemaItem.show({ values: this.formModel });
            if (typeof schemaItem.ifShow === 'function') return !!schemaItem.ifShow({ values: this.formModel });
            return schemaItem.show !== false && schemaItem.ifShow !== false;
          })
          .map((schemaItem) => {
            const baseColProps = ((this._baseColProps || this.baseColProps) || {});
            const schemaColProps = schemaItem.colProps || {};
            const mergedColProps = { ...baseColProps, ...schemaColProps };
            return {
              ...schemaItem,
              disabled: (
                'disabled' in schemaItem
                  ? schemaItem.disabled
                  : !!(schemaItem.componentProps && schemaItem.componentProps.disabled)
              ),
              colProps: mergedColProps
            };
          });

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
          const src = flattenSchemas(val || []);
          const next = buildInitValues(src, this.formModel);
          if (!this.model) syncInternalModel(this, next);
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
      normalizeWidth,
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
          // eslint-disable-next-line no-console
          console.error(`[${logScope}] mapFieldToTime error:`, err);
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
      setFieldsValue(values) {
        Object.keys(values || {}).forEach((fieldName) => {
          this.$set(this.formModel, fieldName, values[fieldName]);
        });
      },
      resetFields() { this.reset(); },
      validateFields(nameList) {
        const ref = this.$refs.formRef;
        if (!ref) return getPromiseCtor() ? getPromiseCtor().resolve(true) : true;
        const PromiseCtor = getPromiseCtor();
        if (PromiseCtor) {
          return new PromiseCtor((resolve) => {
            ref.validateField(nameList || [], (msg) => resolve(!msg));
          });
        }
        let ok = true;
        ref.validateField(nameList || [], (msg) => { ok = !msg; });
        return ok;
      },
      validate(nameList) {
        const ref = this.$refs.formRef;
        if (!ref) return getPromiseCtor() ? getPromiseCtor().resolve(true) : true;
        const PromiseCtor = getPromiseCtor();
        if (PromiseCtor) {
          return new PromiseCtor((resolve) => {
            ref.validate((valid) => resolve(valid));
          });
        }
        let ok = true;
        ref.validate((valid) => { ok = !!valid; });
        return ok;
      },
      clearValidate(name) {
        const ref = this.$refs.formRef;
        if (!ref) return;
        ref.clearValidate(name);
      },
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
        const src = (this.internalSchemas && this.internalSchemas.length)
          ? this.internalSchemas.slice()
          : ((this.schemas || []).slice());
        const item = { ...(schema || {}) };
        if (first) {
          src.unshift(item);
        } else if (prefixField) {
          const idx = src.findIndex((schemaItem) => schemaItem.field === prefixField);
          if (idx !== -1) src.splice(idx + 1, 0, item);
          else src.push(item);
        } else {
          src.push(item);
        }
        this.internalSchemas = src;
      },
      updateSchema(data) {
        const src = (this.internalSchemas && this.internalSchemas.length)
          ? this.internalSchemas.slice()
          : ((this.schemas || []).slice());
        const items = Array.isArray(data) ? data : [data];
        const patchMap = Object.create(null);
        items.forEach((patchSchema) => {
          if (patchSchema && patchSchema.field) patchMap[patchSchema.field] = patchSchema;
        });
        this.internalSchemas = src.map((schemaItem) => (
          patchMap[schemaItem.field] ? { ...schemaItem, ...patchMap[schemaItem.field] } : schemaItem
        ));
      },
      submit() {
        const ref = this.$refs.formRef;
        if (!ref) return;
        const doSubmit = () => {
          const payload = this.mergePayload(this.mapFieldToTime({ ...this.formModel }));
          this.$emit('submit', payload);
        };
        if (typeof this.submitFunc === 'function') {
          runHookThen(this.submitFunc, doSubmit, logScope, 'submitFunc');
          return;
        }
        ref.validate((valid) => { if (valid) doSubmit(); });
      },
      reset() {
        const ref = this.$refs.formRef;
        if (!ref) return;
        const doReset = () => {
          ref.resetFields();
          const src = flattenSchemas(this.schemas || []);
          const next = buildInitValues(src, {});
          this.internalModel = { ...next };
          this.$emit('reset', this.mergePayload(this.mapFieldToTime({ ...this.formModel })));
        };
        if (typeof this.resetFunc === 'function') {
          runHookThen(this.resetFunc, doReset, logScope, 'resetFunc');
          return;
        }
        doReset();
      }
    }
  };
}

