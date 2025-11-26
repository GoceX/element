<script>
// 列渲染子组件：封装 el-table-column 属性映射与默认溢出处理（Hover 展示完整文本）
import ElTableColumn from 'element-ui/packages/table-column';
import ElPopover from 'element-ui/packages/popover';
import OverflowCell from './overflow-cell.js';

export default {
  name: 'ElBasicTableColumn',
  components: { ElTableColumn, ElPopover },
  props: {
    /** 列配置对象（来自父组件 normalizedColumns） */
    column: { type: Object, required: true },
    /** 全局溢出省略开关（列级未设置时生效） */
    ellipsis: { type: Boolean, default: false }
  },
  computed: {
    /** 列唯一 key */
    columnKey() { return this.column.key || this.column.prop || this.column.dataIndex || ''; },
    /** 列类型（default/selection/index 等） */
    type() { return this.column.type || 'default'; },
    /** 表头文本 */
    label() { return this.column.title || this.column.label || ''; },
    /** 数据字段名（prop/dataIndex） */
    prop() { return this.column.dataIndex || this.column.prop || this.column.key || ''; },
    /** 列宽 */
    width() { return this.column.width; },
    /** 最小列宽 */
    minWidth() { return this.column.minWidth; },
    /** 对齐方式 */
    align() { return this.column.align; },
    /** 表头对齐方式 */
    headerAlign() { return this.column.headerAlign; },
    /** 固定列 */
    fixed() { return this.column.fixed; },
    /** 是否可排序 */
    sortable() { return this.column.sortable || false; },
    /** 序号列 index（仅 type=index 生效） */
    index() { return this.column.index; },
    // 原始溢出提示需求
    showOverflowTooltip() {
      const v = this.column.showOverflowTooltip;
      return v != null ? v : !!this.ellipsis;
    },
    // 是否使用自定义 Popover 展示完整内容（仅默认文本列且未自定义插槽时启用）
    usePopoverOverflow() {
      return this.type === 'default' && !this.slotName && !!this.showOverflowTooltip && !!this.prop;
    },
    /** 具名插槽名称（用于自定义单元格渲染） */
    slotName() { return this.column.slot || null; }
  },
  methods: {
    /**
     * 动态渲染来自父组件的具名插槽
     * @param {Object} scope 作用域对象（row/column/$index 等）
     * @returns {VNode|null}
     */
    renderCell(scope) {
      const name = this.slotName;
      if (!name) return null;
      const parentSlots = this.$parent && this.$parent.$scopedSlots;
      const fn = parentSlots && parentSlots[name];
      return fn ? fn(scope) : null;
    }
  },
  render(h) {
    // 透传 el-table-column 所需属性
    const props = {
      type: this.type,
      label: this.label,
      prop: this.prop,
      width: this.width,
      minWidth: this.minWidth,
      align: this.align,
      headerAlign: this.headerAlign,
      fixed: this.fixed,
      sortable: this.sortable,
      index: this.index,
      // 当自定义 Popover 溢出处理时，关闭原生 tooltip
      showOverflowTooltip: this.usePopoverOverflow ? false : this.showOverflowTooltip
    };
    const scopedSlots = {};
    if (this.slotName) {
      scopedSlots.default = (scope) => this.renderCell(scope);
    } else if (this.usePopoverOverflow) {
      scopedSlots.default = (scope) => {
        const value = scope && scope.row ? scope.row[this.prop] : '';
        const text = value == null ? '' : String(value);
        return h(OverflowCell, { props: { text } });
      };
    }
    return h(ElTableColumn, { props, scopedSlots });
  }
};
</script>
