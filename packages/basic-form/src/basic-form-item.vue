<template>
  <!-- 列内容插槽：若提供 renderColContent/colSlot，则在列级别渲染自定义内容 -->
  <el-col v-if="schema && (schema.renderColContent || schema.colSlot)" v-bind="schema.colProps || { span: 24 }">
    <RenderVNode v-if="schema.renderColContent" :render-fn="() => schema.renderColContent(itemCtx)" />
    <slot v-else :name="schema.colSlot" v-bind="itemCtx" />
  </el-col>
  <!-- 分割线组件：占满一行，并在标签右侧显示可选的帮助信息 -->
  <el-col v-else-if="schema && schema.component === 'Divider'" v-bind="schema.colProps || { span: 24 }">
    <el-divider>
      {{ schema.label }}
      <span v-if="helpMessageText" style="margin-left:8px;color:#909399;">{{ helpMessageText }}</span>
    </el-divider>
  </el-col>
  <!-- 常规表单项：统一包裹在 el-col 中，默认 span:24 -->
  <el-col v-else v-bind="(schema && schema.colProps) ? schema.colProps : { span: 24 }">
    <!-- 表单项容器：根据 itemProps 驱动标签、校验、宽度等配置 -->
    <el-form-item v-bind="itemProps">
      <!-- 自定义标签：支持主标签与副标签 -->
      <template v-if="schema.subLabel" slot="label">
        <span>{{ schema.label }}</span>
        <span style="margin-left:8px;color:#909399;">{{ schema.subLabel }}</span>
      </template>
      <!-- 优先：解析具名插槽对应的渲染函数，使用 RenderVNode 渲染 -->
      <RenderVNode v-if="schema.slot && resolveSlotRender(schema)" :render-fn="resolveSlotRender(schema)" />
      <!-- 其次：直接渲染具名插槽，透传 model 与 field -->
      <slot v-else-if="schema.slot" :name="schema.slot" :model="formModel" :field="schema.field" />
      <!-- 其三：使用 schema.render(h,ctx) 渲染自定义内容 -->
      <RenderVNode v-else-if="schema.render" :render-fn="(h) => schema.render(itemCtx)" />
      <!-- 默认：按 componentTag 生成具体组件，v-model 双向绑定到 formModel[field] -->
      <component v-else :is="componentTag(schema.component)" v-model="formModel[schema.field]" v-bind="finalComponentProps"
        :disabled="computeDisabled(schema)" v-on="finalListeners(schema)">
        <!-- 组件内部插槽：根据 options/自定义生成 default/suffix 等插槽 -->
        <template v-for="(slotRender, slotName) in renderComponentContent(schema)" v-slot:[slotName]>
          <RenderVNode v-if="typeof slotRender === 'function'" :render-fn="(h) => slotRender(itemCtx)" />
          <span v-else>{{ slotRender }}</span>
        </template>
      </component>
      <!-- 帮助信息提示：展示在表单项底部，可配置样式 -->
      <div v-if="helpMessageText" class="el-form-item__extra" :style="helpStyle">{{ helpMessageText }}</div>
    </el-form-item>
  </el-col>
  <!-- 说明：以上渲染分支顺序保证了最大灵活性：列级插槽 > Divider > 常规组件 -->
</template>
<script>
import RenderVNode from './components/render-vnode';
import BasicFormItemMixin from './mixins/basic-form-item';

export default {
  name: 'ElBasicFormItem',
  components: { RenderVNode },
  mixins: [BasicFormItemMixin],
  props: {
    // 单个表单项的配置 Schema
    schema: Object,
    // 来自父表单的响应式模型对象
    formModel: Object,
    // 是否为常见输入组件自动设置 placeholder
    globalAutoSetPlaceHolder: Boolean,
    // 规则消息是否拼接标签文本
    globalRulesMessageJoinLabel: Boolean,
    // 统一的组件尺寸
    globalSize: String,
    // 统一的禁用态（优先生效）
    globalDisabled: Boolean,
    // 自动设置支持组件的 clearable
    globalAutoSetClearable: Boolean,
    tableAction: Object,
    formActionType: Object
  },
  computed: {
    /**
     * 生成 `el-form-item` 的属性对象
     * - 动态 required/rules 计算
     * - labelWidth 统一格式
     * @returns {Object} - 符合 ElementUI `el-form-item` 的 props
     */
    itemProps() {
      const schema = this.schema || {};
      const required = this.evalMaybeFn(schema.required);
      const rulesSource = Array.isArray(schema.dynamicRules)
        ? schema.dynamicRules
        : (typeof schema.dynamicRules === 'function' ? schema.dynamicRules(this.itemCtx) : (schema.rules || []));
      const joinLabel = this.globalRulesMessageJoinLabel || !!schema.rulesMessageJoinLabel;
      const label = schema.label || '';
      const rules = joinLabel
        ? (rulesSource || []).map(rule => ({ ...rule, message: rule && rule.message ? `${label}${rule.message}` : rule.message }))
        : (rulesSource || []);
      const elFormItemProps = {
        label: schema.label,
        prop: schema.field,
        rules,
        labelWidth: schema.disabledLabelWidth ? null : this.normalizeItemLabelWidth(schema.labelWidth),
        required,
        inlineMessage: schema.inlineMessage,
        showMessage: schema.showMessage,
        size: schema.size,
        error: schema.error,
        validateStatus: schema.validateStatus,
        for: (() => {
          const component = schema.component;
          const isRange = component === 'RangePicker' || (component === 'DatePicker' && ((schema.componentProps && ['daterange', 'datetimerange'].includes(schema.componentProps.type))));
          return isRange ? null : (schema.for || schema.field);
        })()
      };
      if (schema.itemProps && typeof schema.itemProps === 'object') Object.assign(elFormItemProps, schema.itemProps);
      return elFormItemProps;
    },
    /**
     * 合并出最终传入组件的 props，并清理事件键（事件通过 `v-on` 绑定）
     * @returns {Object}
     */
    finalComponentProps() {
      const schema = this.schema || {};
      const mergedProps = this.getComponentPropsMerged(schema);
      const extractedListeners = this.extractEventListeners(mergedProps);
      Object.keys(extractedListeners).forEach((listenerKey) => { if (listenerKey in mergedProps) delete mergedProps[listenerKey]; });
      return mergedProps;
    },
    /**
     * 规范化帮助信息文本
     * @returns {string}
     */
    helpMessageText() {
      const schema = this.schema || {};
      const helpMessage = schema.helpMessage;
      if (!helpMessage) return '';
      if (Array.isArray(helpMessage)) return helpMessage.join(' ');
      return String(helpMessage);
    },
    /**
     * 帮助信息样式生成
     * @returns {Object}
     */
    helpStyle() {
      const helpComponentProps = (this.schema && this.schema.helpComponentProps) || {};
      const style = {};
      if (helpComponentProps.maxWidth) style.maxWidth = helpComponentProps.maxWidth;
      if (helpComponentProps.color) style.color = helpComponentProps.color;
      if (helpComponentProps.fontSize) style.fontSize = helpComponentProps.fontSize;
      return style;
    },
    /**
     * 提供给 `render/slot` 的上下文对象
     * @returns {{ model: Object, field: string, schema: Object, h: Function }}
     */
    itemCtx() {
      const schema = this.schema || {};
      return { model: this.formModel, field: schema.field, schema: schema, h: this.$createElement };
    }
  },
  methods: {}
};
</script>
