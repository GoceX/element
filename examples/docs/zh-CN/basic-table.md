## BasicTable 表格

用于展示多条结构类似的数据，封装了列配置、分页、远程加载与搜索表单联动。

### 基础示例

:::demo 传入 `columns` 与本地 `data-source` 渲染，并使用方法集进行分页、刷新、选择与数据更新（含远程加载模拟）。
```html
<template>
  <el-basic-table
    title="基础示例"
    :columns="columns"
    :striped="true"
    :bordered="true"
    :pagination="{ pageSize: 5 ,}"
    :row-selection="true"
    :click-to-row-select="true"
    :show-index-column="true"
    :use-search-form="true"
    :max-height="350"
    :form-config="formConfig"
    :api="fetchList"
    @register="onRegister">
    <template slot="toolbar">
      <el-button size="mini" type="primary" @click="doReload">刷新</el-button>
      <el-button size="mini" @click="showPager">显示分页</el-button>
      <el-button size="mini" @click="hidePager">隐藏分页</el-button>
      <el-button size="mini" @click="logData">获取数据</el-button>
      <el-button size="mini" @click="selectSecond">选中第二行</el-button>
      <el-button size="mini" @click="clearSelect">清空选中</el-button>
      <el-button size="mini" @click="updateSecond">修改第二行地址</el-button>
    </template>
  </el-basic-table>
</template>
<script>
export default {
  data() {
    return {
      columns: [
        { title: 'ID', dataIndex: 'id', width: 150 },
        { title: '日期', dataIndex: 'date', width: 150 },
        { title: '名称', dataIndex: 'name', minWidth: 120 },
        { title: '产地', dataIndex: 'origin', minWidth: 120 },
        { title: '描述', dataIndex: 'description', minWidth: 160 }
      ],
      tableProps: null,
      formConfig: {
        labelWidth: 60,
        showActionButtonGroup: true,
        submitButtonText: '搜索',
        resetButtonText: '清空',
        baseColProps:{span:6},
        actionColOptions:{span:8},
        schemas: [
          { field: 'id', component: 'Input', label: 'ID', defaultValue: 1, componentProps: { placeholder: '例如 1' } },
          { field: 'date', component: 'Input', label: '日期', componentProps: { placeholder: '例如 2016-05-02' } },
          { field: 'name', component: 'Input', label: '名称', componentProps: { placeholder: '如 鸡蛋仔' } },
          { field: 'origin', component: 'Input', label: '产地', componentProps: { placeholder: '如 中国' } },
          { field: 'description', component: 'Input', label: '描述', componentProps: { placeholder: '关键字' } }
        ]
      }
    };
  },
  methods: {
    onRegister(props) { this.tableProps = props; },
    fetchList(params) {
      return typeof window !== 'undefined' && window.Promise
        ? new window.Promise((resolve) => {
            const { page = 1, pageSize = 5 } = params || {};
            const dateF = params && params.date ? String(params.date) : '';
            const nameF = params && params.name ? String(params.name) : '';
            const originF = params && params.origin ? String(params.origin) : '';
            const descriptionF = params && params.description ? String(params.description) : '';
            setTimeout(() => {
              const ALL = 120;
              const all = Array.from({ length: ALL }).map((_, idx) => ({
                id: idx + 1,
                date: '2016-05-0' + ((idx % 9) + 1),
                name: '鸡蛋仔',
                origin: '中国',
                description: '这是一个鸡蛋仔'
              }));
              const filtered = all.filter(it => (
                (!dateF || it.date.indexOf(dateF) !== -1) &&
                (!nameF || it.name.indexOf(nameF) !== -1) &&
                (!originF || it.origin.indexOf(originF) !== -1) &&
                (!descriptionF || it.description.indexOf(descriptionF) !== -1)
              ));
              const start = (page - 1) * pageSize;
              const items = filtered.slice(start, start + pageSize);
              resolve({ items, total: filtered.length });
            }, 300);
          })
        : { then() {} };
    },
    doReload() { this.tableProps && this.tableProps.reload(); },
    showPager() { this.tableProps && this.tableProps.setShowPagination(true); },
    hidePager() { this.tableProps && this.tableProps.setShowPagination(false); },
    logData() {
      const ds = this.tableProps ? this.tableProps.getDataSource() : [];
      console.log('当前数据源:', ds);
    },
    selectSecond() { this.tableProps && this.tableProps.setSelectedRowKeys([2]); },
    clearSelect() { this.tableProps && this.tableProps.clearSelectedRowKeys(); },
    updateSecond() { this.tableProps && this.tableProps.updateTableDataRecord(2, { address: '修改后的地址' }); }
  }
};
</script>
```
:::

