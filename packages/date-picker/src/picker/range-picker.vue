<template>
  <div
    class="el-date-editor el-range-editor el-input__inner"
    :class="[
      'el-date-editor--' + actualType,
      pickerSize ? `el-range-editor--${ pickerSize }` : '',
      pickerDisabled ? 'is-disabled' : '',
      pickerVisible ? 'is-active' : '',
      rangeInputError ? 'is-error' : ''
    ]"
    @click="handleRangeClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="showClose = false"
    @keydown="handleKeydown"
    ref="reference"
    v-clickoutside="handleClose">
    <i :class="['el-input__icon', 'el-range__icon', triggerClass]"></i>
    <input
      autocomplete="off"
      :placeholder="startPlaceholder"
      :value="displayValue && displayValue[0]"
      :disabled="pickerDisabled"
      v-bind="firstInputId"
      :readonly="!editable || readonly"
      :name="name && name[0]"
      @input="handleStartInput"
      @change="handleStartChange"
      @focus="handleInputFocus(0)"
      @blur="handleInputBlur"
      ref="minInput"
      :class="['el-range-input', rangePreview && rangePreview.minIsPreview ? 'is-preview' : '', focusedInputIndex === 0 ? 'is-focused' : '']"/>
    <slot name="range-separator">
      <span class="el-range-separator">{{ rangeSeparator }}</span>
    </slot>
    <input
      autocomplete="off"
      :placeholder="endPlaceholder"
      :value="displayValue && displayValue[1]"
      :disabled="pickerDisabled"
      v-bind="secondInputId"
      :readonly="!editable || readonly"
      :name="name && name[1]"
      @input="handleEndInput"
      @change="handleEndChange"
      @focus="handleInputFocus(1)"
      @blur="handleInputBlur"
      ref="maxInput"
      :class="['el-range-input', rangePreview && rangePreview.maxIsPreview ? 'is-preview' : '', focusedInputIndex === 1 ? 'is-focused' : '']"/>
    <i
      @click="handleClickIcon"
      v-if="haveTrigger"
      :class="[showClose ? '' + clearIcon : clearIcon]"
      class="el-input__icon el-range__close-icon">
    </i>
  </div>
</template>

<script>
import PickerMixin from './picker-mixin';
import DateRangePanel from '../panel/date-range';
import DateTimeRangePanel from '../panel/date-time-range';
import MonthRangePanel from '../panel/month-range';
import YearRangePanel from '../panel/year-range';
import QuarterRangePanel from '../panel/quarter-range';
import TimeRangePanel from '../panel/time-range';
import WeekRangePanel from '../panel/week-range';

/**
 * 根据类型获取对应的范围面板组件
 * @param {String} type - 选择器类型
 * @returns {Object} - 对应的面板组件
 */
const getPanel = function(type) {
  if (type === 'date') {
    return DateRangePanel;
  } else if (type === 'month') {
    return MonthRangePanel;
  } else if (type === 'time') {
    return TimeRangePanel;
  } else if (type === 'year') {
    return YearRangePanel;
  } else if (type === 'quarter') {
    return QuarterRangePanel;
  } else if (type === 'week') {
    return WeekRangePanel;
  }
  return DateRangePanel;
};

export default {
  name: 'ElRangePicker',
  
  // 混入通用 Picker 逻辑
  mixins: [PickerMixin],

  props: {
    // 选择器类型：date, time, month, week, year, quarter
    type: {
      type: String,
      default: 'date'
    },
    // 是否显示时间
    showTime: Boolean,
    // 是否使用箭头控制时间
    timeArrowControl: Boolean
  },

  data() {
    return {
      focusedInputIndex: -1
    };
  },

  computed: {
    /**
     * 计算实际使用的类型
     * 将简写的 type 转换为完整的 range 类型名称
     * @returns {String}
     */
    actualType() {
      if (this.type === 'date') {
        return this.showTime ? 'datetimerange' : 'daterange';
      }
      if (this.type === 'time') {
        return 'timerange';
      }
      if (this.type === 'month') {
        return 'monthrange';
      }
      if (this.type === 'week') {
        return 'weekrange';
      }
      if (this.type === 'year') {
        return 'yearrange';
      }
      if (this.type === 'quarter') {
        return 'quarterrange';
      }
      return 'daterange';
    }
  },

  watch: {
    /**
     * 监听 type 变化，动态切换面板
     */
    type(type) {
      if (this.picker) {
        this.unmountPicker();
        this.panel = getPanel(type);
        // 特殊处理 date 类型开启 showTime 的情况
        if (type === 'date' && this.showTime) {
            this.panel = DateTimeRangePanel;
        }
        this.mountPicker();
      } else {
        this.panel = getPanel(type);
        if (type === 'date' && this.showTime) {
            this.panel = DateTimeRangePanel;
        }
      }
    },
    /**
     * 监听 showTime 变化，切换日期范围和日期时间范围面板
     */
    showTime(val) {
        if (this.type === 'date') {
            if (this.picker) {
                this.unmountPicker();
                this.panel = val ? DateTimeRangePanel : DateRangePanel;
                this.mountPicker();
            } else {
                this.panel = val ? DateTimeRangePanel : DateRangePanel;
            }
        }
    }
  },
  
  watch: {
    focusedInputIndex(val) {
      if (this.picker) {
        this.picker.focusedInputIndex = val;
      }
    },
    pickerVisible(val) {
      if (val && this.picker) {
        this.picker.focusedInputIndex = this.focusedInputIndex;
      }
    }
  },

  created() {
    // 初始化面板
    this.panel = getPanel(this.type);
    if (this.type === 'date' && this.showTime) {
        this.panel = DateTimeRangePanel;
    }
  },

  methods: {
    handleInputFocus(index) {
      this.focusedInputIndex = index;
      this.handleFocus();
    },
    handleInputBlur() {
      this.focusedInputIndex = -1;
    },
    handlePickStartDate() {
      this.$nextTick(() => {
        if (this.$refs.maxInput) {
          this.$refs.maxInput.focus();
        }
        this.focusedInputIndex = 1;
      });
    },
    handlePickEndDate() {
      this.$nextTick(() => {
        if (this.$refs.minInput) {
          this.$refs.minInput.focus();
        }
        this.focusedInputIndex = 0;
      });
    }
  },
};
</script>

<style scoped>
.el-range-input.is-focused {
  border-bottom: 2px solid #409EFF;
}
</style>
