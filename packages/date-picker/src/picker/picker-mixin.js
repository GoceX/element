
import Vue from 'vue';
import Clickoutside from 'rowinself-ui/src/utils/clickoutside';
import { formatDate, parseDate, isDateObject, getWeekNumber } from 'rowinself-ui/src/utils/date-util';
import Popper from 'rowinself-ui/src/utils/vue-popper';
import Emitter from 'rowinself-ui/src/mixins/emitter';
import merge from 'rowinself-ui/src/utils/merge';

/**
 * PickerMixin
 * 
 * 日期选择器的核心混入对象
 * 负责处理选择器的通用逻辑，包括：
 * 1. 弹出层的管理（显示/隐藏、定位）
 * 2. 值的解析与格式化
 * 3. 输入框的事件处理（聚焦、失焦、键盘事件）
 * 4. 值的校验与同步
 */
/**
 * 自定义 Popper 配置对象
 * 继承自 Element UI 的 VuePopper，用于处理弹出层定位
 */
const NewPopper = {
  props: {
    appendToBody: Popper.props.appendToBody,
    offset: Popper.props.offset,
    boundariesPadding: Popper.props.boundariesPadding,
    arrowOffset: Popper.props.arrowOffset,
    transformOrigin: Popper.props.transformOrigin
  },
  methods: Popper.methods,
  data() {
    return merge({ visibleArrow: true }, Popper.data);
  },
  beforeDestroy: Popper.beforeDestroy
};

/**
 * 默认日期格式映射表
 * 定义了不同选择器类型的默认显示格式
 */
const DEFAULT_FORMATS = {
  date: 'yyyy-MM-dd',
  month: 'yyyy-MM',
  months: 'yyyy-MM',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  time: 'HH:mm:ss',
  week: 'yyyyWW',
  timerange: 'HH:mm:ss',
  daterange: 'yyyy-MM-dd',
  monthrange: 'yyyy-MM',
  datetimerange: 'yyyy-MM-dd HH:mm:ss',
  year: 'yyyy',
  years: 'yyyy',
  quarter: "yyyy-'Q'q",
  weekrange: 'yyyyWW',
  yearrange: 'yyyy',
  quarterrange: "yyyy-'Q'q"
};

/**
 * 拥有触发行为的类型列表
 * 这些类型的选择器支持通过点击输入框或图标触发展示
 */
const HAVE_TRIGGER_TYPES = [
  'date',
  'datetime',
  'time',
  'time-select',
  'week',
  'month',
  'year',
  'quarter',
  'daterange',
  'monthrange',
  'timerange',
  'datetimerange',
  'dates',
  'months',
  'years',
  'weekrange',
  'yearrange',
  'quarterrange'
];

/**
 * 基础日期格式化函数
 * @param {Date} value - 日期对象
 * @param {String} format - 格式字符串
 * @returns {String|Number} - 格式化后的字符串或时间戳
 */
const DATE_FORMATTER = function(value, format) {
  if (format === 'timestamp') return value.getTime();
  return formatDate(value, format);
};

/**
 * 基础日期解析函数
 * @param {String} text - 日期字符串
 * @param {String} format - 格式字符串
 * @returns {Date} - 解析后的日期对象
 */
const DATE_PARSER = function(text, format) {
  if (format === 'timestamp') return new Date(Number(text));
  return parseDate(text, format);
};

/**
 * 范围选择格式化函数
 * @param {Array} value - 日期数组 [start, end]
 * @param {String} format - 格式字符串
 * @returns {Array} - 格式化后的字符串数组
 */
const RANGE_FORMATTER = function(value, format) {
  if (Array.isArray(value) && value.length === 2) {
    const start = value[0];
    const end = value[1];

    if (start && end) {
      return [DATE_FORMATTER(start, format), DATE_FORMATTER(end, format)];
    }
  }
  return '';
};

