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
    scanner: {
      overlay: "rgba(0, 0, 0, 0.45)",
      buttonBg: "rgba(255, 255, 255, 0.15)",
      buttonHover: "rgba(255, 255, 255, 0.2)",
      flashlightActive: "#C4A938",
      flashlightHover: "#B59B33",
      scanLine: "red.500"
    }
  },
  components: {
    IconButton: {
      baseStyle: {
        borderRadius: "full",
      },
      variants: {
        scanner: {
          bg: "scanner.buttonBg",
          color: "white",
          _hover: {
            bg: "scanner.buttonHover"
          },
          _active: {
            transform: "scale(0.95)"
          }
        },
        flashlight: (props: { isActive: boolean }) => ({
          bg: props.isActive ? "scanner.flashlightActive" : "scanner.buttonBg",
          color: props.isActive ? "black" : "white",
          _hover: {
            bg: props.isActive ? "scanner.flashlightHover" : "scanner.buttonHover"
          }
        })
      }
    }
  }
});

export default theme;