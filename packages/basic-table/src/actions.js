// 表格方法集：供外部通过 @register 获取并调用
// 说明：这些方法依赖于父组件的内部状态（如 internalData/internalPagination 等）
export default {
  // 获取行主键值（支持字符串字段名或函数 rowKey(row)）
  getKeyOfRow(row) {
    const k = this.rowKey;
    if (!k) return undefined;
    if (typeof k === 'function') return k(row);
    return row ? row[k] : undefined;
  },
  // 根据主键值取消某一行的选中状态
  deleteSelectRowByKey(key) {
    const ref = this.$refs.tableRef;
    const row = this.internalData.find((r) => this.getKeyOfRow(r) === key);
    if (ref && row) ref.toggleRowSelection(row, false);
    this.onSelectionChange(this.selectedRows.filter((r) => this.getKeyOfRow(r) !== key));
  },
  // 获取当前选中行的主键集合
  getSelectRowKeys() { return this.selectedRows.map((r) => this.getKeyOfRow(r)).filter((v) => v !== undefined); },
  // 获取当前选中的行数据副本
  getSelectRows() { return this.selectedRows.slice(); },
  // 清空当前选中行
  clearSelectedRowKeys() {
    const ref = this.$refs.tableRef;
    if (ref && typeof ref.clearSelection === 'function') ref.clearSelection();
    this.selectedRows = [];
    this.selectedRowKeys = [];
  },
  // 设置选中行的主键集合（批量选中/取消）
  setSelectedRowKeys(rowKeys) {
    const keys = Array.isArray(rowKeys) ? rowKeys : [];
    const ref = this.$refs.tableRef;
    if (!ref) return;
    this.internalData.forEach((r) => {
      const k = this.getKeyOfRow(r);
      ref.toggleRowSelection(r, keys.indexOf(k) !== -1);
    });
  },
  // 获取当前分页配置引用（或 false）
  getPaginationRef() { return this.internalPagination || false; },
  // 获取当前分页显示状态
  getShowPagination() { return !!this.showPaginationFlag; },
  // 设置分页显示状态（返回 Promise 以保持一致性）
  setShowPagination(show) {
    if (typeof window !== 'undefined' && window.Promise) {
      return new window.Promise((resolve) => { this.showPaginationFlag = !!show; resolve(); });
    }
    this.showPaginationFlag = !!show;
    return undefined;
  },
  // 获取选择列配置（或 false）
  getRowSelection() { return this.rowSelection || false; },
  // 更新指定行的指定字段值（按索引）
  updateTableData(index, key, value) {
    const i = Number(index);
    if (i >= 0 && i < this.internalData.length) {
      const rec = { ...(this.internalData[i] || {}) };
      rec[key] = value;
      this.$set(this.internalData, i, rec);
    }
  },
  // 根据主键更新指定行数据（局部更新）
  updateTableDataRecord(rowKey, record) {
    const idx = this.internalData.findIndex((r) => this.getKeyOfRow(r) === rowKey);
    if (idx !== -1) this.$set(this.internalData, idx, { ...(this.internalData[idx] || {}), ...(record || {}) });
  },
  // 根据主键集合删除指定行（局部删除）
  deleteTableDataRecord(rowKey) {
    const keys = Array.isArray(rowKey) ? rowKey : [rowKey];
    this.internalData = this.internalData.filter((r) => keys.indexOf(this.getKeyOfRow(r)) === -1);
  },
  // 插入一行数据（可指定插入位置，否则追加）
  insertTableDataRecord(record, index) {
    const rec = { ...(record || {}) };
    const i = typeof index === 'number' ? index : this.internalData.length;
    const list = this.internalData.slice();
    if (i >= 0 && i <= list.length) list.splice(i, 0, rec); else list.push(rec);
    this.internalData = list;
  },
  // 获取搜索表单方法集（当启用 useSearchForm 时有效）
  getForm() { return this.formActions; },
  // 展开全部树形节点（需 isTreeTable=true）
  expandAll() { if (this.isTreeTable) this.internalData.forEach((r) => { const ref = this.$refs.tableRef; if (ref) ref.toggleRowExpansion(r, true); }); },
  // 折叠全部树形节点（需 isTreeTable=true）
  collapseAll() { if (this.isTreeTable) this.internalData.forEach((r) => { const ref = this.$refs.tableRef; if (ref) ref.toggleRowExpansion(r, false); }); },
  // 表格选择变化事件处理：同步 selectedRows/selectedRowKeys，并对外发出 selection-change
  onSelectionChange(sel) {
    this.selectedRows = Array.isArray(sel) ? sel : [];
    this.selectedRowKeys = this.getSelectRowKeys();
    this.$emit('selection-change', { keys: this.selectedRowKeys, rows: this.selectedRows });
  },
  // 表格行点击事件处理：支持点击切换选中（当 clickToRowSelect=true 且 rowSelection 有效）
  onRowClick(row, column, event) {
    this.$emit('row-click', row, column, event);
    if (this.clickToRowSelect) {
      const ref = this.$refs.tableRef;
      if (ref && this.rowSelection) ref.toggleRowSelection(row);
    }
  },
  // 重新计算表格布局高度（适配容器变化）
  redoHeight() {
    const ref = this.$refs.tableRef;
    if (ref && typeof ref.doLayout === 'function') ref.doLayout();
  },
  // 表单注册与提交（为兼容性保留；实际逻辑在父组件中实现）
  onFormRegister(actions) { this.formActions = actions; },
  onFormSubmit(payload) { this.$emit('form-submit', payload); this.$emit('update:searchInfo', payload); this.reload(); }
};
