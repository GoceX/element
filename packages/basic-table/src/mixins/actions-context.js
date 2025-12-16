/**
 * 动作上下文混入（Actions Context Mixin）
 * 职责：
 * - 生成对外暴露的方法集合，供父级通过 @register 获取以进行外部控制
 * 设计：
 * - 仅聚合现有方法，不承担业务逻辑
 */
export default {
  computed: {
    /**
     * 对外动作上下文对象
     * @returns {Object} 方法集合
     */
    tableActionContext() {
      return {
        setProps: this.setProps,
        setLoading: this.setLoading,
        reload: this.reload,
        getDataSource: this.getDataSource,
        clearSelection: this.clearSelection,
        setColumns: this.setColumns,
        setDataSource: this.setDataSource,
        getRawDataSource: this.getRawDataSource,
        getColumns: this.getColumns,
        setTableData: this.setTableData,
        setPagination: this.setPagination,
        deleteSelectRowByKey: this.deleteSelectRowByKey,
        getSelectRowKeys: this.getSelectRowKeys,
        getSelectRows: this.getSelectRows,
        clearSelectedRowKeys: this.clearSelectedRowKeys,
        setSelectedRowKeys: this.setSelectedRowKeys,
        getPaginationRef: this.getPaginationRef,
        getShowPagination: this.getShowPagination,
        setShowPagination: this.setShowPagination,
        getRowSelection: this.getRowSelection,
        updateTableData: this.updateTableData,
        updateTableDataRecord: this.updateTableDataRecord,
        deleteTableDataRecord: this.deleteTableDataRecord,
        insertTableDataRecord: this.insertTableDataRecord,
        getForm: this.getForm,
        expandAll: this.expandAll,
        collapseAll: this.collapseAll,
        redoHeight: this.redoHeight
      };
    }
  }
};
