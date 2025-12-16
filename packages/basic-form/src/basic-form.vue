<template>
  <!-- 表单容器：绑定模型、校验规则与基础配置，拦截 Enter 键触发回车提交 -->
  <el-form ref="formRef" :class="['el-basic-form']" :model="formModel" :rules="formRules" :label-position="labelAlign || labelPosition"
    :label-width="normalizedLabelWidth" :inline="inline" :size="size" :disabled="disabled"
    @keydown.native.enter.prevent="handleEnterSubmit">
    <!-- 栅格行：设置统一 gutter 与可选的行内样式 -->
    <el-row :gutter="14" :style="baseRowStyle" :class="`el-basic-form__label-${labelAlign}`">
      <!-- 逐项渲染 Schema 对应的表单项组件，并透传全局占位与校验文案配置 -->
      <ElBasicFormItem
        v-for="(schema, idx) in effectiveSchemas"
        :key="schema && schema.field ? schema.field : idx"
        :schema="schema"
        :form-model="formModel"
        :global-auto-set-place-holder="computedAutoSetPlaceHolder"
        :global-auto-set-clearable="computedAutoSetClearable"
        :global-rules-message-join-label="computedRulesMessageJoinLabel"
        :global-size="size"
        :global-disabled="disabled"
        :table-action="tableAction"
        :form-action-type="computedFormActionType"
      />
      <!-- 操作按钮区域：提交、重置、高级展开/收起等 -->
      <BasicFormAction
        v-if="showActionButtonGroup"
        :action-col-options="computedActionColOptions"
        :show-submit-button="computedShowSubmitButton"
        :show-reset-button="computedShowResetButton"
        :submit-button-options="computedSubmitButtonOptions"
        :reset-button-options="computedResetButtonOptions"
        :submit-button-text="computedSubmitButtonText"
        :reset-button-text="computedResetButtonText"
        :action-button="computedActionCustomButtons"
        :show-advanced-button="computedShowAdvancedButton"
        :advanced-open="advancedOpen"
        :table-action="tableAction"
        :on-submit="submit"
        :on-reset="reset"
        :on-toggle-advanced="toggleAdvanced"
      >
        <template slot="action"><slot name="action"></slot></template>
      </BasicFormAction>
    </el-row>
  </el-form>
</template>
<script>
// import { formatDate, isDateObject } from 'rowinself-ui/src/utils/date-util';
import ElBasicFormItem from './basic-form-item.vue';
import BasicFormAction from './basic-form-action.vue';
import basicFormRuntime from './mixins/basic-form-runtime';
/*
 * 组件：ElBasicForm
 * 功能：基于 Schema 配置快速构建表单，支持动态 Schema、占位符、校验规则拼接、
 *       高级字段展开、字段滚动定位、以及提交/重置等常用能力。
 * 依赖：ElementUI 表单与栅格组件
 */

export default {
  name: 'ElBasicForm',
  components: { ElBasicFormItem, BasicFormAction },
  mixins: [basicFormRuntime],
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
    // 自动为可清空的组件设置 clearable
    autoSetClearable: {
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
    tableAction: Object,
    actionButton: {
      type: [Array, null],
      default: () => null
    }
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
    // 计算自动 clearable 开关
    computedAutoSetClearable() {
      return typeof this.autoSetClearable === 'boolean' ? this.autoSetClearable : true;
    },
    // 计算规则消息是否拼接标签
    computedRulesMessageJoinLabel() {
      return this._rulesMessageJoinLabel != null ? this._rulesMessageJoinLabel : !!this.rulesMessageJoinLabel;
    },
    // 生效的 Schema 列表：过滤 show/ifShow 并合并列属性；未展开时按行裁剪
    effectiveSchemas() {
      // 优先使用 internalSchemas（运行时变更），否则回退到 props.schemas
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
  watch: {},
  methods: {
    handleEnterSubmit() {
      const autoSubmitEnabled = this._autoSubmitOnEnter != null ? this._autoSubmitOnEnter : this.autoSubmitOnEnter;
      if (autoSubmitEnabled) this.submit();
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
