<template>
  <div class="date-time-panel">
    <div class="date-time-panel__date-part">
      <slot name="header">
        <!-- 头部导航栏：年份、月份切换 -->
        <div
          class="el-date-picker__header"
          :class="{ 'el-date-picker__header--bordered': currentView === 'year' || currentView === 'month' || currentView === 'quarter' }"
          v-show="currentView !== 'time'">
          <slot name="header-label">
            <!-- 年份下拉 -->
            <span class="el-date-picker__header-label" style="margin: 0 5px">
              <el-select
                :value="currentYear"
                @input="$emit('update:currentYear', $event)"
                size="mini"
                filterable
                allow-create
                default-first-option
                :popper-append-to-body="false"
                style="width: 110px;">
                <el-option
                  v-for="y in yearOptions"
                  :key="y"
                  :value="y"
                  :label="y + ' ' + t('el.datepicker.year')"/>
              </el-select>
            </span>
            <!-- 月份下拉（仅在日期视图显示） -->
            <span
              v-show="currentView === 'date'"
              class="el-date-picker__header-label"
              style="margin: 0 5px">
              <el-select
                :value="currentMonth"
                @input="$emit('update:currentMonth', $event)"
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
              v-show="currentView === 'date'"
              style="margin-left: 5px;">
              {{ t('el.datepicker.today') }}
            </el-button>
          </slot>
        </div>
      </slot>
      <div class="date-time-panel__content" @mousedown.prevent>
        <date-table
          :selection-mode="selectionMode"
          :first-day-of-week="firstDayOfWeek"
          :value="value"
          :default-value="defaultValue"
          :date="date"
          :cell-class-name="cellClassName"
          :disabled-date="disabledDate"
          :min-date="minDate"
          :max-date="maxDate"
          :range-state="rangeState"
          :is-range-picker="isRangePicker"
          @pick="handlePick"
          @changerange="handleChangeRange"
        />
      </div>
    </div>
    <div class="date-time-panel__time-part" v-if="showTime" @mousedown.prevent>
      <div class="date-time-panel__time-header">{{ visibleTime }}</div>
      <div class="el-time-panel__content" :class="{ 'has-seconds': showSeconds }">
        <time-spinner
          ref="timeSpinner"
          :show-seconds="showSeconds"
          :am-pm-mode="amPmMode"
          @change="handleTimeChange"
          :arrow-control="arrowControl"
          :date="date"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import TimeSpinner from '../basic/time-spinner';
  import DateTable from '../basic/date-table';
  import { formatDate } from 'rowinself-ui/src/utils/date-util';
  import Locale from 'rowinself-ui/src/mixins/locale';
  import ElButton from 'rowinself-ui/packages/button';
  import ElSelect from 'rowinself-ui/packages/select';
  import ElOption from 'rowinself-ui/packages/option';

  export default {
    name: 'DateTime',
    components: { TimeSpinner, DateTable, ElButton, ElSelect, ElOption },
    mixins: [Locale],
    props: {
      currentView: String,
      currentYear: Number,
      currentMonth: Number,
      yearOptions: Array,
      monthOptions: Array,
      date: {
        type: Date,
        default() {
          return new Date();
        }
      },
      showTime: {
        type: Boolean,
        default: false
      },
      showSeconds: Boolean,
      amPmMode: String,
      arrowControl: Boolean,
      selectionMode: {
        type: String,
        default: 'day'
      },
      value: [Date, Array, String],
      defaultValue: [Date, Array],
      minDate: [Date, String],
      maxDate: [Date, String],
      rangeState: {
        type: Object,
        default() {
          return {
            endDate: null,
            selecting: false,
            row: null,
            column: null
          };
        }
      },
      disabledDate: Function,
      cellClassName: [Function, String],
      firstDayOfWeek: {
        type: Number,
        default: 7
      },
      isRangePicker: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        visible: false,
        timePickerVisible: false // 时间选择器显隐
      };
    },
    computed: {
      visibleTime() {
        if (!this.date) return '';
        const format = this.showSeconds ? 'HH:mm:ss' : 'HH:mm';
        return formatDate(this.date, format);
      }
    },
    methods: {
      handleTimeChange(value) {
        this.$emit('time-change', value);
      },
      handlePick(value, ...args) {
        this.$emit('pick', value, ...args);
      },
      handleChangeRange(val) {
        this.$emit('changerange', val);
      }
    }
  };
</script>

<style lang="scss" scoped>
  .date-time-panel {
    display: flex;
    flex-direction: row;

    &__date-part {
      width: 322px;
    }

    &__time-part {
      width: 161px;
      border-left: 1px solid #e4e7ed;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    &__time-header {
      height: 31px;
      line-height: 31px;
      text-align: center;
      color: #777;
      flex: 0 0 auto;
      padding: 12px;
    }

    &__content {
      position: relative;
      border-top: 1px solid #E4E7ED;
    }
  }

  .el-time-panel__content {
    flex: 1;
    position: relative;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    /* border-radius: 0px; */
    margin: 0 10px 10px;

    .el-time-spinner {
      max-height: 270px;
      &__wrapper {
        max-height: 270px;
      }
    }
  }
</style>
