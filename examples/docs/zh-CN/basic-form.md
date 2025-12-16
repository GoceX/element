## BasicForm 表单组件

基于本库 `ElForm/ElFormItem` 的轻封装，使用 `options` 配置方式，提供更便捷的动态渲染、显隐控制、禁用控制与统一的提交/重置操作。

 

### 快速开始

:::demo 使用 `schemas` 定义表单结构，支持常用组件与规则校验
```html
<el-basic-form :schemas="schemas" :labelWidth="120" labelAlign="between" @submit="handleSubmit"  />
<script>
  export default {
    data() {
      return {
        schemas: [
          {
            field: 'field',
            component: 'Input',
            label: '字段',
            defaultValue: '',
            componentProps: { placeholder: '请输入'},
            rules: [{ required: true, message: '必填', trigger: 'blur' }],
            colProps: { span: 12 }
          },
          {
            field: 'pwd',
            component: 'InputPassword',
            label: '密码',
            // required: true,
            componentProps: { placeholder: '请输入密码', showPassword: true },
            rules: [{ required: true, message: '必填', trigger: 'blur' }],
            colProps: { span: 12 }
          },
          {
            field: 'bio',
            component: 'InputTextArea',
            label: '简介',
            componentProps: { rows: 3, maxlength: 100, showWordLimit: true },
            colProps: { span: 24 }
          },
          {
            field: 'count',
            component: 'InputNumber',
            label: '数量',
            defaultValue: 1,
            componentProps: { min: 0, max: 100 },
            colProps: { span: 12 }
          },
          {
            field: 'agree',
            component: 'Checkbox',
            label: '同意协议',
            defaultValue: false,
            componentProps: { label: '同意' },
            colProps: { span: 12 }
          },
          {
            field: 'category',
            component: 'Select',
            label: '分类',
            componentProps: {
              placeholder: '请选择分类',
              options: [
                { label: 'A 类', value: 'A' },
                { label: 'B 类', value: 'B' }
              ]
            },
            colProps: { span: 12 }
          },
          {
            field: 'search',
            component: 'InputSearch',
            label: '搜索',
            componentProps: { placeholder: '请输入关键字' },
            colProps: { span: 12 }
          },
          {
            field: 'auto',
            component: 'InputAutoComplete',
            label: '自动完成',
            componentProps: {
              placeholder: '输入建议',
              fetchSuggestions: (q, cb) => cb([
                { value: 'Apple' },
                { value: 'Banana' },
                { value: 'Cherry' }
              ])
            },
            colProps: { span: 12 }
          },
          {
            field: 'color',
            component: 'el-color-picker',
            label: '颜色',
            defaultValue: '#409EFF',
            colProps: { span: 12 }
          },
          {
            field: 'region',
            component: 'el-cascader',
            label: '地区',
            colProps: { span: 12 },
            componentProps: {
              options: [
                {
                  value: 'zhejiang',
                  label: '浙江',
                  children: [
                    { value: 'hangzhou', label: '杭州' },
                    { value: 'ningbo', label: '宁波' }
                  ]
                },
                {
                  value: 'jiangsu',
                  label: '江苏',
                  children: [
                    { value: 'nanjing', label: '南京' },
                    { value: 'suzhou', label: '苏州' }
                  ]
                }
              ]
            }
          },
          {
            field: 'dateRange',
            component: 'RangePicker',
            label: '日期范围',
            componentProps: { },
            colProps: { span: 12 }
          },
          {
            field: 'gender',
            label: '性别',
            colProps: { span: 12 },
            render: ({ model, field, h }) => {
              return h('el-radio-group', {
                props: { value: model[field] },
                on: { input: (val) => (model[field] = val) }
              }, [
                h('el-radio', { props: { label: 'male' } }, '男'),
                h('el-radio', { props: { label: 'female' } }, '女')
              ]);
            },
            defaultValue: 'male'
          },
          {
            field: 'features',
            component: 'CheckboxButtonGroup',
            label: '特性',
            componentProps: {
              options: [
                { label: '快', value: 'fast' },
                { label: '准', value: 'accurate' },
                { label: '稳', value: 'stable' }
              ]
            },
            colProps: { span: 24 }
          },
          {
            field: 'level',
            component: 'RadioButtonGroup',
            label: '等级',
            componentProps: {
              options: [
                { label: '初级', value: 'low' },
                { label: '中级', value: 'mid' },
                { label: '高级', value: 'high' }
              ]
            },
            colProps: { span: 24 }
          },
          {
            field: 'files',
            label: '上传',
            render: ({ model, field, h }) => {
              return h('el-upload', {
                props: {
                  action: 'https://jsonplaceholder.typicode.com/posts/',
                  fileList: model[field] || [],
                  listType: 'text'
                },
                on: {
                  success: (response, file, fileList) => (model[field] = fileList),
                  remove: (file, fileList) => (model[field] = fileList)
                }
              }, [h('el-button', { props: { type: 'primary' } }, ['点击上传'])]);
            },
            defaultValue: []
          }
        ]
      };
    },
    methods: {
      handleSubmit(values) {
        console.log('提交: ', values);
      }
    }
  };
</script>
```
:::

