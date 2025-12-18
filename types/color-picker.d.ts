import { ElementUIComponent, ElementUIComponentSize } from './component'

export type ColorFormat = 'hsl' | 'hsv' | 'hex' | 'rgb'

export type ColorPickerType = 'default' | 'input'

/** ColorPicker Component */
export declare class ElColorPicker extends ElementUIComponent {
  /** Display type of ColorPicker */
  type: ColorPickerType

  width: string | number

  /** Whether to display the alpha slider */
  showAlpha: boolean

  /** Whether to disable the ColorPicker */
  disabled: boolean

  /** Size of ColorPicker */
  size: ElementUIComponentSize

  /** Whether to display the alpha slider */
  popperClass: string

  /** Custom class name for ColorPicker's dropdown */
  colorFormat: ColorFormat
}
