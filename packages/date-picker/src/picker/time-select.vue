<template>
  <el-input
    class="el-date-editor"
    :class="['el-date-editor--' + actualType, inputError ? 'is-error' : '']"
    :readonly="!editable || readonly"
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
</template>

<script>
import PickerMixin from './picker-mixin';
import Panel from '../panel/time-select';
import ElInput from 'rowinself-ui/packages/input';

export default {
  name: 'ElTimeSelect',

  components: { ElInput },
  
  // 混入通用 Picker 逻辑
  mixins: [PickerMixin],

  componentName: 'ElTimeSelect',

  props: {
    // 选择器类型，默认为 time-select
    type: {
      type: String,
      default: 'time-select'
    }
  },

  beforeCreate() {
    // 固定使用 TimeSelect 面板
    this.panel = Panel;
  }
};
</script>
