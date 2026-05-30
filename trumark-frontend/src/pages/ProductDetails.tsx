import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Skeleton,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  FiCheckCircle,
  FiChevronRight,
  FiExternalLink,
  FiImage,
  FiRefreshCw,
} from "react-icons/fi";
import AppBar from "../components/AppBar";
import Screen from "../components/Screen";
import { VERDICT_META } from "../components/verdict";
import { useProductReport } from "../lib/report";
import type { ProductReport, Recall, TraceStep } from "../lib/types";

export default function ProductDetails() {
  const { upc } = useParams<{ upc: string }>();
  const navigate = useNavigate();
  const { status, report, error, reload } = useProductReport(upc);

  return (
    <Screen
      header={<AppBar title="Product" onBack={() => navigate("/scanner")} />}
      footer={
        status === "success" &&
        report && (
          <Button
            w="full"
            rightIcon={<FiChevronRight />}
            onClick={() => navigate(`/verification/${report.product.upc}`)}
          >
            View blockchain verification
          </Button>
        )
      }
    >
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={error} onRetry={reload} />}
      {status === "success" && report && <Report report={report} onRetry={reload} />}
    </Screen>
  );
}

/* ---- Success ------------------------------------------------------------- */

function Report({ report, onRetry }: { report: ProductReport; onRetry: () => void }) {
  const { product, recalls, recallStatus, verification } = report;
  const meta = VERDICT_META[report.verdict];

  return (
    <Stack spacing="md" p="md" pb="lg">
      {/* Verdict — the single most important thing on the screen. */}
      <Flex
        role="status"
        aria-live="polite"
        align="center"
        gap="md"
        bg={meta.bg}
        borderRadius="lg"
        p="md"
      >
        <Icon as={meta.icon} boxSize="32px" color={meta.fg} aria-hidden />
        <Box>
          <Text fontSize="lg" fontWeight={700} color={meta.fg}>
            {meta.headline}
          </Text>
          <Text fontSize="sm" color="text-secondary">
            {meta.detail}
          </Text>
        </Box>
      </Flex>

      {/* Product identity */}
      <Flex bg="surface" borderRadius="lg" boxShadow="card" p="md" gap="md">
        <ProductThumb name={product.name} src={product.imageUrl} />
        <Box flex={1} minW={0}>
          <Text fontSize="lg" fontWeight={700} noOfLines={2}>
            {product.name}
          </Text>
          {product.brand && (
            <Text fontSize="sm" color="text-secondary" noOfLines={1}>
              {product.brand}
            </Text>
          )}
          <HStack spacing="sm" mt="sm" flexWrap="wrap">
            {product.category && <Tag>{product.category}</Tag>}
            {product.origin && <Tag>{product.origin}</Tag>}
            {product.nutriScore && <Tag>Nutri-Score {product.nutriScore}</Tag>}
          </HStack>
        </Box>
      </Flex>

      {!product.found && (
        <Note>
          This barcode isn't in our product database yet. Recall and chain checks
          still ran against the code.
        </Note>
      )}

      {/* Recall surface. Three distinct states — never let "couldn't check"
          masquerade as "no recalls". */}
      {recallStatus === "unavailable" ? (
        <Section title="Recall check">
          <Flex
            bg="status-caution-bg"
            borderRadius="md"
            p="md"
            align="center"
            gap="md"
            borderLeftWidth="3px"
            borderColor="status-caution"
          >
            <Box flex={1}>
              <Text fontWeight={600} color="status-caution">
                Recall check unavailable
              </Text>
              <Text fontSize="sm" color="text-secondary" mt="xs">
                We couldn't reach the recall service, so this product hasn't been
                checked against active recalls.
              </Text>
            </Box>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FiRefreshCw />}
              color="status-caution"
              onClick={onRetry}
              flexShrink={0}
            >
              Retry
            </Button>
          </Flex>
        </Section>
      ) : recalls.length > 0 ? (
        <Section title={recalls.length === 1 ? "Active recall" : "Active recalls"}>
          <Stack spacing="sm">
            {recalls.map((r) => (
              <RecallCard key={r.id} recall={r} />
            ))}
          </Stack>
        </Section>
      ) : (
        <Section title="Recall check">
          <Flex bg="status-safe-bg" borderRadius="md" p="md" align="center" gap="sm">
            <Icon as={FiCheckCircle} color="status-safe" boxSize="20px" aria-hidden />
            <Text fontSize="sm" color="text-secondary">
              No active recalls found for this product.
            </Text>
          </Flex>
        </Section>
      )}

      {/* Supply-chain trace preview */}
      {verification.trace.length > 0 && (
        <Section title="Supply chain">
          <Trace steps={verification.trace} />
        </Section>
      )}

      <Text fontSize="xs" color="text-tertiary" textAlign="center" pt="xs">
        UPC {product.upc}
      </Text>
    </Stack>
  );
}

