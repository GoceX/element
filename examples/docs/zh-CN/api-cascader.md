## ApiCascader 级联选择器

通过 `api` 方法远程加载级联选项数据，并渲染为级联选择器。

本页示例使用本地 mock：`/api/cascaderData`。

### 基础用法

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-cascader
        v-model="value"
        placeholder="请选择地区"
        clearable
        :api="fetch_cascader_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="JSON.stringify(value)" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: []
    };
  },
  methods: {
    fetch_cascader_options() {
      return fetch('/api/cascaderData').then((r) => r.json());
    }
  }
};
</script>
```
:::

### 可搜索

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-cascader
        v-model="value"
        placeholder="试试搜索：浙江"
        filterable
        clearable
        :api="fetch_cascader_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="JSON.stringify(value)" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: []
    };
  },
  methods: {
    fetch_cascader_options() {
      return fetch('/api/cascaderData').then((r) => r.json());
    }
  }
};
</script>
```
:::

### 仅显示最后一级

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-cascader
        v-model="value"
        placeholder="仅显示最后一级"
        :show-all-levels="false"
        clearable
        :api="fetch_cascader_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="JSON.stringify(value)" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: []
    };
  },
  methods: {
    fetch_cascader_options() {
      return fetch('/api/cascaderData').then((r) => r.json());
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
    <el-button size="mini" @click="bump_params">刷新选项</el-button>
    <div style="margin-top: 12px;">
      <el-api-cascader
        v-model="value"
        clearable
        placeholder="点击按钮触发重新加载"
        :api="fetch_cascader_options"
        :params="params"
      />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: [],
      params: { t: 1 }
    };
  },
  methods: {
    bump_params() {
      this.params = { t: (this.params && this.params.t ? this.params.t : 0) + 1 };
    },
    fetch_cascader_options(params) {
      const query = params && params.t != null ? `?t=${encodeURIComponent(String(params.t))}` : '';
      return fetch(`/api/cascaderData${query}`).then((r) => r.json());
    }
  }
};
</script>
```
:::

### 映射字段（`afterFetch`）

当接口返回项字段不是 `label/value/children` 时，可用 `afterFetch` 将其映射为级联选项结构。

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-cascader
        v-model="value"
        clearable
        placeholder="通过 afterFetch 映射字段"
        :api="fetch_backend_tree"
        :after-fetch="map_to_cascader_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="JSON.stringify(value)" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: []
    };
  },
  methods: {
    fetch_backend_tree() {
      return fetch('/api/cascaderData')
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
    map_to_cascader_options(list) {
      const safe_list = Array.isArray(list) ? list : [];
      return safe_list.map((item) => {
        const children = item && Array.isArray(item.nodes) ? item.nodes : [];
        return {
          label: item && item.name != null ? item.name : '',
          value: item && item.id != null ? item.id : '',
          children: children.map((c) => ({
            label: c && c.label != null ? c.label : '',
            value: c && c.value != null ? c.value : ''
          }))
        };
      });
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
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-cascader
        v-model="value"
        clearable
        placeholder="使用 resultField 提取 list"
        :api="fetch_wrapped_options"
        result-field="data.list"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="JSON.stringify(value)" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: []
    };
  },
  methods: {
    fetch_wrapped_options() {
      return fetch('/api/cascaderData').then((r) => r.json()).then((list) => ({ data: { list } }));
    }
  }
};
</script>
```
:::

### 自定义节点内容

可通过默认 scoped slot 自定义节点内容（透传至 `el-cascader`）。

:::demo
```html
<template>
  <el-api-cascader
    v-model="value"
    clearable
    placeholder="自定义节点内容"
    :api="fetch_cascader_options"
  >
    <template slot-scope="{ node, data }">
      <span>{{ data.label }}</span>
      <span v-if="!node.isLeaf"> ({{ (data.children || []).length }}) </span>
    </template>
  </el-api-cascader>
</template>

<script>
export default {
  data() {
    return {
      value: []
    };
  },
  methods: {
    fetch_cascader_options() {
      return fetch('/api/cascaderData').then((r) => r.json());
    }
  }
};
</script>
```
:::

### 属性

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value / v-model | 绑定值（参考 `el-cascader` 的 `value`） | any | — |
| api | 请求函数，返回数组或 Promise | Function | — |
| params | 请求参数（对象变更会触发重新加载） | object | `{}` |
| resultField | 从返回值中提取列表的路径（点号路径） | string | `''` |
| immediate | 是否在创建时立即请求 | boolean | `true` |
| beforeFetch | 请求前参数处理 | Function | — |
| afterFetch | 请求后列表处理 | Function | — |

除以上属性外，`el-cascader` 的属性、事件可通过 `$attrs/$listeners` 透传（例如 `filterable`、`props`、`show-all-levels`、`separator`、`disabled` 等）。

### 插槽

除 `el-cascader` 自身支持的插槽外，本组件不新增插槽。
