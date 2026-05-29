import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

/**
 * TruKit — TruMark's design system.
 *
 * One source of truth for color, type, spacing, radius, elevation and the
 * core component recipes. Screens consume tokens (e.g. `bg="surface"`,
 * `color="trust.500"`), never raw hex. This is what makes the product feel
 * like one app instead of a collection of inline styles.
 */

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Mobile-first. The product is phone/tablet only; the >1024 case is a gate, not a layout.
const breakpoints = {
  base: "0px",
  xs: "360px",
  sm: "375px",
  md: "414px",
  lg: "768px",
  xl: "820px",
  "2xl": "1024px",
};

/**
 * Raw color ramps. Functional meaning is assigned via `semanticTokens` below —
 * components should prefer the semantic names so dark mode and re-theming are free.
 */
const colors = {
  // Trust / primary — calm blue. The brand's resting state.
  trust: {
    50: "#EAF2FE",
    100: "#CFE0FD",
    200: "#A7C7FC",
    300: "#7AA8F9",
    400: "#4C8BF5",
    500: "#2E6FE0",
    600: "#1F57BD",
    700: "#184496",
    800: "#143A7E",
    900: "#0F2C5E",
  },
  // Safe — verified / no recall.
  safe: {
    50: "#E7F8EF",
    100: "#C2EDD6",
    200: "#8FDDB4",
    300: "#54C88C",
    400: "#27AE6B",
    500: "#159454",
    600: "#0F7644",
    700: "#0C5E37",
    800: "#0A4C2D",
    900: "#073A22",
  },
  // Caution — unverified / unknown provenance.
  caution: {
    50: "#FEF6E7",
    100: "#FCE7BD",
    200: "#F8D27E",
    300: "#F0B53C",
    400: "#D97706",
    500: "#B86405",
    600: "#965105",
    700: "#763F06",
    800: "#5F3307",
    900: "#4A2806",
  },
  // Danger — recalled / unsafe. This is the one screen state that should alarm.
  danger: {
    50: "#FDECEC",
    100: "#FACFCF",
    200: "#F4A3A3",
    300: "#EC6F6F",
    400: "#E03E3E",
    500: "#C42525",
    600: "#9F1B1B",
    700: "#7F1717",
    800: "#651414",
    900: "#4D0F0F",
  },
  // Security accent — the chain / cryptographic layer.
  chain: {
    50: "#F3EBFB",
    100: "#E1CBF5",
    200: "#C6A0EC",
    300: "#A66FE0",
    400: "#8B47D4",
    500: "#6B21A8",
    600: "#581A8A",
    700: "#46156E",
    800: "#371157",
    900: "#280C40",
  },
  // Neutral ink scale.
  ink: {
    50: "#F7F7F8",
    100: "#ECECEE",
    200: "#D9D9DD",
    300: "#BFBFC6",
    400: "#9A9AA3",
    500: "#727279",
    600: "#535359",
    700: "#3A3A3F",
    800: "#252528",
    900: "#1C1C1C",
  },
};

/**
 * Semantic tokens — the names screens actually use. Light/dark pairs are defined
 * together so contrast is real in both modes (TruKit rule: never invert).
 */
