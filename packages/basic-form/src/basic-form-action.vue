<template>
  <!--
    操作区容器：统一承载提交/重置/高级展开/自定义按钮
    - actionColOptions 直接透传给 el-col
    - 回调通过 onSubmit/onReset/onToggleAdvanced 由父级运行时提供
  -->
  <el-col v-bind="actionColOptions" class="el-form-item__action">
    <!-- 提交按钮：可通过 showSubmitButton 控制显隐，并透传按钮属性 -->
    <el-button v-if="showSubmitButton" v-bind="submitButtonOptions" @click="handleSubmit">{{ submitButtonText }}</el-button>
    <!-- 重置按钮：可通过 showResetButton 控制显隐，并透传按钮属性 -->
    <el-button v-if="showResetButton" v-bind="resetButtonOptions" @click="handleReset">{{ resetButtonText }}</el-button>
    <!-- 自定义按钮组：由 schema 外部传入 actionButton 数组驱动渲染 -->
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
    <!-- 高级展开/收起按钮：仅做状态切换，具体收起逻辑由运行时 effectiveSchemas 控制 -->
    <el-button v-if="showAdvancedButton" type="text" @click="handleToggle">{{ advancedOpen ? '收起' : '展开' }}</el-button>
    <!-- 额外动作插槽：供业务侧插入自定义内容 -->
    <slot name="action"></slot>
  </el-col>
</template>
<script>
export default {
  name: 'ElBasicFormAction',
  props: {
    // 操作区 el-col 的布局属性，如 { span: 24, offset: 0 }
    actionColOptions: Object,
    // 是否展示高级展开按钮
    showAdvancedButton: Boolean,
    // 当前是否处于展开状态
    advancedOpen: Boolean,
    // 是否展示提交按钮
    showSubmitButton: Boolean,
    // 是否展示重置按钮
    showResetButton: Boolean,
    // 透传给提交按钮（el-button）的属性
    submitButtonOptions: Object,
    // 透传给重置按钮（el-button）的属性
    resetButtonOptions: Object,
    // 提交按钮文本
    submitButtonText: String,
    // 重置按钮文本
    resetButtonText: String,
    // 自定义按钮配置数组（每项可包含 el-button props + click 回调）
    actionButton: [Array, null],
    // 表格方法集上下文（透传给自定义按钮 click）
    tableAction: Object,
    // 提交回调（由父组件运行时提供）
    onSubmit: Function,
    // 重置回调（由父组件运行时提供）
    onReset: Function,
    // 展开/收起回调（由父组件运行时提供）
    onToggleAdvanced: Function
  },
  methods: {
    // 触发提交
    handleSubmit() { if (typeof this.onSubmit === 'function') this.onSubmit(); },
    // 触发重置
    handleReset() { if (typeof this.onReset === 'function') this.onReset(); },
    // 切换高级展开状态
    handleToggle() { if (typeof this.onToggleAdvanced === 'function') this.onToggleAdvanced(); }
  }
};
</script>
