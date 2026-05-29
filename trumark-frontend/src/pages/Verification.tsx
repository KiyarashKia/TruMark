import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Skeleton,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiCopy,
  FiExternalLink,
  FiLink,
} from "react-icons/fi";
import AppBar from "../components/AppBar";
import Screen from "../components/Screen";
import { verifyOnChain } from "../lib/chain";
import type { ChainVerification, TraceStep } from "../lib/types";

const EXPLORER = "https://amoy.polygonscan.com";

export default function Verification() {
  const { upc } = useParams<{ upc: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ChainVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!upc) return;
    const controller = new AbortController();
    setLoading(true);
    verifyOnChain(upc, controller.signal)
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setData({ status: "unverified", network: "Polygon Amoy", trace: [] });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [upc]);

  return (
    <Screen
      header={
        <AppBar
          title="Verification"
          onBack={() => navigate(upc ? `/product/${upc}` : "/scanner")}
        />
      }
    >
      {loading || !data ? <LoadingState /> : <Result data={data} />}
    </Screen>
  );
}

function Result({ data }: { data: ChainVerification }) {
  const verified = data.status === "verified";

  return (
    <Stack spacing="md" p="md" pb="lg">
      {/* Status hero */}
      <Flex
        role="status"
        aria-live="polite"
        direction="column"
        align="center"
        textAlign="center"
        bg={verified ? "status-chain-bg" : "status-caution-bg"}
        borderRadius="lg"
        p="lg"
      >
        <Icon
          as={verified ? FiCheckCircle : FiAlertTriangle}
          boxSize="40px"
          color={verified ? "status-chain" : "status-caution"}
          aria-hidden
        />
        <Text fontSize="xl" fontWeight={700} mt="sm" color={verified ? "status-chain" : "status-caution"}>
          {verified ? "Verified on-chain" : "Not verified on-chain"}
        </Text>
        <Text fontSize="sm" color="text-secondary" mt="xs" maxW="300px">
          {verified
            ? `This product's supply chain is recorded as an immutable entry on ${data.network}.`
            : `We couldn't find a registry entry for this product on ${data.network}. Its provenance can't be confirmed yet.`}
        </Text>
      </Flex>

      {verified && (
        <>
          {/* On-chain references */}
          <Stack spacing="sm">
            {data.contractAddress && (
              <ChainRef
                label="Contract address"
                value={data.contractAddress}
                href={`${EXPLORER}/address/${data.contractAddress}`}
              />
            )}
            {data.transactionHash && (
              <ChainRef
                label="Transaction"
                value={data.transactionHash}
                href={`${EXPLORER}/tx/${data.transactionHash}`}
              />
            )}
          </Stack>

          {data.trace.length > 0 && (
            <Box>
              <SectionLabel>Recorded journey</SectionLabel>
              <Trace steps={data.trace} />
            </Box>
          )}
        </>
      )}

      {/* Trust explainer */}
      <Box bg="surface" borderRadius="lg" boxShadow="card" p="md">
        <SectionLabel>What this means</SectionLabel>
        <Text fontSize="sm" color="text-secondary">
          {verified
            ? "Each step was written to a public blockchain at the time it happened. Records can't be edited or deleted after the fact, so what you see is the original supply-chain history — not a claim a brand can quietly change later."
            : "An unverified product isn't necessarily unsafe — it simply hasn't been registered on TruMark's blockchain registry. Treat its supply-chain claims with normal caution."}
        </Text>
      </Box>
    </Stack>
  );
}

function ChainRef({ label, value, href }: { label: string; value: string; href: string }) {
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    } catch {
      toast({ title: "Couldn't copy", status: "error", duration: 2000, position: "top" });
    }
  };

  return (
    <Box bg="surface" borderRadius="md" boxShadow="card" p="md">
      <HStack mb="xs" spacing="xs" color="text-tertiary">
        <Icon as={FiLink} boxSize="12px" aria-hidden />
        <Text fontSize="xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.04em">
          {label}
        </Text>
      </HStack>
      <Flex align="center" gap="sm">
        <Text fontFamily="mono" fontSize="sm" flex={1} minW={0} isTruncated title={value}>
          {value}
        </Text>
        <IconButton
          aria-label={`Copy ${label.toLowerCase()}`}
          icon={<FiCopy />}
          size="sm"
          variant="ghost"
          onClick={copy}
        />
        <IconButton
          as="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${label.toLowerCase()} in block explorer`}
          icon={<FiExternalLink />}
          size="sm"
          variant="ghost"
        />
      </Flex>
    </Box>
  );
}

function Trace({ steps }: { steps: TraceStep[] }) {
  return (
    <Stack spacing={0} bg="surface" borderRadius="lg" boxShadow="card" p="md">
      {steps.map((step, i) => (
        <Flex key={`${step.role}-${i}`} gap="md">
          <Flex direction="column" align="center" flexShrink={0}>
            <Box boxSize="10px" borderRadius="full" bg="status-chain" mt="6px" />
            {i < steps.length - 1 && <Box w="2px" flex={1} bg="border" minH="28px" />}
          </Flex>
          <Box pb={i < steps.length - 1 ? "md" : 0}>
            <Text fontWeight={600} fontSize="sm">
              {step.label}
            </Text>
            <Text fontSize="xs" color="text-secondary">
              {[step.location, step.date && formatDate(step.date)].filter(Boolean).join(" · ")}
            </Text>
          </Box>
        </Flex>
      ))}
    </Stack>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight={600}
      textTransform="uppercase"
      letterSpacing="0.04em"
      color="text-tertiary"
      mb="sm"
    >
      {children}
    </Text>
  );
}

function LoadingState() {
  return (
    <Stack spacing="md" p="md">
      <Skeleton height="160px" borderRadius="lg" />
      <Skeleton height="72px" borderRadius="md" />
      <Skeleton height="72px" borderRadius="md" />
      <Skeleton height="120px" borderRadius="lg" />
    </Stack>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
