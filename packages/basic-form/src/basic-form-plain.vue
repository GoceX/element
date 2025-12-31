<template>
  <!--
    普通模式表单：
    - 逐条渲染 effectiveSchemas（一维数组）
    - 表单能力来自 basic-form-view/basic-form-runtime 两个 mixin
    - 回车提交由 handleEnterSubmit 统一拦截
  -->
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
    <!--
      行容器：
      - gutter 控制列间距
      - baseRowStyle 允许外部覆盖整行样式
      - labelAlign 用于生成 label 对齐的 class
    -->
    <el-row :gutter="14" :style="baseRowStyle" :class="`el-basic-form__label-${labelAlign}`">
      <!--
        表单项渲染：
        - schema 驱动组件类型/校验/联动
        - 全局开关（placeholder/clearable/rulesMessageJoinLabel）以 global 前缀传入
      -->
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
      <!--
        操作区：
        - 提交/重置/高级展开/自定义按钮
        - 具体行为由 runtime mixin 的 submit/reset/toggleAdvanced 提供
      -->
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
        <template slot="action"><slot name="action" ></slot></template>
      </BasicFormAction>
    </el-row>
  </el-form>
</template>
<script>
import basicFormView from './mixins/basic-form-view';
import basicFormRuntime from './mixins/basic-form-runtime';

export default {
  // 普通模式：schemas 为一维数组
  name: 'ElBasicFormPlain',
  // 复用视图层能力 + 普通模式运行时
  mixins: [basicFormView, basicFormRuntime]
};
</script>
