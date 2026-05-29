import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  FiZap,
  FiClock,
  FiUploadCloud,
  FiCamera,
  FiChevronRight,
} from "react-icons/fi";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { useScanHistory } from "../lib/history";

interface TorchConstraint extends MediaTrackConstraintSet {
  torch?: boolean;
}

/** Minimal shape we use from zxing's IScannerControls (avoids a deep import). */
interface ScannerControls {
  stop: () => void;
}

const SCAN_WIDTH = 320;
const SCAN_HEIGHT = 200;

// Restrict to the 1D retail formats we care about. Fewer formats = faster,
// more accurate decoding (the engine isn't also hunting QR/Data Matrix/etc).
const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
];

function buildHints(): Map<DecodeHintType, unknown> {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true); // favor accuracy over raw speed
  return hints;
}

type ScanState = "initializing" | "scanning" | "denied";

export default function Scanner() {
  const navigate = useNavigate();
  const toast = useToast();
  const { entries, add, clear } = useScanHistory();
  const history = useDisclosure();

  const [scanState, setScanState] = useState<ScanState>("initializing");
  const [flashlight, setFlashlight] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const handledRef = useRef(false); // guards against double navigation / StrictMode

  const stopCamera = () => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* already stopped */
    }
    controlsRef.current = null;
  };

  const goToProduct = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || handledRef.current) return;
    handledRef.current = true;
    add(trimmed);
    stopCamera();
    navigate(`/product/${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(buildHints(), {
      delayBetweenScanAttempts: 100,
      delayBetweenScanSuccess: 1000,
    });
    let cancelled = false;

    // Acquire the camera ONCE. Deferring to a macrotask lets React StrictMode's
    // dev-only mount → unmount → mount cancel this first attempt before
    // getUserMedia ever runs — otherwise two readers acquire the same camera
    // and share one <video>, and the cancelled reader's stop() clears the
    // srcObject of the live stream, leaving a black camera after permission.
    const startTimer = setTimeout(async () => {
      const video = videoRef.current;
      if (!video || cancelled) return;
      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (result) => {
            if (result) goToProduct(result.getText());
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setScanState("scanning");
      } catch (err) {
        if (cancelled) return;
        // No camera, denied permission, or insecure context (non-HTTPS).
        console.error("Scanner start failed:", err);
        setScanState("denied");
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    const url = URL.createObjectURL(file);
    try {
      const reader = new BrowserMultiFormatReader(buildHints());
      const result = await reader.decodeFromImageUrl(url);
      goToProduct(result.getText());
    } catch {
      toast({
        title: "No barcode found",
        description: "Try a clearer, well-lit photo of the barcode.",
        status: "warning",
        duration: 3000,
        position: "top",
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const toggleFlashlight = async () => {
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities?.() ?? {};
    if (!("torch" in capabilities)) {
      toast({
        title: "Flashlight unavailable",
        description: "This device or browser doesn't support torch control.",
        status: "info",
        duration: 3000,
        position: "top",
      });
      return;
    }

    const next = !flashlight;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] as TorchConstraint[] });
      setFlashlight(next);
    } catch {
      setFlashlight(false);
      toast({ title: "Couldn't toggle flashlight", status: "error", duration: 2500, position: "top" });
    }
  };

  const submitManual = () => {
    const code = manualCode.trim();
    if (code) goToProduct(code);
  };

  if (scanState === "denied") {
    return (
      <CameraDenied
        manualCode={manualCode}
        onManualChange={setManualCode}
        onManualSubmit={submitManual}
      />
    );
  }

  return (
    <Box position="relative" w="100vw" h="100dvh" bg="black" overflow="hidden">
      {/* Camera feed (zxing attaches the MediaStream to this element) */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* Dimming overlays above/below the scan window */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h={`calc(45% - ${SCAN_HEIGHT / 2}px)`}
        bg="scrim"
        zIndex={1}
      />
      <Box
        position="absolute"
        bottom={0}
        left={0}
        w="100%"
        h={`calc(55% - ${SCAN_HEIGHT / 2}px)`}
        bg="scrim"
        zIndex={1}
      />

      {/* Scan frame */}
      <Box
        position="absolute"
        top="45%"
        left="50%"
        transform="translate(-50%, -50%)"
        w={`${SCAN_WIDTH}px`}
        h={`${SCAN_HEIGHT}px`}
        zIndex={2}
        pointerEvents="none"
      >
        {(["tl", "tr", "bl", "br"] as const).map((corner) => (
          <Corner key={corner} pos={corner} />
        ))}
        <Box
          position="absolute"
          top="50%"
          left={0}
          w="100%"
          h="2px"
          bg="danger.400"
          transform="translateY(-1px)"
          boxShadow="0 0 8px rgba(224,62,62,0.8)"
        />
      </Box>

      {/* Top controls */}
      <Flex
        position="absolute"
        top="max(20px, env(safe-area-inset-top))"
        left={0}
        w="full"
        px="lg"
        justify="space-between"
        zIndex={4}
      >
        <IconButton
          aria-label="Scan history"
          icon={<FiClock size={20} />}
          variant="scanner"
          onClick={history.onOpen}
        />
        <IconButton
          aria-label={flashlight ? "Turn off flashlight" : "Turn on flashlight"}
          aria-pressed={flashlight}
          icon={<FiZap size={20} />}
          variant={flashlight ? "flashlightOn" : "scanner"}
          onClick={toggleFlashlight}
        />
      </Flex>

      {/* Instruction */}
      <Text
        position="absolute"
        top={`calc(45% - ${SCAN_HEIGHT / 2}px - 36px)`}
        left="50%"
        transform="translateX(-50%)"
        color="whiteAlpha.900"
        fontSize="sm"
        fontWeight={500}
        zIndex={3}
      >
        {scanState === "initializing" ? "Starting camera…" : "Point at a barcode"}
      </Text>

      {/* Upload action */}
      <Box
        position="absolute"
        top={`calc(45% + ${SCAN_HEIGHT / 2}px + 32px)`}
        left="50%"
        transform="translateX(-50%)"
        zIndex={3}
      >
        <Button as="label" htmlFor="upload-input" variant="onDark" leftIcon={<FiUploadCloud />} cursor="pointer">
          Upload from library
          <Input
            id="upload-input"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            display="none"
          />
        </Button>
      </Box>

      <HistoryDrawer
        isOpen={history.isOpen}
        onClose={history.onClose}
        entries={entries}
        onClear={clear}
        onSelect={(code) => {
          history.onClose();
          navigate(`/product/${encodeURIComponent(code)}`);
        }}
      />
    </Box>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const v = pos[0] === "t" ? { top: 0 } : { bottom: 0 };
  const h = pos[1] === "l" ? { left: 0 } : { right: 0 };
  return (
    <>
      <Box position="absolute" {...v} {...h} w="28px" h="3px" bg="white" borderRadius="full" />
      <Box position="absolute" {...v} {...h} w="3px" h="28px" bg="white" borderRadius="full" />
    </>
  );
}

function CameraDenied({
  manualCode,
  onManualChange,
  onManualSubmit,
}: {
  manualCode: string;
  onManualChange: (v: string) => void;
  onManualSubmit: () => void;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="100dvh"
      bg="app-bg"
      px="lg"
      textAlign="center"
    >
      <Icon as={FiCamera} boxSize="36px" color="text-tertiary" mb="md" aria-hidden />
      <Text fontSize="lg" fontWeight={700}>
        Camera access needed
      </Text>
      <Text fontSize="sm" color="text-secondary" mt="xs" maxW="300px">
        Allow camera access in your browser settings to scan, or enter a barcode
        number manually below.
      </Text>

      <Flex
        as="form"
        mt="lg"
        w="full"
        maxW="320px"
        gap="sm"
        onSubmit={(e) => {
          e.preventDefault();
          onManualSubmit();
        }}
      >
        <Input
          value={manualCode}
          onChange={(e) => onManualChange(e.target.value)}
          placeholder="Enter barcode number"
          inputMode="numeric"
          bg="surface"
          aria-label="Barcode number"
        />
        <IconButton
          type="submit"
          aria-label="Look up barcode"
          icon={<FiChevronRight />}
          isDisabled={!manualCode.trim()}
        />
      </Flex>
    </Flex>
  );
}

function HistoryDrawer({
  isOpen,
  onClose,
  entries,
  onClear,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: { upc: string; at: number }[];
  onClear: () => void;
  onSelect: (code: string) => void;
}) {
  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay bg="scrim" />
      <DrawerContent
        bg="surface"
        borderTopRadius="xl"
        pb="env(safe-area-inset-bottom)"
        maxH="70dvh"
      >
        <DrawerCloseButton mt="sm" />
        <DrawerHeader>Scan history</DrawerHeader>
        <DrawerBody>
          {entries.length === 0 ? (
            <Flex direction="column" align="center" py="2xl" color="text-secondary">
              <Icon as={FiClock} boxSize="28px" mb="sm" aria-hidden />
              <Text fontSize="sm">No scans yet</Text>
            </Flex>
          ) : (
            <Stack spacing={0} divider={<Box borderBottomWidth="1px" borderColor="border" />}>
              {entries.map((e) => (
                <Flex
                  key={`${e.upc}-${e.at}`}
                  as="button"
                  align="center"
                  justify="space-between"
                  py="md"
                  onClick={() => onSelect(e.upc)}
                  textAlign="left"
                  _active={{ opacity: 0.6 }}
                >
                  <Box>
                    <Text fontFamily="mono" fontWeight={600}>
                      {e.upc}
                    </Text>
                    <Text fontSize="xs" color="text-tertiary">
                      {new Date(e.at).toLocaleString("en-CA")}
                    </Text>
                  </Box>
                  <Icon as={FiChevronRight} color="text-tertiary" aria-hidden />
                </Flex>
              ))}
              <Button variant="ghost" mt="md" color="status-danger" onClick={onClear}>
                Clear history
              </Button>
            </Stack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
