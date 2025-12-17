// 引入日期工具函数：formatDate 用于格式化日期，isDateObject 用于判断是否为日期对象
import { formatDate, isDateObject } from 'rowinself-ui/src/utils/date-util';
// 使用 normalize-schemas-with-sections.js 提供的规范化工具函数
import { flattenSchemasWithSections, normalizeSchemasWithSections } from './normalize-schemas-with-sections';

export default {
  computed: {
    /**
     * 计算属性：effectiveSchemas
     * 用于最终渲染的 schema 列表，已做过滤、合并、排序、展开/收起等处理
     */
    effectiveSchemas() {
      const base = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
      const src = normalizeSchemasWithSections(base);
      // 过滤掉 show / ifShow 为 false 的字段；若为函数则执行函数并取布尔结果
      const list = src.filter((schemaItem) => {
        if (typeof schemaItem.show === 'function') return !!schemaItem.show({ values: this.formModel });
        if (typeof schemaItem.ifShow === 'function') return !!schemaItem.ifShow({ values: this.formModel });
        return schemaItem.show !== false && schemaItem.ifShow !== false;
      }).map((schemaItem) => {
        // 合并基础 colProps 与当前 schema 的 colProps
        const baseColProps = ((this._baseColProps || this.baseColProps) || {});
        const schemaColProps = schemaItem.colProps || {};
        const mergedColProps = { ...baseColProps, ...schemaColProps };
        return {
          ...schemaItem,
          // 若 schema 自身未声明 disabled，则读取 componentProps.disabled
          disabled: ('disabled' in schemaItem ? schemaItem.disabled : !!(schemaItem.componentProps && schemaItem.componentProps.disabled)),
          colProps: mergedColProps
        };
      });
      // 若开启“高级/收起”按钮且当前为收起状态，则只保留前 N 项
      if (this.showAdvancedButton && !this.advancedOpen) {
        const keep = Math.max(this.alwaysShowLines, this.autoAdvancedLine);
        return list.slice(0, keep);
      }
      return list;
    },
    // 计算属性：合并后的操作按钮列配置
    computedActionColOptions() { return this._actionColOptions || this.actionColOptions || null; },
    // 是否显示“高级/收起”按钮
    computedShowAdvancedButton() { return !!this.showAdvancedButton; },
    // 是否显示提交按钮
    computedShowSubmitButton() { return this._showSubmitButton != null ? this._showSubmitButton : this.showSubmitButton; },
    // 是否显示重置按钮
    computedShowResetButton() { return this._showResetButton != null ? this._showResetButton : this.showResetButton; },
    // 提交按钮配置
    computedSubmitButtonOptions() { return this.submitButtonOptions || {}; },
    // 重置按钮配置
    computedResetButtonOptions() { return this.resetButtonOptions || {}; },
    // 提交按钮文字
    computedSubmitButtonText() { return this._submitButtonText || this.submitButtonText; },
    // 重置按钮文字
    computedResetButtonText() { return this._resetButtonText || this.resetButtonText; },
    // 自定义操作按钮
    computedActionCustomButtons() { return this.actionButton || null; },
    /**
     * 计算属性：computedFormActionType
     * 对外暴露的表单操作 API 对象，供父组件通过 ref 调用
     */
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
    /**
     * 监听 schemas 变化，立即执行
     * 用于初始化/同步 formModel 字段值
     */
    schemas: {
      immediate: true,
      handler(val) {
        const next = {};
        const src = flattenSchemasWithSections(val || []);
        // 为每个字段生成初始值
        src.forEach((schemaItem) => {
          if (!schemaItem || !schemaItem.field) return;
          let init = schemaItem.defaultValue !== undefined ? schemaItem.defaultValue : this.formModel[schemaItem.field];
          const comp = schemaItem.component;
          if (init === undefined) {
            if (comp === 'CheckboxGroup' || comp === 'CheckboxButtonGroup' || comp === 'Upload') init = [];
            if (comp === 'Checkbox') init = false;
            if (comp === 'InputNumber') init = 0;
          }
          next[schemaItem.field] = init;
        });
        // 若未使用 v-model，则通过 $set/$delete 同步 internalModel
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
    // 监听 rules 变化，立即同步到 formRules
    rules: {
      immediate: true,
      handler(val) {
        this.formRules = val || {};
      }
    }
  },
  methods: {
    /**
     * 工具方法：标准化宽度值
     * 若传入数字则拼接 px，否则原样返回
     */
    normalizeWidth(val) {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return `${val}px`;
      return val;
    },
    /**
     * 将日期区间字段拆分为开始/结束字段，并格式化日期
     * 例如：{ dateRange: [Date, Date] } -> { startDate: '2020-01-01', endDate: '2020-01-02' }
     */
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
    /**
     * 合并动态附加数据到表单值
     * 用于提交/重置时追加额外字段
     */
    mergePayload(values) {
      const extra = this._mergeDynamicData != null ? this._mergeDynamicData : (this.mergeDynamicData || {});
      return { ...extra, ...values };
    },
    /**
     * 切换“高级/收起”状态
     */
    toggleAdvanced() {
      this.advancedOpen = !this.advancedOpen;
    },
    /**
     * 获取当前表单所有字段值
     */
    getFieldsValue() { return { ...this.formModel }; },
    /**
     * 设置表单字段值
     */
    setFieldsValue(values) { Object.keys(values || {}).forEach((fieldName) => { this.$set(this.formModel, fieldName, values[fieldName]); }); },
    /**
     * 重置表单字段（el-form 原生方法）
     */
    resetFields() { this.reset(); },
    /**
     * 校验指定字段
     * 返回 Promise 或布尔值（兼容无 Promise 环境）
     */
    validateFields(nameList) {
      const ref = this.$refs.formRef; if (!ref) return (window && window.Promise) ? window.Promise.resolve(true) : true;
      if (window && window.Promise) {
        return new window.Promise((resolve) => { ref.validateField(nameList || [], (msg) => resolve(!msg)); });
      }
      let ok = true;
      ref.validateField(nameList || [], (msg) => { ok = !msg; });
      return ok;
    },
    /**
     * 校验整个表单
     * 返回 Promise 或布尔值
     */
    validate(nameList) {
      const ref = this.$refs.formRef; if (!ref) return (window && window.Promise) ? window.Promise.resolve(true) : true;
      if (window && window.Promise) {
        return new window.Promise((resolve) => { ref.validate((valid) => resolve(valid)); });
      }
      let ok = true;
      ref.validate((valid) => { ok = !!valid; });
      return ok;
    },
    /**
     * 清除指定字段校验提示
     */
    clearValidate(name) { const ref = this.$refs.formRef; if (!ref) return; ref.clearValidate(name); },
    /**
     * 滚动到指定字段所在表单项
     * 优先找 label 的 for，再找 input 的 name
     */
    scrollToField(name, options) {
      const el = this.$el && this.$el.querySelector && this.$el.querySelector(`[for="${name}"]`);
      const target = el || (this.$el && this.$el.querySelector && this.$el.querySelector(`.el-form-item__content [name='${name}']`));
      if (target && target.scrollIntoView) target.scrollIntoView(options || { behavior: 'smooth', block: 'center' });
    },
    /**
     * 动态设置表单属性
     * 支持 actionColOptions、baseColProps、mergeDynamicData 等
     */
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
    /**
     * 根据字段名移除 schema
     * 支持数组或字符串
     */
    removeSchemaByField(field) {
      const names = Array.isArray(field) ? field : [field];
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
      this.internalSchemas = src.filter((schemaItem) => names.indexOf(schemaItem.field) === -1);
    },
    /**
     * 插入 schema
     * @param schema 要插入的 schema
     * @param prefixField 插入到哪个字段之后
     * @param first 是否插到最前
     */
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
    /**
     * 批量更新 schema
     * 根据 field 匹配并合并属性
     */
    updateSchema(data) {
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas.slice() : ((this.schemas || []).slice());
      const items = Array.isArray(data) ? data : [data];
      const patchMap = Object.create(null);
      items.forEach((patchSchema) => { if (patchSchema && patchSchema.field) patchMap[patchSchema.field] = patchSchema; });
      this.internalSchemas = src.map((schemaItem) => (patchMap[schemaItem.field] ? { ...schemaItem, ...patchMap[schemaItem.field] } : schemaItem));
    },
    /**
     * 提交表单
     * 1. 若传 submitFunc 则先执行，再 emit submit
     * 2. 否则先校验，通过后 emit submit
     */
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
    /**
     * 重置表单
     * 1. 若传 resetFunc 则先执行，再执行默认重置
     * 2. 重置 el-form 字段值，并同步 internalModel
     * 3. emit reset 事件
     */
    reset() {
      const ref = this.$refs.formRef;
      if (!ref) return;
      const doReset = () => {
        ref.resetFields();
        const next = {};
        const src = flattenSchemasWithSections(this.schemas || []);
        src.forEach((schemaItem) => {
          if (!schemaItem || !schemaItem.field) return;
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
