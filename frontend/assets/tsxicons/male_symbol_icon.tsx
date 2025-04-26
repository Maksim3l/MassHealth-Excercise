import * as React from "react"
import Svg, { SvgProps, Circle, Path } from "react-native-svg"
const MaleSymbolIcon = (props: SvgProps) => (
  <Svg fill="none" {...props}>
    <Circle cx={12} cy={20} r={9} stroke="#A4A4A8" strokeWidth={2.5} />
    <Path
      stroke="#A4A4A8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M19 13 29 3m0 0v7.111M29 3h-7.111"
    />
  </Svg>
)
export default MaleSymbolIcon