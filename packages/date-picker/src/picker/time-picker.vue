<template>
  <span>
    <!-- 单个时间选择器输入框 -->
    <el-input
      class="el-date-editor"
      :class="['el-date-editor--' + actualType, inputError ? 'is-error' : '']"
      :readonly="!editable || readonly"
      :disabled="pickerDisabled"
      :size="pickerSize"
      :name="name"
      v-bind="firstInputId"
      v-if="!ranged"
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
        @click="handleFocus">
      </i>
      <i 
        slot="suffix"
        class="el-input__icon"
        @click="handleClickIcon"
        :class="[showClose ? '' + clearIcon : '']"
        v-if="haveTrigger">
      </i>
    </el-input>

    <!-- 范围时间选择器输入框 -->
    <div
      class="el-date-picker el-date-range-picker el-input__inner"
      :class="[
        'el-date-editor--' + type,
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
      v-clickoutside="handleClose"
      v-else>
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
        @focus="handleFocus"
        :class="['el-range-input', rangePreview && rangePreview.minIsPreview ? 'is-preview' : '']"/>
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
        @focus="handleFocus"
        :class="['el-range-input', rangePreview && rangePreview.maxIsPreview ? 'is-preview' : '']"/>
      <i
        @click="handleClickIcon"
        v-if="haveTrigger"
        :class="[showClose ? '' + clearIcon : '']"
        class="el-input__icon el-range__close-icon">
      </i>
    </div>
  </span>
</template>

<script>
import PickerMixin from './picker-mixin';
import TimePanel from '../panel/time';
import TimeRangePanel from '../panel/time-range';
import ElInput from 'rowinself-ui/packages/input';

export default {
  name: 'ElTimePicker',

  components: { ElInput },
  
  // 混入通用 Picker 逻辑
  mixins: [PickerMixin],

  props: {
    // 是否为时间范围选择
    isRange: Boolean,
    // 是否使用箭头控制
    arrowControl: Boolean
  },

  data() {
    return {
      // 内部维护的类型：time 或 timerange
      type: ''
    };
  },

  watch: {
    /**
     * 监听 isRange 属性变化
     * 切换时间点选择和时间范围选择
     */
    isRange(isRange) {
      if (this.picker) {
        this.unmountPicker();
        this.type = isRange ? 'timerange' : 'time';
        this.panel = isRange ? TimeRangePanel : TimePanel;
        this.mountPicker();
      } else {
        this.type = isRange ? 'timerange' : 'time';
        this.panel = isRange ? TimeRangePanel : TimePanel;
      }
    }
  },

  created() {
    // 初始化类型和面板
    this.type = this.isRange ? 'timerange' : 'time';
    this.panel = this.isRange ? TimeRangePanel : TimePanel;
  }
};
</script>
