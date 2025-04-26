import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const DeleteIcon = ({ stroke = "#F8FAFD", ...props }: SvgProps) => (
  <Svg
    width={32}
    height={32}
    viewBox="0 0 32 32"
    fill="none"
    {...props}
  >
    <Path
      d="M7 13v11.715c0 1.943 1.395 3.622 3.32 3.878 4.089.542 7.276.543 11.36 0 1.926-.255 3.32-1.935 3.32-3.877V13"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={2.5}
    />
    <Path
      d="M5.8 12.16c7.637 1.11 12.639 1.13 20.402 0A2.109 2.109 0 0 0 28 10.067a2.13 2.13 0 0 0-2.13-2.13h-1.68A1.728 1.728 0 0 1 22.46 6.21c0-1.126-1.06-1.945-2.163-1.722-3.114.63-5.482.662-8.587.022-1.104-.227-2.173.587-2.173 1.714 0 .947-.767 1.714-1.714 1.714H6.13A2.13 2.13 0 0 0 4 10.067a2.11 2.11 0 0 0 1.8 2.092ZM12 17v7m8-7v7m-4-7v7"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={2.5}
    />
  </Svg>
);

export default DeleteIcon;
