<template>
  <el-input
    class="el-date-editor"
    :class="['el-date-editor--' + actualType, inputError ? 'is-error' : '']"
    :readonly="isReadonly"
    :disabled="pickerDisabled"
    :size="pickerSize"
    :name="name"
    v-bind="firstInputId"
    v-clickoutside="handleClose"
    :placeholder="placeholder"
    @focus="handleFocus"
    @keydown.native="handleKeydown"
    :value="displayValue"
    @input="value => userInput = value"
    @change="handleChange"
    @mouseenter.native="handleMouseEnter"
    @mouseleave.native="showClose = false"
    :validateEvent="false"
    ref="reference">
    <i 
      slot="prefix"
      class="el-input__icon"
      :class="triggerClass"
      @click="handleFocus"
    ></i>
    
    <i 
      slot="suffix"
      class="el-input__icon"
      @click="handleClickIcon"
      :class="[showClose ? '' + clearIcon : '']"
      v-if="haveTrigger">
    </i>
  </el-input>
</template>

<script>
/**
 * DatePicker 日期选择器组件
 * 
 * 封装了日期、时间、日期时间等多种类型的选择功能
 * 基于 PickerMixin 混入实现通用逻辑
 * 根据 type 属性动态加载对应的 Panel 组件
 */
import PickerMixin from './picker-mixin';
import DatePanel from '../panel/date';
import DateRangePanel from '../panel/date-range';
import MonthRangePanel from '../panel/month-range';
import DateTimeRangePanel from '../panel/date-time-range';
import MonthPanel from '../panel/month';
import YearPanel from '../panel/year';
import QuarterPanel from '../panel/quarter';
import ElInput from 'rowinself-ui/packages/input';

/**
 * 根据类型获取对应的面板组件
 * @param {String} type - 选择器类型
 * @returns {Object} - 对应的面板组件
 */
const getPanel = function (type) {
  if (type === 'daterange') {
    return DateRangePanel;
  } else if (type === 'datetimerange') {
    return DateTimeRangePanel;
  } else if (type === 'monthrange') {
    return MonthRangePanel;
  } else if (type === 'month' || type === 'months') {
    return MonthPanel;
  } else if (type === 'year' || type === 'years') {
    return YearPanel;
  } else if (type === 'quarter') {
    return QuarterPanel;
  }
  return DatePanel;
};

export default {
  name: 'ElDatePicker',

  components: { ElInput },
  
  // 混入通用 Picker 逻辑
  mixins: [PickerMixin],

  props: {
    // 选择器类型：date, week, month, year, quarter, datetime, dates, months, years
    type: {
      type: String,
      default: 'date'
    },
    // 是否使用箭头进行时间选择
    timeArrowControl: Boolean,
    // 是否显示时间选择器（用于 date 类型下开启时间选择）
    showTime: Boolean
  },

  computed: {
    /**
     * 计算实际使用的类型
     * 如果 type 为 date 且开启了 showTime，则实际类型为 datetime
     * @returns {String}
     */
    actualType() {
      if (this.type === 'date' && this.showTime) {
        return 'datetime';
      }
      return this.type;
    },

    /**
     * 判断输入框是否只读
     * 某些复杂类型（如 dates, week, years, months, quarter）强制为只读，避免用户手动输入格式错误
     * @returns {Boolean}
     */
    isReadonly () {
      return !this.editable || this.readonly || this.actualType === 'dates' || this.actualType === 'week' || this.actualType === 'years' || this.actualType === 'months' || this.actualType === 'quarter';
    }
  },

  watch: {
    /**
     * 监听 type 属性变化
     * 当类型变化时，需要重新挂载对应的面板
     */
    type(type) {
      if (this.picker) {
        // 卸载旧面板，清除事件监听和 DOM
        this.unmountPicker();
        // 获取新类型的面板组件
        this.panel = getPanel(type);
        // 挂载新面板，重新初始化
        this.mountPicker();
      } else {
        // 如果选择器尚未实例化，仅更新面板组件引用
        this.panel = getPanel(type);
      }
    },

    /**
     * 监听 showTime 属性变化
     * 仅在 type 为 date 时生效，切换 date 和 datetime 面板
     */
    showTime(val) {
      if (this.type === 'date') {
        if (this.picker) {
          // 卸载当前面板
          this.unmountPicker();
          // 根据 showTime 切换面板组件 (DateTimePanel 或 DatePanel)
          this.panel = DatePanel;
          // 重新挂载面板
          this.mountPicker();
        } else {
          // 更新面板组件引用
          this.panel = DatePanel;
        }
      }
    }
  },

  created() {
    // 组件创建时，根据 type 初始化面板组件
    this.panel = getPanel(this.type);
  }
};
</script>
