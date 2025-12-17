<template>
  <!--
    整体表单容器：复用 basic-form-view/basic-form-runtime-sections 提供的表单能力
    - formModel / formRules 由 mixin 维护
    - label-position / label-width / size / disabled 均透传外部 props
    - 回车提交行为由 handleEnterSubmit 统一处理
  -->
  <el-form ref="formRef" :class="['el-basic-form']" :model="formModel" :rules="formRules"
    :label-position="labelAlign || labelPosition" :label-width="normalizedLabelWidth" :inline="inline" :size="size"
    :disabled="disabled" @keydown.native.enter.prevent="handleEnterSubmit">

    <!--
      外层行容器：
      - 统一设置 gutter 与 label 对齐样式
      - computedRowStyle 控制整行左右负 margin，以抵消内部 col 的 padding
    -->
    <el-row :gutter="28" :style="computedRowStyle" :class="`el-basic-form__label-${labelAlign}`">
      <!--
        遍历 effectiveSchemas：
        - 若 schema 内包含 sections，则视为“分组模式”
        - 否则视为“普通字段”，直接交给 ElBasicFormItem 渲染
      -->
      <template v-for="(schema, idx) in effectiveSchemas">
        <!--
          分组模式：schema.sections 存在且非空
          - 占满一整行(span=24)
          - 可选显示分组标题 sectionsTitle
          - schema.sectionsStyle 控制分组整体背景/圆角等样式
        -->
        <el-col v-if="schema && schema.sections && schema.sections.length" :span="24"
          :key="groupKey(schema, idx)">
          <RenderVNode v-if="typeof schema.sectionsTitle === 'function'" :render-fn="schema.sectionsTitle" />
          <el-divider v-else-if="schema.sectionsTitle" content-position="left">
            <template>{{ schema.sectionsTitle }}</template>
          </el-divider>
          <el-row :gutter="28" :style="{ ...(schema.sectionsStyle || {}), marginLeft: '0px', marginRight: '0px' }"
            :class="`el-basic-form__label-${labelAlign}`">
            <!--
              遍历分组内部的 section：
              - 若 section 仍然包含 sections，则视为“嵌套分组”（如 A/B/C 区）
              - 否则视为分组内的普通字段
            -->
            <template v-for="(section, sIdx) in schema.sections">
              <!--
                嵌套分组（如 A/B/C 区）：
                - 再次占满一整行(span=24)
                - section.sectionsStyle 控制该块的背景/圆角
              -->
              <el-col v-if="section && section.sections && section.sections.length" :span="24"
                :key="groupKey(section, sIdx)" :style="section.sectionsStyle">
                <el-divider v-if="section.sectionsTitle" content-position="left">
                  <RenderVNode v-if="typeof section.sectionsTitle === 'function'" :render-fn="section.sectionsTitle" />
                  <template v-else>{{ section.sectionsTitle }}</template>
                </el-divider>
                <!--
                  若 section.sections 为二维数组：[[field1, field2], [field3, field4]]
                  - 第一层为“行”
                  - 每个行数组内部为多个字段 schema
                -->
                <template v-if="isMatrixSections(section.sections)">
                  <el-row v-for="(row, rowIdx) in section.sections" :key="rowIdx" :gutter="28" :style="section.rowStyle">
                    <!--
                      每个 sub 视为一个完整的表单项 schema：
                      - buildSectionItemSchema 负责合并 labelWidth/required/colProps 等继承属性
                      - 实际渲染完全复用 ElBasicFormItem 的能力
                    -->
                    <ElBasicFormItem v-for="(sub, subIdx) in row"
                      :key="sub && sub.field ? sub.field : subIdx"
                      :schema="buildSectionItemSchema(sub, section, schema)" :form-model="formModel"
                      :global-auto-set-place-holder="computedAutoSetPlaceHolder"
                      :global-auto-set-clearable="computedAutoSetClearable"
                      :global-rules-message-join-label="computedRulesMessageJoinLabel" :global-size="size"
                      :global-disabled="disabled" :table-action="tableAction"
                      :form-action-type="computedFormActionType" />
                  </el-row>
                </template>
                <!--
                  若 section.sections 为一维数组：[field1, field2, ...]
                  - 直接将每个 sub 作为一列 ElBasicFormItem 渲染
                -->
                <template v-else>
                  <ElBasicFormItem v-for="(sub, subIdx) in section.sections"
                    :key="sub && sub.field ? sub.field : subIdx"
                    :schema="buildSectionItemSchema(sub, section, schema)" :form-model="formModel"
                    :global-auto-set-place-holder="computedAutoSetPlaceHolder"
                    :global-auto-set-clearable="computedAutoSetClearable"
                    :global-rules-message-join-label="computedRulesMessageJoinLabel" :global-size="size"
                    :global-disabled="disabled" :table-action="tableAction"
                    :form-action-type="computedFormActionType" />
                </template>
              </el-col>
              <!--
                分组内的普通字段：无嵌套 sections
                - 通过 buildSectionItemSchema 从分组/根 schema 继承属性
                - 然后复用 ElBasicFormItem 渲染
              -->
              <ElBasicFormItem v-else :key="section && section.field ? section.field : sIdx"
                :schema="buildSectionItemSchema(section, null, schema)" :form-model="formModel"
                :global-auto-set-place-holder="computedAutoSetPlaceHolder"
                :global-auto-set-clearable="computedAutoSetClearable"
                :global-rules-message-join-label="computedRulesMessageJoinLabel" :global-size="size"
                :global-disabled="disabled" :table-action="tableAction"
                :form-action-type="computedFormActionType" />
            </template>
          </el-row>
        </el-col>

        <!--
          非分组模式：schema 直接是一个字段配置
          - 完全复用 ElBasicFormItem 的渲染逻辑
        -->
        <ElBasicFormItem v-else :key="schema && schema.field ? schema.field : idx" :schema="schema"
          :form-model="formModel" :global-auto-set-place-holder="computedAutoSetPlaceHolder"
          :global-auto-set-clearable="computedAutoSetClearable"
          :global-rules-message-join-label="computedRulesMessageJoinLabel" :global-size="size"
          :global-disabled="disabled" :table-action="tableAction"
          :form-action-type="computedFormActionType" />
      </template>

      <!--
        表单操作区域：复用 BasicFormAction
        - 包含提交/重置/高级展开按钮
        - 所有配置项均来自 basic-form-runtime-sections 的计算属性
      -->
      <BasicFormAction v-if="showActionButtonGroup" :action-col-options="computedActionColOptions"
        :show-submit-button="computedShowSubmitButton" :show-reset-button="computedShowResetButton"
        :submit-button-options="computedSubmitButtonOptions" :reset-button-options="computedResetButtonOptions"
        :submit-button-text="computedSubmitButtonText" :reset-button-text="computedResetButtonText"
        :action-button="computedActionCustomButtons" :show-advanced-button="computedShowAdvancedButton"
        :advanced-open="advancedOpen" :table-action="tableAction" :on-submit="submit" :on-reset="reset"
        :on-toggle-advanced="toggleAdvanced">
        <template slot="action">
          <slot name="action" />
        </template>
      </BasicFormAction>
    </el-row>
  </el-form>
