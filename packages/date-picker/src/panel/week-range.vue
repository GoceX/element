<template>
  <transition name="el-slide-up" @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-picker-panel el-date-range-picker el-popper"
      :class="[{
        'has-sidebar': $slots.sidebar || (shortcuts && shortcuts.length)
      }, popperClass]"
    >
      <div class="el-picker-panel__body-wrapper">
        <slot name="sidebar" class="el-picker-panel__sidebar"></slot>
        <div class="el-picker-panel__sidebar" v-if="shortcuts && shortcuts.length">
          <button
            type="button"
            class="el-picker-panel__shortcut"
            v-for="(shortcut, key) in shortcuts"
            :key="key"
            @click="handleShortcutClick(shortcut)">
            {{ shortcut.text }}
          </button>
        </div>
        <div class="el-picker-panel__body">
          <div class="el-picker-panel__content el-date-range-picker__content is-left">
            <div class="el-date-range-picker__content-part" @mousedown.prevent>
              <div class="el-date-range-picker__header">
                <slot 
                  name="left-header"
                  :year="leftYear"
                  :month="leftMonth"
                  :year-options="leftYearOptions"
                  :month-options="monthOptions"
                  :handle-year-change="handleLeftYearChange"
                  :handle-month-change="handleLeftMonthChange"
                >
                  <!-- 年份下拉 -->
                  <span class="el-date-picker__header-label" style="margin: 0 5px">
                    <el-select
                      :value="leftYear"
                      @input="handleLeftYearChange"
                      size="mini"
                      filterable
                      allow-create
                      default-first-option
                      :popper-append-to-body="false"
                      style="width: 110px;">
                      <el-option
                        v-for="y in leftYearOptions"
                        :key="y"
                        :value="y"
                        :label="y + ' ' + t('el.datepicker.year')"/>
                    </el-select>
                  </span>
                  <!-- 月份下拉 -->
                  <span
                    class="el-date-picker__header-label"
                    style="margin: 0 5px">
                    <el-select
                      :value="leftMonth"
                      @input="handleLeftMonthChange"
                      size="mini"
                      :popper-append-to-body="false"
                      style="width: 90px;">
                      <el-option
                        v-for="m in monthOptions"
                        :key="m.value"
                        :value="m.value"
                        :label="m.label"/>
                    </el-select>
                  </span>
                  <!-- 今天按钮 -->
                  <el-button
                    type="text"
                    size="mini"
                    @click="handleLeftWeek"
                    style="margin-left: 5px;">
                    {{ t('el.datepicker.week') }}
                  </el-button>
                </slot>
              </div>
              <date-table
                selection-mode="week-range"
                :date="leftDate"
                :default-value="defaultValue"
                :min-date="minDate"
                :max-date="maxDate"
                :range-state="rangeState"
                :disabled-date="disabledDate"
                :cell-class-name="cellClassName"
                @changerange="handleChangeRange"
                :first-day-of-week="firstDayOfWeek"
                @pick="handleRangePick"
              />
            </div>
          </div>
          <div class="el-picker-panel__content el-date-range-picker__content is-right">
            <div class="el-date-range-picker__content-part" @mousedown.prevent>
              <div class="el-date-range-picker__header">
                <slot 
                  name="right-header"
                  :year="rightYear"
                  :month="rightMonth"
                  :year-options="rightYearOptions"
                  :month-options="monthOptions"
                  :handle-year-change="handleRightYearChange"
                  :handle-month-change="handleRightMonthChange">
                  <!-- 年份下拉 -->
                  <span class="el-date-picker__header-label" style="margin: 0 5px">
                    <el-select
                      :value="rightYear"
                      @input="handleRightYearChange"
                      size="mini"
                      filterable
                      allow-create
                      default-first-option
                      :popper-append-to-body="false"
                      style="width: 110px;">
                      <el-option
                        v-for="y in rightYearOptions"
                        :key="y"
                        :value="y"
                        :label="y + ' ' + t('el.datepicker.year')"/>
                    </el-select>
                  </span>
                  <!-- 月份下拉 -->
                  <span
                    class="el-date-picker__header-label"
                    style="margin: 0 5px">
                    <el-select
                      :value="rightMonth"
                      @input="handleRightMonthChange"
                      size="mini"
                      :popper-append-to-body="false"
                      style="width: 90px;">
                      <el-option
                        v-for="m in monthOptions"
                        :key="m.value"
                        :value="m.value"
                        :label="m.label"/>
                    </el-select>
                  </span>
                  <!-- 今天按钮 -->
                  <el-button
                    type="text"
                    size="mini"
                    @click="handleRightWeek"
                    style="margin-left: 5px;">
                    {{ t('el.datepicker.week') }}
                  </el-button>
                </slot>
              </div>
              <date-table
                selection-mode="week-range"
                :date="rightDate"
                :default-value="defaultValue"
                :min-date="minDate"
                :max-date="maxDate"
                :range-state="rangeState"
                :disabled-date="disabledDate"
                :cell-class-name="cellClassName"
                @changerange="handleChangeRange"
                :first-day-of-week="firstDayOfWeek"
                @pick="handleRangePick"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  import {
    isDate,
    modifyDate,
    prevYear,
    nextYear,
    prevMonth,
    nextMonth,
    nextDate,
    formatDate,
    getWeekNumber
  } from 'rowinself-ui/src/utils/date-util';
  import Clickoutside from 'rowinself-ui/src/utils/clickoutside';
  import Locale from 'rowinself-ui/src/mixins/locale';
  import DateTable from '../basic/date-table';
  import ElInput from 'rowinself-ui/packages/input';
  import ElButton from 'rowinself-ui/packages/button';
  import ElSelect from 'rowinself-ui/packages/select';
  import ElOption from 'rowinself-ui/packages/option';

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
    components: { DateTable, ElInput, ElButton,ElSelect,ElOption },
    mixins: [Locale],

    data() {
      return {
        popperClass: '',
        value: [],
        defaultValue: null,
        defaultTime: null,
        minDate: '',
        maxDate: '',
        leftDate: new Date(),
        rightDate: nextMonth(new Date()),
        rangeState: {
          endDate: null,
          selecting: false,
          row: null,
          column: null
        },
        shortcuts: '',
        visible: '',
        disabledDate: null,
        cellClassName: '',
        firstDayOfWeek: 7,
        format: '',
        arrowControl: false,
        unlinkPanels: false,
        focusedInputIndex: 0,
        isReverseSelecting: false
      };
    },

    computed: {
      btnDisabled() {
        return !(this.minDate && this.maxDate && !this.selecting && this.isValidValue([this.minDate, this.maxDate]));
      },

      leftLabel() {
        return this.leftDate.getFullYear() + ' ' + this.t('el.datepicker.year') + ' ' + this.t(`el.datepicker.month${ this.leftDate.getMonth() + 1 }`);
      },

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

      enableMonthArrow() {
        const nextMonth = (this.leftMonth + 1) % 12;
        const yearOffset = this.leftMonth + 1 >= 12 ? 1 : 0;
        return this.unlinkPanels && new Date(this.leftYear + yearOffset, nextMonth) < new Date(this.rightYear, this.rightMonth);
      },

      enableYearArrow() {
        return this.unlinkPanels && this.rightYear * 12 + this.rightMonth - (this.leftYear * 12 + this.leftMonth + 1) >= 12;
      },

      leftYearOptions() {
        const year = this.leftYear;
        const options = [];
        for (let i = year - 10; i <= year + 10; i++) {
          options.push(i);
        }
        return options;
      },

      rightYearOptions() {
        // Options for right year select
        const year = this.rightYear;
        const options = [];
        for (let i = year - 10; i <= year + 10; i++) {
          options.push(i);
        }
        return options;
      },

      monthOptions() {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => ({
          value: i - 1,
          label: this.t(`el.datepicker.month${i}`)
        }));
      }
    },

    watch: {
      minDate(val) {
        // No user input for week range usually
      },

      maxDate(val) {
        // No user input for week range usually
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
       * 处理左侧面板本周按钮点击事件
       * 设置开始日期为本周起始日
       */
      handleLeftWeek() {
        const now = new Date();
        const day = now.getDay();
        const offset = (day - (this.firstDayOfWeek % 7) + 7) % 7;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - offset);
        // 重置时分秒
        weekStart.setHours(0, 0, 0, 0);

        // 校验本周起始日是否被禁用
        if (typeof this.disabledDate === 'function' && this.disabledDate(weekStart)) {
          return;
        }
        
        this.minDate = new Date(weekStart);
        
        // 更新左侧面板日期为本周
        this.leftDate = new Date(weekStart);
        // 如果未解耦面板，更新右侧面板日期为下个月
        if (!this.unlinkPanels) {
          this.rightDate = nextMonth(this.leftDate);
        }

        // 如果结束日期存在，且小于开始日期，则重置结束日期为开始日期
        if (this.maxDate && this.maxDate < this.minDate) {
          this.maxDate = new Date(weekStart);
        }

        // 如果已经有结束日期，则触发选中事件（保持面板打开）
        if (this.maxDate) {
          this.$emit('pick', [this.minDate, this.maxDate], true);
        } else {
          // 否则进入选择状态，不关闭面板
          this.rangeState.selecting = true;
          this.emitInputPreview();
        }
      },

      /**
       * 处理右侧面板本周按钮点击事件
       * 设置结束日期为本周起始日
       */
      handleRightWeek() {
        const now = new Date();
        const day = now.getDay();
        const offset = (day - (this.firstDayOfWeek % 7) + 7) % 7;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - offset);
        // 重置时分秒
        weekStart.setHours(0, 0, 0, 0);

        // 校验本周起始日是否被禁用
        if (typeof this.disabledDate === 'function' && this.disabledDate(weekStart)) {
          return;
        }
        
        this.maxDate = new Date(weekStart);
        
        // 更新右侧面板日期为本周
        this.rightDate = new Date(weekStart);
        // 如果未解耦面板，更新左侧面板日期为上个月
        if (!this.unlinkPanels) {
          this.leftDate = prevMonth(this.rightDate);
        }

        // 如果开始日期不存在，或者开始日期大于结束日期，则重置开始日期为结束日期
        if (!this.minDate || this.minDate > this.maxDate) {
          this.minDate = new Date(weekStart);
        }

        // 触发选中事件（保持面板打开）
        this.$emit('pick', [this.minDate, this.maxDate], true);
      },

      handleClear() {
        this.minDate = null;
        this.maxDate = null;
        this.leftDate = calcDefaultValue(this.defaultValue)[0];
        this.rightDate = nextMonth(this.leftDate);
        this.$emit('pick', null);
      },

      handleChangeRange(val) {
        this.minDate = val.minDate;
        this.maxDate = val.maxDate;
        this.rangeState = val.rangeState;
        this.$emit('changerange', {
          minDate: this.minDate,
          maxDate: this.maxDate,
          rangeState: this.rangeState
        });
        this.emitInputPreview();
      },

      handleRangePick(val, close = true) {
        // week range logic doesn't use time
        const minDate = val.minDate;
        const maxDate = val.maxDate;

        if (this.maxDate === maxDate && this.minDate === minDate) {
          return;
        }
        this.onPick && this.onPick(val);
        
        const isNewSelection = !this.minDate || (this.minDate && this.maxDate);
        if (isNewSelection) {
          if (this.focusedInputIndex === 1) {
            this.isReverseSelecting = true;
            this.minDate = minDate;
            this.maxDate = null;
            this.$emit('pick-end-date');
            this.emitInputPreview();
            return;
          } else {
            this.isReverseSelecting = false;
          }
        } else {
          this.isReverseSelecting = false;
        }

        this.maxDate = maxDate;
        this.minDate = minDate;
        
        if (this.minDate && !this.maxDate) {
          this.$emit('pick-start-date');
        }
        this.emitInputPreview();

        // workaround for https://github.com/ElemeFE/element/issues/7539
        setTimeout(() => {
          this.maxDate = maxDate;
          this.minDate = minDate;
        }, 10);
        if (!close) return;
        this.handleConfirm();
      },
      
      emitInputPreview() {
        if (!this.rangeState || !this.rangeState.endDate) {
          this.$emit('preview', null);
          return;
        }
        const endDate = this.rangeState.endDate;
        const format = this.format || (this.$parent && this.$parent.format) || 'yyyywWW';

        const formatWeek = (date) => {
          let week = getWeekNumber(date);
          let month = date.getMonth();
          const trueDate = new Date(date);
          if (week === 1 && month === 11) {
            trueDate.setFullYear(trueDate.getFullYear() + 1);
          }
          if (week >= 52 && month === 0) {
            trueDate.setFullYear(trueDate.getFullYear() - 1);
          }
          let str = formatDate(trueDate, format);
          const weekStr = week < 10 ? '0' + week : week;
          return str.replace(/WW/g, weekStr).replace(/W/g, week);
        };

        if (!this.minDate || (this.minDate && this.maxDate)) {
          if (this.focusedInputIndex === 1) {
            this.$emit('preview', {
              min: '',
              max: formatWeek(endDate),
              minIsPreview: false,
              maxIsPreview: true
            });
          } else {
            this.$emit('preview', {
              min: formatWeek(endDate),
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
              min: formatWeek(endDate),
              max: formatWeek(this.minDate),
              minIsPreview: true,
              maxIsPreview: false
            });
          } else {
            this.$emit('preview', {
              min: formatWeek(this.minDate),
              max: formatWeek(endDate),
              minIsPreview: false,
              maxIsPreview: true
            });
          }
          return;
        }
      },

      handleShortcutClick(shortcut) {
        if (shortcut.onClick) {
          shortcut.onClick(this);
        }
      },

      leftPrevYear() {
        this.leftDate = prevYear(this.leftDate);
        if (!this.unlinkPanels) {
          this.rightDate = nextMonth(this.leftDate);
        }
      },

      leftPrevMonth() {
        this.leftDate = prevMonth(this.leftDate);
        if (!this.unlinkPanels) {
          this.rightDate = nextMonth(this.leftDate);
        }
      },

      rightNextYear() {
        if (!this.unlinkPanels) {
          this.leftDate = nextYear(this.leftDate);
          this.rightDate = nextMonth(this.leftDate);
        } else {
          this.rightDate = nextYear(this.rightDate);
        }
      },

      rightNextMonth() {
        if (!this.unlinkPanels) {
          this.leftDate = nextMonth(this.leftDate);
          this.rightDate = nextMonth(this.leftDate);
        } else {
          this.rightDate = nextMonth(this.rightDate);
        }
      },

      leftNextYear() {
        this.leftDate = nextYear(this.leftDate);
      },

      leftNextMonth() {
        this.leftDate = nextMonth(this.leftDate);
      },

      rightPrevYear() {
        this.rightDate = prevYear(this.rightDate);
      },

      rightPrevMonth() {
        this.rightDate = prevMonth(this.rightDate);
      },

      handleLeftYearChange(year) {
        this.leftDate = modifyDate(this.leftDate, year, this.leftMonth, this.leftMonthDate);
      },

      handleLeftMonthChange(month) {
        this.leftDate = modifyDate(this.leftDate, this.leftYear, month, this.leftMonthDate);
      },

      handleRightYearChange(year) {
        this.rightDate = modifyDate(this.rightDate, year, this.rightMonth, this.rightMonthDate);
      },

      handleRightMonthChange(month) {
        this.rightDate = modifyDate(this.rightDate, this.rightYear, month, this.rightMonthDate);
      },

      handleConfirm(visible = false) {
        if (this.isValidValue([this.minDate, this.maxDate])) {
          this.$emit('pick', [this.minDate, this.maxDate], visible);
        }
      },

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

      resetView() {
        if (this.minDate && this.maxDate == null) this.rangeState.selecting = false;
        this.minDate = this.value && isDate(this.value[0]) ? new Date(this.value[0]) : null;
        this.maxDate = this.value && isDate(this.value[0]) ? new Date(this.value[1]) : null;
      }
    }
  };
</script>

<style scoped>
.el-date-range-picker__content {
  display: flex;
  flex-direction: row;
}

.el-date-range-picker__content-part {
  flex: 1;
}
</style>
