import * as React from "react"
import Svg, {
  SvgProps,
  G,
  Path,
  Circle,
  Defs,
  ClipPath,
} from "react-native-svg"

const WorkoutIcon = (props: SvgProps) => {
  const { color = "#A4A4A8", ...rest } = props;
  return(
  <Svg viewBox="0 0 32 32" width={24} height={24} fill="none" stroke={color} {...props}>
    <G stroke={color} strokeWidth={2.5} clipPath="url(#a)">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 26c4.223-2.267 6.213-3.786 9-7m0 0c2.92-.23 5-1 7 1-.5 2-1.515 3.202-4 5m-3-6 4-8m0 0c.5 2 2 3.5 3 4 1-.5 2.5-2 3-3m-6-1c-2.577.297-3.948.615-6 2-1.264.9-1.698 1.567-2 3"
      />
      <Circle cx={21} cy={5} r={3} />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 30s14-1.5 23-1m4 1s-2-1-4-1m0 0c0-6 5-12.5 5-12.5"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h32v32H0z" />
      </ClipPath>
    </Defs>
  </Svg>
)
}
export default WorkoutIcon