### 分割线 Divider

:::demo 在 `schemas` 中添加 `component: 'Divider'` 渲染整行分割线
```html
<el-basic-form :schemas="schemas" :labelWidth="120" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { component: 'Divider', label: '基本信息', helpMessage: '以下为必填项' },
          { field: 'name', component: 'Input', label: '姓名' },
          { component: 'Divider', label: '脱敏信息', },
          { field: 'phone', component: 'Input', label: '手机号' },
        ]
      };
    }
  };
 </script>
```
:::

### 副标签 subLabel 与 suffix

:::demo 使用 `subLabel` 显示副标签；使用 `suffix` 在组件右侧插入后缀内容
```html
<el-basic-form :schemas="schemas" label-width="120" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'weight', component: 'InputNumber', label: '体重', subLabel: 'kg', suffix: 'kg', componentProps: { min: 0 } }
        ]
      };
    }
  };
 </script>
```
:::

### 整列渲染 renderColContent/colSlot

:::demo 使用 `renderColContent` 或 `colSlot` 在整列中自定义内容
```html
<el-basic-form :schemas="schemas" label-width="120px">
  <template slot="myCol" slot-scope="{ model }">
    <el-form-item label="说明">
      <el-alert type="info" title="整列插槽内容" description="可用于说明或分组提示" show-icon />
      <div style="margin-top:8px;">当前表单值：{{ JSON.stringify(model) }}</div>
    </el-form-item>
  </template>
</el-basic-form>
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'title', component: 'Input', label: '标题' },
          { field: 'desc', component: 'Input', label: '描述' },
          { colSlot: 'myCol' },
          {
            renderColContent: ({ model, h }) => h('el-form-item', {}, [
              h('el-alert', { props: { type: 'info', title: '整列渲染内容', description: 'renderColContent 自定义整列', showIcon: true } }),
              h('div', { style: { marginTop: '8px' } }, '当前表单值：' + JSON.stringify(model))
            ])
          }
        ]
      };
    }
  };
 </script>
```
:::

### 自定义更新事件 changeEvent

:::demo 使用 `changeEvent` 绑定非 `input` 的更新事件，自动同步到 `model`
```html
<el-basic-form :schemas="schemas" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'price', component: 'InputNumber', label: '价格', changeEvent: 'change', componentProps: { min: 0 } }
        ]
      };
    }
  };
 </script>
```
:::

### useForm 方法集（@register）

:::demo 通过 `@register` 取得方法集，进行动态设置与校验操作
```html
<el-basic-form :schemas="schemas" label-width="120px" :baseColProps="{ span: 12 }" @register="onRegister" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'name', component: 'Input', label: '姓名' },
          { field: 'age', component: 'InputNumber', label: '年龄', componentProps: { min: 0 } }
        ],
        api: null
      };
    },
    methods: {
      onRegister(methods) {
        this.api = methods;
        // 动态设置 props
        methods.setProps({ actionColOptions: { span: 12 }, submitButtonText: '提交表单' });
        // 设置默认值
        methods.setFieldsValue({ name: '张三', age: 18 });
      }
    }
  };
 </script>
```
:::

### 动态 Schema 操作（remove/append/update）

:::demo 通过方法集动态维护表单结构
```html
<el-basic-form :schemas="schemas" @register="onRegister" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'name', component: 'Input', label: '姓名' },
          { field: 'age', component: 'InputNumber', label: '年龄' }
        ],
        api: null
      };
    },
    methods: {
      onRegister(methods) {
        this.api = methods;
        // 删除 age
        methods.removeSchemaByField('age');
        // 在 name 后面插入 email
        methods.appendSchemaByField({ field: 'email', component: 'Input', label: '邮箱' }, 'name');
        // 更新 email 为必填
        methods.updateSchema({ field: 'email', rules: [{ required: true, message: '必填', trigger: 'blur' }] });
      }
    }
  };
 </script>
```
:::

