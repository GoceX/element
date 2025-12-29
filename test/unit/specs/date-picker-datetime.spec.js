
import { createTest, destroyVM, createVue, triggerEvent } from '../util';
import DatePicker from 'packages/date-picker';

describe('DatePicker DateTime', () => {
  let vm;
  afterEach(() => {
    destroyVM(vm);
  });

  it('create datetime picker', done => {
    vm = createVue({
      template: `
        <el-date-picker
          v-model="value"
          type="date"
          :show-time="true"
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
      
      console.log('DateTime Picker Visible:', picker.visible);
      console.log('DateTime Picker Classes:', $el.className);

      // 验证面板是否可见
      expect(picker.visible).to.be.true;
      
      // 验证是否使用了正确的面板类 (DatePanel 具有 el-date-picker 类)
      expect($el.classList.contains('el-date-picker')).to.be.true;
      expect($el.classList.contains('has-time')).to.be.true;
      
      // 模拟点击 document 关闭
      triggerEvent(document, 'mousedown');
      triggerEvent(document, 'mouseup');
      input.blur(); // Ensure blur to allow subsequent focus to trigger handleFocus
      
      setTimeout(_ => {
        expect(picker.visible).to.be.false;
        
        // 测试 Confirm 按钮
        console.log('Triggering click to reopen picker...');
        triggerEvent(input, 'click');
        setTimeout(_ => {
          console.log('Reopened picker visible:', picker.visible);
          expect(picker.visible).to.be.true;
          // 找到确认按钮
          const confirmBtn = picker.$el.querySelector('.el-picker-panel__footer .el-button--text:last-child');
          expect(confirmBtn).to.exist;
          expect(confirmBtn.textContent.trim()).to.equal('确定'); // or check translation
          
          confirmBtn.click();
          setTimeout(_ => {
            console.log('After confirm visible:', picker.visible);
            expect(picker.visible).to.be.false;
            done();
          }, 100);
        }, 500);
      }, 100);
    });
  });
});