const WEEK_FORMATTER = function(value, format) {
  let week = getWeekNumber(value);
  let month = value.getMonth();
  const trueDate = new Date(value);
  if (week === 1 && month === 11) {
    trueDate.setHours(0, 0, 0, 0);
    trueDate.setDate(trueDate.getDate() + 3 - (trueDate.getDay() + 6) % 7);
  }
  let date = formatDate(trueDate, format);

  date = /WW/.test(date)
    ? date.replace(/WW/, week < 10 ? '0' + week : week)
    : date.replace(/W/, week);
  return date;
};

const RANGE_WEEK_FORMATTER = function(value, format) {
  if (Array.isArray(value) && value.length === 2) {
    const start = value[0];
    const end = value[1];

    if (start && end) {
      return [WEEK_FORMATTER(start, format), WEEK_FORMATTER(end, format)];
    }
  }
  return '';
};

/**
 * 范围选择解析函数
 * @param {Array|String} array - 日期字符串数组或分隔符连接的字符串
 * @param {String} format - 格式字符串
 * @param {String} separator - 分隔符
 * @returns {Array} - 解析后的日期对象数组
 */
const RANGE_PARSER = function(array, format, separator) {
  if (!Array.isArray(array)) {
    array = array.split(separator);
  }
  if (array.length === 2) {
    const range1 = array[0];
    const range2 = array[1];

    return [DATE_PARSER(range1, format), DATE_PARSER(range2, format)];
  }
  return [];
};

/**
 * 类型值解析器映射表
 * 定义了不同类型的 formatter 和 parser 实现
 */
const TYPE_VALUE_RESOLVER_MAP = {
  default: {
    formatter(value) {
      if (!value) return '';
      return '' + value;
    },
    parser(text) {
      if (text === undefined || text === '') return null;
      return text;
    }
  },
  week: {
    formatter: WEEK_FORMATTER,
    parser(text, format) {
      return TYPE_VALUE_RESOLVER_MAP.date.parser(text, format);
    }
  },
  date: {
    formatter: DATE_FORMATTER,
    parser: DATE_PARSER
  },
  datetime: {
    formatter: DATE_FORMATTER,
    parser: DATE_PARSER
  },
  daterange: {
    formatter: RANGE_FORMATTER,
    parser: RANGE_PARSER
  },
  monthrange: {
    formatter: RANGE_FORMATTER,
    parser: RANGE_PARSER
  },
  datetimerange: {
    formatter: RANGE_FORMATTER,
    parser: RANGE_PARSER
  },
  timerange: {
    formatter: RANGE_FORMATTER,
    parser: RANGE_PARSER
  },
  weekrange: {
    formatter: RANGE_WEEK_FORMATTER,
    parser: RANGE_PARSER
  },
  yearrange: {
    formatter: RANGE_FORMATTER,
    parser: RANGE_PARSER
  },
  quarterrange: {
    formatter: RANGE_FORMATTER,
    parser: RANGE_PARSER
  },
  time: {
    formatter: DATE_FORMATTER,
    parser: DATE_PARSER
  },
  month: {
    formatter: DATE_FORMATTER,
    parser: DATE_PARSER
  },
  year: {
    formatter: DATE_FORMATTER,
    parser: DATE_PARSER
  },
  quarter: {
    formatter: DATE_FORMATTER,
    parser: DATE_PARSER
  },
  number: {
    formatter(value) {
      if (!value) return '';
      return '' + value;
    },
    parser(text) {
      let result = Number(text);

      if (!isNaN(text)) {
        return result;
      } else {
        return null;
      }
    }
  },
  dates: {
    formatter(value, format) {
      return value.map(date => DATE_FORMATTER(date, format));
    },
    parser(value, format) {
      return (typeof value === 'string' ? value.split(', ') : value)
        .map(date => date instanceof Date ? date : DATE_PARSER(date, format));
    }
  },
  months: {
    formatter(value, format) {
      return value.map(date => DATE_FORMATTER(date, format));
    },
    parser(value, format) {
      return (typeof value === 'string' ? value.split(', ') : value)
        .map(date => date instanceof Date ? date : DATE_PARSER(date, format));
    }
  },
  years: {
    formatter(value, format) {
      return value.map(date => DATE_FORMATTER(date, format));
    },
    parser(value, format) {
      return (typeof value === 'string' ? value.split(', ') : value)
        .map(date => date instanceof Date ? date : DATE_PARSER(date, format));
    }
  }
};

