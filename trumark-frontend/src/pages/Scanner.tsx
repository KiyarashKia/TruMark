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
import * as Quagga from "quagga";
import type { QuaggaResult } from "quagga";
import { useScanHistory } from "../lib/history";

interface TorchConstraint extends MediaTrackConstraintSet {
  torch?: boolean;
}

const SCAN_WIDTH = 320;
const SCAN_HEIGHT = 200;
const READERS = [
  "ean_reader",
  "ean_8_reader",
  "upc_reader",
  "upc_e_reader",
  "code_128_reader",
] as const;

type ScanState = "initializing" | "scanning" | "denied";

export default function Scanner() {
  const navigate = useNavigate();
  const toast = useToast();
  const { entries, add, clear } = useScanHistory();
  const history = useDisclosure();

  const [scanState, setScanState] = useState<ScanState>("initializing");
  const [flashlight, setFlashlight] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // Refs avoid stale closures and double-handling under StrictMode remounts.
  const handledRef = useRef(false);
  const startedRef = useRef(false);

  const goToProduct = (code: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    add(code);
    try {
      Quagga.stop();
    } catch {
      /* already stopped */
    }
    navigate(`/product/${encodeURIComponent(code)}`);
  };

  useEffect(() => {
    let cancelled = false;

    const onDetected = (data: QuaggaResult) => {
      const code = data?.codeResult?.code;
      if (code) goToProduct(code);
    };

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#scanner-container") as HTMLElement,
          constraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        decoder: { readers: [...READERS] },
        locate: true,
        frequency: 5,
        numOfWorkers: 2,
        halfSample: false,
        patchSize: "medium",
      },
      (err: unknown) => {
        if (cancelled) return;
        if (err) {
          // Almost always a denied/unavailable camera. Show a real recovery screen.
          console.error("Quagga init failed:", err);
          setScanState("denied");
          return;
        }
        startedRef.current = true;
        Quagga.start();
        setScanState("scanning");
      },
    );

    Quagga.onDetected(onDetected);

    return () => {
      cancelled = true;
      // Pass the SAME handler reference so it actually unregisters (the old
      // code passed a fresh fn and leaked the camera + decoder).
      Quagga.offDetected(onDetected);
      if (startedRef.current) {
        try {
          Quagga.stop();
        } catch {
          /* noop */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result;
      if (!src) return;
      Quagga.decodeSingle(
        {
          inputStream: { size: 800, singleChannel: false, src: src.toString() },
          decoder: { readers: [...READERS] },
        },
        (result: QuaggaResult | null) => {
          if (result?.codeResult?.code) {
            goToProduct(result.codeResult.code);
          } else {
            toast({
              title: "No barcode found",
              description: "Try a clearer, well-lit photo of the barcode.",
              status: "warning",
              duration: 3000,
              position: "top",
            });
          }
        },
      );
    };
    reader.readAsDataURL(file);
    // Allow re-selecting the same file.
    event.target.value = "";
  };

  const toggleFlashlight = async () => {
    const video = document.querySelector("#scanner-container video") as HTMLVideoElement | null;
    const stream = video?.srcObject as MediaStream | undefined;
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
      {/* Camera feed */}
      <Box id="scanner-container" position="absolute" inset={0} zIndex={0} />

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