const semanticTokens = {
  colors: {
    "app-bg": { default: "#F3F3F5", _dark: "#0E0E10" },
    surface: { default: "#FFFFFF", _dark: "#1A1A1D" },
    "surface-raised": { default: "#FFFFFF", _dark: "#222226" },
    "surface-sunken": { default: "#F7F7F8", _dark: "#141416" },
    border: { default: "ink.200", _dark: "whiteAlpha.300" },
    "text-primary": { default: "ink.900", _dark: "ink.50" },
    "text-secondary": { default: "ink.500", _dark: "ink.300" },
    "text-tertiary": { default: "ink.400", _dark: "ink.400" },
    "text-on-accent": { default: "#FFFFFF", _dark: "#FFFFFF" },
    // Status — used by verdict badges and result screens.
    "status-safe": { default: "safe.500", _dark: "safe.300" },
    "status-safe-bg": { default: "safe.50", _dark: "rgba(21,148,84,0.16)" },
    "status-caution": { default: "caution.400", _dark: "caution.300" },
    "status-caution-bg": { default: "caution.50", _dark: "rgba(217,119,6,0.16)" },
    "status-danger": { default: "danger.500", _dark: "danger.300" },
    "status-danger-bg": { default: "danger.50", _dark: "rgba(196,37,37,0.18)" },
    "status-chain": { default: "chain.500", _dark: "chain.300" },
    "status-chain-bg": { default: "chain.50", _dark: "rgba(107,33,168,0.18)" },
    // Scrim for modals/sheets — 50% keeps foreground legible (TruKit rule).
    scrim: { default: "rgba(0,0,0,0.5)", _dark: "rgba(0,0,0,0.6)" },
  },
};

const fonts = {
  heading:
    "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  body:
    "'SF Pro Display', 'SF UI Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  mono:
    "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

// Apple-ish type scale. Sizes only — weight carries hierarchy.
const fontSizes = {
  xs: "12px",
  sm: "13px",
  md: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "28px",
  "4xl": "34px",
};

// 4pt rhythm. Chakra's default scale is already 4pt-based; these are named aliases.
const space = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
};

const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  pill: "999px",
};

// One elevation scale. No ad-hoc shadows in screens.
const shadows = {
  card: "0px 1px 2px rgba(16,24,40,0.06), 0px 1px 3px rgba(16,24,40,0.10)",
  raised: "0px 4px 6px rgba(16,24,40,0.10), 0px 2px 4px rgba(16,24,40,0.06)",
  sheet: "0px -8px 24px rgba(16,24,40,0.12)",
  button: "0px 4px 6px rgba(0,0,0,0.16)",
  focus: "0 0 0 3px rgba(46,111,224,0.45)",
};

const components = {
  Button: {
    baseStyle: {
      borderRadius: "pill",
      fontWeight: 600,
      _focusVisible: { boxShadow: "focus" },
      // Touch target floor (TruKit rule: ≥44px).
      minH: "44px",
    },
    variants: {
      // Primary CTA — one per screen.
      primary: {
        bg: "trust.500",
        color: "text-on-accent",
        boxShadow: "button",
        _hover: { bg: "trust.600", _disabled: { bg: "trust.500" } },
        _active: { bg: "trust.700", transform: "scale(0.98)" },
      },
      // Used on dark/camera surfaces.
      onDark: {
        bg: "whiteAlpha.200",
        color: "white",
        backdropFilter: "blur(8px)",
        _hover: { bg: "whiteAlpha.300" },
        _active: { transform: "scale(0.98)" },
      },
      ghost: {
        bg: "transparent",
        color: "text-secondary",
        _hover: { bg: "surface-sunken" },
      },
    },
    defaultProps: { variant: "primary" },
  },
  IconButton: {
    baseStyle: { borderRadius: "pill" },
    variants: {
      scanner: {
        bg: "whiteAlpha.200",
        color: "white",
        backdropFilter: "blur(8px)",
        _hover: { bg: "whiteAlpha.300" },
        _active: { transform: "scale(0.95)" },
      },
      flashlightOn: {
        bg: "caution.400",
        color: "black",
        _hover: { bg: "caution.500" },
        _active: { transform: "scale(0.95)" },
      },
    },
  },
  // The trust verdict pill used on result screens.
  Badge: {
    baseStyle: {
      borderRadius: "pill",
      px: 3,
      py: 1,
      fontWeight: 600,
      textTransform: "none",
      fontSize: "sm",
    },
  },
};

const styles = {
  global: {
    "html, body": {
      bg: "app-bg",
      color: "text-primary",
    },
    "#root": {
      minH: "100dvh",
    },
  },
};

const theme = extendTheme({
  config,
  breakpoints,
  colors,
  semanticTokens,
  fonts,
  fontSizes,
  space,
  radii,
  shadows,
  components,
  styles,
});

export default theme;
