import * as React from "react"
import Svg, { SvgProps, Circle, Path } from "react-native-svg"
const FemaleSymbolIcon = (props: SvgProps) => {
  const { color = "#A4A4A8", ...rest } = props;

  return (
  <Svg fill="none" {...props}>
    <Circle cx={16} cy={11} r={9} stroke={color} strokeWidth={2.5} />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M16 21v5m0 0h-5m5 0h5m-5 0v4"
    />
  </Svg>
  )
}
export default FemaleSymbolIcon