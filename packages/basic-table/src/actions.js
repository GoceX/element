/**
 * 表格方法集（Actions）
 * 职责：
 * - 对外提供对表格数据与选择行为的操作方法
 * 使用说明：
 * - 这些方法在父组件上下文运行（依赖 internalData/internalPagination 等）
 */
export default {
  // 获取行主键值（支持字符串字段名或函数 rowKey(row)）
  /**
   * 获取行的主键值
   * @param {Object} row 行数据
   * @returns {*|undefined} 主键值
   */
  getKeyOfRow(row) {
    const k = this.rowKey;
    if (!k) return undefined;
    if (typeof k === 'function') return k(row);
    return row ? row[k] : undefined;
  },
  // 根据主键值取消某一行的选中状态
  /**
   * 根据主键取消选中某一行
   * @param {*} key 主键值
   * @returns {void}
   */
  deleteSelectRowByKey(key) {
    const ref = this.$refs.tableRef;
    const row = this.internalData.find((r) => this.getKeyOfRow(r) === key);
    if (ref && row) ref.toggleRowSelection(row, false);
    this.onSelectionChange(this.selectedRows.filter((r) => this.getKeyOfRow(r) !== key));
  },
  // 获取当前选中行的主键集合
  /**
   * 获取当前选中行主键集合
   * @returns {Array<*>}
   */
  getSelectRowKeys() {
    return this.selectedRows.map((r) => this.getKeyOfRow(r)).filter((v) => v !== undefined);
  },
  // 获取当前选中的行数据副本
  /**
   * 获取当前选中行数据副本
   * @returns {Array<Object>}
   */
  getSelectRows() {
    return this.selectedRows.slice();
  },
  // 清空当前选中行
  /**
   * 清空当前选中行与主键集合
   * @returns {void}
   */
  clearSelectedRowKeys() {
    const ref = this.$refs.tableRef;
    if (ref && typeof ref.clearSelection === 'function') ref.clearSelection();
    this.selectedRows = [];
    this.selectedRowKeys = [];
  },
  // 设置选中行的主键集合（批量选中/取消）
  /**
   * 通过主键集合设置选中状态
   * @param {Array<*>} rowKeys 选中主键集合
   * @returns {void}
   */
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
  /**
   * 获取当前分页配置引用
   * @returns {Object|boolean}
   */
  getPaginationRef() {
    return this.internalPagination || false;
  },
  // 获取当前分页显示状态
  /**
   * 获取是否显示分页
   * @returns {boolean}
   */
  getShowPagination() {
    return !!this.showPaginationFlag;
  },
  // 设置分页显示状态（返回 Promise 以保持一致性）
  /**
   * 设置分页显示状态
   * @param {boolean} show 是否显示
   * @returns {Promise<void>|undefined}
   */
  setShowPagination(show) {
    if (typeof window !== 'undefined' && window.Promise) {
      return new window.Promise((resolve) => {
        this.showPaginationFlag = !!show; resolve();
      });
    }
    this.showPaginationFlag = !!show;
    return undefined;
  },
  // 获取选择列配置（或 false）
  /**
   * 获取选择列配置
   * @returns {Object|boolean}
   */
  getRowSelection() {
    return this.rowSelection || false;
  },
  // 更新指定行的指定字段值（按索引）
  /**
   * 按索引更新指定行的某字段
   * @param {number} index 行索引
   * @param {string} key 字段名
   * @param {*} value 字段值
   * @returns {void}
   */
  updateTableData(index, key, value) {
    const i = Number(index);
    if (i >= 0 && i < this.internalData.length) {
      const rec = { ...(this.internalData[i] || {}) };
      rec[key] = value;
      this.$set(this.internalData, i, rec);
    }
  },
  // 根据主键更新指定行数据（局部更新）
  /**
   * 根据主键更新指定行数据
   * @param {*} rowKey 主键值
   * @param {Object} record 局部更新数据
   * @returns {void}
   */
  updateTableDataRecord(rowKey, record) {
    const idx = this.internalData.findIndex((r) => this.getKeyOfRow(r) === rowKey);
    if (idx !== -1) {
      this.$set(
        this.internalData,
        idx,
        {
          ...(this.internalData[idx] || {}),
          ...(record || {})
        }
      );
    }
  },
  // 根据主键集合删除指定行（局部删除）
  /**
   * 根据主键集合删除行
   * @param {Array<*>|*} rowKey 主键或主键数组
   * @returns {void}
   */
  deleteTableDataRecord(rowKey) {
    const keys = Array.isArray(rowKey) ? rowKey : [rowKey];
    this.internalData = this.internalData.filter((r) => keys.indexOf(this.getKeyOfRow(r)) === -1);
  },
  // 插入一行数据（可指定插入位置，否则追加）
  /**
   * 插入一行数据
   * @param {Object} record 行数据
   * @param {number} [index] 插入位置索引
   * @returns {void}
   */
  insertTableDataRecord(record, index) {
    const rec = { ...(record || {}) };
    const i = typeof index === 'number' ? index : this.internalData.length;
    const list = this.internalData.slice();
    if (i >= 0 && i <= list.length) {
      list.splice(i, 0, rec);
    } else {
      list.push(rec);
    }
    this.internalData = list;
  },
  // 获取搜索表单方法集（当启用 useSearchForm 时有效）
  /**
   * 获取搜索表单方法集
   * @returns {Object|null}
   */
  getForm() {
    return this.formActions;
  },
  // 展开全部树形节点
  /**
   * 展开全部树形节点（树形表格）
   * @returns {void}
   */
  expandAll() {
    const ref = this.$refs.tableRef;
    if (!ref || !this.rowKey) return;
    const store = ref.store;
    const treeData = (store && store.states && store.states.treeData) || {};
    const keys = Object.keys(treeData);
    if (keys.length && store && typeof store.updateTreeExpandKeys === 'function') {
      store.updateTreeExpandKeys(keys);
    }
  },
  // 折叠全部树形节点
  /**
   * 折叠全部树形节点（树形表格）
   * @returns {void}
   */
  collapseAll() {
    const ref = this.$refs.tableRef;
    if (!ref || !this.rowKey) return;
    const store = ref.store;
    if (store && typeof store.updateTreeExpandKeys === 'function') {
      store.updateTreeExpandKeys([]);
    }
  },
  // 表格选择变化事件处理：同步 selectedRows/selectedRowKeys，并对外发出 selection-change
  /**
   * 表格选择变化事件
   * @param {Array<Object>} sel 选中行集合
   * @returns {void}
   */
  onSelectionChange(sel) {
    this.selectedRows = Array.isArray(sel) ? sel : [];
    this.selectedRowKeys = this.getSelectRowKeys();
    this.$emit('selection-change', {
      keys: this.selectedRowKeys,
      rows: this.selectedRows
    });
  },
  // 表格行点击事件处理：支持点击切换选中（当 clickToRowSelect=true 且 rowSelection 有效）
  /**
   * 表格行点击事件
   * @param {Object} row 行数据
   * @param {Object} column 列对象
   * @param {Event} event 原生事件
   * @returns {void}
   */
  onRowClick(row, column, event) {
    this.$emit('row-click', row, column, event);
    if (this.clickToRowSelect) {
      const ref = this.$refs.tableRef;
      if (ref && this.rowSelection) {
        ref.toggleRowSelection(row);
      }
    }
  },
  // 重新计算表格布局高度（适配容器变化）
  /**
   * 重新计算表格布局高度
   * @returns {void}
   */
  redoHeight() {
    const ref = this.$refs.tableRef;
    if (ref && typeof ref.doLayout === 'function') {
      ref.doLayout();
    }
  }
};
