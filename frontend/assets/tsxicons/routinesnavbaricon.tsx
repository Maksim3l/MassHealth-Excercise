import * as React from "react"
import Svg, { SvgProps, Rect, Path } from "react-native-svg"
import Routines from "../../app/(tabs)/(authenticated)/routines"

const RoutinesIcon = (props: SvgProps) => {
  const { color = "#A4A4A8", ...rest } = props;
  return(
  <Svg viewBox="0 0 32 32" width={24} height={24} fill="none" stroke={color} {...props}>
    <Rect
      width={4}
      height={10}
      x={5}
      y={11}
      stroke={color}
      strokeWidth={2.5}
      rx={1}
    />
    <Rect
      width={4}
      height={18}
      x={9}
      y={7}
      stroke={color}
      strokeWidth={2.5}
      rx={1}
    />
    <Rect
      width={4}
      height={18}
      x={19}
      y={7}
      stroke={color}
      strokeWidth={2.5}
      rx={1}
    />
    <Rect
      width={4}
      height={10}
      x={23}
      y={11}
      stroke={color}
      strokeWidth={2.5}
      rx={1}
    />
    <Path stroke={color} strokeWidth={2.5} d="M13 16h5" />
    <Path
      fill={color}
      d="M30 17.25a1.25 1.25 0 1 0 0-2.5v2.5ZM28 16v1.25h2v-2.5h-2V16ZM2 14.75a1.25 1.25 0 1 0 0 2.5v-2.5ZM2 16v1.25h2v-2.5H2V16Z"
    />
  </Svg>
)
}
export default RoutinesIcon