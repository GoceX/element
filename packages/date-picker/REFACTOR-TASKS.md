# DatePicker 交互重构任务清单

基于 ant-design-vue DatePicker 交互文档，对 rw-element DatePicker 进行交互修改重构。

---

## 高优先级

- [ ] **1. PageUp/PageDown 切换月份**
  - 文件: `src/panel/date.vue`, `src/basic/date-table.vue`
  - 内容: 在键盘事件处理中添加 PageUp(33)/PageDown(34) 支持
  - 效果: PageUp 跳转上月同一天，PageDown 跳转下月同一天

- [ ] **2. Ctrl+←/→ 切换年份**
  - 文件: `src/panel/date.vue`, `src/basic/date-table.vue`
  - 内容: 检测 Ctrl 键 + 方向键组合
  - 效果: Ctrl+Left 跳转上年同一天，Ctrl+Right 跳转下年同一天

- [ ] **3. 范围选择输入框悬停预览**
  - 文件: `src/panel/date-range.vue`, `src/picker.vue`
  - 内容: 鼠标在日期面板滑动时，输入框实时显示悬停日期值
  - 效果: 起始/结束输入框显示灰色预览文字，移出后恢复

---

## 中优先级

- [ ] **4. 范围高亮预览增强**
  - 文件: `src/basic/date-table.vue`
  - 内容: 选中起始日期后，悬停其他日期时显示完整预览区间
  - 效果: 起始到悬停位置的日期单元格显示淡色背景

- [ ] **5. 输入框错误状态样式**
  - 文件: `src/picker.vue`
  - 内容: 格式验证失败时添加错误样式类
  - 效果: 输入框边框变红色

- [ ] **6. 今日按钮行为优化**
  - 文件: `src/panel/date.vue`
  - 内容: 确保"今天"按钮只跳转视图，不自动选中日期
  - 效果: 点击后面板跳转到当月，今天日期高亮但不选中

---

## 低优先级

- [ ] **7. 弹出层动画优化**
  - 文件: `src/picker.vue`
  - 内容: 检查/添加 slide-up/down 动画过渡
  - 效果: 面板打开时从下向上滑出，关闭时向下滑出

- [ ] **8. 自定义单元格渲染增强**
  - 文件: `src/basic/date-table.vue`
  - 内容: 增强 cellClassName 支持，允许更多自定义
  - 效果: 支持根据日期返回自定义类名

---

## 完成记录

| 任务 | 完成时间 | 备注 |
|-----|---------|------|
| - | - | - |
