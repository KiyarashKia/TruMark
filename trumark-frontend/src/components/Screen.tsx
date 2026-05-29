import { Box, Flex } from "@chakra-ui/react";

interface ScreenProps {
  /** Sticky top bar, typically <AppBar />. */
  header?: React.ReactNode;
  /** Sticky bottom action area (CTA bar). Gets safe-area padding. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Phone-shaped page shell: full dynamic-viewport height, a scrolling content
 * region between an optional sticky header and footer, capped width so it stays
 * readable if opened on a small tablet. Footer reserves bottom safe-area space
 * so the CTA never collides with the home indicator.
 */
export default function Screen({ header, footer, children }: ScreenProps) {
  return (
    <Flex
      direction="column"
      minH="100dvh"
      bg="app-bg"
      mx="auto"
      maxW="480px"
      position="relative"
    >
      {header}

      <Box as="main" flex={1} overflowY="auto" overscrollBehavior="contain">
        {children}
      </Box>

      {footer && (
        <Box
          bg="surface"
          borderTopWidth="1px"
          borderColor="border"
          px="md"
          pt="md"
          pb="max(16px, env(safe-area-inset-bottom))"
        >
          {footer}
        </Box>
      )}
    </Flex>
  );
}