/**
 * 弹出层位置映射表
 */
const PLACEMENT_MAP = {
  left: 'bottom-start',
  center: 'bottom',
  right: 'bottom-end'
};

/**
 * 根据格式和类型解析值
 * @param {any} value - 待解析的值
 * @param {String} customFormat - 自定义格式
 * @param {String} type - 选择器类型
 * @param {String} rangeSeparator - 范围分隔符
 * @returns {any} - 解析后的值
 */
const parseAsFormatAndType = (value, customFormat, type, rangeSeparator = '-') => {
  if (!value) return null;
  const parser = (
    TYPE_VALUE_RESOLVER_MAP[type] ||
    TYPE_VALUE_RESOLVER_MAP['default']
  ).parser;
  const format = customFormat || DEFAULT_FORMATS[type];
  return parser(value, format, rangeSeparator);
};

/**
 * 根据格式和类型格式化值
 * @param {any} value - 待格式化的值
 * @param {String} customFormat - 自定义格式
 * @param {String} type - 选择器类型
 * @returns {any} - 格式化后的值
 */
const formatAsFormatAndType = (value, customFormat, type) => {
  if (!value) return null;
  const formatter = (
    TYPE_VALUE_RESOLVER_MAP[type] ||
    TYPE_VALUE_RESOLVER_MAP['default']
  ).formatter;
  const format = customFormat || DEFAULT_FORMATS[type];
  return formatter(value, format);
};

/**
 * 判断两个值是否相等
 * 支持 Date 对象和数组的深度比较
 * @param {any} a - 值 A
 * @param {any} b - 值 B
 * @returns {Boolean} - 是否相等
 */
const valueEquals = function(a, b) {
  const dateEquals = function(a, b) {
    const aIsDate = a instanceof Date;
    const bIsDate = b instanceof Date;
    if (aIsDate && bIsDate) {
      return a.getTime() === b.getTime();
    }
    if (!aIsDate && !bIsDate) {
      return a === b;
    }
    return false;
  };

  const aIsArray = a instanceof Array;
  const bIsArray = b instanceof Array;
  if (aIsArray && bIsArray) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => dateEquals(item, b[index]));
  }
  if (!aIsArray && !bIsArray) {
    return dateEquals(a, b);
  }
  return false;
};

/**
 * 判断是否为字符串
 * @param {any} val - 待检查的值
 * @returns {Boolean} - 是否为字符串
 */
const isString = function(val) {
  return typeof val === 'string' || val instanceof String;
};

/**
 * 校验器函数
 * @param {any} val - 待校验的值
 * @returns {Boolean} - 是否有效
 */
const validator = function(val) {
  return (
    val === null ||
    val === undefined ||
    isString(val) ||
    (Array.isArray(val) && val.length === 2 && val.every(isString))
  );
};

/**
 * PickerMixin 混入对象
 * 提供了日期选择器的通用逻辑，包括弹出层管理、输入处理、值格式化等
 */
