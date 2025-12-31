<template>
  <transition name="el-zoom-in-top" @after-leave="doDestroy">
    <div
      class="el-color-dropdown"
      v-show="showPopper">
      <div class="el-color-dropdown__main-wrapper">
        <hue-slider ref="hue" :color="color" vertical style="float: right;"/>
        <sv-panel ref="sl" :color="color"/>
      </div>
      <alpha-slider v-if="showAlpha" ref="alpha" :color="color"/>
      <predefine v-if="predefine" :color="color" :colors="predefine"/>
      <div class="el-color-dropdown__btns">
        <span class="el-color-dropdown__value">
          <el-input
            v-model="customInput"
            @keyup.native.enter="handleConfirm"
            @blur="handleConfirm"
            :validate-event="false"
            size="mini"/>
        </span>
        <el-button
          size="mini"
          type="text"
          class="el-color-dropdown__link-btn"
          @click="$emit('clear')">
          {{ t('el.colorpicker.clear') }}
        </el-button>
        <el-button
          plain
          size="mini"
          class="el-color-dropdown__btn"
          @click="confirmValue">
          {{ t('el.colorpicker.confirm') }}
        </el-button>
      </div>
    </div>
  </transition>
</template>

<script>
  import SvPanel from './sv-panel';
  import HueSlider from './hue-slider';
  import AlphaSlider from './alpha-slider';
  import Predefine from './predefine';
  import Popper from 'rowinself-ui/src/utils/vue-popper';
  import Locale from 'rowinself-ui/src/mixins/locale';
  import ElInput from 'rowinself-ui/packages/input';
  import ElButton from 'rowinself-ui/packages/button';

  export default {
    name: 'ElColorPickerDropdown',

    components: {
      SvPanel,
      HueSlider,
      AlphaSlider,
      ElInput,
      ElButton,
      Predefine
    },

    mixins: [Popper, Locale],

    props: {
      color: {
        required: true,
        type: Object
      },
      showAlpha: Boolean,
      predefine: Array
    },

    data() {
      return {
        customInput: ''
      };
    },

    computed: {
      currentColor() {
        const parent = this.$parent;
        return !parent.value && !parent.showPanelColor ? '' : parent.color.value;
      }
    },

    watch: {
      showPopper(val) {
        if (val === true) {
          this.$nextTick(() => {
            const { sl, hue, alpha } = this.$refs;
            sl && sl.update();
            hue && hue.update();
            alpha && alpha.update();
          });
        }
      },

      currentColor: {
        immediate: true,
        handler(val) {
          this.customInput = val;
        }
      }
    },

    mounted() {
      this.$parent.popperElm = this.popperElm = this.$el;
      const parent = this.$parent;
      this.referenceElm = (parent && parent.$refs && parent.$refs.trigger) ? parent.$refs.trigger : parent.$el;
    },

    methods: {
      confirmValue() {
        this.$emit('pick');
      },

      handleConfirm() {
        this.color.fromString(this.customInput);
      }
    },
  };
</script>
