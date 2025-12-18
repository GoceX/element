# packages/basic-form 数据流向逻辑图

## 一、组件层结构

- `index.js`
  - 默认导出：`ElBasicForm`（`src/basic-form.vue`）
- `src/basic-form.vue`
  - 外层包装组件：根据 `sections` 选择渲染 `ElBasicFormPlain` 或 `ElBasicFormSections`
- `src/basic-form-plain.vue`
  - 普通模式（非分组）：循环渲染 `effectiveSchemas`，逐项交由 `ElBasicFormItem` 渲染
- `src/basic-form-sections.vue`
  - 分组模式（sections）：模板负责渲染 `schemas` 的树形/矩阵结构，并在叶子节点复用 `ElBasicFormItem`

## 二、数据输入与模型流向

- 外部调用方传入
  - `model`（可选）
  - `schemas`
  - `rules`
  - `fieldMapToTime`
  - `baseColProps`
  - `mergeDynamicData` 等
- 在 `src/mixins/basic-form-view.js` 中：
  - `props`：统一定义表单对外 props（`basicFormViewProps`）
  - `data`
    - `internalModel`：未传 `model` 时使用的本地表单数据
    - `internalSchemas`：运行时可变的 schema 列表（用于动态增删改）
    - `formRules`：当前校验规则（由 `rules` watch 同步）
    - `advancedOpen`：高级项展开状态
  - `computed.formModel`
    - `formModel = model || internalModel`

## 三、schemas 流向

- 外部传入 `schemas`
  - 进入 `src/mixins/basic-form-runtime-factory.js` 的 `watch.schemas`
  - 通过运行时策略 `flattenSchemas(schemas)` 抽取“字段 schema”列表并生成初始值映射
    - 普通模式：`flattenSchemas` 为“直接返回数组（并做 Array 保护）”
    - sections 模式：`flattenSchemas` 为 `flattenSchemasWithSections(schemas)`
  - 若未提供外部 `model`：
    - 用 `$set/$delete` 将初始值映射增量同步到 `internalModel`

- `effectiveSchemas`（computed）
  - 源数据 `base = internalSchemas（优先） || props.schemas`
  - 通过运行时策略 `normalizeSchemas(base)` 得到“渲染用 schema 列表”
    - 普通模式：`normalizeSchemas` 为“直接返回数组（并做 Array 保护）”
    - sections 模式：`normalizeSchemas` 为 `normalizeSchemasWithSections(base)`（当前实现仅做 Array 保护并原样返回）
  - 对渲染用 schema 进行统一处理
    - 执行 `show/ifShow`（支持函数与布尔）过滤
    - 合并 `colProps = { ...baseColProps, ...schemaItem.colProps }`
    - 归一化 `disabled`（schema.disabled 优先，否则读取 `componentProps.disabled`）
    - 若开启高级收起：截取前 `max(alwaysShowLines, autoAdvancedLine)` 项

## 四、sections 模式下的“字段抽取”

- 文件：`normalize-schemas-with-sections.js`
- 输入：树形 `schemas`（含 `sections`）
- `normalizeSchemasWithSections(src)`
  - 仅做最小类型保护：`src` 非数组时返回 `[]`；当前版本不改动结构
- `flattenSchemasWithSections(src)`
  - 用显式 `stack` 迭代遍历（支持 `sections`、支持二维数组矩阵结构）
  - 仅抽取叶子节点（必须有 `field`）
  - 按 `field` 去重，返回“字段 schema”扁平列表（供初始化与重置使用）

## 五、渲染流向

- `src/basic-form.vue`
  - 根据 `sections` 选择内层组件
    - `sections=false` → `src/basic-form-plain.vue`
    - `sections=true` → `src/basic-form-sections.vue`

- `src/basic-form-plain.vue`
  - `el-form :model="formModel" :rules="formRules"`
  - `v-for="schema in effectiveSchemas"` → `ElBasicFormItem`
  - `BasicFormAction` 触发 `submit/reset/toggleAdvanced`

- `src/basic-form-sections.vue`
  - 顶层循环 `effectiveSchemas`
    - 若 `schema.sections` 存在：按“分组节点”渲染 `el-divider + el-row`，递归展开子 sections（模板层级展开）
    - 否则：按“字段节点”交由 `ElBasicFormItem` 渲染
  - 对叶子字段节点：通过 `buildSectionItemSchema` 合并/继承 `labelWidth/required/colProps/labelStyle` 后再交给 `ElBasicFormItem`

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
    - `BasicFormAction` → `submit()`（由 `basic-form-runtime-factory.js` 提供）
  - 处理逻辑（运行时统一）：
    - 若存在 `submitFunc`：先执行（支持 Promise），成功后继续
    - 否则：先 `el-form.validate` 校验
    - 生成 `payload = mergePayload(mapFieldToTime(formModel))`
    - `$emit('submit', payload)`
- 重置 `reset`
  - 触发路径：
    - `BasicFormAction` → `reset()`（由 `basic-form-runtime-factory.js` 提供）
  - 处理逻辑（运行时统一）：
    - 若存在 `resetFunc`：先执行（支持 Promise），成功后继续
    - `el-form.resetFields()` 重置校验与值
    - 通过 `flattenSchemas(schemas)` 重新计算每个字段的默认值并覆盖 `internalModel`
    - `$emit('reset', mergePayload(mapFieldToTime(formModel)))`

## 七、代码依赖关系（简图）

- `packages/basic-form/index.js`
  - → `src/basic-form.vue`
    - → `src/basic-form-plain.vue`
      - → `src/mixins/basic-form-view.js`
      - → `src/mixins/basic-form-runtime.js`
        - → `src/mixins/basic-form-runtime-factory.js`
          - → `rowinself-ui/src/utils/date-util`
      - → `src/basic-form-item.vue` → `src/mixins/basic-form-item.js` → `src/mixins/basic-form-runtime-factory.js`
      - → `src/basic-form-action.vue`
    - → `src/basic-form-sections.vue`
      - → `src/mixins/basic-form-view.js`
      - → `src/mixins/basic-form-runtime-sections.js`
        - → `src/mixins/normalize-schemas-with-sections.js`
        - → `src/mixins/basic-form-runtime-factory.js`
      - → `src/components/render-vnode.js`

## 八、对外方法集（@register）

- `src/mixins/basic-form-view.js` 在 `mounted` 时触发 `$emit('register', api)`
- `api` 来源：优先使用运行时 `computedFormActionType`（由 `basic-form-runtime-factory.js` 统一生成）