### 插槽自定义

:::demo 通过 `schema.slot` 在表单项中插入自定义渲染内容
```html
<el-basic-form :schemas="schemas" label-width="120px">
  <template slot="usernameSlot" slot-scope="{ model, field }">
    <el-input v-model="model[field]" />
    <span style="line-height:1;margin-left:8px;color:#999;">自定义提示</span>
  </template>
</el-basic-form>
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'username', label: '用户名', slot: 'usernameSlot' }
        ]
      };
    }
  };
</script>
```
:::

### 布局栅格 colProps

:::demo 通过 `colProps` 为单项设置栅格布局（基于 `el-col`）
```html
<el-basic-form :schemas="schemas" label-width="100px" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'a', component: 'Input', label: 'A', colProps: { span: 8 } },
          { field: 'b', component: 'Input', label: 'B', colProps: { span: 8 } },
          { field: 'c', component: 'Input', label: 'C', colProps: { span: 8 } }
        ]
      };
    }
  };
 </script>
```
:::

### 动态显示/禁用

:::demo 通过 `show/ifShow/dynamicDisabled` 根据当前 `model` 动态控制
```html
<el-basic-form :schemas="schemas" label-width="120px"/>
<script>
  export default {
    data() {
      return {
        schemas: [
          {
            field: 'switcher',
            component: 'Switch',
            label: '开关'
          },
          {
            field: 'visibleInput',
            component: 'Input',
            label: '条件显示',
            show: ({ values }) => !!values.switcher
          },
          {
            field: 'disabledSelect',
            component: 'Select',
            label: '条件禁用',
            dynamicDisabled: ({ values }) => !values.switcher,
            componentProps: { placeholder: '请选择' }
          }
        ]
      };
    }
  };
</script>
```
:::

### 操作区与按钮文案

:::demo 可通过 `showActionButtonGroup/submitButtonText/resetButtonText` 控制底部按钮
```html
<el-basic-form
  :schemas="schemas"
  label-width="120px"
  :showActionButtonGroup="true"
  submitButtonText="搜索"
  resetButtonText="清空"
  @submit="onSearch"
/>
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'keyword', component: 'Input', label: '关键字' }
        ]
      };
    },
    methods: {
      onSearch(values) {
        console.log('搜索: ', values);
      }
    }
  };
</script>
```
:::

### FieldMapToTime

:::demo 将时间范围字段映射为开始/结束字段并格式化输出
```html
<el-basic-form :schemas="schemas" label-width="120px" :fieldMapToTime="[['dateRange','startDate','endDate','yyyy-MM-dd']]" @submit="onSubmit" />
<script>
  export default {
    data() {
      return {
        schemas: [
          { field: 'dateRange', component: 'DatePicker', label: '日期范围', componentProps: { type: 'daterange' } }
        ]
      };
    },
    methods: {
      onSubmit(values) {
        // values 将包含 startDate/endDate 字段，且移除了原 dateRange 字段
        console.log(values);
      }
    }
  };
 </script>
```
:::

### Render 自定义渲染

:::demo 通过 `schema.render` 使用 `h` 返回 VNode 进行渲染
```html
<el-basic-form :schemas="schemas" label-width="120px" @submit="handleSubmit" />
<script>
  export default {
    data() {
      return {
        schemas: [
          {
            field: 'customInput',
            label: '自定义',
            render: ({ model, field, h }) => {
              return h('el-input', {
                props: { value: model[field], placeholder: '请输入' },
                on: { 
                  input: val => (model[field] = val),
                  blur: () => (model[field] = (model[field] || '').trim()),
                  change: () => { console.log(model[field]); }
                }
              });
            },
            rules: [{ required: true }]
          }
        ]
      };
    },
    methods: {
      handleSubmit(values) { console.log(values); }
    }
  };
 </script>
```
:::

### 组件 Slots 注入

:::demo 通过 `schema.renderComponentContent` 注入内部组件插槽（如 `suffix`）
```html
<el-basic-form label-width="120px" :schemas="schemas" />
<script>
  export default {
    data() {
      return {
        schemas: [
          {
            field: 'withSuffix',
            component: 'Input',
            label: '带后缀',
            renderComponentContent: () => ({ suffix: () => 'suffix' })
          }
        ]
      };
    }
  };
 </script>
```
:::


