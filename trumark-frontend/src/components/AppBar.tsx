import { Flex, IconButton, Text, Box } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";

interface AppBarProps {
  title?: string;
  onBack?: () => void;
  /** Optional trailing control (e.g. an action button). */
  trailing?: React.ReactNode;
}

/**
 * Top app bar. Fixed placement is the caller's job; this handles the notch via
 * safe-area padding and keeps the back affordance in a consistent spot on every
 * screen (nav-consistency rule).
 */
export default function AppBar({ title, onBack, trailing }: AppBarProps) {
  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px="md"
      pt="max(12px, env(safe-area-inset-top))"
      pb="sm"
      bg="surface"
      borderBottomWidth="1px"
      borderColor="border"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Box w="44px">
        {onBack && (
          <IconButton
            aria-label="Go back"
            icon={<FiArrowLeft size={22} />}
            variant="ghost"
            onClick={onBack}
            color="text-primary"
          />
        )}
      </Box>

      <Text fontWeight={600} fontSize="lg" noOfLines={1} textAlign="center" flex={1}>
        {title}
      </Text>

      <Flex w="44px" justify="flex-end">
        {trailing}
      </Flex>
    </Flex>
  );
}
