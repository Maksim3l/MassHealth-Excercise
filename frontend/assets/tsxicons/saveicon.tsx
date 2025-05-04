import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface SvgComponentProps {
  width?: number;
  height?: number;
  strokeColor?: string;
}

const SaveIcon: React.FC<SvgComponentProps> = ({ width = 32,
  height = 32,
  strokeColor = "#A4A4A8",}) => (
  <Svg
    width={width}
    height={height}
    fill={"none"}
    viewBox="0 0 32 32"

  >
    <Path
      stroke={strokeColor}
      strokeLinecap="round"
      strokeWidth={2.5}
      d="M25 3H7a2 2 0 0 0-2 2v21.479c0 1.736 2.06 2.648 3.345 1.48L16 21l7.655 6.959c1.284 1.168 3.345.256 3.345-1.48V5a2 2 0 0 0-2-2Z"
    />
  </Svg>
)
export default SaveIcon