function ProductThumb({ name, src }: { name: string; src?: string }) {
  if (!src) {
    return (
      <Flex
        boxSize="84px"
        borderRadius="md"
        bg="surface-sunken"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={FiImage} boxSize="28px" color="text-tertiary" aria-hidden />
      </Flex>
    );
  }
  return (
    <Image
      src={src}
      alt={`${name} packaging`}
      boxSize="84px"
      flexShrink={0}
      objectFit="cover"
      borderRadius="md"
      bg="surface-sunken"
    />
  );
}

function RecallCard({ recall }: { recall: Recall }) {
  return (
    <Box
      bg="status-danger-bg"
      borderRadius="md"
      p="md"
      borderLeftWidth="3px"
      borderColor="status-danger"
    >
      <Flex justify="space-between" align="baseline" gap="sm">
        <Text fontWeight={600} color="status-danger">
          {recall.title}
        </Text>
        <Text fontSize="xs" color="text-secondary" flexShrink={0}>
          {formatDate(recall.date)}
        </Text>
      </Flex>
      <Text fontSize="sm" color="text-secondary" mt="xs">
        {recall.reason}
      </Text>
      <HStack justify="space-between" mt="sm">
        <Text fontSize="xs" color="text-tertiary">
          {recall.source} · {recall.id}
        </Text>
        {recall.url && (
          <Button
            as="a"
            href={recall.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            rightIcon={<FiExternalLink />}
            color="status-danger"
          >
            Details
          </Button>
        )}
      </HStack>
    </Box>
  );
}

function Trace({ steps }: { steps: TraceStep[] }) {
  return (
    <Stack spacing={0} bg="surface" borderRadius="lg" boxShadow="card" p="md">
      {steps.map((step, i) => (
        <Flex key={`${step.role}-${i}`} gap="md">
          {/* Timeline rail */}
          <Flex direction="column" align="center" flexShrink={0}>
            <Box boxSize="10px" borderRadius="full" bg="status-chain" mt="6px" />
            {i < steps.length - 1 && <Box w="2px" flex={1} bg="border" minH="28px" />}
          </Flex>
          <Box pb={i < steps.length - 1 ? "md" : 0}>
            <Text fontWeight={600} fontSize="sm">
              {step.label}
            </Text>
            <Text fontSize="xs" color="text-secondary">
              {[step.location, step.date && formatDate(step.date)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </Box>
        </Flex>
      ))}
    </Stack>
  );
}

/* ---- Shared bits --------------------------------------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight={600}
        textTransform="uppercase"
        letterSpacing="0.04em"
        color="text-tertiary"
        mb="sm"
        px="xs"
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <Box
      fontSize="xs"
      color="text-secondary"
      bg="surface-sunken"
      px="sm"
      py="2px"
      borderRadius="pill"
    >
      {children}
    </Box>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <Box bg="status-caution-bg" borderRadius="md" p="md">
      <Text fontSize="sm" color="text-secondary">
        {children}
      </Text>
    </Box>
  );
}

/* ---- Non-success states -------------------------------------------------- */

function LoadingState() {
  return (
    <Stack spacing="md" p="md">
      <Skeleton height="76px" borderRadius="lg" />
      <Flex bg="surface" borderRadius="lg" boxShadow="card" p="md" gap="md">
        <Skeleton boxSize="84px" borderRadius="md" />
        <Box flex={1}>
          <SkeletonText noOfLines={2} spacing="3" skeletonHeight="3" />
          <Skeleton height="20px" width="60%" mt="3" borderRadius="pill" />
        </Box>
      </Flex>
      <Skeleton height="160px" borderRadius="lg" />
    </Stack>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <Flex direction="column" align="center" justify="center" minH="60dvh" p="lg" textAlign="center">
      <Icon as={FiRefreshCw} boxSize="32px" color="text-tertiary" mb="md" aria-hidden />
      <Text fontWeight={600} fontSize="lg">
        Couldn't load this product
      </Text>
      <Text fontSize="sm" color="text-secondary" mt="xs" maxW="280px">
        {message || "Check your connection and try again."}
      </Text>
      <Button mt="lg" leftIcon={<FiRefreshCw />} onClick={onRetry}>
        Try again
      </Button>
    </Flex>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