### 斑马纹与边框

:::demo 通过 `striped/bordered` 控制表格外观。
```html
<template>
  <el-basic-table :columns="columns" :data-source="data" :striped="true" :bordered="true" />
</template>
<script>
export default {
  data() {
    return {
      columns: [
        { title: '日期', dataIndex: 'date' },
        { title: '姓名', dataIndex: 'name' },
        { title: '地址', dataIndex: 'address' }
      ],
      data: [
        { id: 1, date: '2016-05-02', name: '王小虎', address: '上海市普陀区金沙江路 1518 弄' },
        { id: 2, date: '2016-05-04', name: '王小虎', address: '上海市普陀区金沙江路 1517 弄' },
        { id: 3, date: '2016-05-01', name: '王小虎', address: '上海市普陀区金沙江路 1519 弄' },
        { id: 4, date: '2016-05-03', name: '王小虎', address: '上海市普陀区金沙江路 1516 弄' }
      ]
    };
  }
};
</script>
```
:::

### 最大高度与滚动

:::demo 使用 `max-height` 指定表格最大高度。
```html
<template>
  <el-basic-table :columns="columns" :data-source="data" :bordered="true" :max-height="250" />
</template>
<script>
export default {
  data() {
    return {
      columns: [
        { title: '日期', dataIndex: 'date', width: 150 },
        { title: '姓名', dataIndex: 'name', width: 120 },
        { title: '地址', dataIndex: 'address', width: 300 }
      ],
      data: Array.from({ length: 12 }).map((_, i) => ({ id: i + 1, date: '2016-05-0' + ((i % 9) + 1), name: '王小虎', address: '上海市普陀区金沙江路 151' + i + ' 弄' }))
    };
  }
};
</script>
```
:::

### 索引列与选择列

:::demo 开启索引列与选择列，支持点击行切换勾选。
```html
<template>
  <el-basic-table
    :columns="columns"
    :data-source="data"
    :row-selection="true"
    :click-to-row-select="true"
    :show-index-column="true"
    @selection-change="onSel" />
</template>
<script>
export default {
  data() {
    return {
      columns: [
        { title: '名称', dataIndex: 'name' },
        { title: '地址', dataIndex: 'address' }
      ],
      data: [
        { id: 1, name: 'A', address: '上海市普陀区金沙江路 1518 弄' },
        { id: 2, name: 'B', address: '上海市普陀区金沙江路 1517 弄' }
      ]
    };
  },
  methods: {
    onSel({ keys, rows }) { console.log(keys, rows); }
  }
};
</script>
```
:::

### 列插槽渲染

:::demo 在列中通过 `slot` 指定插槽名进行自定义渲染。
```html
<template>
  <el-basic-table :columns="columns" :data-source="data" :bordered="true">
    <template slot="nameCell" slot-scope="{ row }">
      <el-tag type="success">{{ row.name }}</el-tag>
    </template>
  </el-basic-table>
</template>
<script>
export default {
  data() {
    return {
      columns: [{ title: '名称', dataIndex: 'name', slot: 'nameCell' }],
      data: [{ id: 1, name: 'A' }]
    };
  }
};
</script>
```
:::

### 远程加载（模拟）

:::demo 使用 `api` 与 `pagination` 进行远程分页加载（使用 Promise + setTimeout 模拟）。
```html
<template>
  <el-basic-table
    :columns="columns"
    :pagination="{ pageSize: 5 }"
    :api="fetchList"
    :bordered="true"
    @register="onRegister" />
</template>
<script>
export default {
  data() {
    return { columns: [{ title: '名称', dataIndex: 'name' }] };
  },
  methods: {
    fetchList(params) {
      return typeof window !== 'undefined' && window.Promise
        ? new window.Promise((resolve) => {
            const { page = 1, pageSize = 5 } = params || {};
            setTimeout(() => {
              const total = 23;
              const start = (page - 1) * pageSize;
              const items = Array.from({ length: Math.min(pageSize, total - start) })
                .map((_, i) => ({ id: start + i + 1, name: 'Row ' + (start + i + 1) }));
              resolve({ items, total });
            }, 300);
          })
        : { then() {} };
    },
    onRegister(action) { action.reload(); }
  }
};
</script>
```
:::

### 分页字段映射（fetch-setting）

