import * as React from "react"
import Svg, { SvgProps, Path, Rect } from "react-native-svg"

const ActivityIcon = (props: SvgProps) => (
  <Svg viewBox="0 0 32 32" width={24} height={24} fill="none" {...props}>
    <Path
      stroke="#A4A4A8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="m10 30-1-4m13 4 1-4M10 2 9 6m13-4 1 4"
    />
    <Rect
      width={20}
      height={20}
      x={6}
      y={6}
      stroke="#A4A4A8"
      strokeWidth={2.5}
      rx={4}
    />
    <Path
      stroke="#A4A4A8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M21 19v-6m-5 6v-4m-5 4v-2M29 10v6"
    />
  </Svg>
)

export default ActivityIcon