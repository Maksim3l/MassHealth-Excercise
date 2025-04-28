import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface EditIconProps extends SvgProps {
  stroke?: string;
  size?: number;
}

const EditIcon = ({ stroke = "#F8FAFD", size = 24, ...restProps }: EditIconProps) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      {...restProps}
    >
      <Path
        d="m14 26 14.414-14.414A2 2 0 0 0 29 10.172V6.828a2 2 0 0 0-.586-1.414l-1.828-1.828A2 2 0 0 0 25.172 3h-3.344a2 2 0 0 0-1.414.586L6 18m8 8v-4.172a2 2 0 0 0-.586-1.414l-1.828-1.828A2 2 0 0 0 10.172 18H6m8 8-6 2M6 18l-2 6m0 0-1.368 4.103a1 1 0 0 0 1.265 1.264L8 28m-4-4h2a2 2 0 0 1 2 2v2"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={2.5}
      />
    </Svg>
  );
};

export default EditIcon;
 