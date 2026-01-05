<template>
  <table @click="handleQuarterTableClick" @mousemove="handleMouseMove" class="el-quarter-table">
    <tbody>
      <tr>
        <td class="el-quarter-table__cell" :class="getCellStyle(0)">
          <div class="el-quarter-table__cell-inner">
            <a class="el-quarter-table__cell-text">{{ t('el.datepicker.quarters.Q1') }}</a>
          </div>
        </td>
        <td class="el-quarter-table__cell" :class="getCellStyle(1)">
          <div class="el-quarter-table__cell-inner">
            <a class="el-quarter-table__cell-text">{{ t('el.datepicker.quarters.Q2') }}</a>
          </div>
        </td>
        <td class="el-quarter-table__cell" :class="getCellStyle(2)">
          <div class="el-quarter-table__cell-inner">
            <a class="el-quarter-table__cell-text">{{ t('el.datepicker.quarters.Q3') }}</a>
          </div>
        </td>
        <td class="el-quarter-table__cell" :class="getCellStyle(3)">
          <div class="el-quarter-table__cell-inner">
            <a class="el-quarter-table__cell-text">{{ t('el.datepicker.quarters.Q4') }}</a>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script type="text/babel">
  import Locale from 'rowinself-ui/src/mixins/locale';
  import { isDate, range, nextDate, getDayCountOfMonth } from 'rowinself-ui/src/utils/date-util';
  import { hasClass } from 'rowinself-ui/src/utils/dom';
  import { arrayFindIndex, coerceTruthyValueToArray } from 'rowinself-ui/src/utils/util';

  const datesInQuarter = (year, quarter) => {
    const startMonth = quarter * 3;
    let dates = [];
    for (let i = 0; i < 3; i++) {
      const month = startMonth + i;
      const numOfDays = getDayCountOfMonth(year, month);
      const firstDay = new Date(year, month, 1);
      dates = dates.concat(range(numOfDays).map(n => nextDate(firstDay, n)));
    }
    return dates;
  };

  export default {
    mixins: [Locale],

    props: {
      disabledDate: {
        type: Function,
        default: null
      },
      value: {
        type: [Date, Array, String],
        default: null
      },
      selectionMode: {
        type: String,
        default: 'quarter'
      },
      minDate: {
        type: Date,
        default: null
      },
      maxDate: {
        type: Date,
        default: null
      },
      defaultValue: {
        type: [Date, Array],
        default: null,
        validator(val) {
          // null 或有效 Date 对象
          return val === null || isDate(val) || (Array.isArray(val) && val.every(isDate));
        }
      },
      date: {
        type: Date,
        required: true
      },
      rangeState: {
        type: Object,
        default() {
          return {
            endDate: null,
            selecting: false
          };
        }
      }
    },

    data() {
      return {
      };
    },

    methods: {
      getCellStyle(quarter) {
        const style = {};
        const year = this.date.getFullYear();
        const today = new Date();
        const month = today.getMonth();
        const currentQuarter = Math.floor(month / 3);
        const defaultValue = this.defaultValue ? Array.isArray(this.defaultValue) ? this.defaultValue : [this.defaultValue] : [];

        style['is-disabled'] = typeof this.disabledDate === 'function'
          ? datesInQuarter(year, quarter).every(this.disabledDate)
          : false;

        style['is-current'] = arrayFindIndex(coerceTruthyValueToArray(this.value), date => 
          date.getFullYear() === year && Math.floor(date.getMonth() / 3) === quarter
        ) >= 0;

        style['is-today'] = today.getFullYear() === year && currentQuarter === quarter;
        style['is-default'] = defaultValue.some(date => 
          date.getFullYear() === year && Math.floor(date.getMonth() / 3) === quarter
        );

        if (this.selectionMode === 'range') {
          const quarterStartMonth = quarter * 3;
          const quarterStartDate = new Date(year, quarterStartMonth, 1);
          const quarterEndDate = new Date(year, quarterStartMonth + 3, 0);

          let minDate = this.minDate;
          let maxDate = this.maxDate;
          
          if (this.rangeState.selecting && this.rangeState.endDate) {
             const endDate = this.rangeState.endDate;
             if (endDate < minDate) {
               maxDate = minDate;
               minDate = endDate;
             } else {
               maxDate = endDate;
             }
          }

          if (minDate && maxDate) {
             style['is-in-range'] = 
               (minDate <= quarterEndDate && maxDate >= quarterStartDate);
             
             // Check start date (approximate check for quarter)
             const minQuarter = Math.floor(minDate.getMonth() / 3);
             const minYear = minDate.getFullYear();
             style['is-start-date'] = minYear === year && minQuarter === quarter;

             // Check end date
             const maxQuarter = Math.floor(maxDate.getMonth() / 3);
             const maxYear = maxDate.getFullYear();
             style['is-end-date'] = maxYear === year && maxQuarter === quarter;
          } else if (minDate) {
             const minQuarter = Math.floor(minDate.getMonth() / 3);
             const minYear = minDate.getFullYear();
             style['is-start-date'] = minYear === year && minQuarter === quarter;
          }
        }

        return style;
      },

      handleMouseMove(event) {
        if (!this.rangeState.selecting) return;

        let target = event.target;
        while (target.tagName !== 'TD') {
          if (target.tagName === 'TABLE') return;
          target = target.parentNode;
        }

        const column = target.cellIndex;
        const quarter = column;
        // Check if disabled
        if (hasClass(target, 'is-disabled')) return;
        
        const year = this.date.getFullYear();
        const quarterStartMonth = quarter * 3;
        // Use the end of the quarter as the end date for range calculation logic usually?
        // Or the start?
        // In year-table, we used start of year.
        // Let's use start of quarter.
        const newDate = new Date(year, quarterStartMonth, 1);

        this.$emit('changerange', {
          minDate: this.minDate,
          maxDate: this.maxDate,
          rangeState: {
            selecting: true,
            endDate: newDate
          }
        });
      },

      handleQuarterTableClick(event) {
        let target = event.target;
        while (target.tagName !== 'TD') {
          if (target.tagName === 'TABLE') return;
          target = target.parentNode;
        }

        if (hasClass(target, 'is-disabled')) return;

        const column = target.cellIndex;
        const quarter = column; // 0, 1, 2, 3
        
        if (this.selectionMode === 'range') {
          const year = this.date.getFullYear();
          const quarterStartMonth = quarter * 3;
          const newDate = new Date(year, quarterStartMonth, 1);
          
          if (!this.rangeState.selecting) {
            this.$emit('pick', {minDate: newDate, maxDate: null});
            this.rangeState.selecting = true;
          } else {
             if (newDate >= this.minDate) {
               this.$emit('pick', {minDate: this.minDate, maxDate: newDate});
             } else {
               this.$emit('pick', {minDate: newDate, maxDate: this.minDate});
             }
             this.rangeState.selecting = false;
          }
        } else {
          this.$emit('pick', quarter);
        }
      }
    }
  };
</script>
