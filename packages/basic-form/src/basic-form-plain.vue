<template>
  <el-form
    ref="formRef"
    :class="['el-basic-form']"
    :model="formModel"
    :rules="formRules"
    :label-position="labelAlign || labelPosition"
    :label-width="normalizedLabelWidth"
    :inline="inline"
    :size="size"
    :disabled="disabled"
    @keydown.native.enter.prevent="handleEnterSubmit"
  >
    <el-row :gutter="14" :style="baseRowStyle" :class="`el-basic-form__label-${labelAlign}`">
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
        <template slot="action"><slot name="action" /></template>
      </BasicFormAction>
    </el-row>
  </el-form>
</template>
<script>
import basicFormView from './mixins/basic-form-view';
import basicFormRuntime from './mixins/basic-form-runtime';

export default {
  name: 'ElBasicFormPlain',
  mixins: [basicFormView, basicFormRuntime]
};
</script>
