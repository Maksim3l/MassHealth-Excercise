import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface MinusIconProps extends SvgProps {
  strokeColor?: string;
}

const PlayIcon: React.FC<MinusIconProps> = ({ strokeColor = "#A4A4A8", width = "32", height = "32", ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" fill="none" {...props}>
    <Path
      stroke={strokeColor}
      strokeLinecap="round"
      strokeWidth={2.5}
      d="M6 26.159V5.84c0-1.618 1.821-2.566 3.147-1.638l14.512 10.159a2 2 0 0 1 0 3.277L9.147 27.797C7.82 28.725 6 27.777 6 26.16Z"
    />
  </Svg>
);

export default PlayIcon;