<template>
  <!--
    外层包装组件：
    - 通过 sections 切换 plain / sections 两种渲染模式
    - 其余 props 原样透传给内部组件
    - 事件透传使用 v-on="$listeners" 保持兼容
  -->
  <component :is="innerComponent" v-bind="passThroughProps" v-on="$listeners">
    <slot ></slot>
  </component>
</template>
<script>
import ElBasicFormPlain from './basic-form-plain.vue';
import ElBasicFormSections from './basic-form-sections.vue';
import { basicFormViewProps } from './mixins/basic-form-view';

export default {
  name: 'ElBasicForm',
  components: { ElBasicFormPlain, ElBasicFormSections },
  props: {
    // 复用视图层 props（与 plain/sections 内部组件保持一致）
    ...basicFormViewProps,
    // 运行模式开关：true 使用分组模式（sections），false 使用普通模式（plain）
    sections: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    /**
     * 根据 sections 开关选择内部实际渲染的组件。
     * @returns {string}
     */
    innerComponent() {
      return this.sections ? 'ElBasicFormSections' : 'ElBasicFormPlain';
    },
    /**
     * 透传给内部组件的 props：移除仅外层使用的 sections。
     * @returns {Object}
     */
    passThroughProps() {
      const props = { ...this.$props };
      delete props.sections;
      return props;
    }
  }
};
</script>
