import ElBasicFormItem from '../basic-form-item.vue';
import BasicFormAction from '../basic-form-action.vue';

export default {
  components: { ElBasicFormItem, BasicFormAction },
  props: {
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
  },
  data() {
    return {
      internalModel: {},
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
    formModel() {
      return this.model || this.internalModel;
    },
    normalizedLabelWidth() {
      return this.normalizeWidth(this.labelWidth);
    },
    computedAutoSetPlaceHolder() {
      return typeof this.autoSetPlaceHolder === 'boolean' ? this.autoSetPlaceHolder : true;
    },
    computedAutoSetClearable() {
      return typeof this.autoSetClearable === 'boolean' ? this.autoSetClearable : true;
    },
    computedRulesMessageJoinLabel() {
      return this._rulesMessageJoinLabel != null ? this._rulesMessageJoinLabel : !!this.rulesMessageJoinLabel;
    }
  },
  methods: {
    handleEnterSubmit() {
      const autoSubmitEnabled = this._autoSubmitOnEnter != null ? this._autoSubmitOnEnter : this.autoSubmitOnEnter;
      if (autoSubmitEnabled) this.submit();
    }
  },
  mounted() {
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
      this.$nextTick(() => {
        const el = this.$el && this.$el.querySelector && this.$el.querySelector('input,textarea,.el-input__inner');
        if (el && typeof el.focus === 'function') el.focus();
      });
    }
  }
};
