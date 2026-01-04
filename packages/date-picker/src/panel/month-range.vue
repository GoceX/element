<template>
  <transition name="el-slide-up" @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-picker-panel el-date-range-picker el-popper"
      :class="[{
        'has-sidebar': $slots.sidebar || shortcuts
    }, popperClass]">
      <div class="el-picker-panel__body-wrapper">
        <slot name="sidebar" class="el-picker-panel__sidebar"></slot>
        <div class="el-picker-panel__sidebar" v-if="shortcuts">
          <button
            type="button"
            class="el-picker-panel__shortcut"
            v-for="(shortcut, key) in shortcuts"
            :key="key"
            @click="handleShortcutClick(shortcut)">{{ shortcut.text }}</button>
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
                  <!-- 今天按钮 -->
                  <el-button
                    type="text"
                    size="mini"
                    @click="handleLeftMonth"
                    style="margin-left: 5px;">
                    {{ t('el.datepicker.month') }}
                  </el-button>
                </slot>
              </div>
              <month-table
                selection-mode="range"
                :date="leftDate"
                :default-value="defaultValue"
                :min-date="minDate"
                :max-date="maxDate"
                :range-state="rangeState"
                :disabled-date="disabledDate"
                @changerange="handleChangeRange"
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
                >
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
                  <!-- 今天按钮 -->
                  <el-button
                    type="text"
                    size="mini"
                    @click="handleRightMonth"
                    style="margin-left: 5px;">
                    {{ t('el.datepicker.month') }}
                  </el-button>
                </slot>
              </div>
              <month-table
                selection-mode="range"
                :date="rightDate"
                :default-value="defaultValue"
                :min-date="minDate"
                :max-date="maxDate"
                :range-state="rangeState"
                :disabled-date="disabledDate"
                @changerange="handleChangeRange"
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
    modifyWithTimeString,
    prevYear,
    nextYear,
    nextMonth,
    formatDate
  } from 'rowinself-ui/src/utils/date-util';
  import Clickoutside from 'rowinself-ui/src/utils/clickoutside';
  import Locale from 'rowinself-ui/src/mixins/locale';
  import MonthTable from '../basic/month-table';
  import ElInput from 'rowinself-ui/packages/input';
  import ElButton from 'rowinself-ui/packages/button';
  import ElSelect from 'rowinself-ui/packages/select';
  import ElOption from 'rowinself-ui/packages/option';

  const calcDefaultValue = (defaultValue) => {
    if (Array.isArray(defaultValue)) {
      return [new Date(defaultValue[0]), new Date(defaultValue[1])];
    } else if (defaultValue) {
      return [new Date(defaultValue), nextMonth(new Date(defaultValue))];
    } else {
      return [new Date(), nextMonth(new Date())];
    }
  };
  export default {

    directives: { Clickoutside },

    components: { MonthTable, ElInput, ElButton, ElSelect, ElOption },
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
        rightDate: nextYear(new Date()),
        rangeState: {
          endDate: null,
          selecting: false,
          row: null,
          column: null
        },
        shortcuts: '',
        visible: '',
        disabledDate: null,
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
        return this.leftDate.getFullYear() + ' ' + this.t('el.datepicker.year');
      },

      rightLabel() {
        return this.rightDate.getFullYear() + ' ' + this.t('el.datepicker.year');
      },

      leftYear() {
        return this.leftDate.getFullYear();
      },

      rightYear() {
        return this.rightDate.getFullYear() === this.leftDate.getFullYear() ? this.leftDate.getFullYear() + 1 : this.rightDate.getFullYear();
      },

      leftMonth() {
        return this.leftDate.getMonth();
      },

      leftMonthDate() {
        return this.leftDate.getDate();
      },

      rightMonth() {
        return this.rightDate.getMonth();
      },

      rightMonthDate() {
        return this.rightDate.getDate();
      },

      enableYearArrow() {
        return this.unlinkPanels && this.rightYear > this.leftYear + 1;
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
              const maxDateYear = this.maxDate.getFullYear();
              this.rightDate = minDateYear === maxDateYear
                ? nextYear(this.maxDate)
                : this.maxDate;
            } else {
              this.rightDate = nextYear(this.leftDate);
            }
          } else {
            this.leftDate = calcDefaultValue(this.defaultValue)[0];
            this.rightDate = nextYear(this.leftDate);
          }
        }
      },

      defaultValue(val) {
        if (!Array.isArray(this.value)) {
          const [left, right] = calcDefaultValue(val);
          this.leftDate = left;
          this.rightDate = val && val[1] && left.getFullYear() !== right.getFullYear() && this.unlinkPanels
            ? right
            : nextYear(this.leftDate);
        }
      }
    },

    methods: {
      /**
       * 处理左侧面板本月按钮点击事件
       * 设置开始日期为本月
       */
      handleLeftMonth() {
        const now = new Date();
        now.setDate(1); // 设置为当月1号
        now.setHours(0, 0, 0, 0); // 重置时间

        // 校验本月是否被禁用
        if (typeof this.disabledDate === 'function' && this.disabledDate(now)) {
          return;
        }
        
        this.minDate = new Date(now);
        
        // 更新左侧面板年份为当前年
        this.leftDate = new Date(now);
        // 如果未解耦面板，更新右侧面板为下一年
        if (!this.unlinkPanels) {
          this.rightDate = nextYear(this.leftDate);
        }

        // 如果结束日期存在，且小于开始日期，则重置结束日期为开始日期
        if (this.maxDate && this.maxDate < this.minDate) {
          this.maxDate = new Date(now);
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
       * 处理右侧面板本月按钮点击事件
       * 设置结束日期为本月
       */
      handleRightMonth() {
        const now = new Date();
        now.setDate(1); // 设置为当月1号
        now.setHours(0, 0, 0, 0); // 重置时间

        // 校验本月是否被禁用
        if (typeof this.disabledDate === 'function' && this.disabledDate(now)) {
          return;
        }
        
        this.maxDate = new Date(now);
        
        // 更新右侧面板年份为当前年
        this.rightDate = new Date(now);
        // 如果未解耦面板，更新左侧面板为上一年
        if (!this.unlinkPanels) {
          this.leftDate = prevYear(this.rightDate);
        }

        // 如果开始日期不存在，或者开始日期大于结束日期，则重置开始日期为结束日期
        if (!this.minDate || this.minDate > this.maxDate) {
          this.minDate = new Date(now);
        }

        // 触发选中事件（保持面板打开）
        this.$emit('pick', [this.minDate, this.maxDate], true);
      },

      handleClear() {
        this.minDate = null;
        this.maxDate = null;
        this.leftDate = calcDefaultValue(this.defaultValue)[0];
        this.rightDate = nextYear(this.leftDate);
        this.$emit('pick', null);
      },

      handleChangeRange(val) {
        this.minDate = val.minDate;
        this.maxDate = val.maxDate;
        this.rangeState = val.rangeState;
        this.emitInputPreview();
      },

      handleRangePick(val, close = true) {
        const defaultTime = this.defaultTime || [];
        const minDate = modifyWithTimeString(val.minDate, defaultTime[0]);
        const maxDate = modifyWithTimeString(val.maxDate, defaultTime[1]);
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

        // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57
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
        const format = this.format || (this.$parent && this.$parent.format) || 'yyyy-MM';

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

      handleShortcutClick(shortcut) {
        if (shortcut.onClick) {
          shortcut.onClick(this);
        }
      },

      // leftPrev*, rightNext* need to take care of `unlinkPanels`
      leftPrevYear() {
        this.leftDate = prevYear(this.leftDate);
        if (!this.unlinkPanels) {
          this.rightDate = prevYear(this.rightDate);
        }
      },

      rightNextYear() {
        if (!this.unlinkPanels) {
          this.leftDate = nextYear(this.leftDate);
        }
        this.rightDate = nextYear(this.rightDate);
      },

      // leftNext*, rightPrev* are called when `unlinkPanels` is true
      leftNextYear() {
        this.leftDate = nextYear(this.leftDate);
      },

      rightPrevYear() {
        this.rightDate = prevYear(this.rightDate);
      },

      handleLeftYearChange(year) {
        this.leftDate = modifyDate(this.leftDate, year, this.leftMonth, this.leftMonthDate);
      },

      handleRightYearChange(year) {
        this.rightDate = modifyDate(this.rightDate, year, this.rightMonth, this.rightMonthDate);
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
        // NOTE: 打开选择器时重置 {min, max}Date 的一种方法
        // TODO: 正确的做法是将 {min， max}Date 重构为依赖于值和内部选择状态
        // 另一种方法是在选择器可见时重置视图 还应研究日期面板的 resetView 方法
        this.minDate = this.value && isDate(this.value[0]) ? new Date(this.value[0]) : null;
        this.maxDate = this.value && isDate(this.value[0]) ? new Date(this.value[1]) : null;
      }
    },
  };
</script>