### Methods

| 方法 | 类型 | 说明 |
| --- | --- | --- |
| `getFieldsValue` | `() => Recordable` | 获取表单值 |
| `setFieldsValue` | `<T>(values: T) => Promise<void>` | 设置表单字段值 |
| `resetFields` | `() => Promise<void>` | 重置表单值 |
| `validateFields` | `(nameList?: NamePath[]) => Promise<boolean>` | 校验指定表单项 |
| `validate` | `(nameList?: NamePath[]) => Promise<boolean>` | 校验整个表单 |
| `submit` | `() => Promise<void>` | 提交表单 |
| `scrollToField` | `(name: NamePath, options?: ScrollOptions) => Promise<void>` | 滚动到对应字段位置 |
| `clearValidate` | `(name?: string | string[]) => Promise<void>` | 清空校验 |
| `setProps` | `(formProps: Partial<FormProps>) => Promise<void>` | 设置表单 Props（亦可标签传递或初始化 `useForm(props)`） |
| `removeSchemaByField` | `(field: string | string[]) => Promise<void>` | 根据 field 删除 Schema |
| `appendSchemaByField` | `(schema: FormSchema, prefixField?: string, first?: boolean) => Promise<void>` | 插入到指定 `field` 后；未传则插入最后；`first=true` 插入第一个位置 |
| `updateSchema` | `(data: Partial<FormSchema> | Partial<FormSchema>[]) => Promise<void>` | 更新表单的 schema（仅更新传入的部分） |

示例：

```ts
updateSchema({ field: 'filed', componentProps: { disabled: true } });
updateSchema([
  { field: 'filed', componentProps: { disabled: true } },
  { field: 'filed1', componentProps: { disabled: false } },
]);
```

## Props

::: tip 温馨提醒

以下为当前组件实际支持的 Props；未列出的或标注“暂不支持”的为文档占位，不在本版本实现中。

:::

| 属性 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| model | `object` | - | - | 外部表单数据模型（不传则使用内部模型） |
| rules | `object` | - | - | ElementUI 校验规则对象 |
| labelPosition | `string` | - | `left`/`right`/`top` | 标签位置（被 `labelAlign` 覆盖） |
| labelAlign | `string` | - | `left`/`right`/`top`/`between` | 标签对齐方式（优先生效） |
| labelWidth | `number|string` | - | - | 标签宽度，支持数字像素或字符串 |
| inline | `boolean` | `false` | - | 行内表单 |
| size | `string` | - | `medium`/`small`/`mini` | 统一尺寸，透传到子组件 |
| disabled | `boolean` | `false` | - | 全局禁用态 |
| schemas | `Schema[]` | - | - | 表单项配置，见下方 `FormSchema` |
| fieldMapToTime | `Array<[string,string,string,string?]>` | - | - | 区间字段映射：`[src,start,end,format]` |
| actionColOptions | `object` | - | - | 操作区域 `el-col` 配置，如 `{ span, offset }` |
| baseColProps | `object` | - | - | 所有项的基础 `colProps`，项内可覆盖 |
| baseRowStyle | `object` | - | - | `el-row` 样式对象 |
| mergeDynamicData | `object` | - | - | 提交时与表单值合并的额外数据 |
| autoFocusFirstItem | `boolean` | `false` | - | 挂载后自动聚焦第一个输入框 |
| compact | `boolean` | - | - | 紧凑样式（暂不支持） |
| autoSetPlaceHolder | `boolean` | `true` | - | 常见输入组件自动占位文案 |
| autoSetClearable | `boolean` | `true` | - | 自动为支持的组件开启 `clearable` |
| autoSubmitOnEnter | `boolean` | `false` | - | 回车自动提交 |
| rulesMessageJoinLabel | `boolean` | `false` | - | 校验信息是否拼接标签文本 |
| showAdvancedButton | `boolean` | `false` | - | 显示展开/收起按钮，控制高级项 |
| emptySpan | `number|object` | 0 | - | 空白占位（暂不支持） |
| autoAdvancedLine | `number` | 3 | - | 未展开时默认保留的行数 |
| alwaysShowLines | `number` | 1 | - | 未展开时至少保留的行数 |
| showActionButtonGroup | `boolean` | `true` | - | 是否显示提交/重置/高级按钮区域 |
| showResetButton | `boolean` | `true` | - | 是否显示重置按钮 |
| resetButtonOptions | `object` | - | - | 透传到重置按钮的属性（`el-button`） |
| showSubmitButton | `boolean` | `true` | - | 是否显示提交按钮 |
| submitButtonOptions | `object` | - | - | 透传到提交按钮的属性（`el-button`） |
| submitButtonText | `string` | `提交` | - | 提交按钮文本 |
| resetButtonText | `string` | `重置` | - | 重置按钮文本 |
| resetFunc | `() => Promise<void>` | - | - | 自定义重置钩子，成功后执行内部重置 |
| submitFunc | `() => Promise<void>` | - | - | 自定义提交钩子，成功后触发 `submit` 事件 |
| tableAction | `object` | - | - | 表格方法集上下文（供 `componentProps` 函数使用） |
| actionButton | `Array` | - | - | 操作区自定义按钮数组，项形如 `{ text, click, ...el-button props }` |

