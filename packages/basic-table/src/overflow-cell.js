// 溢出单元格：仅当文本溢出时通过 Popover 展示完整内容
import ElPopover from 'element-ui/packages/popover';

export default {
  name: 'ElBasicTableOverflowCell',
  props: { text: String },
  data() { return { overflow: false }; },
  mounted() {
    const el = this.$refs.ref;
    if (el) this.overflow = el.scrollWidth > el.clientWidth;
  },
  render(h) {
    const refNode = h('span', {
      ref: 'ref',
      style: { display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      domProps: { innerText: this.text || '' }
    });
    if (this.overflow) {
      return h(ElPopover, { props: { trigger: 'hover', placement: 'top', content: this.text || '' } }, [h('span', { slot: 'reference' }, [refNode])]);
    }
    return refNode;
  }
};

