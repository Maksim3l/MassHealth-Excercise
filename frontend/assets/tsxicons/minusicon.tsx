import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface MinusIconProps extends SvgProps {
  strokeColor?: string;
}

const MinusIcon: React.FC<MinusIconProps> = ({ strokeColor = "#A4A4A8", ...props }) => (
  <Svg
    fill="none"
    viewBox="0 0 32 32"
    {...props}
  >
    <Path
      stroke={strokeColor}
      strokeLinecap="round"
      strokeWidth={2.5}
      d="M8 16h16"
    />
  </Svg>
);

export default MinusIcon;
