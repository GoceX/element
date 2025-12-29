<template>
  <transition name="el-slide-up" @after-enter="handleEnter" @after-leave="handleLeave">
    <div 
      v-show="visible" 
      class="el-picker-panel el-year-panel el-popper" 
      :class="[{
        'has-sidebar': $slots.sidebar || (shortcuts && shortcuts.length)
    }, popperClass]">
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
          <div class="el-date-picker__header el-date-picker__header--bordered">
            <button 
              type="button" 
              @click="handlePrevYear" 
              :aria-label="t(`el.datepicker.prevYear`)"
              class="el-picker-panel__icon-btn el-date-picker__prev-btn el-icon-d-arrow-left">
            </button>
            <span role="button" class="el-date-picker__header-label">
              {{ yearLabel }}
            </span>
            <button 
              type="button" 
              @click="handleNextYear" 
              :aria-label="t(`el.datepicker.nextYear`)"
              class="el-picker-panel__icon-btn el-date-picker__next-btn el-icon-d-arrow-right">
            </button>
          </div>
          <div class="el-picker-panel__content">
            <year-table 
              :date="date" 
              :value="value" 
              :default-value="defaultValue" 
              :disabled-date="disabledDate"
              :selection-mode="selectionMode" 
              @pick="handleYearPick" />
          </div>
        </div>
        <div
          class="el-picker-panel__footer"
          v-show="selectionMode === 'years'"
        >
          <el-button
            type="text"
            size="mini"
            class="el-picker-panel__link-btn"
            @click="handleConfirm">
            {{ t('el.datepicker.confirm') }}
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
import { prevYear, nextYear, isDate } from 'rowinself-ui/src/utils/date-util';
import Locale from 'rowinself-ui/src/mixins/locale';
import YearTable from '../basic/year-table';
import ElButton from 'rowinself-ui/packages/button';

export default {
  name: 'YearPanel',

  components: {
    YearTable,
    ElButton
  },

  mixins: [Locale],

  props: {
    linkedDate: {
      type: Date
    },
    value: [Date, Array, String],
    defaultValue: [Date, Array],
    disabledDate: Function,
    selectionMode: {
      default: 'year',
      type: String
    }
  },
  data () {
    return {
      date: new Date(),
      visible: false,
      shortcuts: '',
      popperClass: ''
    };
  },
  computed: {
    year () {
      return this.date.getFullYear();
    },
    yearLabel () {
      const yearTranslation = this.t('el.datepicker.year');
      const startYear = this.year - 6;
      if (yearTranslation) {
        return startYear + ' ' + yearTranslation + ' - ' + (startYear + 11) + ' ' + yearTranslation;
      }
      return startYear + ' - ' + (startYear + 11);
    }
  },
  watch: {
    linkedDate(val) {
      if (val) {
        this.date = new Date(val);
      }
    },
    value(val) {
      if (this.selectionMode === 'years' && this.value) return;
      if (isDate(val)) {
        this.date = new Date(val);
      } else {
        this.date = this.defaultValue ? new Date(this.defaultValue) : new Date();
      }
    },

    defaultValue(val) {
      if (!isDate(this.value)) {
        this.date = val ? new Date(val) : new Date();
      }
    }
  },

  methods: {
    handleEnter () {
      // document.body.addEventListener('keydown', this.handleKeydown);
    },

    handleLeave () {
      this.$emit('dodestroy');
      // document.body.removeEventListener('keydown', this.handleKeydown);
    },
    handlePrevYear () {
      const newDate = prevYear(this.date, 12);
      this.date = newDate;
      this.$emit('update:date', newDate);
    },
    handleNextYear () {
      const newDate = nextYear(this.date, 12);
      this.date = newDate;
      this.$emit('update:date', newDate);
    },
    handleYearPick (year) {
      if (this.selectionMode === 'years') {
        this.$emit('pick', year, true);
      } else {
        const date = new Date(year, 0, 1);
        this.$emit('pick', date, false);
      }
    },
    handleConfirm() {
      this.$emit('pick', this.value, false);
    }
  }
};
</script>
