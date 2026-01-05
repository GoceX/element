<template>
  <table @click="handleYearTableClick" @mousemove="handleMouseMove" class="el-year-table" :class="{ 'is-selecting': rangeState.selecting }">
    <tbody>
      <tr>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 0)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 1)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 1 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 2)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 2 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 3)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 3 }}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 4)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 4 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 5)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 5 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 6)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 6 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 7)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 7 }}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 8)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 8 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 9)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 9 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 10)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 10 }}</a>
          </div>
        </td>
        <td class="el-year-table__cell" :class="getCellStyle(startYear + 11)">
          <div class="el-year-table__cell-inner">
            <a class="el-year-table__cell-text">{{ startYear + 11 }}</a>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script type="text/babel">
  import { hasClass } from 'rowinself-ui/src/utils/dom';
  import { isDate, range, nextDate, getDayCountOfYear } from 'rowinself-ui/src/utils/date-util';
  import { arrayFindIndex, coerceTruthyValueToArray } from 'rowinself-ui/src/utils/util';

  const datesInYear = year => {
    const numOfDays = getDayCountOfYear(year);
    const firstDay = new Date(year, 0, 1);
    return range(numOfDays).map(n => nextDate(firstDay, n));
  };

  export default {
    props: {
      disabledDate: {
        type: Function
      },
      value: {
        type: [Date, Array, String],
        default: null
      },
      defaultValue: {
        validator(val) {
          // null or valid Date Object
          return val === null || (val instanceof Date && isDate(val));
        }
      },
      date: {
        type: Date
      },
      selectionMode: {
        type: String
      },
      minDate: {
        type: [Date, String, Number]
      },
      maxDate: {
        type: [Date, String, Number]
      },
      rangeState: {
        default() {
          return {
            endDate: null,
            selecting: false
          };
        },
        type: Object
      }
    },

    computed: {
      startYear() {
        return this.date && this.date.getFullYear ? this.date.getFullYear() - 6 : new Date().getFullYear() - 6;
      }
    },

    methods: {
      getCellStyle(year) {
        const style = {};
        const today = new Date();

        style['is-disabled'] = typeof this.disabledDate === 'function'
          ? datesInYear(year).every(this.disabledDate)
          : false;
        style['is-current'] = arrayFindIndex(coerceTruthyValueToArray(this.value), date => isDate(date) && date.getFullYear() === year) >= 0;
        style['is-today'] = today.getFullYear() === year;
        style['is-default'] = this.defaultValue && isDate(this.defaultValue) && this.defaultValue.getFullYear() === year;

        if (this.selectionMode === 'range') {
          let minYear = this.minDate ? this.minDate.getFullYear() : -1;
          let maxYear = this.maxDate ? this.maxDate.getFullYear() : -1;
          
          if (this.rangeState.selecting && this.rangeState.endDate) {
            const endDateYear = this.rangeState.endDate.getFullYear();
            if (endDateYear < minYear) {
              maxYear = minYear;
              minYear = endDateYear;
            } else {
              maxYear = endDateYear;
            }
          }

          style['is-in-range'] = minYear >= 0 && maxYear >= 0 && year >= minYear && year <= maxYear;
          style['is-start-date'] = minYear >= 0 && year === minYear;
          style['is-end-date'] = maxYear >= 0 && year === maxYear;
          style['is-preview-end'] = this.rangeState.selecting && this.rangeState.endDate && this.rangeState.endDate.getFullYear() === year;
        }

        return style;
      },

      handleYearTableClick(event) {
        let target = event.target;
        if (target.tagName === 'A') {
          target = target.parentNode.parentNode;
        }
        if (target.tagName === 'DIV') {
          target = target.parentNode;
        }
        if (target.tagName !== 'TD') return;
        if (hasClass(target, 'is-disabled')) return;

        const column = target.cellIndex;
        const row = target.parentNode.rowIndex;
        const year = this.startYear + row * 4 + column;

        if (this.selectionMode === 'years') {
          const value = this.value || [];
          const idx = arrayFindIndex(value, date => isDate(date) && date.getFullYear() === Number(year));
          const newValue = idx > -1
            ? [...value.slice(0, idx), ...value.slice(idx + 1)]
            : [...value, new Date(year)];
          this.$emit('pick', newValue);
        } else if (this.selectionMode === 'range') {
          const newDate = new Date(year, 0, 1);
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
          this.$emit('pick', Number(year));
        }
      },
      
      handleMouseMove(event) {
        if (!this.rangeState.selecting) return;

        let target = event.target;
        if (target.tagName === 'A') {
          target = target.parentNode.parentNode;
        }
        if (target.tagName === 'DIV') {
          target = target.parentNode;
        }
        if (target.tagName !== 'TD') return;
        
        const column = target.cellIndex;
        const row = target.parentNode.rowIndex;
        const year = this.startYear + row * 4 + column;
        
        // Check if disabled
        if (hasClass(target, 'disabled')) return;

        if (this.rangeState.endDate && this.rangeState.endDate.getFullYear() === year) return;

        this.$emit('changerange', {
          minDate: this.minDate,
          maxDate: this.maxDate,
          rangeState: {
            selecting: true,
            endDate: new Date(year, 0, 1)
          }
        });
      }
    }
  };
</script>
