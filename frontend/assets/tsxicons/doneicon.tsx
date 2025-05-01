import * as React from "react";
import Svg, { Path } from "react-native-svg";

const DoneIcon = ({ width = 24, height = 24, stroke = "white", ...props }) => (
  <Svg
    {...props} 
    width={width}  
    height={height}  
    fill="none"
  >
    <Path
      fill={stroke}  
      d="M27.554 6.212a1.25 1.25 0 0 1 1.393 2.076c-8.069 5.41-10.598 8.866-15.817 17.322l-1.155 1.687L11 25.5c-1.148-2.116-1.972-3.247-3.105-4.517-.991-1.11-2.133-2.096-3.676-3.22l-.687-.49-.101-.079a1.25 1.25 0 0 1 1.43-2.035c-.926-.671.033.022 0 0C7 16 11.17 19.626 12 21c4.93-7.314 7.586-9.446 15.554-14.788Z"
    />
  </Svg>
);

export default DoneIcon;
