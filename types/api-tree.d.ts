import { ElementUIComponent } from './component'

export declare class ElApiTree extends ElementUIComponent {
  api: Function
  params: object
  resultField: string
  immediate: boolean
  beforeFetch?: Function
  afterFetch?: Function
}