### 说明

按钮 `submitButtonOptions`/`resetButtonOptions` 直接透传到 `el-button`，可使用其标准属性（如 `type`、`size`、`loading` 等）。

### fieldMapToTime

用于将时间区间字段（值为 `[start,end]`）映射为两个独立字段：

```ts
// 配置示例：[源字段, 起始字段, 结束字段, 格式]
fieldMapToTime: [
  ['datetime', 'startTime', 'endTime', 'yyyy-MM-dd'],
  ['range2', 'begin', 'finish', 'yyyy-MM-dd HH:mm:ss'],
]
```

### FormSchema

| 属性 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| field | `string` | - | - | 字段名 |
| label | `string` | - | - | 标签名 |
| subLabel | `string` | - | - | 二级标签名灰色 |
| suffix | `string|number|Function` | - | - | 组件后缀内容（支持函数） |
| changeEvent | `string` | - | - | 表单更新事件名称 |
| helpMessage | `string , string[]` | - | - | 标签名右侧温馨提示 |
| helpComponentProps | `HelpComponentProps` | - | - | 标签名右侧温馨提示组件 props,见下方 HelpComponentProps |
| labelWidth | `string , number` | - | - | 覆盖统一设置的 labelWidth |
| disabledLabelWidth | `boolean` | false | true/false | 禁用 form 全局设置的 labelWidth,自己手动设置 labelCol 和 wrapperCol |
| component | `string` | - | - | 组件类型，见下方 ComponentType |
| componentProps | `object|Function` | - | - | 组件 props 或返回 props 的函数 |
| rules | `ValidationRule[]` | - | - | 校验规则,见下方 ValidationRule |
| required | `boolean|Function` | - | - | 是否必填（渲染必填标识），不自动转化 rules |
| rulesMessageJoinLabel | `boolean` | false | - | 校验信息是否加入 label |
| itemProps | `any` | - | - | 参考下方 FormItem |
| colProps | `ColEx` | - | - | 参考上方 actionColOptions |
| defaultValue | `any` | - | - | 组件初始值，用于生成内部模型 |
| render | `(renderCallbackParams: RenderCallbackParams) => VNode / VNode[] / string` | - | - | 自定义渲染组件 |
| renderColContent | `(renderCallbackParams: RenderCallbackParams) => VNode / VNode[] / string` | - | - | 自定义渲染组件（需要自行包含 formItem） |
| renderComponentContent | `(renderCallbackParams: RenderCallbackParams) => any / string` | - | - | 自定义渲染组内部的 slot |
| slot | `string` | - | - | 自定义 slot，渲染组件 |
| colSlot | `string` | - | - | 自定义 slot，渲染组件 （需要自行包含 formItem） |
| show | ` boolean / ((renderCallbackParams: RenderCallbackParams) => boolean)` | - | - | 动态判断当前组件是否显示，css 控制，不会删除 dom |
| ifShow | ` boolean / ((renderCallbackParams: RenderCallbackParams) => boolean)` | - | - | 动态判断当前组件是否显示，js 控制，会删除 dom |
| dynamicDisabled | `boolean / ((renderCallbackParams: RenderCallbackParams) => boolean) ` | - | - | 动态判断当前组件是否禁用 |
| dynamicRules | `ValidationRule[] / ((renderCallbackParams: RenderCallbackParams) => ValidationRule[])` | - | - | 动态返回当前组件的校验规则 |

**RenderCallbackParams**

