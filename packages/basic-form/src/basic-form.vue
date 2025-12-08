<template>
  <!-- 表单容器：绑定模型、校验规则与基础配置，拦截 Enter 键触发回车提交 -->
  <el-form ref="formRef" :model="formModel" :rules="formRules" :label-position="labelAlign || labelPosition"
    :label-width="normalizedLabelWidth" :inline="inline" :size="size" :disabled="disabled"
    @keydown.native.enter.prevent="handleEnterSubmit">
    <!-- 栅格行：设置统一 gutter 与可选的行内样式 -->
    <el-row :gutter="14" :style="baseRowStyle">
      <!-- 逐项渲染 Schema 对应的表单项组件，并透传全局占位与校验文案配置 -->
      <ElBasicFormItem
        v-for="(schema, idx) in effectiveSchemas"
        :key="schema && schema.field ? schema.field : idx"
        :schema="schema"
        :form-model="formModel"
        :global-auto-set-place-holder="computedAutoSetPlaceHolder"
        :global-rules-message-join-label="computedRulesMessageJoinLabel"
        :global-size="size"
        :global-disabled="disabled"
        :table-action="tableAction"
        :form-action-type="computedFormActionType"
      />
      <!-- 操作按钮区域：提交、重置、高级展开/收起等 -->
      <template v-if="showActionButtonGroup">
        <!-- 通过 computedActionColOptions 控制该列的栅格属性，如 span/offset -->
        <el-col v-bind="computedActionColOptions">
          <el-form-item>
            <!-- 提交按钮：可配置文本与属性，点击后触发表单提交逻辑 -->
            <el-button v-if="computedShowSubmitButton" type="primary" v-bind="computedSubmitButtonOptions" @click="submit">
              {{ computedSubmitButtonText }}
            </el-button>
            <!-- 重置按钮：点击后恢复初始值并触发 reset 事件 -->
            <el-button v-if="computedShowResetButton" v-bind="computedResetButtonOptions" @click="reset">
              {{ computedResetButtonText }}
            </el-button>
            <!-- 高级按钮：展开/收起更多字段，仅在开启 showAdvancedButton 时显示 -->
            <el-button v-if="computedShowAdvancedButton" type="text" @click="toggleAdvanced">
              {{ advancedOpen ? '收起' : '展开' }}
            </el-button>
            <!-- 外部可注入的操作插槽，例如自定义按钮 -->
            <slot name="action"></slot>
          </el-form-item>
        </el-col>
      </template>
    </el-row>
  </el-form>
</template>
<script>
import { formatDate, isDateObject } from 'rowinself-ui/src/utils/date-util';
import ElBasicFormItem from './basic-form-item.vue';
/*
 * 组件：ElBasicForm
 * 功能：基于 Schema 配置快速构建表单，支持动态 Schema、占位符、校验规则拼接、
 *       高级字段展开、字段滚动定位、以及提交/重置等常用能力。
 * 依赖：ElementUI 表单与栅格组件
 */

