<script>
import ElLink from 'rowinself-ui/packages/link';
import ElPopconfirm from 'rowinself-ui/packages/popconfirm';

export default {
  name: 'TableAction',
  components: { ElLink, ElPopconfirm },
  props: {
    actions: { type: Array, default: () => [] },
    size: { type: String, default: 'mini' }
  },
  methods: {
    renderButton(h, act) {
      const type = act.color || act.type || 'primary';
      const btn = h(
        ElLink,
        {
          props: { type, size: this.size, icon: act.icon, underline: false },
          on: {
            click: () => {
              if (!act.popConfirm && typeof act.onClick === 'function') {
                act.onClick();
              }
            }
          }
        },
        [act.text || act.label || '']
      );

      if (act.popConfirm) {
        const pc = act.popConfirm || {};
        return h(ElPopconfirm, {
          props: {
            title: pc.title || '',
            confirmButtonType: pc.type || 'primary',
            cancelButtonType: pc.cancelType || 'primary',
            confirmButtonText: pc.okText || pc.confirmText || '确定',
            cancelButtonText: pc.cancelText || '取消',
            customClass: 'el-table-popconfirm'
          },
          on: {
            confirm: () => {
              if (typeof act.onClick === 'function') {
                act.onClick();
              }
            }
          }
        }, [
          h(ElLink, {
            slot: 'reference',
            props: { type, size: this.size, icon: act.icon, underline: false }
          }, [act.text || act.label || ''])
        ]);
      }
      return btn;
    }
  },
  render(h) {
    const children = (this.actions || []).map((a, i) => this.renderButton(h, a));
    return h('span', {
      class: 'el-table-action',
      style: { }
    }, children);
  }
};
</script>
