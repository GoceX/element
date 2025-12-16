/**
 * 溢出单元格组件（OverflowCell）
 * 职责：
 * - 检测文本是否溢出
 * - 溢出时使用 Popover 展示完整内容
 */
import ElPopover from 'rowinself-ui/packages/popover';

export default {
  name: 'ElBasicTableOverflowCell',
  props: { text: String },
  data() { return { overflow: false }; },
  mounted() {
    const el = this.$refs.ref; // 被测量的文本容器
    if (el) this.overflow = el.scrollWidth > el.clientWidth; // 根据实际宽度判断是否溢出
  },
  render(h) {
    // 渲染被测量文本节点
    const refNode = h('span', {
      ref: 'ref',
      style: { display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      domProps: { innerText: this.text || '' }
    });
    // 当溢出时，使用 Popover 包裹并展示完整文本
    if (this.overflow) {
      return h(
        ElPopover,
        { props: { trigger: 'hover', placement: 'top', content: this.text || '' } },
        [h('span', { slot: 'reference' }, [refNode])]
      );
    }
    // 否则直接显示省略文本
    return refNode;
  }
};
