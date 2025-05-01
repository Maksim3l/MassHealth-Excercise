import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

const HomeIcon = (props: SvgProps) => {
  const { color = "#A4A4A8", ...rest } = props;
  return(
  <Svg viewBox="0 0 32 32" width={30} height={30} fill="none" stroke={color} {...props}>
    <Path
      stroke={color}
      strokeWidth={2.5}
      d="M4 12.569a4 4 0 0 1 1.688-3.265l8-5.666a4 4 0 0 1 4.624 0l8 5.666A4 4 0 0 1 28 12.568V24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V12.569Z"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M12 28V16a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12"
      />
    </Svg>
  )
}
export default HomeIcon