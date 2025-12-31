<template>
  <transition name="el-slide-up" @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-picker-panel el-date-range-picker el-popper"
      :class="[{
        'has-sidebar': $slots.sidebar || (shortcuts && shortcuts.length),
        'has-time': showTime
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
                    @click="$emit('handle-today')"
                    style="margin-left: 5px;">
                    {{ t('el.datepicker.today') }}
                  </el-button>
                </slot>
              </div>
              <date-table
                selection-mode="range"
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
            <div class="el-date-range-picker__time-part" v-if="showTime" @mousedown.prevent>
              <div class="el-time-panel__content" :class="{ 'has-seconds': showSeconds }">
                <time-spinner
                  ref="minSpinner"
                  :show-seconds="showSeconds"
                  :am-pm-mode="amPmMode"
                  @change="handleMinTimePick"
                  :arrow-control="arrowControl"
                  :date="minDate || leftDate"
                />
              </div>
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
                    @click="$emit('handle-today')"
                    style="margin-left: 5px;">
                    {{ t('el.datepicker.today') }}
                  </el-button>
                </slot>
              </div>
              <date-table
                selection-mode="range"
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
            <div class="el-date-range-picker__time-part" v-if="showTime" @mousedown.prevent>
              <div class="el-time-panel__content" :class="{ 'has-seconds': showSeconds }">
                <time-spinner
                  ref="maxSpinner"
                  :show-seconds="showSeconds"
                  :am-pm-mode="amPmMode"
                  @change="handleMaxTimePick"
                  :arrow-control="arrowControl"
                  :date="maxDate || rightDate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="el-picker-panel__footer" v-if="showTime">
        <el-button
          size="mini"
          type="text"
          class="el-picker-panel__link-btn"
          @click="handleClear">
          {{ t('el.datepicker.clear') }}
        </el-button>
        <el-button
          plain
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
    components: { TimeSpinner, DateTable, ElInput, ElButton, ElSelect, ElOption },
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
        showTime: false,
        shortcuts: '',
        visible: '',
        disabledDate: null,
        cellClassName: '',
        firstDayOfWeek: 7,
        format: '',
        arrowControl: false,
        unlinkPanels: false,
        dateUserInput: {
          min: null,
          max: null
        },
        timeUserInput: {
          min: null,
          max: null
        }
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

      timeFormat() {
        if (this.format) {
          return extractTimeFormat(this.format);
        } else {
          return 'HH:mm:ss';
        }
      },

      dateFormat() {
        if (this.format) {
          return extractDateFormat(this.format);
        } else {
          return 'yyyy-MM-dd';
        }
      },

      enableMonthArrow() {
        const nextMonth = (this.leftMonth + 1) % 12;
        const yearOffset = this.leftMonth + 1 >= 12 ? 1 : 0;
        return this.unlinkPanels && new Date(this.leftYear + yearOffset, nextMonth) < new Date(this.rightYear, this.rightMonth);
      },

      enableYearArrow() {
        return this.unlinkPanels && this.rightYear * 12 + this.rightMonth - (this.leftYear * 12 + this.leftMonth + 1) >= 12;
      },

      amPmMode() {
        if ((this.timeFormat || '').indexOf('A') !== -1) return 'A';
        if ((this.timeFormat || '').indexOf('a') !== -1) return 'a';
        return '';
      },
      showSeconds() {
        return (this.timeFormat || '').indexOf('ss') !== -1;
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
            // 编辑时 如果有结束时间 始终显示结束时间所在的月份 而不强制显示为开始时间的下个月
            if (this.maxDate) {
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

      emitInputPreview() {
        if (!this.rangeState || !this.rangeState.endDate) {
          this.$emit('preview', null);
          return;
        }
        const endDate = this.rangeState.endDate;
        const format = this.format || (this.$parent && this.$parent.format) || this.dateFormat;

        if (!this.minDate || (this.minDate && this.maxDate)) {
          if (this.focusedInputIndex === 1) {
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
      },

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

      handleMinTimePick(value) {
        if (value) {
          this.minDate = new Date(value);
        }
        if (!this.maxDate || this.maxDate && this.maxDate.getTime() < this.minDate.getTime()) {
          this.maxDate = new Date(this.minDate);
        }
      },

      handleMaxTimePick(value) {
        if (value) {
          this.maxDate = new Date(value);
        }
        if (this.maxDate && this.minDate && this.minDate.getTime() > this.maxDate.getTime()) {
          this.minDate = new Date(this.maxDate);
        }
      },

      handleRangePick(val, close = true) {
        const defaultTime = this.defaultTime || [];
        const minDate = modifyWithTimeString(val.minDate, defaultTime[0]);
        const maxDate = modifyWithTimeString(val.maxDate, defaultTime[1]);

        if (this.maxDate === maxDate && this.minDate === minDate) {
          return;
        }
        this.onPick && this.onPick(val);

        // Detect if this is a new selection start
        const isNewSelection = !this.minDate || (this.minDate && this.maxDate);
        if (isNewSelection) {
          if (this.focusedInputIndex === 1) {
            // Reverse selection: User picked End Date first
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
          // Second pick
          this.isReverseSelecting = false;
        }

        this.maxDate = maxDate;
        this.minDate = minDate;
        if (this.minDate && !this.maxDate) {
          this.$emit('pick-start-date');
        }
        this.emitInputPreview();

        // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57
        setTimeout(() => {
          this.maxDate = maxDate;
          this.minDate = minDate;
        }, 10);
        if (!close || this.showTime) return;
        this.handleConfirm();
      },

      handleShortcutClick(shortcut) {
        if (shortcut.onClick) {
          shortcut.onClick(this);
        }
      },

      // leftPrev*, rightNext* need to take care of `unlinkPanels`
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

      // leftNext*, rightPrev* are called when `unlinkPanels` is true
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