export default {
  name: 'ElBasicForm',
  components: { ElBasicFormItem },
  props: {
    // 外部传入的表单数据模型；缺省时组件维护 internalModel
    model: Object,
    // ElementUI 的校验规则对象
    rules: Object,
    // 标签位置（left/right/top）；当 labelAlign 存在时优先生效
    labelPosition: String,
    // 标签对齐方式（覆盖 labelPosition），用于更细粒度控制
    labelAlign: String,
    // 标签宽度，支持 number（像素）与字符串（例如 '100px'、'auto'）
    labelWidth: [String, Number],
    // 行内表单开关
    inline: Boolean,
    // 组件尺寸（medium/small/mini）
    size: String,
    // 整体禁用态
    disabled: Boolean,
    // 表单项 Schema 列表，决定渲染项、组件类型、校验、占位等
    schemas: {
      type: Array,
      default: () => []
    },
    // 将区间字段映射为起止字段的配置：[srcField, startField, endField, format]
    fieldMapToTime: {
      type: Array,
      default: () => []
    },
    // 操作区域的列配置，如 { span: 24, offset: 0 }
    actionColOptions: Object,
    // 每个 Schema 的默认列属性，作为基础合并项
    baseColProps: Object,
    // el-row 的基础样式
    baseRowStyle: Object,
    // 合并到提交载荷的动态数据（运行时可变）
    mergeDynamicData: Object,
    // 是否在挂载后自动聚焦第一个输入框
    autoFocusFirstItem: Boolean,
    // 紧凑模式：通常用于减少间距
    compact: Boolean,
    // 自动设置常见输入组件的占位符
    autoSetPlaceHolder: {
      type: Boolean,
      default: true
    },
    // 回车自动提交
    autoSubmitOnEnter: Boolean,
    // 规则消息拼接字段标签（如 “用户名不能为空”）
    rulesMessageJoinLabel: Boolean,
    // 显示高级展开按钮
    showAdvancedButton: Boolean,
    // 用于占位的空列 span 配置
    emptySpan: [Number, Object],
    // 未展开时保留的可见行数（或按行计算的项数）
    autoAdvancedLine: {
      type: Number,
      default: 3
    },
    // 始终显示的最少行数
    alwaysShowLines: {
      type: Number,
      default: 1
    },
    // 是否显示操作按钮区域
    showActionButtonGroup: {
      type: Boolean,
      default: true
    },
    // 是否显示重置按钮
    showResetButton: {
      type: Boolean,
      default: true
    },
    // 重置按钮的额外 props，例如 { type, size }
    resetButtonOptions: Object,
    // 是否显示提交按钮
    showSubmitButton: {
      type: Boolean,
      default: true
    },
    // 提交按钮的额外 props
    submitButtonOptions: Object,
    // 提交按钮文案
    submitButtonText: {
      type: String,
      default: '提交'
    },
    // 重置按钮文案
    resetButtonText: {
      type: String,
      default: '重置'
    },
    // 外部重置钩子（可异步），成功后执行内部重置逻辑
    resetFunc: Function,
    // 外部提交钩子（可异步），成功后触发 submit 事件
    submitFunc: Function,
    tableAction: Object
  },
  data() {
    return {
      internalModel: {},
      // 内部可变的 schema 列表，支持运行时增删改
      internalSchemas: [],
      formRules: this.rules || {},
      advancedOpen: false,
      _actionColOptions: null,
      _baseColProps: null,
      _mergeDynamicData: null,
      _autoSubmitOnEnter: null,
      _rulesMessageJoinLabel: null,
      _showSubmitButton: null,
      _showResetButton: null,
      _submitButtonText: null,
      _resetButtonText: null
    };
  },
  computed: {
    // 使用外部 model 或内部模型作为双向绑定源
    formModel() {
      return this.model || this.internalModel;
    },
    // 归一化标签宽度
    normalizedLabelWidth() {
      return this.normalizeWidth(this.labelWidth);
    },
    // 计算自动占位符开关
    computedAutoSetPlaceHolder() {
      return typeof this.autoSetPlaceHolder === 'boolean' ? this.autoSetPlaceHolder : true;
    },
    // 计算规则消息是否拼接标签
    computedRulesMessageJoinLabel() {
      return this._rulesMessageJoinLabel != null ? this._rulesMessageJoinLabel : !!this.rulesMessageJoinLabel;
    },
    // 生效的 Schema 列表：过滤 show/ifShow 并合并列属性；未展开时按行裁剪
    effectiveSchemas() {
      // 优先使用 internalSchemas（运行时变更），否则回退到 props.schemas
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
      const list = src.filter((s) => {
        if (typeof s.show === 'function') return !!s.show({ values: this.formModel });
        if (typeof s.ifShow === 'function') return !!s.ifShow({ values: this.formModel });
        return s.show !== false && s.ifShow !== false;
      }).map((s) => ({ ...s, colProps: { ...((this._baseColProps || this.baseColProps) || {}), ...(s.colProps || {}) } }));
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
        // 根据 schemas 初始值生成/同步 internalModel（当未传入外部 model 时）
        const next = {};
        (val || []).forEach((s) => {
          let init = s.defaultValue !== undefined ? s.defaultValue : this.formModel[s.field];
          const comp = s.component;
          if (init === undefined) {
            if (comp === 'CheckboxGroup' || comp === 'CheckboxButtonGroup' || comp === 'Upload') init = [];
            if (comp === 'Checkbox') init = false;
            if (comp === 'InputNumber') init = 0;
          }
          next[s.field] = init;
        });
        if (!this.model) {
          Object.keys(next).forEach((k) => {
            if (this.internalModel[k] === undefined) this.$set(this.internalModel, k, next[k]);
          });
          Object.keys(this.internalModel).forEach((k) => {
            if (!(k in next)) this.$delete(this.internalModel, k);
          });
        }
      }
    },
    rules: {
      immediate: true,
      handler(val) {
        // 动态更新校验规则对象
        this.formRules = val || {};
      }
    }
  },
  methods: {
    /**
     * 回车提交事件处理
     * @returns {void}
     */
    handleEnterSubmit() {
      const v = this._autoSubmitOnEnter != null ? this._autoSubmitOnEnter : this.autoSubmitOnEnter;
      if (v) this.submit();
    },
    /**
     * 统一宽度为字符串形式
     * @param {string|number|null|undefined} val
     * @returns {string|null}
     */
    normalizeWidth(val) {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return `${val}px`;
      return val;
    },
    /**
     * 将区间时间字段映射为起止字段
     * @param {Object} values 表单值
     * @returns {Object} 处理后的值
     */
    mapFieldToTime(values) {
      const output = { ...values };
      try {
        (this.fieldMapToTime || []).forEach((item) => {
          const [srcField, startField, endField, fmt] = item;
          const val = output[srcField];
          if (Array.isArray(val) && val.length >= 2) {
            // 区分 Date 对象与字符串，按需格式化
            const s = isDateObject(val[0]) ? formatDate(val[0], fmt || 'yyyy-MM-dd') : val[0];
            const e = isDateObject(val[1]) ? formatDate(val[1], fmt || 'yyyy-MM-dd') : val[1];
            output[startField] = s;
            output[endField] = e;
            delete output[srcField];
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ElBasicForm] mapFieldToTime error:', err);
      }
      return output;
    },
    /**
     * 合并动态数据到提交载荷
     * @param {Object} values 当前表单值
     * @returns {Object}
     */
    mergePayload(values) {
      const extra = this._mergeDynamicData != null ? this._mergeDynamicData : (this.mergeDynamicData || {});
      return { ...extra, ...values };
    },
    /**
     * 展开/收起高级字段
     * @returns {void}
     */
    toggleAdvanced() {
      this.advancedOpen = !this.advancedOpen;
    },
    /**
     * 获取表单当前值快照
     * @returns {Object}
     */
    getFieldsValue() { return { ...this.formModel }; },
    /**
     * 批量设置表单值
     * @param {Object} values
     * @returns {void}
     */
    setFieldsValue(values) { Object.keys(values || {}).forEach((k) => { this.$set(this.formModel, k, values[k]); }); },
    resetFields() { this.reset(); },
    /**
     * 校验指定字段
     * @param {string[]|string} nameList
     * @returns {Promise<boolean>|boolean}
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
     * 整体校验
     * @param {string[]|undefined} nameList
     * @returns {Promise<boolean>|boolean}
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
    clearValidate(name) { const ref = this.$refs.formRef; if (!ref) return; ref.clearValidate(name); },
    /**
     * 滚动到指定字段
     * @param {string} name
     * @param {ScrollIntoViewOptions} [options]
     * @returns {void}
     */
    scrollToField(name, options) {
      const el = this.$el && this.$el.querySelector && this.$el.querySelector(`[for="${name}"]`);
      const target = el || (this.$el && this.$el.querySelector && this.$el.querySelector(`.el-form-item__content [name='${name}']`));
      if (target && target.scrollIntoView) target.scrollIntoView(options || { behavior: 'smooth', block: 'center' });
    },
    /**
     * 运行时更新表单属性
     * @param {Object} formProps
     * @returns {void}
     */
    setProps(formProps) {
      const p = formProps || {};
      if ('actionColOptions' in p) this._actionColOptions = p.actionColOptions;
      if ('baseColProps' in p) this._baseColProps = p.baseColProps;
      if ('mergeDynamicData' in p) this._mergeDynamicData = p.mergeDynamicData;
      if ('autoSubmitOnEnter' in p) this._autoSubmitOnEnter = p.autoSubmitOnEnter;
      if ('rulesMessageJoinLabel' in p) this._rulesMessageJoinLabel = p.rulesMessageJoinLabel;
      if ('showSubmitButton' in p) this._showSubmitButton = p.showSubmitButton;
      if ('showResetButton' in p) this._showResetButton = p.showResetButton;
      if ('submitButtonText' in p) this._submitButtonText = p.submitButtonText;
      if ('resetButtonText' in p) this._resetButtonText = p.resetButtonText;
    },
    // 根据 field 删除 Schema（支持数组）
    removeSchemaByField(field) {
      const names = Array.isArray(field) ? field : [field];
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas : (this.schemas || []);
      this.internalSchemas = src.filter((s) => names.indexOf(s.field) === -1);
    },
    // 在指定字段后插入 schema；未指定则插到末尾；first=true 则插到最前
    appendSchemaByField(schema, prefixField, first) {
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas.slice() : ((this.schemas || []).slice());
      const item = { ...(schema || {}) };
      if (first) {
        src.unshift(item);
      } else if (prefixField) {
        const idx = src.findIndex((s) => s.field === prefixField);
        if (idx !== -1) src.splice(idx + 1, 0, item); else src.push(item);
      } else {
        src.push(item);
      }
      this.internalSchemas = src;
    },
    // 更新一个或多个 schema（按 field 合并）
    updateSchema(data) {
      const src = (this.internalSchemas && this.internalSchemas.length) ? this.internalSchemas.slice() : ((this.schemas || []).slice());
      const items = Array.isArray(data) ? data : [data];
      const map = Object.create(null);
      items.forEach((d) => { if (d && d.field) map[d.field] = d; });
      this.internalSchemas = src.map((s) => (map[s.field] ? { ...s, ...map[s.field] } : s));
    },
    /**
     * 触发提交
     * @returns {void}
     */
    submit() {
      const ref = this.$refs.formRef;
      if (!ref) return;
      const doSubmit = () => {
        // 提交前将区间时间映射并合并动态数据
        const payload = this.mergePayload(this.mapFieldToTime({ ...this.formModel }));
        this.$emit('submit', payload);
      };
      if (typeof this.submitFunc === 'function') {
        try {
          if (window && window.Promise) {
            window.Promise.resolve(this.submitFunc()).then(() => doSubmit()).catch((err) => {
              // eslint-disable-next-line no-console
              console.error('[ElBasicForm] submitFunc rejected:', err);
            });
          } else {
            this.submitFunc();
            doSubmit();
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[ElBasicForm] submitFunc error:', err);
        }
        return;
      }
      ref.validate((valid) => { if (valid) doSubmit(); });
    },
    /**
     * 重置表单
     * @returns {void}
     */
    reset() {
      const ref = this.$refs.formRef;
      if (!ref) return;
      const doReset = () => {
        ref.resetFields();
        const next = {};
        (this.schemas || []).forEach((s) => {
          let init = s.defaultValue;
          if (init === undefined) {
            const comp = s.component;
            if (comp === 'CheckboxGroup' || comp === 'CheckboxButtonGroup' || comp === 'Upload') init = [];
            if (comp === 'Checkbox') init = false;
            if (comp === 'InputNumber') init = 0;
          }
          next[s.field] = init;
        });
        this.internalModel = { ...next };
        // 重置后对当前值做映射与合并，并向外触发 reset 事件
        this.$emit('reset', this.mergePayload(this.mapFieldToTime({ ...this.formModel })));
      };
      if (typeof this.resetFunc === 'function') {
        try {
          if (window && window.Promise) {
            window.Promise.resolve(this.resetFunc()).then(() => doReset()).catch((err) => {
              // eslint-disable-next-line no-console
              console.error('[ElBasicForm] resetFunc rejected:', err);
            });
          } else {
            this.resetFunc();
            doReset();
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[ElBasicForm] resetFunc error:', err);
        }
        return;
      }
      doReset();
    }
  },
  mounted() {
    // 暴露注册 API，供父组件持有并调用
    this.$emit('register', {
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
    });
    if (this.autoFocusFirstItem) {
      // 下一个事件循环中聚焦第一个可输入元素
      this.$nextTick(() => {
        const el = this.$el && this.$el.querySelector && this.$el.querySelector('input,textarea,.el-input__inner');
        if (el && typeof el.focus === 'function') el.focus();
      });
    }
  }
};
</script>
