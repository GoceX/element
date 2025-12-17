<template>
  <component :is="innerComponent" v-bind="passThroughProps" v-on="$listeners">
    <slot />
  </component>
</template>
<script>
import ElBasicFormPlain from './basic-form-plain.vue';
import ElBasicFormSections from './basic-form-sections.vue';

export default {
  name: 'ElBasicForm',
  components: { ElBasicFormPlain, ElBasicFormSections },
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
    },
    sections: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    innerComponent() {
      return this.sections ? 'ElBasicFormSections' : 'ElBasicFormPlain';
    },
    passThroughProps() {
      const props = { ...this.$props };
      delete props.sections;
      return props;
    }
  }
};
</script>
