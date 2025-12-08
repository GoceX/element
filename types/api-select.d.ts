import { ElementUIComponent } from './component'

export declare class ElApiSelect extends ElementUIComponent {
  value: any
  api: Function | null
  params: object
  resultField: string
  immediate: boolean
  beforeFetch?: Function
  afterFetch?: Function
  focus (): void
  blur (): void
}
