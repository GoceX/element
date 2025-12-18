## ApiSelect 选择器

通过 `api` 方法远程加载选项数据，并渲染为下拉选择器。

本页示例使用本地 mock：`/api/selectData`、`/api/roleOptions`。

### 基础用法

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-select
        v-model="value"
        placeholder="请选择城市"
        clearable
        filterable
        :api="fetch_city_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="value" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: ''
    };
  },
  methods: {
    fetch_city_options() {
      return fetch('/api/selectData').then((r) => r.json());
    }
  }
};
</script>
```
:::

### 分组选项

:::demo
```html
<template>
  <el-api-select
    v-model="value"
    placeholder="请选择（支持分组）"
    :api="fetch_city_options"
  />
</template>

<script>
export default {
  data() {
    return {
      value: ''
    };
  },
  methods: {
    fetch_city_options() {
      return fetch('/api/selectData').then((r) => r.json());
    }
  }
};
</script>
```
:::

### 映射字段（afterFetch）

当接口返回项字段不是 `label/value`（例如 `{ id, name }`）时，可用 `afterFetch` 做映射。

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-select
        v-model="role_id"
        placeholder="请选择角色"
        clearable
        :api="fetch_role_options"
        result-field="data"
        :after-fetch="map_role_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="String(role_id || '')" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      role_id: ''
    };
  },
  methods: {
    fetch_role_options(params) {
      return fetch('/api/roleOptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {})
      }).then((r) => r.json());
    },
    map_role_options(list) {
      const safe_list = Array.isArray(list) ? list : [];
      return safe_list.map((item) => ({
        label: item && item.name != null ? item.name : '',
        value: item && item.id != null ? item.id : ''
      }));
    }
  }
};
</script>
```
:::

### 多选

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-select
        v-model="values"
        multiple
        collapse-tags
        clearable
        filterable
        placeholder="请选择多个城市"
        :api="fetch_city_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="JSON.stringify(values)" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      values: []
    };
  },
  methods: {
    fetch_city_options() {
      return fetch('/api/selectData')
        .then((r) => r.json())
        .catch(() => []);
    }
  }
};
</script>
```
:::

### 禁用状态

:::demo
```html
<template>
  <div>
    <el-switch v-model="is_disabled" active-text="禁用" inactive-text="启用" />
    <div style="margin-top: 12px;">
      <el-api-select
        v-model="value"
        clearable
        filterable
        placeholder="请选择城市"
        :disabled="is_disabled"
        :api="fetch_city_options"
      />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: '',
      is_disabled: false
    };
  },
  methods: {
    fetch_city_options() {
      return fetch('/api/selectData')
        .then((r) => r.json())
        .catch(() => []);
    }
  }
};
</script>
```
:::

### 禁用选项

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-select
        v-model="value"
        clearable
        filterable
        placeholder="包含禁用选项"
        :api="fetch_city_options"
        :after-fetch="decorate_disabled_options"
      />
    </el-col>
    <el-col :span="12">
      <el-input :value="value" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: ''
    };
  },
  methods: {
    fetch_city_options() {
      return fetch('/api/selectData')
        .then((r) => r.json())
        .catch(() => []);
    },
    decorate_disabled_options(list) {
      const safe_list = Array.isArray(list) ? list : [];
      return safe_list.map((item) => {
        if (item && item.value === 'beijing') {
          return Object.assign({}, item, { disabled: true });
        }
        if (item && item.label === '热门城市') {
          const children = Array.isArray(item.children) ? item.children : [];
          return Object.assign({}, item, {
            children: children.map((child) => {
              if (child && child.value === 'hangzhou') {
                return Object.assign({}, child, { disabled: true });
              }
              return child;
            })
          });
        }
        return item;
      });
    }
  }
};
</script>
```
:::

### 自定义模板

:::demo
```html
<template>
  <div>
    <el-switch v-model="is_empty" active-text="空数据" inactive-text="正常" />
    <div style="margin-top: 12px;">
      <el-api-select
        v-model="value"
        clearable
        filterable
        placeholder="自定义 prefix / empty"
        :params="{ is_empty }"
        :api="fetch_city_options"
      >
        <template #prefix>
          <i class="el-icon-search" />
        </template>
        <template #option="{ item }">
          <span style="float: left">{{ item.label }}</span>
          <span style="float: right; color: #8492a6; font-size: 13px">{{ item.value }}</span>
        </template>
        <template #empty>
          <div style="padding: 12px 0; color: #999; text-align: center;">
            暂无数据
          </div>
        </template>
      </el-api-select>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: '',
      is_empty: false
    };
  },
  methods: {
    fetch_city_options(params) {
      const is_empty = !!(params && params.is_empty);
      if (is_empty) return Promise.resolve([]);
      return fetch('/api/selectData')
        .then((r) => r.json())
        .catch(() => []);
    }
  }
};
</script>
```
:::

### 可搜索

`filterable` 会启用 `el-select` 的本地筛选能力，选项加载后即可按关键字过滤。

:::demo
```html
<template>
  <el-row :gutter="12">
    <el-col :span="12">
      <el-api-select
        v-model="value"
        clearable
        filterable
        default-first-option
        placeholder="输入关键字搜索"
        :api="fetch_city_options"
      >
        <template #prefix>
          <i class="el-icon-search" />
        </template>
      </el-api-select>
    </el-col>
    <el-col :span="12">
      <el-input :value="value" readonly />
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      value: ''
    };
  },
  methods: {
    fetch_city_options() {
      return fetch('/api/selectData')
        .then((r) => r.json())
        .catch(() => []);
    }
  }
};
</script>
```
:::

### 属性

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value / v-model | 绑定值 | any | — |
| api | 请求函数，返回数组或 Promise | Function | — |
| params | 请求参数（对象变更会触发重新加载） | object | `{}` |
| resultField | 从返回值中提取列表的路径（点号路径） | string | `''` |
| immediate | 是否在创建时立即请求 | boolean | `true` |
| beforeFetch | 请求前参数处理 | Function | — |
| afterFetch | 请求后列表处理 | Function | — |

除以上属性外，`el-select` 的属性、事件可通过 `$attrs/$listeners` 透传（例如 `multiple`、`filterable`、`disabled` 等）。

### 插槽

| 插槽名 | 说明 |
| --- | --- |
| prefix | 输入框头部内容 |
| empty | 无匹配选项时的内容 |
| option | 自定义选项内容（作用域参数: `{ item }`） |

### 方法

| 方法名 | 说明 |
| --- | --- |
| focus | 聚焦 |
| blur | 失焦 |
