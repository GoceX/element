<template>
  <transition name="el-slide-up" @after-enter="handleEnter" @after-leave="handleLeave">
    <div 
      v-show="visible" 
      class="el-picker-panel el-quarter-panel el-popper" 
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
            <span class="el-date-picker__header-label" style="margin: 0 5px">
              <el-select 
                v-model="currentYear" 
                size="mini" 
                filterable 
                allow-create 
                default-first-option
                :popper-append-to-body="false" 
                style="width: 110px;">
                <el-option v-for="y in yearOptions" :key="y" :value="y" :label="y + ' ' + t('el.datepicker.year')" />
              </el-select>
            </span>
            <button 
              type="button" 
              @click="handleNextYear" 
              :aria-label="t(`el.datepicker.nextYear`)"
              class="el-picker-panel__icon-btn el-date-picker__next-btn el-icon-d-arrow-right">
            </button>
          </div>
          <div class="el-picker-panel__content">
            <quarter-table 
              :date="date" 
              :value="value" 
              :default-value="defaultValue" 
              :disabled-date="disabledDate"
              :selection-mode="selectionMode" 
              @pick="handleQuarterPick" />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
import Locale from 'rowinself-ui/src/mixins/locale';
import QuarterTable from '../basic/quarter-table';
import ElSelect from 'rowinself-ui/packages/select';
import ElOption from 'rowinself-ui/packages/option';
import { prevYear, nextYear, modifyDate, isDate } from 'rowinself-ui/src/utils/date-util';

export default {
  name: 'QuarterPanel',

  components: {
    QuarterTable,
    ElSelect,
    ElOption
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
      default: 'quarter',
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
    currentYear: {
      get () {
        return this.date.getFullYear();
      },
      set (val) {
        const year = Number(val);
        if (isNaN(year)) return;
        const date = modifyDate(this.date, year, this.date.getMonth(), this.date.getDate());
        this.date = date;
        this.$emit('update:date', date);
      }
    },
    yearOptions () {
      const currentYear = this.date.getFullYear();
      const start = currentYear - 50;
      const end = currentYear + 5;
      const options = [];
      for (let i = start; i <= end; i++) {
        options.push(i);
      }
      return options;
    }
  },

  watch: {
    linkedDate(val) {
      if (val) {
        this.date = new Date(val);
      }
    },

    value(val) {
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

    handleShortcutClick (shortcut) {
      if (shortcut.onClick) {
        shortcut.onClick(this);
      }
    },

    resetView () {
      // Quarter panel only has one view
    },

    handlePrevYear () {
      const newDate = prevYear(this.date);
      this.date = newDate;
      this.$emit('update:date', newDate);
    },
    handleNextYear () {
      const newDate = nextYear(this.date);
      this.date = newDate;
      this.$emit('update:date', newDate);
    },
    handleQuarterPick (quarter) {
      if (this.selectionMode === 'quarter') {
        const year = this.date.getFullYear();
        const month = quarter * 3;
        const newDate = modifyDate(this.date, year, month, 1);
        this.$emit('pick', newDate, false);
      }
    }
  }
};
</script>
