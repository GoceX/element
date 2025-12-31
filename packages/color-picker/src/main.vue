<template>
  <div
    :class="[
      'el-color-picker',
      type === 'input' ? 'el-color-picker--input' : '',
      colorDisabled ? 'is-disabled' : '',
      colorSize ? `el-color-picker--${ colorSize }` : ''
    ]"
    v-clickoutside="hide">
    <div class="el-color-picker__mask" v-if="colorDisabled && type !== 'input'"></div>

    <el-input
      v-if="type === 'input'"
      :value="inputValue"
      :style="inputStyle"
      :disabled="colorDisabled"
      :size="colorSize"
      :validate-event="false"
      @input="handleInputValue"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
      @keyup.native.enter="handleInputConfirm"
    >
      <template #suffix>
        <span
          ref="trigger"
          class="el-color-picker__trigger el-color-picker__trigger--in-input"
          @click.stop="handleTrigger"
        >
          <span class="el-color-picker__color" :class="{ 'is-alpha': showAlpha }">
            <span
              class="el-color-picker__color-inner"
              :style="{
                backgroundColor: displayedColor
              }"
            ></span>
            <span class="el-color-picker__empty el-icon-close" v-if="!value && !showPanelColor"></span>
          </span>
        </span>
      </template>
    </el-input>

    <div v-else ref="trigger" class="el-color-picker__trigger" @click="handleTrigger">
      <span class="el-color-picker__color" :class="{ 'is-alpha': showAlpha }">
        <span 
          class="el-color-picker__color-inner"
          :style="{
            backgroundColor: displayedColor
        }"></span>
        <span class="el-color-picker__empty el-icon-close" v-if="!value && !showPanelColor"></span>
      </span>
      <span class="el-color-picker__icon el-icon-arrow-down" v-show="value || showPanelColor"></span>
    </div>
    <picker-dropdown
      ref="dropdown"
      :class="['el-color-picker__panel', popperClass || '']"
      v-model="showPicker"
      @pick="confirmValue"
      @clear="clearValue"
      :color="color"
      :show-alpha="showAlpha"
      :predefine="predefine"/>
  </div>
</template>

