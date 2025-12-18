import ElBasicFormItem from '../basic-form-item.vue';
import BasicFormAction from '../basic-form-action.vue';

/**
 * 基础表单 props：plain/sections 组件与外层包装组件复用同一份定义。
 */
export const basicFormViewProps = {
  model: Object,
  rules: Object,
  labelPosition: String,
  labelAlign: String,
  labelWidth: [String, Number],
  inline: Boolean,
  size: String,
  disabled: Boolean,
  schemas: {
    type: Array,
    default: () => []
  },
  fieldMapToTime: {
    type: Array,
    default: () => []
  },
  actionColOptions: Object,
  baseColProps: Object,
  baseRowStyle: Object,
  mergeDynamicData: Object,
  autoFocusFirstItem: Boolean,
  compact: Boolean,
  autoSetPlaceHolder: {
    type: Boolean,
    default: true
  },
  autoSetClearable: {
    type: Boolean,
    default: true
  },
  autoSubmitOnEnter: Boolean,
  rulesMessageJoinLabel: Boolean,
  showAdvancedButton: Boolean,
  emptySpan: [Number, Object],
  autoAdvancedLine: {
    type: Number,
    default: 3
  },
  alwaysShowLines: {
    type: Number,
    default: 1
  },
  showActionButtonGroup: {
    type: Boolean,
    default: true
  },
  showResetButton: {
    type: Boolean,
    default: true
  },
  resetButtonOptions: Object,
  showSubmitButton: {
    type: Boolean,
    default: true
  },
  submitButtonOptions: Object,
  submitButtonText: {
    type: String,
    default: '提交'
  },
  resetButtonText: {
    type: String,
    default: '重置'
  },
  resetFunc: Function,
  submitFunc: Function,
  tableAction: Object,
  actionButton: {
    type: [Array, null],
    default: () => null
  }
};

export default {
  components: { ElBasicFormItem, BasicFormAction },
  props: basicFormViewProps,
  data() {
    return {
      // 当未传入外部 model 时，内部使用 internalModel 维护表单值
      internalModel: {},
      // 当运行时动态增减 schema 时，internalSchemas 作为内部数据源
      internalSchemas: [],
      // 当前生效的校验规则：优先使用外部 rules，否则为空对象
      formRules: this.rules || {},
      // 高级展开状态：由 toggleAdvanced 控制
      advancedOpen: false,

      // 以下字段用于 setProps 做“运行时覆写”，避免直接修改外部 props
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
    /**
     * 当前表单使用的 model：外部传入优先，否则回退到 internalModel。
     * @returns {Object}
     */
    formModel() {
      return this.model || this.internalModel;
    },
    /**
     * 将 labelWidth 标准化为 ElementUI 可识别的宽度字符串。
     * @returns {string | null}
     */
    normalizedLabelWidth() {
      return this.normalizeWidth(this.labelWidth);
    },
    /**
     * 是否自动为常见输入组件设置 placeholder。
     * @returns {boolean}
     */
    computedAutoSetPlaceHolder() {
      return typeof this.autoSetPlaceHolder === 'boolean' ? this.autoSetPlaceHolder : true;
    },
    /**
     * 是否自动为支持的组件设置 clearable。
     * @returns {boolean}
     */
    computedAutoSetClearable() {
      return typeof this.autoSetClearable === 'boolean' ? this.autoSetClearable : true;
    },
    /**
     * 规则提示是否拼接 label：优先使用 setProps 注入的覆写值。
     * @returns {boolean}
     */
    computedRulesMessageJoinLabel() {
      return this._rulesMessageJoinLabel != null ? this._rulesMessageJoinLabel : !!this.rulesMessageJoinLabel;
    }
  },
  methods: {
    /**
     * 回车提交：由 el-form keydown 触发。
     * - 受 autoSubmitOnEnter / setProps 覆写控制
     */
    handleEnterSubmit() {
      const autoSubmitEnabled = this._autoSubmitOnEnter != null ? this._autoSubmitOnEnter : this.autoSubmitOnEnter;
      if (autoSubmitEnabled) this.submit();
    }
  },
  mounted() {
    // 对外暴露表单动作集合：外部可通过 @register 拿到操作 API
    const api = this.computedFormActionType || {
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
    this.$emit('register', api);

    // 自动聚焦首个输入控件：用于提升键盘输入体验
    if (this.autoFocusFirstItem) {
      this.$nextTick(() => {
        const el = this.$el && this.$el.querySelector && this.$el.querySelector('input,textarea,.el-input__inner');
        if (el && typeof el.focus === 'function') el.focus();
      });
    }
  }
};
