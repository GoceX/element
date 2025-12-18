<template>
  <div class="rw-color-picker-link" :style="containerStyle">
    <el-select
      v-if="showSelect"
      v-model="selectValueModel"
      :style="mergedSelectStyle"
      v-bind="selectProps"
      
    >
      <el-option
        v-for="option in selectOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
    <el-color-picker v-model="color1Model" type="input" :show-alpha="showAlpha" v-bind="leftProps" />
    <el-divider :style="mergedDividerStyle" />
    <el-color-picker v-model="color2Model" type="input" :show-alpha="showAlpha" v-bind="rightProps" />
  </div>
</template>

<script>
export default {
  name: 'ColorPickerLink',
  props: {
    value: {
      type: [String, Object],
      default: ''
    },
    showSelect: {
      type: Boolean,
      default: true
    },
    showAlpha: {
      type: Boolean,
      default: true
    },
    selectProps: {
      type: Object,
      default: () => ({})
    },
    selectStyle: {
      type: Object,
      default: () => ({})
    },
    selectOptions: {
      type: Array,
      default: () => ([])
    },
    dividerStyle: {
      type: Object,
      default: () => ({})
    },
    containerStyle: {
      type: Object,
      default: () => ({})
    },
    leftProps: {
      type: Object,
      default: () => ({})
    },
    rightProps: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    normalizedValue: {
      get() {
        if (this.value && typeof this.value === 'object') {
          return {
            selectValue: this.value.selectValue,
            color1: this.value.color1,
            color2: this.value.color2
          };
        }
        return {
          selectValue: this.value,
          color1: this.value,
          color2: this.value
        };
      },
      set(nextValue) {
        const safe_next_value = nextValue && typeof nextValue === 'object' ? nextValue : {};
        const payload = {
          selectValue: safe_next_value.selectValue,
          color1: safe_next_value.color1,
          color2: safe_next_value.color2
        };
        this.$emit('input', payload);
        this.$emit('change', payload);
        this.$emit('update:value', payload);
      }
    },
    selectValueModel: {
      get() {
        return this.normalizedValue.selectValue;
      },
      set(next_value) {
        const next_normalized_value = this.build_next_value_by_select(next_value);
        this.normalizedValue = next_normalized_value;
      }
    },
    color1Model: {
      get() {
        return this.normalizedValue.color1;
      },
      set(next_value) {
        this.normalizedValue = Object.assign({}, this.normalizedValue, { color1: next_value });
      }
    },
    color2Model: {
      get() {
        return this.normalizedValue.color2;
      },
      set(next_value) {
        this.normalizedValue = Object.assign({}, this.normalizedValue, { color2: next_value });
      }
    },
    mergedSelectStyle() {
      return Object.assign(
        {
          width: '140px',
          marginRight: '20px'
        },
        this.selectStyle || {}
      );
    },
    mergedDividerStyle() {
      return Object.assign(
        {
          width: '32px',
          margin: 'auto 10px'
        },
        this.dividerStyle || {}
      );
    }
  },
  methods: {
    build_next_value_by_select(next_select_value) {
      const base_value = this.normalizedValue;
      const next_value = Object.assign({}, base_value, { selectValue: next_select_value });

      const options = Array.isArray(this.selectOptions) ? this.selectOptions : [];
      const matched_option = options.find((option) => option && option.value === next_select_value);
      const colors = matched_option && Array.isArray(matched_option.colors) ? matched_option.colors : null;

      if (Array.isArray(colors) && colors.length >= 2) {
        next_value.color1 = colors[0];
        next_value.color2 = colors[1];
      }

      return next_value;
    }
  }
};
</script>

<style scoped>
  .rw-color-picker-link {
    display: flex;
    align-items: center;
  }
</style>