export default {
  mixins: [Emitter, NewPopper],

  inject: {
    elForm: {
      default: ''
    },
    elFormItem: {
      default: ''
    }
  },

  directives: { Clickoutside },

  props: {
    size: String, // 尺寸
    format: String, // 显示格式
    valueFormat: String, // 绑定值格式
    readonly: Boolean, // 是否只读
    placeholder: String, // 占位符
    startPlaceholder: String, // 范围选择开始占位符
    endPlaceholder: String, // 范围选择结束占位符
    prefixIcon: String, // 前缀图标
    clearIcon: { // 清除图标
      type: String,
      default: 'el-icon-circle-close'
    },
    name: { // 原生 name 属性
      default: '',
      validator
    },
    disabled: Boolean, // 是否禁用
    clearable: { // 是否可清除
      type: Boolean,
      default: true
    },
    id: { // 原生 id 属性
      default: '',
      validator
    },
    popperClass: String, // 弹出层类名
    editable: { // 是否可编辑
      type: Boolean,
      default: true
    },
    align: { // 对齐方式
      type: String,
      default: 'left'
    },
    value: { // 绑定值
      type: [Date, Array, String, Number],
      default: null
    },
    defaultValue: { // 默认值
      type: [Date, Array, String, Number],
      default: null
    },
    defaultTime: { // 默认时间
      type: [String, Array],
      default: ''
    },
    rangeSeparator: { // 范围选择分隔符
      type: String,
      default: '-'
    },
    pickerOptions: { // 特殊选项，如禁用日期等
      type: Object,
      default: () => ({})
    },
    unlinkPanels: Boolean, // 范围选择时是否取消两个面板的联动
    validateEvent: { // 是否触发表单验证
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      pickerVisible: false, // 选择器是否可见
      showClose: false, // 是否显示清除按钮
      userInput: null, // 用户输入的值
      valueOnOpen: null, // 打开时的值（用于取消时恢复）
      valueOnOpenParsed: null, // 打开时的解析值
      unwatchPickerOptions: null, // 取消监听 pickerOptions 的函数
      rangePreview: null, // 范围选择预览
      inputError: false, // 输入是否错误
      cancelPending: false, // 是否处于取消等待状态
      rangeInputErrorState: { // 范围输入错误状态
        min: false,
        max: false
      }
    };
  },

  computed: {
    /**
     * 实际使用的类型
     */
    actualType() {
      return this.type;
    },

    /**
     * 是否为范围选择类型
     */
    ranged() {
      return this.actualType.indexOf('range') > -1;
    },

    /**
     * 引用元素（输入框）
     */
    reference() {
      const reference = this.$refs.reference;
      return reference.$el || reference;
    },

    /**
     * 输入框 DOM 元素列表
     */
    refInput() {
      if (this.reference) {
        return [].slice.call(this.reference.querySelectorAll('input'));
      }
      return [];
    },

    /**
     * 判断值是否为空
     */
    valueIsEmpty() {
      const val = this.value;
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length; i < len; i++) {
          if (val[i]) {
            return false;
          }
        }
      } else {
        if (val) {
          return false;
        }
      }
      return true;
    },

    /**
     * 触发器类名（图标）
     */
    triggerClass() {
      return this.prefixIcon || (this.actualType.indexOf('time') !== -1 ? 'el-icon-time' : 'el-icon-date');
    },

    /**
     * 选择模式
     * 决定面板展示的视图类型
     */
    selectionMode() {
      if (this.actualType === 'week') {
        return 'week';
      } else if (this.actualType === 'month') {
        return 'month';
      } else if (this.actualType === 'year') {
        return 'year';
      } else if (this.actualType === 'dates') {
        return 'dates';
      } else if (this.actualType === 'quarter') {
        return 'quarter';
      } else if (this.actualType === 'months') {
        return 'months';
      } else if (this.actualType === 'years') {
        return 'years';
      }

      return 'day';
    },

    /**
     * 是否拥有触发器
     */
    haveTrigger() {
      if (typeof this.showTrigger !== 'undefined') {
        return this.showTrigger;
      }
      return HAVE_TRIGGER_TYPES.indexOf(this.actualType) !== -1;
    },

    /**
     * 显示在输入框中的值
     */
    displayValue() {
      if (this.ranged && this.rangePreview && this.pickerVisible && this.userInput === null) {
        return [this.rangePreview.min || '', this.rangePreview.max || ''];
      }
      const formattedValue = formatAsFormatAndType(this.parsedValue, this.format, this.actualType, this.rangeSeparator);
      if (Array.isArray(this.userInput)) {
        return [
          this.userInput[0] || (formattedValue && formattedValue[0]) || '',
          this.userInput[1] || (formattedValue && formattedValue[1]) || ''
        ];
      } else if (this.userInput !== null) {
        return this.userInput;
      } else if (formattedValue) {
        return (this.actualType === 'dates' || this.actualType === 'years' || this.actualType === 'months')
          ? formattedValue.join(', ')
          : formattedValue;
      } else {
        return '';
      }
    },

    /**
     * 解析后的值（Date 对象或数组）
     */
    parsedValue() {
      if (!this.value) return this.value;
      if (this.actualType === 'time-select') return this.value;

      const valueIsDateObject = isDateObject(this.value) || (Array.isArray(this.value) && this.value.every(isDateObject));
      if (valueIsDateObject) {
        return this.value;
      }

      if (this.valueFormat) {
        return parseAsFormatAndType(this.value, this.valueFormat, this.actualType, this.rangeSeparator) || this.value;
      }

      return Array.isArray(this.value) ? this.value.map(val => new Date(val)) : new Date(this.value);
    },

    /**
     * 范围输入是否有误
     */
    rangeInputError() {
      return this.rangeInputErrorState.min || this.rangeInputErrorState.max;
    },

    _elFormItemSize() {
      return (this.elFormItem || {}).elFormItemSize;
    },

    /**
     * 选择器尺寸
     */
    pickerSize() {
      return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
    },

    /**
     * 选择器是否禁用
     */
    pickerDisabled() {
      return this.disabled || (this.elForm || {}).disabled;
    },

    /**
     * 第一个输入框的 ID
     */
    firstInputId() {
      const obj = {};
      let id;
      if (this.ranged) {
        id = this.id && this.id[0];
      } else {
        id = this.id;
      }
      if (id) obj.id = id;
      return obj;
    },

    /**
     * 第二个输入框的 ID（范围选择时）
     */
    secondInputId() {
      const obj = {};
      let id;
      if (this.ranged) {
        id = this.id && this.id[1];
      }
      if (id) obj.id = id;
      return obj;
    }
  },

  watch: {
    /**
     * 监听选择器显隐状态
     */
    pickerVisible(val) {
      if (this.readonly || this.pickerDisabled) return;
      if (val) {
        this.showPicker();
        this.valueOnOpen = Array.isArray(this.value) ? [...this.value] : this.value;
        this.valueOnOpenParsed = Array.isArray(this.parsedValue) ? [...this.parsedValue] : this.parsedValue;
      } else {
        this.hidePicker();
        if (!this.cancelPending) {
          this.emitChange(this.value);
        }
        this.cancelPending = false;
        this.userInput = null;
        this.rangePreview = null;
        this.inputError = false;
        this.rangeInputErrorState.min = false;
        this.rangeInputErrorState.max = false;
        if (this.validateEvent) {
          this.dispatch('ElFormItem', 'el.form.blur');
        }
        this.$emit('blur', this);
        this.blur();
      }
    },
    /**
     * 监听解析后的值，同步到 picker 实例
     */
    parsedValue: {
      immediate: true,
      handler(val) {
        if (this.picker) {
          this.picker.value = val;
        }
      }
    },
    defaultValue(val) {
      if (this.picker) {
        this.picker.defaultValue = val;
      }
    },
    /**
     * 监听值变化，触发表单验证
     */
    value(val, oldVal) {
      if (!valueEquals(val, oldVal) && !this.pickerVisible && this.validateEvent) {
        this.dispatch('ElFormItem', 'el.form.change', val);
      }
    }
  },

  created() {
    this.popperOptions = {
      boundariesPadding: 0,
      gpuAcceleration: false
    };
    this.placement = PLACEMENT_MAP[this.align] || PLACEMENT_MAP.left;

    this.$on('fieldReset', this.handleFieldReset);
  },

  methods: {
    /**
     * 聚焦输入框
     */
    focus() {
      if (!this.ranged) {
        this.$refs.reference.focus();
      } else {
        this.handleFocus();
      }
    },

    /**
     * 失焦输入框
     */
    blur() {
      this.refInput.forEach(input => input.blur());
    },

    /**
     * 解析值
     */
    parseValue(value) {
      const isParsed = isDateObject(value) || (Array.isArray(value) && value.every(isDateObject));
      if (this.valueFormat && !isParsed) {
        return parseAsFormatAndType(value, this.valueFormat, this.actualType, this.rangeSeparator) || value;
      } else {
        return value;
      }
    },

    /**
     * 格式化值
     */
    formatToValue(date) {
      const isFormattable = isDateObject(date) || (Array.isArray(date) && date.every(isDateObject));
      if (this.valueFormat && isFormattable) {
        return formatAsFormatAndType(date, this.valueFormat, this.actualType, this.rangeSeparator);
      } else {
        return date;
      }
    },

    /**
     * 解析字符串
     */
    parseString(value) {
      const type = Array.isArray(value) ? this.actualType : this.actualType.replace('range', '');
      return parseAsFormatAndType(value, this.format, type);
    },

    /**
     * 格式化为字符串
     */
    formatToString(value) {
      const type = Array.isArray(value) ? this.actualType : this.actualType.replace('range', '');
      return formatAsFormatAndType(value, this.format, type);
    },

    /**
     * 处理鼠标移入
     */
    handleMouseEnter() {
      if (this.readonly || this.pickerDisabled) return;
      if (!this.valueIsEmpty && this.clearable) {
        this.showClose = true;
      }
    },

    /**
     * 处理输入变化
     */
    handleChange() {
      if (this.userInput) {
        const value = this.parseString(this.displayValue);
        if (value) {
          this.picker.value = value;
          if (this.isValidValue(value)) {
            this.emitInput(value);
            this.userInput = null;
            this.inputError = false;
          }
        } else {
          this.inputError = true;
        }
      }
      if (this.userInput === '') {
        this.emitInput(null);
        this.emitChange(null);
        this.userInput = null;
        this.inputError = false;
      }
    },

    /**
     * 处理范围选择开始输入
     */
    handleStartInput(event) {
      if (this.userInput) {
        this.userInput = [event.target.value, this.userInput[1]];
      } else {
        this.userInput = [event.target.value, null];
      }
      this.rangeInputErrorState.min = false;
    },

    /**
     * 处理范围选择结束输入
     */
    handleEndInput(event) {
      if (this.userInput) {
        this.userInput = [this.userInput[0], event.target.value];
      } else {
        this.userInput = [null, event.target.value];
      }
      this.rangeInputErrorState.max = false;
    },

    /**
     * 处理范围选择开始值变化
     */
    handleStartChange(event) {
      const value = this.parseString(this.userInput && this.userInput[0]);
      if (value) {
        this.userInput = [this.formatToString(value), this.displayValue[1]];
        const newValue = [value, this.picker.value && this.picker.value[1]];
        this.picker.value = newValue;
        if (this.isValidValue(newValue)) {
          this.emitInput(newValue);
          this.userInput = null;
        }
        this.rangeInputErrorState.min = false;
      } else if (this.userInput && this.userInput[0]) {
        this.rangeInputErrorState.min = true;
      }
    },

    /**
     * 处理范围选择结束值变化
     */
    handleEndChange(event) {
      const value = this.parseString(this.userInput && this.userInput[1]);
      if (value) {
        this.userInput = [this.displayValue[0], this.formatToString(value)];
        const newValue = [this.picker.value && this.picker.value[0], value];
        this.picker.value = newValue;
        if (this.isValidValue(newValue)) {
          this.emitInput(newValue);
          this.userInput = null;
        }
        this.rangeInputErrorState.max = false;
      } else if (this.userInput && this.userInput[1]) {
        this.rangeInputErrorState.max = true;
      }
    },

    /**
     * 处理图标点击（打开选择器或清除内容）
     */
    handleClickIcon(event) {
      if (this.readonly || this.pickerDisabled) return;
      if (this.showClose) {
        this.valueOnOpen = this.value;
        event.stopPropagation();
        this.emitInput(null);
        this.emitChange(null);
        this.showClose = false;
        if (this.picker && typeof this.picker.handleClear === 'function') {
          this.picker.handleClear();
        }
      } else {
        this.pickerVisible = !this.pickerVisible;
      }
    },

    /**
     * 处理关闭
     */
    handleClose() {
      if (!this.pickerVisible) return;
      this.pickerVisible = false;

      if (this.actualType === 'dates' || this.actualType === 'years' || this.actualType === 'months') {
        const oldValue = parseAsFormatAndType(this.valueOnOpen, this.valueFormat, this.actualType, this.rangeSeparator) || this.valueOnOpen;
        this.emitInput(oldValue);
      }
    },

    /**
     * 处理表单重置
     */
    handleFieldReset(initialValue) {
      this.userInput = initialValue === '' ? null : initialValue;
    },

    /**
     * 处理聚焦
     */
    handleFocus() {
      const type = this.actualType;

      if (HAVE_TRIGGER_TYPES.indexOf(type) !== -1 && !this.pickerVisible) {
        this.pickerVisible = true;
      }
      this.$emit('focus', this);
    },

    /**
     * 处理键盘按键
     */
    handleKeydown(event) {
      const keyCode = event.keyCode;

      // ESC 关闭
      if (keyCode === 27) {
        if (this.pickerVisible) {
          // 标记为等待取消状态
          this.cancelPending = true;
          // 清空状态
          this.rangePreview = null;
          this.userInput = null;

          // 恢复打开时的值
          if (this.valueOnOpenParsed !== null || this.valueOnOpen === null) {
            this.emitInput(this.valueOnOpenParsed);
          }
          // 关闭选择器
          this.pickerVisible = false;
        }
        // 阻止事件冒泡和默认行为
        event.stopPropagation();
        event.preventDefault();
        return;
      }

      // Tab 键处理
      if (keyCode === 9) {
        if (!this.ranged) {
          // 非范围选择，触发变更并关闭
          this.handleChange();
          this.pickerVisible = this.picker.visible = false;
          this.blur();
          event.stopPropagation();
        } else {
          // 范围选择，延迟检查焦点是否移出组件
          setTimeout(() => {
            if (this.refInput.indexOf(document.activeElement) === -1) {
              this.pickerVisible = false;
              this.blur();
              event.stopPropagation();
            }
          }, 0);
        }
        return;
      }

      // Enter 键处理
      if (keyCode === 13) {
        if (!this.pickerVisible) {
          // 如果选择器未打开，则打开
          this.pickerVisible = true;
          event.stopPropagation();
          event.preventDefault();
          return;
        }

        if (this.userInput) {
          // 如果有用户输入，检查输入是否有效
          if (this.userInput === '' || this.isValidValue(this.parseString(this.displayValue))) {
            // 有效则触发变更并关闭
            this.handleChange();
            this.pickerVisible = this.picker.visible = false;
            this.blur();
          }
          event.stopPropagation();
          return;
        }

        // 将键盘事件传递给 picker 实例处理
        if (this.picker && this.picker.handleKeydown) {
          this.picker.handleKeydown(event);
        }
        event.stopPropagation();
        event.preventDefault();
        return;
      }

      // 如果有用户输入，阻止事件冒泡
      if (this.userInput) {
        event.stopPropagation();
        return;
      }

      // 默认将事件传递给 picker 实例
      if (this.picker && this.picker.handleKeydown) {
        this.picker.handleKeydown(event);
      }
    },

    /**
     * 处理范围选择点击
     */
    handleRangeClick() {
      const type = this.actualType;

      if (HAVE_TRIGGER_TYPES.indexOf(type) !== -1 && !this.pickerVisible) {
        this.pickerVisible = true;
      }
      this.$emit('focus', this);
    },

    /**
     * 隐藏选择器
     */
    hidePicker() {
      if (this.picker) {
        this.picker.resetView && this.picker.resetView();
        this.pickerVisible = this.picker.visible = false;
        this.destroyPopper();
      }
    },

    /**
     * 显示选择器
     */
    showPicker() {
      if (this.$isServer) return;
      if (!this.picker) {
        this.mountPicker();
      }
      this.pickerVisible = this.picker.visible = true;

      this.updatePopper();

      this.picker.value = this.parsedValue;
      this.picker.resetView && this.picker.resetView();

      this.$nextTick(() => {
        this.picker.adjustSpinners && this.picker.adjustSpinners();
      });
    },

    /**
     * 卸载 Picker 实例
     * 清理 DOM 和事件监听，防止内存泄漏
     */
    unmountPicker() {
      if (this.picker) {
        this.picker.$destroy();
        this.picker.$off();
        if (typeof this.unwatchPickerOptions === 'function') {
          this.unwatchPickerOptions();
        }
        this.picker.$el.parentNode.removeChild(this.picker.$el);
        this.picker = null;
      }
    },

    /**
     * 发射 input 事件
     * @param {any} val - 新值
     */
    emitInput(val) {
      const formatted = this.formatToValue(val);
      if (!valueEquals(this.value, formatted)) {
        this.$emit('input', formatted);
      }
    },

    /**
     * 发射 change 事件
     * @param {any} val - 新值
     */
    emitChange(val) {
      const formatted = this.formatToValue(val);
      if (!valueEquals(formatted, this.valueOnOpen)) {
        this.$emit('change', formatted);
        this.dispatch('ElFormItem', 'el.form.change', formatted);
        this.valueOnOpen = formatted;
      }
    },

    /**
     * 挂载 Picker 实例
     * 创建 Vue 实例并挂载到 DOM，绑定相关属性和事件
     */
    mountPicker() {
      // 创建并挂载 picker 实例
      this.picker = new Vue(this.panel).$mount();
      // 同步属性到 picker
      this.picker.defaultValue = this.defaultValue;
      this.picker.defaultTime = this.defaultTime;
      this.picker.popperClass = this.popperClass;
      this.popperElm = this.picker.$el;
      // 设置宽度
      this.picker.width = this.reference.getBoundingClientRect().width;
      // 设置显示时间属性
      this.picker.showTime = this.actualType === 'datetime' || this.actualType === 'datetimerange';
      this.picker.selectionMode = this.selectionMode;
      this.picker.unlinkPanels = this.unlinkPanels;
      this.picker.arrowControl = this.arrowControl || this.timeArrowControl || false;
      
      // 监听 format 变化
      this.$watch('format', (format) => {
        this.picker.format = format;
      });

      // 同步 pickerOptions
      const updateOptions = () => {
        const options = this.pickerOptions;
        if (options && options.selectableRange) {
          let ranges = options.selectableRange;
          const parser = TYPE_VALUE_RESOLVER_MAP.datetimerange.parser;
          const format = DEFAULT_FORMATS.timerange;
          ranges = Array.isArray(ranges) ? ranges : [ranges];
          this.picker.selectableRange = ranges.map(range => parser(range, format, this.rangeSeparator));
        }

        for (const option in options) {
          if (options.hasOwnProperty(option) &&
              // 忽略 user-defined format 属性
              option !== 'selectableRange' &&
              option !== 'format') {
            this.picker[option] = options[option];
          }
        }

        // 处理快捷选项
        const mainShortcut = options.shortcuts || [];
        const sidebarShortcut = options.sidebarShortcuts || [];
        const shortcuts = mainShortcut.concat(sidebarShortcut);
        this.picker.shortcuts = shortcuts.length > 0 ? shortcuts : undefined;
      };
      
      updateOptions();
      // 深度监听 pickerOptions
      this.unwatchPickerOptions = this.$watch('pickerOptions', () => updateOptions(), { deep: true });
      
      // 将 picker 元素添加到 DOM
      this.$el.appendChild(this.picker.$el);
      this.picker.resetView && this.picker.resetView();

      // 监听 picker 销毁事件
      this.picker.$on('dodestroy', this.doDestroy);
      // 监听 pick 事件
      this.picker.$on('pick', (date = '', visible = false) => {
        this.userInput = null;
        this.pickerVisible = this.picker.visible = visible;
        this.emitInput(date);
        this.picker.resetView && this.picker.resetView();
      });

      // 监听 update:date 事件，同步面板日期
      this.picker.$on('update:date', date => {
        this.picker.date = date;
      });

      // 监听 select-range 事件
      this.picker.$on('select-range', (start, end, pos) => {
        if (this.refInput.length === 0) return;
        if (!pos || pos === 'min') {
          this.refInput[0].setSelectionRange(start, end);
          this.refInput[0].focus();
        } else {
          this.refInput[1].setSelectionRange(start, end);
          this.refInput[1].focus();
        }
      });
    }
  }
};
