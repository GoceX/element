<template>
  <el-col v-bind="actionColOptions" class="el-form-item__action">
    <el-button v-if="showSubmitButton" v-bind="submitButtonOptions" @click="handleSubmit">{{ submitButtonText }}</el-button>
    <el-button v-if="showResetButton" v-bind="resetButtonOptions" @click="handleReset">{{ resetButtonText }}</el-button>
    <template v-if="actionButton && actionButton.length">
      <el-button
        v-for="(customButton, idx) in actionButton"
        :key="customButton && (customButton.key || customButton.text || idx)"
        v-bind="customButton"
        @click="customButton.click({tableAction})"
      >
        {{ customButton.text }}
      </el-button>
    </template>
    <el-button v-if="showAdvancedButton" type="text" @click="handleToggle">{{ advancedOpen ? '收起' : '展开' }}</el-button>
    <slot name="action"></slot>
  </el-col>
</template>
<script>
export default {
  name: 'ElBasicFormAction',
  props: {
    actionColOptions: Object,
    showAdvancedButton: Boolean,
    advancedOpen: Boolean,
    showSubmitButton: Boolean,
    showResetButton: Boolean,
    submitButtonOptions: Object,
    resetButtonOptions: Object,
    submitButtonText: String,
    resetButtonText: String,
    actionButton: [Array, null],
    tableAction: Object,
    onSubmit: Function,
    onReset: Function,
    onToggleAdvanced: Function
  },
  methods: {
    handleSubmit() { if (typeof this.onSubmit === 'function') this.onSubmit(); },
    handleReset() { if (typeof this.onReset === 'function') this.onReset(); },
    handleToggle() { if (typeof this.onToggleAdvanced === 'function') this.onToggleAdvanced(); }
  }
};
</script>