```ts
export interface RenderCallbackParams {
  schema: FormSchema;
  values: any;
  model: any;
  field: string;
}
```

**componentProps**

- 当值为对象类型时,该对象将作为`component`所对应组件的的 props 传入组件

- 当值为一个函数时候

参数有 4 个

`schema`: 表单的整个 schemas

`formActionType`: 操作表单的函数。与 useForm 返回的操作函数一致

`formModel`: 表单的双向绑定对象，这个值是响应式的。所以可以方便处理很多操作

`tableAction`: 操作表格的函数，与 useTable 返回的操作函数一致。注意该参数只在表格内开启搜索表单的时候有值，其余情况为`null`,

```ts
{
  // 简单例子，值改变的时候操作表格或者修改表单内其他元素的值
  component:'Input',
  componentProps: ({ schema, tableAction, formActionType, formModel }) => {
    return {
      // xxxx props
      onChange:(e)=>{
        const {reload}=tableAction
        reload()
        // or
        formModel.xxx='123'
      }
    };
  };
}
```

**HelpComponentProps**

```ts
export interface HelpComponentProps {
  maxWidth: string;
  color: string;
  fontSize: string;
}
```

**ComponentType**

schema 内组件的可选类型

```ts
export type ComponentType =
  | 'Input'
  | 'InputPassword'
  | 'InputSearch'
  | 'InputTextArea'
  | 'InputAutoComplete'
  | 'InputNumber'
  | 'Select'
  | 'ApiSelect'
  | 'ApiTree'
  | 'ApiCascader'
  | 'TreeSelect' // 映射为 el-cascader
  | 'Cascader'
  | 'Radio'
  | 'RadioButtonGroup'
  | 'RadioGroup'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'DatePicker'
  | 'MonthPicker'
  | 'RangePicker'
  | 'WeekPicker'
  | 'TimePicker'
  | 'Switch'
  | 'Upload'
  | 'Slider'
  | 'Rate'
  | 'ColorPicker'
  | 'Transfer'
  | 'Divider';
```

### Divider schema 说明

`Divider`类型用于在`schemas`中占位，将会渲染成一个分割线（始终占一整行的版面），可用于较长表单的分组与分隔。

- 始终占一整列渲染，不随高级展开/收起逻辑隐藏
- 使用 `schema.label` 与 `schema.helpMessage` 渲染分割线与提示
- 可通过 `componentProps` 设置除 `type` 之外的属性
- 不渲染常规表单项容器，仅用于展示分隔与说明

## 自行添加需要的组件类型

在 `src/components/Form/src/componentMap.ts` 内，添加需要的组件，并在上方 **ComponentType** 添加相应的类型 key

### 方式 1

这种写法适用与适用频率较高的组件

```ts
componentMap.set('componentName', 组件);

// ComponentType
export type ComponentType = xxxx | 'componentName';
```

### 方式 2

使用 **useComponentRegister** 进行注册

这种写法只能在当前页使用，页面销毁之后会从 componentMap 删除相应的组件

```
import { useComponentRegister } from '@/components/form/index';

import { StrengthMeter } from '@/components/strength-meter/index';

useComponentRegister('StrengthMeter', StrengthMeter);
```

::: tip 提示

方式 2 出现的原因是为了减少打包体积，如果某个组件体积很大，用方式 1 的话可能会使首屏体积增加

:::

### render

自定义渲染内容

```html
<template>
  <div class="m-4">
    <BasicForm @register="register" @submit="handleSubmit" />
  </div>
</template>
<script lang="ts">
  import { defineComponent, h } from 'vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Input } from 'ant-design-vue';
  const schemas: FormSchema[] = [
    {
      field: 'field1',
      component: 'Input',
      label: '字段1',
      colProps: {
        span: 8,
      },
      rules: [{ required: true }],
      render: ({ model, field }) => {
        return h(Input, {
          placeholder: '请输入',
          value: model[field],
          onChange: (e: ChangeEvent) => {
            model[field] = e.target.value;
          },
        });
      },
    },
    {
      field: 'field2',
      component: 'Input',
      label: '字段2',
      colProps: {
        span: 8,
      },
      rules: [{ required: true }],
      renderComponentContent: () => {
        return {
          suffix: () => 'suffix',
        };
      },
    },
  ];
  export default defineComponent({
    components: { BasicForm },
    setup() {
      const { createMessage } = useMessage();
      const [register, { setProps }] = useForm({
        labelWidth: 120,
        schemas,
        actionColOptions: {
          span: 24,
        },
      });
      return {
        register,
        schemas,
        handleSubmit: (values: any) => {
          createMessage.success('click search,values:' + JSON.stringify(values));
        },
        setProps,
      };
    },
  });
</script>
```

