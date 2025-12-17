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
    <el-color-picker v-model="color1Model" :show-alpha="showAlpha" v-bind="leftProps" />
    <el-divider :style="mergedDividerStyle" />
    <el-color-picker v-model="color2Model" :show-alpha="showAlpha" v-bind="rightProps" />
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
        this.$emit('input', {
          selectValue: safe_next_value.selectValue,
          color1: safe_next_value.color1,
          color2: safe_next_value.color2
        });
      }
    },
    selectValueModel: {
      get() {
        return this.normalizedValue.selectValue;
      },
      set(next_value) {
        this.normalizedValue = Object.assign({}, this.normalizedValue, { selectValue: next_value });
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
  }
};
</script>

<style scoped>
  .rw-color-picker-link {
    display: flex;
    align-items: center;
  }
</style>
