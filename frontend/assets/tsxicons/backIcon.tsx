import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const BackIcon = ({ stroke = "#F8FAFD", ...props }: SvgProps) => (
  <Svg
    width={32}
    height={32}
    viewBox="0 0 32 32"
    fill="none"
    {...props}
  >
    <Path
      d="M13 8L3 16m10 8L3 16m0 0h27"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={2.5}
    />
  </Svg>
);

export default BackIcon;
