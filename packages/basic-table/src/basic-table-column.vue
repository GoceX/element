<script>
// 列渲染子组件：封装 el-table-column 属性映射与默认溢出处理（Hover 展示完整文本）
// 注意：不能使用函数式组件，否则在 npm 包环境中 inject 和组件树查找可能失效
import ElTableColumn from 'rowinself-ui/packages/table-column';
import OverflowCell from './overflow-cell.js';

export default {
  name: 'ElBasicTableColumn',
  components: { ElTableColumn, OverflowCell },
  inject: {
    // 从 ElBasicTable 注入获取插槽的函数
    getBasicTableSlots: { default: () => () => ({}) }
  },
  props: {
    /** 列配置对象（来自父组件 normalizedColumns） */
    column: { type: Object, required: true },
    /** 全局溢出省略开关（列级未设置时生效） */
    ellipsis: { type: Boolean, default: false }
  },
  computed: {
    // 列类型
    colType() {
      return this.column.type || 'default';
    },
    // 列标题
    colLabel() {
      return this.column.title || this.column.label || '';
    },
    // 列字段
    colProp() {
      return this.column.dataIndex || this.column.prop || this.column.key || '';
    },
    // 插槽名
    slotName() {
      return this.column.slot || null;
    },
    // 是否显示溢出提示
    showOverflowTooltip() {
      const raw = this.column.showOverflowTooltip;
      return raw != null ? raw : !!this.ellipsis;
    },
    // 是否使用自定义 Popover 溢出处理
    usePopoverOverflow() {
      return this.colType === 'default' && !this.slotName && !!this.showOverflowTooltip && !!this.colProp;
    },
    // 透传给 el-table-column 的属性
    tableColumnProps() {
      return {
        type: this.colType,
        label: this.colLabel,
        prop: this.colProp,
        width: this.column.width,
        minWidth: this.column.minWidth,
        align: this.column.align,
        headerAlign: this.column.headerAlign,
        fixed: this.column.fixed,
        sortable: this.column.sortable || false,
        index: this.column.index,
        showOverflowTooltip: this.usePopoverOverflow ? false : this.showOverflowTooltip
      };
    },
    // 是否有对应的命名插槽
    hasNamedSlot() {
      if (!this.slotName) return false;
      const slots = this.getBasicTableSlots();
      return slots && typeof slots[this.slotName] === 'function';
    }
  },
  methods: {
    // 渲染命名插槽内容
    renderNamedSlot(scope) {
      if (!this.slotName) return null;
      const slots = this.getBasicTableSlots();
      const fn = slots && slots[this.slotName];
      if (fn) {
        return fn({
          row: scope.row,
          record: scope.row,
          column: this.column,
          $index: scope.$index
        });
      }
      return null;
    },
    // 渲染溢出单元格
    renderOverflowCell(scope) {
      const value = scope && scope.row ? scope.row[this.colProp] : '';
      const text = value == null ? '' : String(value);
      return this.$createElement(OverflowCell, { props: { text } });
    }
  },
  render(h) {
    const scopedSlots = {};

    // 如果列有 slot 配置，并且父组件提供了对应插槽
    if (this.slotName && this.hasNamedSlot) {
      scopedSlots.default = (scope) => this.renderNamedSlot(scope);
    } else if (this.usePopoverOverflow) {
      scopedSlots.default = (scope) => this.renderOverflowCell(scope);
    }

    return h(ElTableColumn, { props: this.tableColumnProps, scopedSlots });
  }
};
</script>
