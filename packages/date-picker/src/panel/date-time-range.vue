<template>
  <!-- 
    日期时间范围选择器面板 
    Date Time Range Picker Panel
  -->
  <transition name="el-slide-up" @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-picker-panel el-date-range-picker el-popper"
      :class="[{
        'has-sidebar': $slots.sidebar || shortcuts,
        'has-time': showTime
      }, popperClass]"
    >
      <div class="el-picker-panel__body-wrapper">
        <!-- 侧边栏插槽 (Sidebar slot) -->
        <slot name="sidebar" class="el-picker-panel__sidebar"></slot>
        <!-- 快捷选项侧边栏 (Shortcuts sidebar) -->
        <div class="el-picker-panel__sidebar" v-if="shortcuts">
          <button
            type="button"
            class="el-picker-panel__shortcut"
            v-for="(shortcut, key) in shortcuts"
            :key="key"
            @click="handleShortcutClick(shortcut)">{{ shortcut.text }}</button>
        </div>
        
        <div class="el-picker-panel__body">
          <!-- 左侧面板 (Left Panel) -->
          <div class="el-picker-panel__content el-date-range-picker__content is-left">
            <date-time
              ref="leftDateTime"
              :date="minDate || leftDate"
              :show-time="showTime"
              :show-seconds="showSeconds"
              :am-pm-mode="amPmMode"
              :arrow-control="arrowControl"
              selection-mode="range"
              :default-value="defaultValue"
              :min-date="minDate"
              :max-date="maxDate"
              :range-state="rangeState"
              :disabled-date="disabledDate"
              :cell-class-name="cellClassName"
              :first-day-of-week="firstDayOfWeek"
              @changerange="handleChangeRange"
              @pick="handleRangePick"
              @time-change="handleMinTimePick"
            >
              <template slot="header">
                <!-- 左侧头部：年月切换按钮 (Left Header: Year/Month switch buttons) -->
                <div class="el-date-range-picker__header" @mousedown.prevent>
                  <button
                    type="button"
                    @click="leftPrevYear"
                    class="el-picker-panel__icon-btn el-icon-d-arrow-left"></button>
                  <button
                    type="button"
                    @click="leftPrevMonth"
                    class="el-picker-panel__icon-btn el-icon-arrow-left"></button>
                  <button
                    type="button"
                    @click="leftNextYear"
                    v-if="unlinkPanels"
                    :disabled="!enableYearArrow"
                    :class="{ 'is-disabled': !enableYearArrow }"
                    class="el-picker-panel__icon-btn el-icon-d-arrow-right"></button>
                  <button
                    type="button"
                    @click="leftNextMonth"
                    v-if="unlinkPanels"
                    :disabled="!enableMonthArrow"
                    :class="{ 'is-disabled': !enableMonthArrow }"
                    class="el-picker-panel__icon-btn el-icon-arrow-right"></button>
                  <div>{{ leftLabel }}</div>
                </div>
              </template>
            </date-time>
          </div>
          
          <!-- 右侧面板 (Right Panel) -->
          <div class="el-picker-panel__content el-date-range-picker__content is-right">
            <date-time
              ref="rightDateTime"
              :date="maxDate || rightDate"
              :show-time="showTime"
              :show-seconds="showSeconds"
              :am-pm-mode="amPmMode"
              :arrow-control="arrowControl"
              selection-mode="range"
              :default-value="defaultValue"
              :min-date="minDate"
              :max-date="maxDate"
              :range-state="rangeState"
              :disabled-date="disabledDate"
              :cell-class-name="cellClassName"
              :first-day-of-week="firstDayOfWeek"
              @changerange="handleChangeRange"
              @pick="handleRangePick"
              @time-change="handleMaxTimePick"
            >
              <template slot="header">
                <!-- 右侧头部：年月切换按钮 (Right Header: Year/Month switch buttons) -->
                <div class="el-date-range-picker__header" @mousedown.prevent>
                  <button
                    type="button"
                    @click="rightPrevYear"
                    v-if="unlinkPanels"
                    :disabled="!enableYearArrow"
                    :class="{ 'is-disabled': !enableYearArrow }"
                    class="el-picker-panel__icon-btn el-icon-d-arrow-left"></button>
                  <button
                    type="button"
                    @click="rightPrevMonth"
                    v-if="unlinkPanels"
                    :disabled="!enableMonthArrow"
                    :class="{ 'is-disabled': !enableMonthArrow }"
                    class="el-picker-panel__icon-btn el-icon-arrow-left"></button>
                  <button
                    type="button"
                    @click="rightNextYear"
                    class="el-picker-panel__icon-btn el-icon-d-arrow-right"></button>
                  <button
                    type="button"
                    @click="rightNextMonth"
                    class="el-picker-panel__icon-btn el-icon-arrow-right"></button>
                  <div>{{ rightLabel }}</div>
                </div>
              </template>
            </date-time>
          </div>
        </div>
      </div>
      
      <!-- 底部页脚：清除和确认按钮 (Footer: Clear and Confirm buttons) -->
      <div class="el-picker-panel__footer" v-if="showTime" @mousedown.prevent>
        <el-button
          size="mini"
          type="text"
          class="el-picker-panel__link-btn"
          @click="handleClear">
          {{ t('el.datepicker.clear') }}
        </el-button>
        <el-button
          type="text"
          size="mini"
          class="el-picker-panel__link-btn"
          :disabled="btnDisabled"
          @click="handleConfirm(false)">
          {{ t('el.datepicker.confirm') }}
        </el-button>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  import {
    formatDate,
    parseDate,
    isDate,
    modifyDate,
    modifyTime,
    modifyWithTimeString,
    prevYear,
    nextYear,
    prevMonth,
    nextMonth,
    nextDate,
    extractDateFormat,
    extractTimeFormat
  } from 'rowinself-ui/src/utils/date-util';
  import Clickoutside from 'rowinself-ui/src/utils/clickoutside';
  import Locale from 'rowinself-ui/src/mixins/locale';
  import TimeSpinner from '../basic/time-spinner';
  import DateTime from './date-time';
  import DateTable from '../basic/date-table';
  import ElInput from 'rowinself-ui/packages/input';
  import ElButton from 'rowinself-ui/packages/button';

  /**
   * 计算默认值
   * Calculate default value
   * @param {Date|Array} defaultValue - 默认值
   * @returns {Array} - 返回包含开始和结束日期的数组
   */
  const calcDefaultValue = (defaultValue) => {
    if (Array.isArray(defaultValue)) {
      return [new Date(defaultValue[0]), new Date(defaultValue[1])];
    } else if (defaultValue) {
      return [new Date(defaultValue), nextDate(new Date(defaultValue), 1)];
    } else {
      return [new Date(), nextDate(new Date(), 1)];
    }
  };

  export default {
    directives: { Clickoutside },
    components: { TimeSpinner, DateTable, ElInput, ElButton, DateTime },
    mixins: [Locale],

    data() {
      return {
        popperClass: '', // 弹出层类名
        value: [], // 当前选中的值
        defaultValue: null, // 默认值
        defaultTime: null, // 默认时间
        minDate: '', // 选中的开始日期
        maxDate: '', // 选中的结束日期
        leftDate: new Date(), // 左侧面板显示的日期
        rightDate: nextMonth(new Date()), // 右侧面板显示的日期
        rangeState: {
          endDate: null, // 结束日期
          selecting: false, // 是否正在选择中
          row: null, // 行索引
          column: null // 列索引
        },
        showTime: false, // 是否显示时间选择
        shortcuts: '', // 快捷选项
        visible: '', // 是否可见
        disabledDate: null, // 禁用的日期函数
        cellClassName: '', // 单元格类名
        firstDayOfWeek: 7, // 每周的第一天
        format: '', // 日期格式
        arrowControl: false, // 是否使用箭头控制
        unlinkPanels: false, // 是否取消左右面板联动
        dateUserInput: {
          min: null,
          max: null
        },
        timeUserInput: {
          min: null,
          max: null
        },
        focusedInputIndex: 0
      };
    },

    computed: {
      isReverseSelecting() {
        return this.focusedInputIndex === 1;
      },

      /**
       * 确认按钮是否禁用
       * Check if the confirm button is disabled
       * @returns {boolean}
       */
      btnDisabled() {
        return !(this.minDate && this.maxDate && !this.selecting && this.isValidValue([this.minDate, this.maxDate]));
      },

      /**
       * 左侧面板的标签 (年 月)
       * Label for the left panel
       * @returns {string}
       */
      leftLabel() {
        return this.leftDate.getFullYear() + ' ' + this.t('el.datepicker.year') + ' ' + this.t(`el.datepicker.month${ this.leftDate.getMonth() + 1 }`);
      },

      /**
       * 右侧面板的标签 (年 月)
       * Label for the right panel
       * @returns {string}
       */
      rightLabel() {
        return this.rightDate.getFullYear() + ' ' + this.t('el.datepicker.year') + ' ' + this.t(`el.datepicker.month${ this.rightDate.getMonth() + 1 }`);
      },

      leftYear() {
        return this.leftDate.getFullYear();
      },

      leftMonth() {
        return this.leftDate.getMonth();
      },

      leftMonthDate() {
        return this.leftDate.getDate();
      },

      rightYear() {
        return this.rightDate.getFullYear();
      },

      rightMonth() {
        return this.rightDate.getMonth();
      },

      rightMonthDate() {
        return this.rightDate.getDate();
      },

      /**
       * 提取时间格式
       * Extract time format
       * @returns {string}
       */
      timeFormat() {
        if (this.format) {
          return extractTimeFormat(this.format);
        } else {
          return 'HH:mm:ss';
        }
      },

      /**
       * 提取日期格式
       * Extract date format
       * @returns {string}
       */
      dateFormat() {
        if (this.format) {
          return extractDateFormat(this.format);
        } else {
          return 'yyyy-MM-dd';
        }
      },

      /**
       * 是否启用月份切换箭头
       * Whether to enable the month arrow
       * @returns {boolean}
       */
      enableMonthArrow() {
        const nextMonth = (this.leftMonth + 1) % 12;
        const yearOffset = this.leftMonth + 1 >= 12 ? 1 : 0;
        return this.unlinkPanels && new Date(this.leftYear + yearOffset, nextMonth) < new Date(this.rightYear, this.rightMonth);
      },

      /**
       * 是否启用年份切换箭头
       * Whether to enable the year arrow
       * @returns {boolean}
       */
      enableYearArrow() {
        return this.unlinkPanels && this.rightYear * 12 + this.rightMonth - (this.leftYear * 12 + this.leftMonth + 1) >= 12;
      },

      /**
       * AM/PM 模式
       * AM/PM mode
       * @returns {string}
       */
      amPmMode() {
        if ((this.timeFormat || '').indexOf('A') !== -1) return 'A';
        if ((this.timeFormat || '').indexOf('a') !== -1) return 'a';
        return '';
      },

      /**
       * 是否显示秒
       * Whether to show seconds
       * @returns {boolean}
       */
      showSeconds() {
        return (this.timeFormat || '').indexOf('ss') !== -1;
      }
    },

    watch: {
      minDate(val) {
        this.dateUserInput.min = null;
        this.timeUserInput.min = null;
      },

      maxDate(val) {
        this.dateUserInput.max = null;
        this.timeUserInput.max = null;
      },

      value(newVal) {
        if (!newVal) {
          this.minDate = null;
          this.maxDate = null;
        } else if (Array.isArray(newVal)) {
          this.minDate = isDate(newVal[0]) ? new Date(newVal[0]) : null;
          this.maxDate = isDate(newVal[1]) ? new Date(newVal[1]) : null;
          if (this.minDate) {
            this.leftDate = this.minDate;
            if (this.unlinkPanels && this.maxDate) {
              const minDateYear = this.minDate.getFullYear();
              const minDateMonth = this.minDate.getMonth();
              const maxDateYear = this.maxDate.getFullYear();
              const maxDateMonth = this.maxDate.getMonth();
              this.rightDate = minDateYear === maxDateYear && minDateMonth === maxDateMonth
                ? nextMonth(this.maxDate)
                : this.maxDate;
            } else {
              this.rightDate = nextMonth(this.leftDate);
            }
          } else {
            this.leftDate = calcDefaultValue(this.defaultValue)[0];
            this.rightDate = nextMonth(this.leftDate);
          }
        }
      },

      defaultValue(val) {
        if (!Array.isArray(this.value)) {
          const [left, right] = calcDefaultValue(val);
          this.leftDate = left;
          this.rightDate = val && val[1] && this.unlinkPanels
            ? right
            : nextMonth(this.leftDate);
        }
      }
    },

    methods: {
      /**
       * 处理清除按钮点击
       * Handle clear button click
       */
      handleClear() {
        this.minDate = null;
        this.maxDate = null;
        this.leftDate = calcDefaultValue(this.defaultValue)[0];
        this.rightDate = nextMonth(this.leftDate);
        this.$emit('pick', null);
      },

      /**
       * 处理范围变更
       * Handle range change
       * @param {Object} val - 范围对象 {minDate, maxDate, rangeState}
       */
      handleChangeRange(val) {
        this.minDate = val.minDate;
        this.maxDate = val.maxDate;
        this.rangeState = val.rangeState;
        this.emitInputPreview();
      },

      /**
       * 触发输入预览事件
       * Emit input preview event
       */
      emitInputPreview() {
        if (!this.rangeState || !this.rangeState.endDate) {
          this.$emit('preview', null);
          return;
        }
        const endDate = this.rangeState.endDate;
        const format = this.format || this.dateFormat;

        if (!this.minDate) {
          if (this.isReverseSelecting) {
            this.$emit('preview', {
              min: '',
              max: formatDate(endDate, format),
              minIsPreview: false,
              maxIsPreview: true
            });
          } else {
            this.$emit('preview', {
              min: formatDate(endDate, format),
              max: '',
              minIsPreview: true,
              maxIsPreview: false
            });
          }
          return;
        }

        if (this.minDate && !this.maxDate) {
          if (this.isReverseSelecting) {
            this.$emit('preview', {
              min: formatDate(endDate, format),
              max: formatDate(this.minDate, format),
              minIsPreview: true,
              maxIsPreview: false
            });
          } else {
            this.$emit('preview', {
              min: formatDate(this.minDate, format),
              max: formatDate(endDate, format),
              minIsPreview: false,
              maxIsPreview: true
            });
          }
          return;
        }
        this.$emit('preview', null);
      },

      /**
       * 处理日期输入
       * Handle date input
       * @param {string} value - 输入的日期字符串
       * @param {string} type - 类型 ('min' or 'max')
       */
      handleDateInput(value, type) {
        this.dateUserInput[type] = value;
        if (value.length !== this.dateFormat.length) return;
        const parsedValue = parseDate(value, this.dateFormat);
        if (parsedValue) {
          if (typeof this.disabledDate === 'function' &&
            this.disabledDate(new Date(parsedValue))) {
            return;
          }
          if (type === 'min') {
            this.minDate = modifyDate(this.minDate || new Date(), parsedValue.getFullYear(), parsedValue.getMonth(), parsedValue.getDate());
            this.leftDate = new Date(parsedValue);
            if (!this.unlinkPanels) {
              this.rightDate = nextMonth(this.leftDate);
            }
          } else {
            this.maxDate = modifyDate(this.maxDate || new Date(), parsedValue.getFullYear(), parsedValue.getMonth(), parsedValue.getDate());
            this.rightDate = new Date(parsedValue);
            if (!this.unlinkPanels) {
              this.leftDate = prevMonth(parsedValue);
            }
          }
        }
      },

      /**
       * 处理日期变更
       * Handle date change
       * @param {string} value - 输入的日期字符串
       * @param {string} type - 类型 ('min' or 'max')
       */
      handleDateChange(value, type) {
        const parsedValue = parseDate(value, this.dateFormat);
        if (parsedValue) {
          if (type === 'min') {
            this.minDate = modifyDate(this.minDate, parsedValue.getFullYear(), parsedValue.getMonth(), parsedValue.getDate());
            if (this.minDate > this.maxDate) {
              this.maxDate = this.minDate;
            }
          } else {
            this.maxDate = modifyDate(this.maxDate, parsedValue.getFullYear(), parsedValue.getMonth(), parsedValue.getDate());
            if (this.maxDate < this.minDate) {
              this.minDate = this.maxDate;
            }
          }
        }
      },

      /**
       * 处理最小时间选择
       * Handle min time pick
       * @param {string} value - 时间字符串
       */
      handleMinTimePick(value) {
        if (value) {
          this.minDate = new Date(value);
        }
        if (!this.maxDate || this.maxDate && this.maxDate.getTime() < this.minDate.getTime()) {
          this.maxDate = new Date(this.minDate);
        }
      },

      /**
       * 处理最大时间选择
       * Handle max time pick
       * @param {string} value - 时间字符串
       */
      handleMaxTimePick(value) {
        if (value) {
          this.maxDate = new Date(value);
        }
        if (this.maxDate && this.minDate && this.minDate.getTime() > this.maxDate.getTime()) {
          this.minDate = new Date(this.maxDate);
        }
      },

      /**
       * 处理范围选择
       * Handle range pick
       * @param {Object} val - 范围对象
       * @param {boolean} close - 是否关闭
       */
      handleRangePick(val, close = true) {
        const defaultTime = this.defaultTime || [];
        const minDate = modifyWithTimeString(val.minDate, defaultTime[0]);
        const maxDate = modifyWithTimeString(val.maxDate, defaultTime[1]);

        if (this.maxDate === maxDate && this.minDate === minDate) {
          return;
        }
        this.onPick && this.onPick(val);
        this.maxDate = maxDate;
        this.minDate = minDate;

        // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57
        setTimeout(() => {
          this.maxDate = maxDate;
          this.minDate = minDate;
        }, 10);

        if (!val.maxDate && this.isReverseSelecting) {
          this.$emit('pick-end-date');
        }

        if (!close || this.showTime) return;
        this.handleConfirm();
      },

      /**
       * 处理快捷键点击
       * Handle shortcut click
       * @param {Object} shortcut - 快捷键对象
       */
      handleShortcutClick(shortcut) {
        if (shortcut.onClick) {
          shortcut.onClick(this);
        }
      },

      // leftPrev*, rightNext* need to take care of `unlinkPanels`
      /**
       * 左侧上一年
       */
      leftPrevYear() {
        this.leftDate = prevYear(this.leftDate);
        if (!this.unlinkPanels) {
          this.rightDate = nextMonth(this.leftDate);
        }
      },

      /**
       * 左侧上一月
       */
      leftPrevMonth() {
        this.leftDate = prevMonth(this.leftDate);
        if (!this.unlinkPanels) {
          this.rightDate = nextMonth(this.leftDate);
        }
      },

      /**
       * 右侧下一年
       */
      rightNextYear() {
        if (!this.unlinkPanels) {
          this.leftDate = nextYear(this.leftDate);
          this.rightDate = nextMonth(this.leftDate);
        } else {
          this.rightDate = nextYear(this.rightDate);
        }
      },

      /**
       * 右侧下一月
       */
      rightNextMonth() {
        if (!this.unlinkPanels) {
          this.leftDate = nextMonth(this.leftDate);
          this.rightDate = nextMonth(this.leftDate);
        } else {
          this.rightDate = nextMonth(this.rightDate);
        }
      },

      // leftNext*, rightPrev* are called when `unlinkPanels` is true
      /**
       * 左侧下一年 (仅 unlinkPanels 为 true 时有效)
       */
      leftNextYear() {
        this.leftDate = nextYear(this.leftDate);
      },

      /**
       * 左侧下一月 (仅 unlinkPanels 为 true 时有效)
       */
      leftNextMonth() {
        this.leftDate = nextMonth(this.leftDate);
      },

      /**
       * 右侧上一年 (仅 unlinkPanels 为 true 时有效)
       */
      rightPrevYear() {
        this.rightDate = prevYear(this.rightDate);
      },

      /**
       * 右侧上一月 (仅 unlinkPanels 为 true 时有效)
       */
      rightPrevMonth() {
        this.rightDate = prevMonth(this.rightDate);
      },

      /**
       * 处理确认
       * Handle confirm
       * @param {boolean} visible - 是否保持可见
       */
      handleConfirm(visible = false) {
        if (this.isValidValue([this.minDate, this.maxDate])) {
          this.$emit('pick', [this.minDate, this.maxDate], visible);
        }
      },

      /**
       * 验证值是否有效
       * Validate value
       * @param {Array} value - 日期数组
       * @returns {boolean}
       */
      isValidValue(value) {
        return Array.isArray(value) &&
          value && value[0] && value[1] &&
          isDate(value[0]) && isDate(value[1]) &&
          value[0].getTime() <= value[1].getTime() && (
          typeof this.disabledDate === 'function'
            ? !this.disabledDate(value[0]) && !this.disabledDate(value[1])
            : true
        );
      },

      /**
       * 重置视图
       * Reset view
       */
      resetView() {
        // NOTE: this is a hack to reset {min, max}Date on picker open.
        // TODO: correct way of doing so is to refactor {min, max}Date to be dependent on value and internal selection state
        //       an alternative would be resetView whenever picker becomes visible, should also investigate date-panel's resetView
        if (this.minDate && this.maxDate == null) this.rangeState.selecting = false;
        this.minDate = this.value && isDate(this.value[0]) ? new Date(this.value[0]) : null;
        this.maxDate = this.value && isDate(this.value[0]) ? new Date(this.value[1]) : null;
      }
    }
  };
</script>


