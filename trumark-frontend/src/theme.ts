import { extendTheme } from "@chakra-ui/react";

const breakpoints = {
  base: "0px", 
  xs: "360px", 
  sm: "375px", 
  md: "414px", 
  lg: "768px", 
  xl: "820px", 
  "2xl": "1024px", 
};

const theme = extendTheme({
  breakpoints,
  fonts: {
    heading: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    body: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  },
  colors: {
    primary: "#1C1C1C",
    secondary: "#646464",
    white: "#FFFFFF",
    progressBg: "#E5E5EA",
    progressFill: "#000000",
  },
});

export default theme;