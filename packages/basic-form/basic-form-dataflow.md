# packages/basic-form 数据流向逻辑图

## 一、组件层结构

- `index.js`
  - 默认导出：`ElBasicForm`（`basic-form.vue`）
  - 具名导出：`ElBasicFormSections`（`basic-form-sections.vue`）
- `basic-form-sections.vue`
  - 包装 `ElBasicForm`，固定传入属性 `sections=true`

## 二、数据输入与模型流向

- 外部调用方传入
  - `model`（可选）
  - `schemas`
  - `rules`
  - `fieldMapToTime`
  - `baseColProps`
  - `mergeDynamicData` 等
- 在 `basic-form.vue` 中：
  - `props`
    - `model`, `rules`, `schemas`, `fieldMapToTime`
    - `baseColProps`, `mergeDynamicData`
    - `sections`, `autoSetPlaceHolder` 等
  - `data`
    - `internalModel`：本地表单数据
    - `internalSchemas`：本地 schema 列表
    - `formRules`：当前校验规则
- `formModel` 计算逻辑
  - `formModel = model || internalModel`

## 三、schemas 流向

- 外部传入 `schemas`
  - 进入 `basic-form-runtime.js` 的 `watch.schemas`
  - 根据 `this.sections` 决定源数据：
    - `sections === true` → `normalizeSchemasWithSections(val)`
    - `sections === false` → 直接使用 `val`
  - 为每个 `schemaItem` 计算初始 `defaultValue`
  - 若未提供外部 `model`：
    - 将 `defaultValue` 写入 `internalModel`
    - 删除 `internalModel` 中已不存在的字段
- `effectiveSchemas`（computed）
  - 源数据 `base = internalSchemas || props.schemas`
  - 在 `sections === true` 时：
    - `src = normalizeSchemasWithSections(base)`
  - 否则：
    - `src = base`
  - 对 `src` 进行过滤：
    - 按 `show` / `ifShow` 过滤可见项
  - 为每个 `schemaItem` 合并列属性：
    - `colProps = { ...baseColProps, ...schemaItem.colProps }`
    - 在 `sections` 模式下注入列 `paddingLeft` / `paddingRight`

## 四、sections 模式下的分组扁平化

- 文件：`normalize-schemas-with-sections.js`
- 输入：树形 `schemas`（含 `sections`）
- 递归遍历 `walk(items, parentCtx)`：
  - 遇到包含 `sections` 的节点：
    - 计算 `interfaceColor`、`rowColor`、`sectionsStyle`
    - 构造新的上下文 `sectionCtx`
    - 若有 `sectionsTitle`：生成 `component: 'Divider'` 的 schema
    - 递归处理子 `sections`
  - 遇到普通字段节点：
    - 继承 `colProps`、`labelWidth`、`required`
    - 合并父级 `sectionsStyle` 到 `colProps.style`
    - 使用 `rowColor` 写入 `backgroundColor`
    - 推入 `result`，最终得到扁平 schema 列表

## 五、渲染流向

- `basic-form.vue` 模板
  - `el-form`
    - `:model="formModel"`
    - `:rules="formRules"`
  - `el-row`
    - `:style="computedRowStyle"`（在 `sections` 模式下加左右负边距）
  - `v-for="schema in effectiveSchemas"`
    - 渲染 `ElBasicFormItem`
      - 接收：`schema`
      - 接收：`formModel` 引用
      - 接收：全局配置（占位符、clearable、rulesMessageJoinLabel 等）
  - `BasicFormAction`
    - 接收按钮配置与回调
    - 触发 `submit` / `reset` / `toggleAdvanced`
- `basic-form-item.vue`
  - 根据 `schema` 决定渲染分支：
    - 有 `renderColContent` / `colSlot` → 自定义列内容
    - `component === 'Divider'` → 渲染 `el-divider`
    - 否则 → 普通字段
  - 普通字段分支：
    - 外层：`el-col`（使用 `schema.colProps`）
    - 内层：`el-form-item`，属性来自 `itemProps`
    - 表单组件：
      - `<component :is="componentTag(schema.component)" v-model="formModel[schema.field]" />`
      - `finalComponentProps` 传入组件 props
      - 事件通过 `finalListeners(schema)` 绑定

## 六、提交与重置数据流

- 提交 `submit`
  - 触发路径：
    - `BasicFormAction` 调用 `on-submit` → `basic-form.vue.submit`
  - 在 `basic-form-runtime.js` 中：
    - 若存在 `submitFunc`：
      - 先执行 `submitFunc`，再执行内部提交
    - 对当前 `formModel`：
      - 通过 `mapFieldToTime` 处理区间字段
      - 通过 `mergePayload` 合并 `mergeDynamicData`
    - 最终：`$emit('submit', payload)`
- 重置 `reset`
  - 触发路径：
    - `BasicFormAction` 调用 `on-reset` → `basic-form.vue.reset`
  - 在 `basic-form-runtime.js` 中：
    - 调用 `el-form.resetFields()` 重置校验与值
    - 根据 `schemas` 或 `normalizeSchemasWithSections(schemas)`：
      - 重新计算每个字段的 `defaultValue`
      - 覆盖 `internalModel`
    - 最终：
      - 通过 `mapFieldToTime` 和 `mergePayload` 处理当前表单值
      - `$emit('reset', mergedPayload)`