:::demo 将后端 `{ records, total }` 字段映射为表格数据。
```html
<template>
  <el-basic-table
    :columns="columns"
    :pagination="{ pageSize: 5 }"
    :api="fetchList"
    :fetch-setting="{ pageField: 'pageNo', sizeField: 'pageSize', listField: 'records', totalField: 'total' }"
    :bordered="true"
    @register="onRegister" />
</template>
<script>
export default {
  data() { return { columns: [{ title: '名称', dataIndex: 'name' }] }; },
  methods: {
    fetchList(params) {
      return typeof window !== 'undefined' && window.Promise
        ? new window.Promise((resolve) => {
            const { pageNo = 1, pageSize = 5 } = params || {};
            setTimeout(() => {
              const total = 12;
              const start = (pageNo - 1) * pageSize;
              const records = Array.from({ length: Math.min(pageSize, total - start) })
                .map((_, i) => ({ id: start + i + 1, name: 'Item ' + (start + i + 1) }));
              resolve({ records, total });
            }, 300);
          })
        : { then() {} };
    },
    onRegister(action) { action.reload(); }
  }
};
</script>
```
:::

### 搜索表单联动

:::demo 启用搜索区域，提交后自动刷新。
```html
<template>
  <el-basic-table
    :use-search-form="true"
    :form-config="{ labelWidth: 100, schemas: [{ field: 'keyword', component: 'Input', label: '关键字' }] }"
    :columns="columns"
    :api="fetchList"
    :bordered="true" />
</template>
<script>
export default {
  data() { return { columns: [{ title: '名称', dataIndex: 'name' }] }; },
  methods: {
    fetchList(params) {
      return typeof window !== 'undefined' && window.Promise
        ? new window.Promise((resolve) => {
            setTimeout(() => resolve({ items: [{ id: 1, name: (params && params.keyword) ? ('搜索_' + params.keyword) : 'A' }], total: 1 }), 300);
          })
        : { then() {} };
    }
  }
};
</script>
```
:::

### 常用 Props 速览

### Methods

**setProps**

类型：`(props: Partial<BasicTableProps>) => void`

说明: 用于设置表格参数

**reload**

类型：`(opt?: FetchParams) => Promise<void>`

说明: 刷新表格

**redoHeight**

类型：`() => void`

说明: 重新计算表格高度

**setLoading**

类型：`(loading: boolean) => void`

说明: 设置表格 loading 状态

**getDataSource**

获取表格数据

类型：`<T = Recordable>() => T[]`

说明: 获取表格数据

**getRawDataSource**

获取后端接口原始数据

类型：`<T = Recordable>() => T`

说明: 获取后端接口原始数据

**getColumns**

类型：`(opt?: GetColumnsParams) => BasicColumn[]`

说明: 获取表格数据

**setColumns**

类型：`(columns: BasicColumn[] | string[]) => void`

说明: 设置表头数据

**setTableData**

类型：`<T = Recordable>(values: T[]) => void`

说明: 设置表格数据

**setPagination**

类型：`(info: Partial<PaginationProps>) => void`

说明: 设置分页信息

**deleteSelectRowByKey**

类型：`(key: string) => void`

说明: 根据 key 删除取消选中行

**getSelectRowKeys**

类型：`() => string[]`

说明: 获取选中行的 keys

**getSelectRows**

类型：`<T = Recordable>() => T[]`

说明: 获取选中行的 rows

**clearSelectedRowKeys**

类型：`() => void`

说明: 清空选中行

**setSelectedRowKeys**

类型：`(rowKeys: string[] | number[]) => void`

说明: 设置选中行

**getPaginationRef**

类型：`() => PaginationProps | boolean`

说明: 获取当前分页信息

**getShowPagination**

类型：`() => boolean`

说明: 获取当前是否显示分页

**setShowPagination**

类型：`(show: boolean) => Promise<void>`

说明: 设置当前是否显示分页

**getRowSelection**

类型：`() => TableRowSelection<Recordable>`

说明: 获取勾选框信息

**updateTableData**

类型：`(index: number, key: string, value: any)=>void`

说明: 更新表格数据

**updateTableDataRecord**

类型： `(rowKey: string | number, record: Recordable) => Recordable | void`

说明： 根据唯一的 `rowKey` 更新指定行的数据.可用于不刷新整个表格而局部更新数据

**deleteTableDataRecord**

类型： `(rowKey: string | number | string[] | number[]) => void`

说明： 根据唯一的`rowKey` 动态删除指定行的数据.可用于不刷新整个表格而局部更新数据

**insertTableDataRecord**

