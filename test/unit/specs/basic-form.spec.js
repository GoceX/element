import Vue from 'vue';
import { createVue, destroyVM, triggerEvent } from '../util';
import ColorPickerLink from 'examples/components/basic-form/color-picker-link.vue';

describe('BasicForm', () => {
  let vm;

  before(() => {
    if (!Vue.options.components || !Vue.options.components.ColorPickerLink) {
      Vue.component('ColorPickerLink', {
        name: 'ColorPickerLink',
        props: {
          value: {
            type: [String, Object],
            default: ''
          },
          showAlpha: {
            type: Boolean,
            default: true
          },
          selectOptions: {
            type: Array,
            default: () => []
          },
          containerStyle: {
            type: Object,
            default: () => ({})
          }
        },
        render(h) {
          const color1 = this.value && typeof this.value === 'object' ? this.value.color1 : '';
          return h('div', {
            class: 'color-picker-link',
            attrs: {
              'data-show-alpha': String(this.showAlpha)
            },
            on: {
              click: () => {
                this.$emit('input', {
                  selectValue: 1,
                  color1: '#111111',
                  color2: '#222222'
                });
              }
            }
          }, [String(color1 || '')]);
        }
      });
    }
  });

  afterEach(() => {
    if (vm) {
      vm.$destroy(true);
      destroyVM(vm);
    }
  });

  it('should pass componentProps and bind v-model for component function in sections', (done) => {
    vm = createVue({
      template: `
        <el-basic-form :schemas="schemas" :labelWidth="140" sections />
      `,
      data() {
        return {
          schemas: [
            {
              sectionsTitle: 'group',
              sections: [
                {
                  field: 'interfaceColor',
                  label: '界面颜色配置',
                  defaultValue: {
                    selectValue: 0,
                    color1: '#0183b0',
                    color2: '#0183ff'
                  },
                  component: (h) => h('ColorPickerLink'),
                  componentProps: {
                    showAlpha: false,
                    selectOptions: [
                      { label: '预设蓝', value: 0, colors: ['#0183b0', '#0183ff'] }
                    ],
                    containerStyle: {
                      display: 'flex',
                      alignItems: 'stretch'
                    }
                  }
                }
              ]
            }
          ]
        };
      }
    }, true);

    vm.$nextTick(() => {
      const el = vm.$el.querySelector('.color-picker-link');
      expect(el).to.exist;
      expect(el.getAttribute('data-show-alpha')).to.equal('false');
      expect((el.textContent || '').trim()).to.equal('#0183b0');

      triggerEvent(el, 'click');

      vm.$nextTick(() => {
        const basicForm = vm.$children[0];
        const inner = basicForm && basicForm.$children && basicForm.$children[0];
        expect(inner).to.exist;
        expect(inner.formModel.interfaceColor.color1).to.equal('#111111');
        done();
      });
    });
  });

  it('should update color1/color2 when select changes in ColorPickerLink', (done) => {
    vm = createVue({
      components: { ColorPickerLink },
      template: `
        <color-picker-link
          v-model="val"
          :show-select="true"
          :show-alpha="false"
          :select-options="selectOptions"
          @change="handleChange"
        />
      `,
      data() {
        return {
          val: {
            selectValue: 0,
            color1: '#0183b0',
            color2: '#0183ff'
          },
          changed: null,
          selectOptions: [
            { label: '预设蓝', value: 0, colors: ['#0183b0', '#0183ff'] },
            { label: '预设绿', value: 1, colors: ['#67a03a', '#67c23a'] }
          ]
        };
      },
      methods: {
        handleChange(payload) {
          this.changed = payload;
        }
      }
    }, true);

    vm.$nextTick(() => {
      const linkVm = vm.$children[0];
      expect(linkVm).to.exist;

      linkVm.selectValueModel = 1;
      vm.$nextTick(() => {
        expect(vm.val.selectValue).to.equal(1);
        expect(vm.val.color1).to.equal('#67a03a');
        expect(vm.val.color2).to.equal('#67c23a');
        expect(vm.changed).to.deep.equal(vm.val);
        done();
      });
    });
  });
});
