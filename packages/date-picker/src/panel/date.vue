<template>
  <!-- 
    日期选择器面板模板
    包含了日期、年份、月份、季度选择以及时间选择功能
  -->
  <transition name="el-slide-up" @after-enter="handleEnter" @after-leave="handleLeave">
    <div
      v-show="visible"
      class="el-picker-panel el-date-picker el-popper"
      :class="[{
        'has-sidebar': $slots.sidebar || (shortcuts && shortcuts.length),
        'has-time': showTime
    }, popperClass]">
      <div class="el-picker-panel__body-wrapper">
        <!-- 侧边栏插槽 -->
        <slot name="sidebar" class="el-picker-panel__sidebar"></slot>
        <!-- 快捷选项侧边栏 -->
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
          <!-- 主体内容包装器 -->
          <date-time
            v-show="currentView === 'date'"
            :date="date"
            :show-time="showTime"
            :show-seconds="showSeconds"
            :am-pm-mode="amPmMode"
            :arrow-control="arrowControl"
            :selection-mode="selectionMode"
            :first-day-of-week="firstDayOfWeek"
            :value="value"
            :default-value="defaultValue ? new Date(defaultValue) : null"
            :cell-class-name="cellClassName"
            :disabled-date="disabledDate"
            :current-view="currentView"
            :current-year="currentYear"
            :current-month="currentMonth"
            :year-options="yearOptions"
            :month-options="monthOptions"
            @update:currentYear="currentYear = $event"
            @update:currentMonth="currentMonth = $event"
            @handle-today="handleToday"
            @time-change="handleTimeSpinnerChange"
            @pick="handleDatePick"
          />

          <div v-show="currentView !== 'date'">
            <year-panel
              v-show="currentView === 'year'"
              :linked-date="date"
              :value="value"
              :default-value="defaultValue ? new Date(defaultValue) : null"
              :disabled-date="disabledDate"
              :selection-mode="selectionMode"
              @pick="handleYearPick"
              @update:date="date = $event"/>
            <!-- 月份选择表格 -->
            <month-panel
              v-show="currentView === 'month'"
              :linked-date="date"
              :value="value"
              :default-value="defaultValue ? new Date(defaultValue) : null"
              :disabled-date="disabledDate"
              :selection-mode="monthTableSelectionMode"
              @pick="handleMonthPick"
              @show-year-picker="showYearPicker"
              @update:date="date = $event"/>
            <quarter-panel
              v-show="currentView === 'quarter'"
              :linked-date="date"
              :value="value"
              :default-value="defaultValue ? new Date(defaultValue) : null"
              :disabled-date="disabledDate"
              :selection-mode="selectionMode"
              @pick="handleQuarterPanelPick"
              @update:date="date = $event"/>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div
          class="el-picker-panel__footer"
          v-show="footerVisible &&
          (currentView === 'date' || currentView === 'month' || currentView === 'year')"
        >
          <!-- 此刻按钮 -->
          <el-button
            size="mini"
            type="text"
            class="el-picker-panel__link-btn"
            @click="changeToNow"
            v-show="selectionMode !== 'dates' && selectionMode !== 'months' && selectionMode !== 'years'">
            {{ t('el.datepicker.now') }}
          </el-button>

          <!-- 确定按钮 -->
          <el-button
            type="text"
            size="mini"
            class="el-picker-panel__link-btn"
            @click="confirm">
            {{ t('el.datepicker.confirm') }}
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  import {
    formatDate,
    parseDate,
    getWeekNumber,
    isDate,
    modifyDate,
    modifyTime,
    modifyWithTimeString,
    clearMilliseconds,
    clearTime,
    prevYear,
    nextYear,
    prevMonth,
    nextMonth,
    changeYearMonthAndClampDate,
    extractDateFormat,
    extractTimeFormat,
    timeWithinRange
  } from 'rowinself-ui/src/utils/date-util';
  import Clickoutside from 'rowinself-ui/src/utils/clickoutside';
  import Locale from 'rowinself-ui/src/mixins/locale';
  import ElInput from 'rowinself-ui/packages/input';
  import ElButton from 'rowinself-ui/packages/button';
  import ElSelect from 'rowinself-ui/packages/select';
  import ElOption from 'rowinself-ui/packages/option';
  import YearPanel from './year';
  import MonthPanel from './month';
  import QuarterPanel from './quarter';
  import DateTime from './date-time';
  import TimePicker from './time';

  export default {

    directives: { Clickoutside },

    components: {
      TimePicker, YearPanel, MonthPanel, QuarterPanel,  ElInput, ElButton, DateTime, ElSelect, ElOption
    },
    mixins: [Locale],

    data() {
      return {
        popperClass: '',
        date: new Date(),
        value: '',
        defaultValue: null, // use getDefaultValue() for time computation
        defaultTime: null,
        showTime: false,
        selectionMode: 'day',
        shortcuts: '',
        visible: false,
        currentView: 'date',
        disabledDate: null,
        cellClassName: '',
        selectableRange: [],
        firstDayOfWeek: 7,
        showWeekNumber: false,
        timePickerVisible: false,
        format: '',
        arrowControl: false,
        userInputDate: null,
        userInputTime: null
      };
    },

    computed: {
      monthTableSelectionMode() {
        if (this.selectionMode === 'months') {
          return 'months';
        }
        return 'month';
      },

      year() {
        return this.date.getFullYear();
      },

      month() {
        return this.date.getMonth();
      },

      week() {
        return getWeekNumber(this.date);
      },

      monthDate() {
        return this.date.getDate();
      },

      footerVisible() {
        return this.showTime || this.selectionMode === 'dates' || this.selectionMode === 'months' || this.selectionMode === 'years';
      },

      visibleTime() {
        if (this.userInputTime !== null) {
          return this.userInputTime;
        } else {
          return formatDate(this.value || this.defaultValue, this.timeFormat);
        }
      },

      visibleDate() {
        if (this.userInputDate !== null) {
          return this.userInputDate;
        } else {
          return formatDate(this.value || this.defaultValue, this.dateFormat);
        }
      },

      yearLabel() {
        const yearTranslation = this.t('el.datepicker.year');
        return this.year + ' ' + yearTranslation;
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

      amPmMode() {
        if ((this.timeFormat || '').indexOf('A') !== -1) return 'A';
        if ((this.timeFormat || '').indexOf('a') !== -1) return 'a';
        return '';
      },

      showSeconds() {
        return (this.timeFormat || '').indexOf('ss') !== -1;
      },

      currentYear: {
        get() {
          return this.date.getFullYear();
        },
        set(val) {
          const year = Number(val);
          if (isNaN(year)) return;
          const date = changeYearMonthAndClampDate(this.date, year, this.month);
          this.date = date;
        }
      },

      currentMonth: {
        get() {
          return this.date.getMonth();
        },
        set(val) {
          const month = Number(val);
          if (isNaN(month)) return;
          const date = changeYearMonthAndClampDate(this.date, this.year, month);
          this.date = date;
        }
      },

      yearOptions() {
        const currentYear = this.date.getFullYear();
        const start = currentYear - 50;
        const end = currentYear + 5;
        const options = [];
        for (let i = start; i <= end; i++) {
          options.push(i);
        }
        return options;
      },

      monthOptions() {
        const options = [];
        for (let i = 0; i < 12; i++) {
          options.push({
            value: i,
            label: this.t(`el.datepicker.month${i + 1}`)
          });
        }
        return options;
      }
    },

    watch: {
      showTime(val) {
        /* istanbul ignore if */
        if (!val) return;
        // this.$nextTick(_ => {
        //   const inputElm = this.$refs.input.$el;
        //   if (inputElm) {
        //     this.pickerWidth = inputElm.getBoundingClientRect().width + 10;
        //   }
        // });
      },

      value(val) {
        if (this.selectionMode === 'dates' && this.value) return;
        if (this.selectionMode === 'months' && this.value) return;
        if (this.selectionMode === 'years' && this.value) return;
        if (isDate(val)) {
          this.date = new Date(val);
        } else {
          this.date = this.getDefaultValue();
        }
      },

      defaultValue(val) {
        if (!isDate(this.value)) {
          this.date = val ? new Date(val) : new Date();
        }
      },

      timePickerVisible(val) {
        if (val) this.$nextTick(() => this.$refs.timepicker.adjustSpinners());
      },

      selectionMode(newVal) {
        if (newVal === 'month') {
          /* istanbul ignore next */
          if (this.currentView !== 'year' || this.currentView !== 'month') {
            this.currentView = 'month';
          }
        } else if (newVal === 'dates') {
          this.currentView = 'date';
        } else if (newVal === 'years') {
          this.currentView = 'year';
        } else if (newVal === 'months') {
          this.currentView = 'month';
        } else if (newVal === 'quarter') {
          this.currentView = 'quarter';
        }
      }
    },

    methods: {
      proxyTimePickerDataProperties() {
        const format = timeFormat => {this.$refs.timepicker.format = timeFormat;};
        const value = value => {this.$refs.timepicker.value = value;};
        const date = date => {this.$refs.timepicker.date = date;};
        const selectableRange = selectableRange => {this.$refs.timepicker.selectableRange = selectableRange;};

        this.$watch('value', value);
        this.$watch('date', date);
        this.$watch('selectableRange', selectableRange);

        format(this.timeFormat);
        value(this.value);
        date(this.date);
        selectableRange(this.selectableRange);
      },

      handleClear() {
        this.date = this.getDefaultValue();
        this.$emit('pick', null);
      },



      emit(value, ...args) {
        if (!value) {
          this.$emit('pick', value, ...args);
        } else if (Array.isArray(value)) {
          const dates = value.map(date => this.showTime ? clearMilliseconds(date) : clearTime(date));
          this.$emit('pick', dates, ...args);
        } else {
          this.$emit('pick', this.showTime ? clearMilliseconds(value) : clearTime(value), ...args);
        }
        this.userInputDate = null;
        this.userInputTime = null;
      },

      // resetDate() {
      //   this.date = new Date(this.date);
      // },

      showMonthPicker() {
        this.currentView = 'month';
      },

      showYearPicker() {
        this.currentView = 'year';
      },

      // XXX: 没用到
      // handleLabelClick() {
      //   if (this.currentView === 'date') {
      //     this.showMonthPicker();
      //   } else if (this.currentView === 'month') {
      //     this.showYearPicker();
      //   }
      // },

      prevMonth() {
        this.date = prevMonth(this.date);
      },

      nextMonth() {
        this.date = nextMonth(this.date);
      },

      prevYear() {
        this.date = prevYear(this.date);
      },

      nextYear() {
        this.date = nextYear(this.date);
      },

      handleShortcutClick(shortcut) {
        if (shortcut.onClick) {
          shortcut.onClick(this);
        }
      },

      handleTimeSpinnerChange(value) {
        if (isDate(value)) {
          const newDate = this.value
            ? modifyTime(this.value, value.getHours(), value.getMinutes(), value.getSeconds())
            : modifyWithTimeString(this.getDefaultValue(), this.defaultTime);
          this.date = newDate;
          this.emit(this.date, true);
        }
      },

      handleTimePick(value, visible, first) {
        if (isDate(value)) {
          const newDate = this.value
            ? modifyTime(this.value, value.getHours(), value.getMinutes(), value.getSeconds())
            : modifyWithTimeString(this.getDefaultValue(), this.defaultTime);
          this.date = newDate;
          this.emit(this.date, true);
        } else {
          this.emit(value, true);
        }
        if (!first) {
          this.timePickerVisible = visible;
        }
      },

      handleTimePickClose() {
        this.timePickerVisible = false;
      },

      handleMonthPick(month) {
        if (this.selectionMode === 'month') {
          this.date = modifyDate(this.date, this.year, month, 1);
          this.emit(this.date);
        } else if (this.selectionMode === 'months') {
          this.emit(month, true);
        } else {
          this.date = changeYearMonthAndClampDate(this.date, this.year, month);
          // TODO: should emit intermediate value ??
          // this.emit(this.date);
          this.currentView = 'date';
        }
      },

      handleQuarterPanelPick(date) {
        this.date = date;
        this.$emit('pick', date);
      },

      handleDatePick(value) {
        if (this.selectionMode === 'day') {
          let newDate = this.value
            ? modifyDate(this.value, value.getFullYear(), value.getMonth(), value.getDate())
            : modifyWithTimeString(value, this.defaultTime);
          // change default time while out of selectableRange
          if (!this.checkDateWithinRange(newDate)) {
            newDate = modifyDate(this.selectableRange[0][0], value.getFullYear(), value.getMonth(), value.getDate());
          }
          this.date = newDate;
          this.emit(this.date, this.showTime);
        } else if (this.selectionMode === 'week') {
          this.emit(value.date);
        } else if (this.selectionMode === 'dates') {
          this.emit(value, true); // set false to keep panel open
        }
      },

      handleYearPick(year) {
        if (this.selectionMode === 'year') {
          this.date = modifyDate(this.date, year, 0, 1);
          this.emit(this.date);
        } else if (this.selectionMode === 'years') {
          this.emit(year, true);
        } else {
          this.date = changeYearMonthAndClampDate(this.date, year, this.month);
          // TODO: should emit intermediate value ??
          // this.emit(this.date, true);
          this.currentView = 'month';
        }
      },

      changeToNow() {
        const now = new Date();
        this.date = now;
        this.emit(now);
      },

      handleToday() {
        const now = new Date();
        if ((!this.disabledDate || !this.disabledDate(now)) && this.checkDateWithinRange(now)) {
          this.date = now;
          this.emit(now, true);
        }
      },

      confirm() {
        if (this.selectionMode === 'dates' || this.selectionMode === 'months' || this.selectionMode === 'years') {
          this.emit(this.value);
        } else {
          // value were emitted in handle{Date,Time}Pick, nothing to update here
          // deal with the scenario where: user opens the picker, then confirm without doing anything
          const value = this.value
            ? this.value
            : modifyWithTimeString(this.getDefaultValue(), this.defaultTime);
          this.date = new Date(value); // refresh date
          this.emit(value);
        }
      },

      resetView() {
        if (this.selectionMode === 'month' || this.selectionMode === 'months') {
          this.currentView = 'month';
        } else if (this.selectionMode === 'year' || this.selectionMode === 'years') {
          this.currentView = 'year';
        } else if (this.selectionMode === 'quarter') {
          this.currentView = 'quarter';
        } else {
          this.currentView = 'date';
        }
      },

      handleEnter() {
        document.body.addEventListener('keydown', this.handleKeydown);
      },

      handleLeave() {
        this.$emit('dodestroy');
        document.body.removeEventListener('keydown', this.handleKeydown);
      },

      handleKeydown(event) {
        const keyCode = event.keyCode;
        const list = [38, 40, 37, 39];
        const isCtrlYearKey = event.ctrlKey && (keyCode === 37 || keyCode === 39);
        const isPageMonthKey = keyCode === 33 || keyCode === 34;
        if (this.visible && !this.timePickerVisible) {
          if (isCtrlYearKey) {
            this.handleKeyYearControl(keyCode);
            event.stopPropagation();
            event.preventDefault();
            return;
          }

          if (isPageMonthKey) {
            this.handleKeyMonthControl(keyCode);
            event.stopPropagation();
            event.preventDefault();
            return;
          }

          if (list.indexOf(keyCode) !== -1) {
            this.handleKeyControl(keyCode);
            event.stopPropagation();
            event.preventDefault();
          }
          if (keyCode === 13 && this.userInputDate === null && this.userInputTime === null) { // Enter
            this.emit(this.date, false);
          }
        }
      },

      handleKeyMonthControl(keyCode) {
        const step = keyCode === 33 ? -1 : 1;
        const maxTries = 24;
        let tryCount = 0;
        let nextDateCandidate = new Date(this.date.getTime());

        while (tryCount < maxTries) {
          nextDateCandidate = this.shiftDateByMonth(nextDateCandidate, step);
          if (typeof this.disabledDate === 'function' && this.disabledDate(nextDateCandidate)) {
            tryCount += 1;
            continue;
          }
          this.date = nextDateCandidate;
          this.$emit('pick', nextDateCandidate, true);
          break;
        }
      },

      handleKeyYearControl(keyCode) {
        const step = keyCode === 37 ? -1 : 1;
        const maxTries = 24;
        let tryCount = 0;
        let nextDateCandidate = new Date(this.date.getTime());

        while (tryCount < maxTries) {
          nextDateCandidate = this.shiftDateByYear(nextDateCandidate, step);
          if (typeof this.disabledDate === 'function' && this.disabledDate(nextDateCandidate)) {
            tryCount += 1;
            continue;
          }
          this.date = nextDateCandidate;
          this.$emit('pick', nextDateCandidate, true);
          break;
        }
      },

      shiftDateByMonth(date, step) {
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth();
        const targetMonth = currentMonth + step;
        const normalized = this.normalizeYearMonth(currentYear, targetMonth);
        return changeYearMonthAndClampDate(date, normalized.year, normalized.month);
      },

      shiftDateByYear(date, step) {
        const targetYear = date.getFullYear() + step;
        return changeYearMonthAndClampDate(date, targetYear, date.getMonth());
      },

      normalizeYearMonth(year, month) {
        if (month >= 0 && month <= 11) return { year, month };
        const deltaYear = Math.floor(month / 12);
        const normalizedMonth = ((month % 12) + 12) % 12;
        return { year: year + deltaYear, month: normalizedMonth };
      },

      handleKeyControl(keyCode) {
        const mapping = {
          'year': {
            38: -4, 40: 4, 37: -1, 39: 1, offset: (date, step) => date.setFullYear(date.getFullYear() + step)
          },
          'month': {
            38: -4, 40: 4, 37: -1, 39: 1, offset: (date, step) => date.setMonth(date.getMonth() + step)
          },
          'week': {
            38: -1, 40: 1, 37: -1, 39: 1, offset: (date, step) => date.setDate(date.getDate() + step * 7)
          },
          'day': {
            38: -7, 40: 7, 37: -1, 39: 1, offset: (date, step) => date.setDate(date.getDate() + step)
          }
        };
        const mode = this.selectionMode;
        const year = 3.1536e10;
        const now = this.date.getTime();
        const newDate = new Date(this.date.getTime());
        while (Math.abs(now - newDate.getTime()) <= year) {
          const map = mapping[mode];
          map.offset(newDate, map[keyCode]);
          if (typeof this.disabledDate === 'function' && this.disabledDate(newDate)) {
            continue;
          }
          this.date = newDate;
          this.$emit('pick', newDate, true);
          break;
        }
      },

      handleVisibleTimeChange(value) {
        const time = parseDate(value, this.timeFormat);
        if (time && this.checkDateWithinRange(time)) {
          this.date = modifyDate(time, this.year, this.month, this.monthDate);
          this.userInputTime = null;
          this.$refs.timepicker.value = this.date;
          this.timePickerVisible = false;
          this.emit(this.date, true);
        }
      },

      handleVisibleDateChange(value) {
        const date = parseDate(value, this.dateFormat);
        if (date) {
          if (typeof this.disabledDate === 'function' && this.disabledDate(date)) {
            return;
          }
          this.date = modifyTime(date, this.date.getHours(), this.date.getMinutes(), this.date.getSeconds());
          this.userInputDate = null;
          this.resetView();
          this.emit(this.date, true);
        }
      },

      isValidValue(value) {
        return value && !isNaN(value) && (
          typeof this.disabledDate === 'function'
            ? !this.disabledDate(value)
            : true
        ) && this.checkDateWithinRange(value);
      },

      getDefaultValue() {
        // if default-value is set, return it
        // otherwise, return now (the moment this method gets called)
        return this.defaultValue ? new Date(this.defaultValue) : new Date();
      },

      checkDateWithinRange(date) {
        return this.selectableRange.length > 0
          ? timeWithinRange(date, this.selectableRange, this.format || 'HH:mm:ss')
          : true;
      }
    },
  };
</script>