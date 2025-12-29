
import { createVue, destroyVM, triggerEvent } from '../util';

describe('DatePicker Panels', () => {
  console.log('I AM HERE - DatePicker Panels Loaded');
  let vm;
  afterEach(() => {
    destroyVM(vm);
  });

  it('QuarterPanel navigation', done => {
    vm = createVue({
      template: `
        <el-date-picker
          v-model="value"
          type="quarter"
          ref="compo">
        </el-date-picker>
      `,
      data() {
        return {
          value: ''
        };
      }
    }, true);

    const input = vm.$el.querySelector('input');
    input.focus();

    setTimeout(_ => {
      const picker = vm.$refs.compo.picker;
      const $el = picker.$el;
      
      // Check if QuarterPanel is rendered
      expect($el.classList.contains('el-quarter-panel')).to.be.true;

      // Initial date
      const date = picker.date;
      const initialYear = date.getFullYear();

      // Find prev year button
      const prevYearBtn = $el.querySelector('.el-date-picker__prev-btn');
      expect(prevYearBtn).to.exist;

      // Click prev year
      prevYearBtn.click();
      vm.$nextTick(_ => {
        expect(picker.date.getFullYear()).to.equal(initialYear - 1);

        // Find next year button
        const nextYearBtn = $el.querySelector('.el-date-picker__next-btn');
        expect(nextYearBtn).to.exist;

        // Click next year
        nextYearBtn.click();
        vm.$nextTick(_ => {
          expect(picker.date.getFullYear()).to.equal(initialYear);
          done();
        });
      });
    }, 500);
  });

  it('MonthPanel navigation (type=month)', done => {
    const localVm = createVue({
      template: `
        <el-date-picker
          v-model="value"
          type="month"
          ref="compo">
        </el-date-picker>
      `,
      data() {
        return {
          value: ''
        };
      }
    }, true);
    vm = localVm;

    const input = localVm.$el.querySelector('input');
    input.focus();

    setTimeout(_ => {
      try {
        console.log('MonthPanel refs:', Object.keys(localVm.$refs));
        if (!localVm.$refs.compo) {
          console.log('Ref "compo" not found in MonthPanel test!');
          done(new Error('Ref "compo" not found'));
          return;
        }
        const picker = localVm.$refs.compo.picker;
        if (!picker) {
          console.log('Picker not found in MonthPanel test!');
          done(new Error('Picker not found'));
          return;
        }
        const $el = picker.$el;
        console.log('MonthPanel classes:', $el.className);
        console.log('MonthPanel tagName:', $el.tagName);
        
        if (!$el.classList.contains('el-month-panel')) {
          console.log('MonthPanel class missing! Has:', $el.className);
          console.log('MonthPanel HTML:', $el.outerHTML.substring(0, 200));
        }
        expect($el.classList.contains('el-month-panel')).to.be.true;

        const date = picker.date;
        const initialYear = date.getFullYear();

        const prevYearBtn = $el.querySelector('.el-date-picker__prev-btn');
        expect(prevYearBtn).to.exist;

        prevYearBtn.click();
        localVm.$nextTick(_ => {
          expect(picker.date.getFullYear()).to.equal(initialYear - 1);

          const nextYearBtn = $el.querySelector('.el-date-picker__next-btn');
          expect(nextYearBtn).to.exist;

          nextYearBtn.click();
          localVm.$nextTick(_ => {
            expect(picker.date.getFullYear()).to.equal(initialYear);
            done();
          });
        });
      } catch (e) {
        console.log('Error in MonthPanel test:', e);
        done(e);
      }
    }, 500);
  });

  it('YearPanel navigation (type=year)', done => {
    const localVm = createVue({
      template: `
        <el-date-picker
          v-model="value"
          type="year"
          ref="compo">
        </el-date-picker>
      `,
      data() {
        return {
          value: ''
        };
      }
    }, true);
    vm = localVm;

    const input = localVm.$el.querySelector('input');
    input.focus();

    setTimeout(_ => {
      try {
        console.log('YearPanel refs:', Object.keys(localVm.$refs));
        if (!localVm.$refs.compo) {
          console.log('Ref "compo" not found in YearPanel test!');
          done(new Error('Ref "compo" not found'));
          return;
        }
        const picker = localVm.$refs.compo.picker;
        if (!picker) {
          console.log('Picker not found in YearPanel test!');
          done(new Error('Picker not found'));
          return;
        }
        const $el = picker.$el;
        console.log('YearPanel classes:', $el.className);
        
        expect($el.classList.contains('el-year-panel')).to.be.true;

        const date = picker.date;
        const initialYear = date.getFullYear();

        const prevYearBtn = $el.querySelector('.el-date-picker__prev-btn');
        if (!prevYearBtn) {
          console.log('prevYearBtn not found in YearPanel');
          done(new Error('prevYearBtn not found'));
          return;
        }
        prevYearBtn.click();
        localVm.$nextTick(_ => {
          expect(picker.date.getFullYear()).to.equal(initialYear - 12);

          const nextYearBtn = $el.querySelector('.el-date-picker__next-btn');
          nextYearBtn.click();
          localVm.$nextTick(_ => {
            expect(picker.date.getFullYear()).to.equal(initialYear);
            done();
          });
        });
      } catch (e) {
        console.log('Error in YearPanel test:', e);
        done(e);
      }
    }, 500);
  });
});