<script>
  import Color from './color';
  import PickerDropdown from './components/picker-dropdown.vue';
  import Clickoutside from 'rowinself-ui/src/utils/clickoutside';
  import Emitter from 'rowinself-ui/src/mixins/emitter';
  import ElInput from 'rowinself-ui/packages/input';

  export default {
    name: 'ElColorPicker',

    directives: { Clickoutside },

    components: {
      PickerDropdown,
      ElInput
    },

    mixins: [Emitter],

    props: {
      value: String,
      showAlpha: Boolean,
      colorFormat: String,
      disabled: Boolean,
      size: String,
      width: [String, Number],
      popperClass: String,
      predefine: Array,
      type: {
        type: String,
        default: 'default'
      }
    },

    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    data() {
      const color = new Color({
        enableAlpha: this.showAlpha,
        format: this.colorFormat
      });

      return {
        color,
        showPicker: false,
        showPanelColor: false,
        inputValue: '',
        inputFocused: false
      };
    },

    computed: {
      displayedColor() {
        if (!this.value && !this.showPanelColor) {
          return 'transparent';
        }

        return this.displayedRgb(this.color, this.showAlpha);
      },

      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },

      colorSize() {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      },

      colorDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      },

      inputStyle() {
        if (this.type !== 'input') return undefined;

        const min_width_px = 120;
        const width_value = this.width;
        let width_css_value = '';

        if (typeof width_value === 'number' && Number.isFinite(width_value)) {
          width_css_value = `${Math.max(width_value, 0)}px`;
        } else if (typeof width_value === 'string' && width_value.trim()) {
          const trimmed = width_value.trim();
          if (/^\d+(\.\d+)?$/.test(trimmed)) {
            width_css_value = `${Math.max(Number(trimmed), 0)}px`;
          } else {
            width_css_value = trimmed;
          }
        } else {
          const text_length = String(this.inputValue || '').length;
          width_css_value = `calc(${Math.max(text_length, 0)}ch + 64px)`;
        }

        return {
          minWidth: `${min_width_px}px`,
          width: width_css_value
        };
      }
    },

    watch: {
      value(val) {
        if (this.type === 'input' && !this.inputFocused) {
          this.inputValue = typeof val === 'string' ? val : '';
        }
        if (!val) {
          this.showPanelColor = false;
        } else if (val && val !== this.color.value) {
          this.color.fromString(val);
        }
      },
      color: {
        deep: true,
        handler() {
          this.showPanelColor = true;
        }
      },
      displayedColor(val) {
        if (!this.showPicker) return;
        const currentValueColor = new Color({
          enableAlpha: this.showAlpha,
          format: this.colorFormat
        });
        currentValueColor.fromString(this.value);

        const currentValueColorRgb = this.displayedRgb(currentValueColor, this.showAlpha);
        if (val !== currentValueColorRgb) {
          this.$emit('active-change', val);
        }
      }
    },

    mounted() {
      const value = this.value;
      if (value) {
        this.color.fromString(value);
      }
      this.popperElm = this.$refs.dropdown.$el;
      if (this.type === 'input') this.inputValue = typeof value === 'string' ? value : '';
    },

    methods: {
      handleTrigger() {
        if (this.colorDisabled) return;
        this.showPicker = !this.showPicker;
      },
      normalizeInputColor(value) {
        const raw = (value || '').trim();
        if (!raw) return '';
        if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw) || /^[0-9a-fA-F]{8}$/.test(raw)) {
          return `#${raw}`;
        }
        return raw;
      },
      resolveColorValue(value) {
        const normalized = this.normalizeInputColor(value);
        if (!normalized) return '';
        const candidate = new Color({
          enableAlpha: this.showAlpha,
          format: this.colorFormat
        });
        candidate.fromString(normalized);
        return candidate.value || '';
      },
      handleInputValue(val) {
        this.inputValue = typeof val === 'string' ? val : '';
      },
      handleInputFocus() {
        this.inputFocused = true;
      },
      handleInputBlur() {
        this.inputFocused = false;
        this.handleInputConfirm();
      },
      handleInputConfirm() {
        if (this.type !== 'input') return;
        if (this.colorDisabled) return;
        const next = this.resolveColorValue(this.inputValue);
        if (!this.inputValue || !String(this.inputValue).trim()) {
          this.clearValue();
          return;
        }
        if (!next) {
          this.inputValue = typeof this.value === 'string' ? this.value : '';
          return;
        }
        this.color.fromString(next);
        const value = this.color.value;
        this.$emit('input', value);
        this.$emit('change', value);
        this.dispatch('ElFormItem', 'el.form.change', value);
      },
      confirmValue() {
        const value = this.color.value;
        this.$emit('input', value);
        this.$emit('change', value);
        this.dispatch('ElFormItem', 'el.form.change', value);
        this.showPicker = false;
      },
      clearValue() {
        this.$emit('input', null);
        this.$emit('change', null);
        if (this.value !== null) {
          this.dispatch('ElFormItem', 'el.form.change', null);
        }
        this.showPanelColor = false;
        this.showPicker = false;
        if (this.type === 'input') this.inputValue = '';
        this.resetColor();
      },
      hide() {
        this.showPicker = false;
        this.resetColor();
      },
      resetColor() {
        this.$nextTick(_ => {
          if (this.value) {
            this.color.fromString(this.value);
          } else {
            this.showPanelColor = false;
          }
        });
      },
      displayedRgb(color, showAlpha) {
        if (!(color instanceof Color)) {
          throw Error('color should be instance of Color Class');
        }

        const { r, g, b } = color.toRgb();
        return showAlpha
          ? `rgba(${ r }, ${ g }, ${ b }, ${ color.get('alpha') / 100 })`
          : `rgb(${ r }, ${ g }, ${ b })`;
      }
    },
  };
</script>
