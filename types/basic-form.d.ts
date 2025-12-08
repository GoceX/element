import { ElementUIComponent, ElementUIComponentSize } from './component'

export declare class ElBasicForm extends ElementUIComponent {
  model: object
  rules: object
  labelPosition: string
  labelAlign: string
  labelWidth: string | number
  inline: boolean
  size: ElementUIComponentSize
  disabled: boolean
  schemas: any[]
  fieldMapToTime: any[]
  actionColOptions: object
  baseColProps: object
  baseRowStyle: object
  mergeDynamicData: object
  autoFocusFirstItem: boolean
  compact: boolean
  autoSetPlaceHolder: boolean
  autoSubmitOnEnter: boolean
  rulesMessageJoinLabel: boolean
  showAdvancedButton: boolean
  emptySpan: number | object
  autoAdvancedLine: number
  alwaysShowLines: number
  showActionButtonGroup: boolean
  showResetButton: boolean
  resetButtonOptions: object
  showSubmitButton: boolean
  submitButtonOptions: object
  submitButtonText: string
  resetButtonText: string
  resetFunc?: Function
  submitFunc?: Function
  tableAction: object
  setProps (formProps: object): void
  getFieldsValue (): object
  setFieldsValue (values: object): void
  resetFields (): void
  validateFields (nameList: string | string[]): Promise<boolean> | boolean
  validate (nameList?: string[]): Promise<boolean> | boolean
  clearValidate (name?: string | string[]): void
  scrollToField (name: string, options?: any): void
  removeSchemaByField (field: string | string[]): void
  appendSchemaByField (schema: object, prefixField?: string, first?: boolean): void
  updateSchema (data: object | object[]): void
  submit (): void
  reset (): void
}