类型： `(record: Recordable, index?: number) => Recordable | void`

说明： 可根据传入的 `index` 值决定插入数据行的位置，不传则是顺序插入，可用于不刷新整个表格而局部更新数据

**getForm**

类型：`() => FormActionType`

说明: 如果开启了搜索区域。可以通过该函数获取表单对象函数进行操作

**expandAll**

类型：`() => void`

说明: 展开树形表格

**collapseAll**

类型：`() => void`

说明: 折叠树形表格

## Props

::: tip 温馨提醒

- 除以下参数外，官方文档内的 props 也都支持，具体可以参考 [table](./table.md)
- 注意：`defaultExpandAllRows`、`defaultExpandedRowKeys` 属性在 basicTable 中不受支持，并且在`antv table` v2.2.0 之后也被移除。

:::

| 属性 | 类型 | 默认值 | 可选值 | 说明 | 版本 |
| --- | --- | --- | --- | --- | --- |
| clickToRowSelect | `boolean` | `true` | - | 点击行是否选中 checkbox 或者 radio。需要开启 |  |
| sortFn | `(sortInfo: SorterResult<any>) => any` | - | - | 自定义排序方法（暂不支持） |  |
| filterFn | `(sortInfo: Partial<Recordable<string[]>>) => any` | - | - | 自定义过滤方法（暂不支持） |  |
| showTableSetting | `boolean` | `false` | - | 显示表格设置工具（暂不支持） |  |
| tableSetting | `TableSetting` | - | - | 表格设置工具配置（暂不支持） |  |
| striped | `boolean` | `true` | - | 斑马纹 |  |
| inset | `boolean` | `false` | - | 取消表格的默认 padding（暂不支持） |  |
| autoCreateKey | `boolean` | `true` | - | 是否自动生成 key |  |
| showSummary | `boolean` | `false` | - | 是否显示合计行 |  |
| summaryData | `any[]` | - | - | 自定义合计数据（暂不支持） |  |
| emptyDataIsShowTable | `boolean` | `true` | - | 空数据时是否显示表格（暂不支持） |  |
| summaryFunc | `(...arg) => any[]` | - | - | 合计行计算方法（暂不支持） |  |
| ~~canRowDrag~~ | ~~`boolean`~~ | ~~`false`~~ | - | ~~是否可拖拽行排序~~ |  |
| ~~canColDrag~~ | ~~`boolean`~~ | ~~`false`~~ | - | ~~是否可拖拽列~~ |  |
| isTreeTable | `boolean` | `false` | - | 是否树表 |  |
| api | `(...arg: any) => Promise<any>` | - | - | 请求接口函数 |  |
| beforeFetch | `(T)=>T` | - | - | 请求之前对参数进行处理 |  |
| afterFetch | `(T)=>T` | - | - | 请求之后对返回值进行处理 |  |
| handleSearchInfoFn | `(T)=>T` | - | - | 在请求之前处理搜索条件参数 |  |
| fetchSetting | `FetchSetting` | - | - | 接口请求字段映射配置 |  |
| immediate | `boolean` | `true` | - | 组件加载后是否立即请求接口 |  |
| searchInfo | `any` | - | - | 额外的请求参数 |
| useSearchForm | `boolean` | `false` | - | 使用搜索表单 |  |
| formConfig | `any` | - | - | 表单配置（透传） |  |
| columns | `any` | - | - | 表格列信息 BasicColumn[] |  |
| showIndexColumn | `boolean` | `true` | - | 是否显示序号列 |  |
| indexColumnProps | `any` | - | - | 序号列配置 BasicColumn |  |
| actionColumn | `any` | - | - | 表格右侧操作列（暂不支持） |  |
| ellipsis | `boolean` | `true` | - | 文本超过宽度是否显示... |  |
| canResize | `boolean` | `true` | - | 自适应高度（暂不支持） |  |
| clearSelectOnPageChange | `boolean` | `false` | - | 切换页码是否重置勾选状态 |  |
| resizeHeightOffset | `number` | 0 | - | 高度计算偏移（暂不支持） |  |
| rowSelection | `any` | - | - | 选择列配置 |  |
| title | `string` | - | - | 表格标题 |  |
| titleHelpMessage | `string ｜ string[]` | - | - | 表格标题右侧温馨提醒 |  |
| maxHeight | `number` | - | - | 表格最大高度，超出显示滚动条 |  |
| dataSource | `any[]` | - | - | 表格数据，非 api 加载情况 |  |
| bordered | `boolean` | `false` | - | 是否显示表格边框 |  |
| pagination | `any` | - | - | 分页信息配置，为 `false` 不显示分页 |  |
| loading | `boolean` | `false` | - | 表格 loading 状态 |  |
| scroll | `any` | - | - | 滚动配置（暂不支持） |  |
| beforeEditSubmit | `({record: Recordable,index: number,key: string \| number,value: any}) => Promise<any>` | - | - | 单元格编辑提交回调（暂不支持） |  |