</template>
<script>
// 引入基础表单视图能力：提供 ElBasicFormItem / BasicFormAction 组件以及公共 props
import basicFormView from './mixins/basic-form-view';
import RenderVNode from './components/render-vnode';
// 引入带 sections 能力的运行时逻辑：包含 effectiveSchemas、字段初始化、提交/重置等行为
import basicFormRuntimeSections from './mixins/basic-form-runtime-sections';

export default {
  // 组件名称：供调试与全局注册使用
  name: 'ElBasicFormSections',
  components: { RenderVNode },
  // 复用 basicFormView + basicFormRuntimeSections 提供的完整表单能力
  mixins: [basicFormView, basicFormRuntimeSections],
  data() {
    return {
      // 标记当前表单处于“分组模式”，供外层 ElBasicForm 判断切换
      sections: true
    };
  },
  computed: {
    /**
     * 计算整行样式：
     * - 在 baseRowStyle 基础上，叠加左右负 margin，用于抵消内部列 padding
     * - 保证整体看起来左右对齐
     */
    computedRowStyle() {
      const base = this.baseRowStyle || {};
      // const fix = { marginLeft: '-7px', marginRight: '-7px' };
      const fix = { };
      return { ...fix, ...base };
    }
  },
  methods: {
    groupKey(item, fallbackIndex) {
      const title = item && item.sectionsTitle;
      if (typeof title === 'string' || typeof title === 'number') return title;
      const field = item && item.field;
      if (typeof field === 'string' || typeof field === 'number') return field;
      return fallbackIndex;
    },
    /**
     * 判断 section.sections 是否为“矩阵结构”（二维数组）：
     * - true 代表第一层为行，行内仍是字段数组
     * - false 则视为普通一维字段数组
     *
     * @param {Array} list 原始 sections 数组
     * @returns {boolean} 是否为二维数组
     */
    isMatrixSections(list) {
      return Array.isArray(list) && list.length && Array.isArray(list[0]);
    },
    /**
     * 构造一个适用于 ElBasicFormItem 的 schema：
     * - 在字段自身配置基础上，继承 section 级与根 schema 级的通用属性
     * - 当前合并的属性：labelWidth / required / colProps
     *
     * 合并优先级：字段自身 > section 级 > 根 schema 级
     *
     * @param {Object} fieldSchema 当前字段级配置（最底层）
     * @param {Object|null} sectionSchema 当前所在 section（可空）
     * @param {Object|null} rootSchema 顶层分组 schema（可空）
     * @returns {Object} 合并后的 schema，交由 ElBasicFormItem 渲染
     */
    buildSectionItemSchema(fieldSchema, sectionSchema, rootSchema) {
      const field = fieldSchema || {};
      const section = sectionSchema || {};
      const root = rootSchema || {};
      const merged = { ...field };
      if (merged.render == null && typeof merged.component === 'function') {
        const componentFn = merged.component;
        merged.render = (ctx) => {
          const h = ctx && ctx.h;
          try {
            return componentFn.length ? componentFn(h) : componentFn();
          } catch (err) {
            console.error('[ElBasicFormSections] component render error:', err);
            return null;
          }
        };
      }
      if (merged.labelStyle == null) {
        if (section.labelStyle != null) merged.labelStyle = section.labelStyle;
        else if (root.labelStyle != null) merged.labelStyle = root.labelStyle;
      }
      // 继承 labelWidth：字段 > section > 根
      if (merged.labelWidth == null) {
        if (section.labelWidth != null) merged.labelWidth = section.labelWidth;
        else if (root.labelWidth != null) merged.labelWidth = root.labelWidth;
      }
      // 继承 required：字段 > section > 根
      if (merged.required == null) {
        if (section.required != null) merged.required = section.required;
        else if (root.required != null) merged.required = root.required;
      }
      // 继承列布局 colProps：字段 > section > 根
      // if (!merged.colProps) {
      //   if (section.colProps) merged.colProps = section.colProps;
      //   else if (root.colProps) merged.colProps = root.colProps;
      // }
      /*
       * colProps 合并策略（优先级：字段自身 > section > 根 schema）：
       * 1. 分别取出 root、section、field 三级的 colProps，确保为对象类型，否则置为 null
       * 2. 用对象展开做浅合并，后出现的属性会覆盖前面的，实现优先级
       * 3. 对 colProps 内部的 style 子对象同样做三级合并，保证行内样式也能按优先级叠加
       * 4. 只有最终合并结果非空时，才把 nextColProps 挂到 merged 上，避免污染字段原始配置
       */
      {
        // 取出三级的 colProps，非对象类型一律视为无效
        const rootColProps = (root && root.colProps && typeof root.colProps === 'object') ? root.colProps : null;
        const sectionColProps = (section && section.colProps && typeof section.colProps === 'object') ? section.colProps : null;
        const fieldColProps = (merged && merged.colProps && typeof merged.colProps === 'object') ? merged.colProps : null;

        // 按优先级浅合并：root -> section -> field，后者覆盖前者同名属性
        const nextColProps = { ...(rootColProps || {}), ...(sectionColProps || {}), ...(fieldColProps || {}) };

        // 同样逻辑处理 colProps.style，保证样式也能继承和覆盖
        const rootStyle = rootColProps && rootColProps.style && typeof rootColProps.style === 'object' ? rootColProps.style : null;
        const sectionStyle = sectionColProps && sectionColProps.style && typeof sectionColProps.style === 'object'
          ? sectionColProps.style
          : null;
        const fieldStyle = fieldColProps && fieldColProps.style && typeof fieldColProps.style === 'object' ? fieldColProps.style : null;
        const nextStyle = { ...(rootStyle || {}), ...(sectionStyle || {}), ...(fieldStyle || {}) };

        // 只有存在行内样式属性时才挂到 nextColProps，避免产生空 style 对象
        if (Object.keys(nextStyle).length) nextColProps.style = nextStyle;

        // 只有合并后的 colProps 有实际内容才写入字段，防止空对象污染
        if (Object.keys(nextColProps).length) merged.colProps = nextColProps;
      }
      return merged;
    }
  }
};
</script>
