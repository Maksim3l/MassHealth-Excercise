import * as React from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";

interface SvgComponentProps {
  strokeColor?: string;
  width?: number;
  height?: number;
}

const LegIcon: React.FC<SvgComponentProps> = ({
  strokeColor = "#A4A4A8",
  width = 32,
  height = 32,
  ...props
}) => (
  <Svg
    {...props}
    fill="none"
    width={width}
    height={height}
    viewBox="0 0 32 32"
  >
    <G
      stroke={strokeColor}
      strokeLinecap="round"
      strokeWidth={2.5}
      clipPath="url(#a)"
    >
      <Path d="M5 2c10.5-2.387 20.546 3.429 24.916 9.18.384.506.457 1.172.241 1.77L24 30M2 16c1.333 1.5 6.5 3.5 11 3-2 1.833-4.8 5-4 11" />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M32 0H0v32h32z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default LegIcon;
