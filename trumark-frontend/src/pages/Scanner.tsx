import React, { useEffect, useState } from "react";
import { Box, Button, Text, IconButton } from "@chakra-ui/react";
import * as Quagga from "quagga";
import { AiOutlineUpload, AiOutlineThunderbolt, AiOutlineHistory } from "react-icons/ai";

const SCAN_WIDTH = 340;
const SCAN_HEIGHT = 210;

const Scanner = () => {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [flashlight, setFlashlight] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
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
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_128_reader",
          ],
        },
        // Performance/accuracy enhancements:
        locate: true,
        frequency: 5,
        numOfWorkers: 2,
        halfSample: false,
        patchSize: "medium",
      },
      (err) => {
        if (err) {
          console.error("Quagga init failed:", err);
          return;
        }
        console.log("Quagga initialized");
        Quagga.start();
      }
    );

    let lastScanned = "";

    Quagga.onDetected((data) => {
      const code = data?.codeResult?.code;
      if (code && code !== lastScanned) {
        lastScanned = code;
        setScannedResult(code);
        setHistory((prev) => [...prev, code]);
        console.log("Barcode scanned:", code);
        setShowAlert(true);
      }
    });

    return () => {
      Quagga.offDetected(() => {});
      Quagga.stop();
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result;
      if (imageData) {
        Quagga.decodeSingle(
          {
            inputStream: {
              size: 800,
              singleChannel: false,
              src: imageData.toString(),
            },
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "upc_e_reader",
              ],
            },
          },
          (result) => {
            if (result?.codeResult?.code) {
              setScannedResult(result.codeResult.code);
              setHistory((prev) => [...prev, result.codeResult.code]);
              setShowAlert(true);
            }
          }
        );
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box position="relative" w="100vw" h="100vh" bg="black" overflow="hidden">
      {/* Camera feed */}
      <Box
        id="scanner-container"
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        zIndex={0}
      />

      {/* Top Blur Overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h={`calc(40% - ${SCAN_HEIGHT / 2}px)`}
        bg="rgba(0, 0, 0, 0.45)"
        style={{ backdropFilter: "blur(6px)" }}
        zIndex={1}
      />

      {/* Bottom Blur Overlay */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        w="100%"
        h={`calc(50% - ${SCAN_HEIGHT / 2}px)`}
        bg="rgba(0, 0, 0, 0.45)"
        style={{ backdropFilter: "blur(6px)" }}
        zIndex={1}
      />

      {/* Scan Frame with Red Line & Brackets */}
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
        {/* White Corner Brackets */}
        {/* Top-left */}
        <Box position="absolute" top={0} left={0} w="32px" h="4px" bg="white" />
        <Box position="absolute" top={0} left={0} w="4px" h="32px" bg="white" />

        {/* Top-right */}
        <Box position="absolute" top={0} right={0} w="32px" h="4px" bg="white" />
        <Box position="absolute" top={0} right={0} w="4px" h="32px" bg="white" />

        {/* Bottom-left */}
        <Box position="absolute" bottom={0} left={0} w="32px" h="4px" bg="white" />
        <Box position="absolute" bottom={0} left={0} w="4px" h="32px" bg="white" />

        {/* Bottom-right */}
        <Box position="absolute" bottom={0} right={0} w="32px" h="4px" bg="white" />
        <Box position="absolute" bottom={0} right={0} w="4px" h="32px" bg="white" />

        {/* Red Scan Line */}
        <Box
          position="absolute"
          top="50%"
          left={0}
          w="100%"
          h="2px"
          bg="red.500"
          transform="translateY(-1px)"
        />
      </Box>

      {/* Icons: History & Flashlight */}
      <Box
        w="full"
        position="absolute"
        top="160px"
        zIndex={3}
        display="flex"
        justifyContent="space-between"
        px="30px"
      >
        <IconButton
          aria-label="History"
          icon={<AiOutlineHistory />}
          onClick={() => console.log(history)}
          bg="rgba(255,255,255,0.15)"
          color="white"
          borderRadius="full"
        />
        <IconButton
          aria-label="Toggle Flashlight"
          icon={<AiOutlineThunderbolt />}
          onClick={() => setFlashlight(!flashlight)}
          bg="rgba(255,255,255,0.15)"
          color="white"
          borderRadius="full"
        />
      </Box>

      {/* Upload From Library Button */}
      <Box
        position="absolute"
        top={`calc(50% + ${SCAN_HEIGHT / 2}px + 40px)`}
        left="50%"
        transform="translateX(-50%)"
        zIndex={3}
      >
        <Button
          leftIcon={<AiOutlineUpload />}
          colorScheme="blue"
          overflow="hidden"
          px={6}
          py={2}
          borderRadius="full"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              opacity: 0,
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              cursor: "pointer",
            }}
          />
          Upload From Library
        </Button>
      </Box>

      {/* Result Display */}
      {scannedResult && (
        <Text
          position="absolute"
          bottom="20px"
          left="50%"
          transform="translateX(-50%)"
          fontSize="md"
          fontWeight="bold"
          color="white"
          zIndex={4}
        >
          Scanned: {scannedResult}
        </Text>
      )}

      {/* Alert */}
      {showAlert && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          zIndex={5}
        >
          <Text fontSize="lg" fontWeight="bold">
            Scanned: {scannedResult}
          </Text>
          <Button mt={4} onClick={() => setShowAlert(false)}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Scanner;