### slot

自定义渲染内容

::: tip 提示

使用插槽自定义表单域时，请注意 Form 有关 FormItem 的[相关说明]()。

:::

```html
<template>
  <div class="m-4">
    <BasicForm @register="register">
      <template #customSlot="{ model, field }">
        <a-input v-model:value="model[field]" />
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'compatible-vue';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { BasicModal } from '@/components/modal/index';
  export default defineComponent({
    name: 'FormDemo',
    setup(props) {
      const [register] = useForm({
        labelWidth: 100,
        actionColOptions: {
          span: 24,
        },
        schemas: [
          {
            field: 'field1',
            label: '字段1',
            slot: 'customSlot',
          },
        ],
      });
      return {
        register,
      };
    },
  });
</script>
```

### ifShow/show/dynamicDisabled

自定义显示/禁用

```html
<template>
  <div class="m-4">
    <BasicForm @register="register" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  const schemas: FormSchema[] = [
    {
      field: 'field1',
      component: 'Input',
      label: '字段1',
      colProps: {
        span: 8,
      },
      show: ({ values }) => {
        return !!values.field5;
      },
    },
    {
      field: 'field2',
      component: 'Input',
      label: '字段2',
      colProps: {
        span: 8,
      },
      ifShow: ({ values }) => {
        return !!values.field6;
      },
    },
    {
      field: 'field3',
      component: 'DatePicker',
      label: '字段3',
      colProps: {
        span: 8,
      },
      dynamicDisabled: ({ values }) => {
        return !!values.field7;
      },
    },
  ];

  export default defineComponent({
    components: { BasicForm },
    setup() {
      const [register, { setProps }] = useForm({
        labelWidth: 120,
        schemas,
        actionColOptions: {
          span: 24,
        },
      });
      return {
        register,
        schemas,
        setProps,
      };
    },
  });
</script>
```


## Slots

| 名称    | 说明               |
| ------- | ------------------ |
| action  | 操作区域插槽（按钮右侧） |

## ApiSelect / ApiTree / ApiCascader

内置远程加载组件，支持在 `schemas` 中直接使用：`component: 'ApiSelect' | 'ApiTree' | 'ApiCascader'`。

### 使用示例
```html
<el-basic-form :schemas="schemas" />
<script>
export default {
  data() {
    return {
      schemas: [
        {
          field: 'category',
          component: 'ApiSelect',
          label: '分类',
          componentProps: {
            api: (p) => fetch('/api/categories', { method: 'POST', body: JSON.stringify(p) }).then(r => r.json()),
            params: { page: 1 },
            resultField: 'data.items',
            immediate: true
          }
        },
        {
          field: 'tree',
          component: 'ApiTree',
          label: '树',
          componentProps: {
            api: () => fetch('/api/tree').then(r => r.json()),
            resultField: 'data.tree'
          }
        },
        {
          field: 'region',
          component: 'ApiCascader',
          label: '地区',
          componentProps: {
            api: () => fetch('/api/regions').then(r => r.json()),
            resultField: 'data.list'
          }
        }
      ]
    };
  }
};
</script>
```

### Props（通用）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| api | `Function` | - | 请求函数，返回数组或 Promise |
| params | `object` | `{}` | 请求参数，对象变更会触发重新加载 |
| resultField | `string` | `''` | 结果字段路径（支持 `x.x.x`）；为空且返回为数组时直接使用 |
| immediate | `boolean` | `true` | 是否在挂载时立即请求 |
| beforeFetch | `(T)=>T` | - | 请求前处理参数 |
| afterFetch | `(T)=>T` | - | 请求后处理返回值（返回数组） |
## RadioButtonGroup

Radio Button 风格的选择按钮

### Usage

```ts
const schemas: FormSchema[] = [
  {
    field: 'field',
    component: 'RadioButtonGroup',
    label: '字段',
  },
];
```

### Props

| 属性    | 类型                                                     | 默认值 | 说明     |
| ------- | -------------------------------------------------------- | ------ | -------- |
| options | `{ label: string; value: string; disabled?: boolean }[]` | -      | 数据字段 |
