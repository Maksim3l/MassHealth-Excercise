import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

const ProfileIcon = (props: SvgProps) => {
  const { color = "#A4A4A8", ...rest } = props;
  return(
  <Svg viewBox="0 0 32 32" width={24} height={24} fill="none" stroke={color} {...props}>
    <Path
      fill={color}
      d="M7.769 9.464c.372.444.866.588 1.205.636.345.048.692.022.959-.01.104-.011.212-.028.318-.044a5.75 5.75 0 0 0 11.497.006l.435.088c.18.036.45.087.728.088.271.002.736-.041 1.15-.374a1.62 1.62 0 0 0 .18-.173c.004.106.009.212.009.319a8.25 8.25 0 1 1-16.481-.536ZM16 1.75a8.22 8.22 0 0 1 5.716 2.304c-.9-.39-1.904-.66-2.697-.794l-.239-.037c-2.029-.28-3.26-.294-5.175-.051l-.866.119c-.684.101-1.54.322-2.329.643A8.22 8.22 0 0 1 16 1.75Z"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M21.63 9.19c-3.873-.571-7.107-.586-10.947-.045-1.421.201-2.833.092-2.702-1.337.157-1.711 1.965-2.983 3.667-3.217 3.238-.445 5.303-.454 8.49-.03 1.802.241 3.57 1.643 3.765 3.45.131 1.223-1.056 1.36-2.273 1.18ZM28 29l.348-2.434A4 4 0 0 0 24.388 22H7.612a4 4 0 0 0-3.96 4.566L4 29"
    />
  </Svg>
)
}
export default ProfileIcon