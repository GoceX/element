<template>
  <component
    :is="_elTag"
    class="el-radio-group"
    role="radiogroup"
    @keydown="handleKeydown"
  >
    <slot></slot>
  </component>
</template>
<script>
  import Emitter from 'rowinself-ui/src/mixins/emitter';

  const keyCode = Object.freeze({
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
  });
  export default {
    name: 'ElRadioGroup',

    componentName: 'ElRadioGroup',

    inject: {
      elFormItem: {
        default: ''
      }
    },

    mixins: [Emitter],

    props: {
      value: {
        type: [String, Number, Boolean]
      },
      size: String,
      fill: String,
      textColor: String,
      disabled: Boolean
    },

    computed: {
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },
      _elTag() {
        let tag = (this.$vnode.data || {}).tag;
        if (!tag || tag === 'component') tag = 'div';
        return tag;
      },
      radioGroupSize() {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      }
    },
    watch: {
      value(value) {
        this.dispatch('ElFormItem', 'el.form.change', [this.value]);
      }
    },

    created() {
      this.$on('handleChange', value => {
        this.$emit('change', value);
      });
    },
    mounted() {
      // 当radioGroup没有默认选项时，第一个可以选中Tab导航
      const radios = this.$el.querySelectorAll('[type=radio]');
      const firstLabel = this.$el.querySelectorAll('[role=radio]')[0];
      if (![].some.call(radios, radio => radio.checked) && firstLabel) {
        firstLabel.tabIndex = 0;
      }
    },
    methods: {
      handleKeydown(e) { // 左右上下按键 可以在radio组内切换不同选项
        const target = e.target;
        const isInput = target && target.nodeName === 'INPUT';
        const className = isInput ? '[type=radio]' : '[role=radio]';
        const radios = this.$el.querySelectorAll(className);
        const roleRadios = this.$el.querySelectorAll('[role=radio]');
        const length = roleRadios.length;
        if (!length) return;

        let index = [].indexOf.call(radios, target);
        if (index < 0) {
          let roleTarget = target;
          while (roleTarget && roleTarget !== this.$el) {
            if (roleTarget.getAttribute && roleTarget.getAttribute('role') === 'radio') break;
            roleTarget = roleTarget.parentNode;
          }
          index = roleTarget ? [].indexOf.call(roleRadios, roleTarget) : -1;
        }
        if (index < 0) return;

        const clickRoleRadio = (nextIndex) => {
          const label = roleRadios[nextIndex];
          if (!label) return;
          const input = label.querySelector ? label.querySelector('[type=radio]') : null;
          if (input && input.click) input.click();
          else if (label.click) label.click();
          if (label.focus) label.focus();
        };
        switch (e.keyCode) {
          case keyCode.LEFT:
          case keyCode.UP:
            e.stopPropagation();
            e.preventDefault();
            if (index === 0) {
              clickRoleRadio(length - 1);
            } else {
              clickRoleRadio(index - 1);
            }
            break;
          case keyCode.RIGHT:
          case keyCode.DOWN:
            if (index === (length - 1)) {
              e.stopPropagation();
              e.preventDefault();
              clickRoleRadio(0);
            } else {
              clickRoleRadio(index + 1);
            }
            break;
          default:
            break;
        }
      }
    },
  };
</script>
