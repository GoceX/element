## ApiTree 树形控件

通过 `api` 方法远程加载树形数据，并渲染为树形控件。

本页示例使用本地 mock：`/api/treeData`。

### 基础用法

:::demo
```html
<template>
  <div>
    <el-api-tree
      :api="fetch_tree_data"
      ref="tree"
      node-key="value"
      show-checkbox
      :default-checked-keys="checked_keys"
      default-expand-all
      @node-click="handle_node_click"
      @check-change="handle_check_change"
    />
    <div style="margin-top: 12px;">当前点击：{{ current_label }}</div>
    <div style="margin-top: 12px;">已勾选：{{ JSON.stringify(checked_keys) }}</div>
    <div style="margin-top: 12px;">半选：{{ JSON.stringify(half_checked_keys) }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      current_label: '',
      checked_keys: ['components'],
      half_checked_keys: []
    };
  },
  methods: {
    fetch_tree_data() {
      return fetch('/api/treeData').then((r) => r.json());
    },
    handle_node_click(data) {
      this.current_label = data && data.label != null ? String(data.label) : '';
    },
    handle_check_change() {
      const tree = this.$refs && this.$refs.tree;
      this.checked_keys = tree && typeof tree.getCheckedKeys === 'function' ? tree.getCheckedKeys() : [];
      this.half_checked_keys = tree && typeof tree.getHalfCheckedKeys === 'function' ? tree.getHalfCheckedKeys() : [];
    }
  }
};
</script>
```
:::

### 通过 `params` 触发重新加载

当 `params`（深度监听）变化时会自动重新请求。

:::demo
```html
<template>
  <div>
    <el-button size="mini" @click="bump_params">刷新数据</el-button>
    <div style="margin-top: 12px;">
      <el-api-tree
        :api="fetch_tree_data"
        :params="params"
        node-key="value"
        default-expand-all
      />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      params: { t: 1 }
    };
  },
  methods: {
    bump_params() {
      const current_t = this.params && this.params.t != null ? Number(this.params.t) : 0;
      this.params = { t: current_t + 1 };
    },
    fetch_tree_data(params) {
      const query = params && params.t != null ? `?t=${encodeURIComponent(String(params.t))}` : '';
      return fetch(`/api/treeData${query}`).then((r) => r.json());
    }
  }
};
</script>
```
:::

### 映射字段（`fieldLabel/fieldValue/fieldChildren`）

当接口返回项字段不是 `label/value/children` 时，可通过 `field-label`、`field-value`、`field-children` 指定字段名；如需额外加工数据，可配合 `afterFetch` 使用。

:::demo
```html
<template>
  <el-api-tree
    :api="fetch_backend_tree"
    :after-fetch="map_to_tree_nodes"
    field-label="name"
    field-value="id"
    field-children="nodes"
    node-key="value"
    default-expand-all
  />
</template>

<script>
export default {
  methods: {
    fetch_backend_tree() {
      return fetch('/api/treeData')
        .then((r) => r.json())
        .then((list) => {
          const safe_list = Array.isArray(list) ? list : [];
          return safe_list.map((item) => {
            return {
              name: item && item.label != null ? item.label : '',
              id: item && item.value != null ? item.value : '',
              nodes: item && Array.isArray(item.children) ? item.children : []
            };
          });
        });
    },
    map_to_tree_nodes(list) {
      return Array.isArray(list) ? list : [];
    }
  }
};
</script>
```
:::

### 提取列表字段（`resultField`）

当接口返回值不是数组，而是对象包装（例如 `{ data: { list: [] } }`）时，可通过 `resultField` 取出数组（支持点号路径）。

:::demo
```html
<template>
  <el-api-tree
    :api="fetch_wrapped_tree"
    result-field="data.list"
    node-key="value"
    default-expand-all
  />
</template>

<script>
export default {
  methods: {
    fetch_wrapped_tree() {
      return fetch('/api/treeData')
        .then((r) => r.json())
        .then((list) => ({ data: { list } }));
    }
  }
};
</script>
```
:::

### 属性

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| api | 请求函数，返回数组或 Promise | Function | — |
| params | 请求参数（对象变更会触发重新加载） | object | `{}` |
| resultField | 从返回值中提取列表的路径（点号路径） | string | `''` |
| fieldLabel | 节点 label 字段名 | string | `'label'` |
| fieldValue | 节点 value 字段名 | string | `'value'` |
| fieldChildren | 子节点数组字段名 | string | `'children'` |
| immediate | 是否在创建时立即请求 | boolean | `true` |
| beforeFetch | 请求前参数处理 | Function | — |
| afterFetch | 请求后列表处理 | Function | — |

除以上属性外，`el-tree` 的属性、事件可通过 `$attrs/$listeners` 透传（例如 `show-checkbox`、`node-key`、`default-expanded-keys`、`default-checked-keys`、`highlight-current` 等）。

### 插槽

本组件不新增插槽；同时不会透传 `el-tree` 的插槽。