### TableSetting

本版本暂不支持内置 TableSetting。请使用外部 UI 与 `setProps`/`setColumns` 控制字段调整与全屏。

## BasicColumn

除参考官方 Column 配置外，以下扩展中与“编辑/权限”相关的参数在本版本暂不支持。

| 属性 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| defaultHidden | `boolean` | false | - | 默认隐藏（暂不支持） |
| helpMessage | `string｜string[]` | - | - | 列头右侧帮助文本（暂不支持） |
| edit | `boolean` | - | - | 单元格编辑（暂不支持） |
| editRow | `boolean` | - | - | 行编辑（暂不支持） |
| editable | `boolean` | false | - | 编辑态（暂不支持） |
| editComponent | `string` | `Input` | - | 编辑组件（暂不支持） |
| editComponentProps | `any` | - | - | 编辑组件 props（暂不支持） |
| editRule | `((text: string, record: Recordable) => Promise<string>)` | - | - | 表单校验（暂不支持） |
| editValueMap | `(value: any) => string` | - | - | 值枚举（暂不支持） |
| onEditRow | `（）=>void` | - | - | 行编辑触发（暂不支持） |
| format | `string | Function | Map` | - | - | 单元格格式化（暂不支持） |
| auth | `string | string[]` | - | - | 权限控制（暂不支持） |
| ifShow | `boolean ｜ Function` | - | - | 业务状态控制（暂不支持） |

### EditComponentType / CellFormat

与编辑相关的类型在本版本暂不支持。

## 事件

::: tip 温馨提醒

除以下事件外，官方文档内的 event 也都支持，具体可以参考 [antv table](https://www.antdv.com/components/table-cn/#api)

:::

| 事件 | 回调参数 | 说明 |
| --- | --- | --- |
| fetch-success | `Function({items,total})` | 接口请求成功后触发 |
| fetch-error | `Function(error)` | 错误信息 |
| selection-change | `Function({keys，rows})` | 勾选事件触发 |
| row-click | `Function(record, index, event)` | 行点击触发 |
| row-dbClick | `Function(record, index, event)` | 行双击触发（暂不支持） |
| row-contextmenu | `Function(record, index, event)` | 行右键触发（暂不支持） |
| row-mouseenter | `Function(record, index, event)` | 行移入触发（暂不支持） |
| row-mouseleave | `Function(record, index, event)` | 行移出触发（暂不支持） |
| edit-end | `Function({record, index, key, value})` | 单元格编辑完成（暂不支持） |
| edit-cancel | `Function({record, index, key, value})` | 单元格取消编辑（暂不支持） |
| edit-row-end | `Function()` | 行编辑结束（暂不支持） |
| edit-change | `Function({column,value,record})` | 单元格编辑值变化（暂不支持） |

<!-- 编辑相关说明与示例已移除：本版本暂不支持单元格/行编辑功能 -->

## Slots

::: tip 温馨提醒

除以下参数外，官方文档内的 slot 也都支持，具体可以参考 [table](./table.md#Slots)

:::

| 名称              | 说明                     | 版本  |
| ----------------- | ------------------------ | ----- |
| toolbar           | 表格顶部右侧区域         |       |
| append            | 表格底部插槽             |       |
| empty             | 空状态插槽               |       |
| tableTitle        | 表格顶部左侧区域（暂不支持） |       |
| expandedRowRender | 展开行区域（暂不支持）   |       |
| headerTop         | 表格顶部区域（暂不支持） |       |

## Form-Slots

当开启 form 表单后。以`form-xxxx`为前缀的 slot 会被视为 form 的 slot

xxxx 为 form 组件的 slot。具体参考[form 组件文档](./form.md#Slots)

e.g

```
form-submitBefore
```

## ColumnSetting 组件

本版本暂不支持内置 ColumnSetting。请通过外部 UI 配合 `setProps`/`setColumns` 控制列的显示、固定与顺序，以及全屏等扩展行为。

## 内置组件（只能用于表格内部）

### TableAction / TableImg

本版本暂不支持内置操作列与图片单元格组件。
