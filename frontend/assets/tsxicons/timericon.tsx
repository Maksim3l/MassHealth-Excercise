import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface SvgComponentProps {
  width?: number;
  height?: number;
  strokeColor?: string;
}

const TimerIcon: React.FC<SvgComponentProps> = ({
  width = 32,
  height = 32,
  strokeColor = "#A4A4A8",
}) => (
  <Svg
    fill="none"
    width={width}
    height={height}
    viewBox="0 0 32 32"
  >
    <Path
      stroke={strokeColor}
      strokeLinecap="round"
      strokeWidth={2.5}
      d="m16 16 7.266-8.72C24.352 5.978 23.426 4 21.73 4H10.27C8.574 4 7.648 5.978 8.734 7.28L16 16Zm0 0 7.266 8.72c1.086 1.302.16 3.28-1.536 3.28H10.27c-1.696 0-2.622-1.978-1.536-3.28L16 16ZM6 28h20M6 4h20"
    />
    <Path
      stroke={strokeColor}
      strokeLinecap="round"
      strokeWidth={2.5}
      d="M10.5 23c1-.333 4.069-1.715 5.5-1 2 1 4.5.667 5.5 1"
    />
  </Svg>
);

export default TimerIcon;
