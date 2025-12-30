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
                @pick="handleRangePick"/>
            </div>
          </div>
          <div class="el-picker-panel__content el-date-range-picker__content is-right">
            <div class="el-date-range-picker__content-part" @mousedown.prevent>
              <div class="el-date-range-picker__header">
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
                @pick="handleRangePick"/>
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
    components: { DateTable, ElInput, ElButton },
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
