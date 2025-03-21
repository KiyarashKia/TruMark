import React, { useEffect, useState } from "react";
import { Box, Button, Text, IconButton } from "@chakra-ui/react";
import * as Quagga from "quagga";
import { AiOutlineUpload, AiOutlineThunderbolt, AiOutlineHistory } from "react-icons/ai";

const Scanner = () => {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [flashlight, setFlashlight] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#scanner-container') as HTMLElement,
        constraints: {
          width: 305,
          height: 305,
          facingMode: "environment",
        },
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
    }, (err) => {
      if (err) {
        console.log("Quagga initialization error:", err);
        return;
      }
      console.log("Quagga initialized successfully");
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      if (data?.codeResult?.code) {
        setScannedResult(data.codeResult.code);
        setHistory(prev => [...prev, data.codeResult.code]);
      }
    });

    return () => {
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
        Quagga.decodeSingle({
        
          inputStream: {
            name: "UploadedImage",
            type: "ImageStream",
            target: imageData.toString(),
            constraints: {
              width: 305,
              height: 305,
              facingMode: "environment",
            },
          },
        
          // numOfWorkers: 0, // set to 0 for decodeSingle
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
            ],
          },
        }, (result) => {
          if (result?.codeResult?.code) {
            setScannedResult(result.codeResult.code);
            setHistory((prev) => [...prev, result.codeResult.code]);
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      bg="gray.200"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {/* Top Bar */}
      <Box w="full" position="relative" mt="30px" mb="19px">
        <IconButton
          aria-label="History"
          icon={<AiOutlineHistory />}
          position="absolute"
          left="23px"
          onClick={() => console.log(history)}
        />
        <IconButton
          aria-label="Toggle Flashlight"
          icon={<AiOutlineThunderbolt />}
          position="absolute"
          right="19px"
          onClick={() => setFlashlight(!flashlight)}
          colorScheme={flashlight ? "yellow" : "gray"}
        />
      </Box>

      {/* Scanner Container */}
      <Box id="scanner-container" w="305px" h="305px" bg="white" border="2px solid black" />

      {/* Upload Button */}
      <Button leftIcon={<AiOutlineUpload />} mt="40px" colorScheme="blue" position="relative" overflow="hidden">
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

      {/* Display Scanned Result */}
      {scannedResult && (
        <Text mt={4} fontSize="lg" fontWeight="bold">
          Scanned Code: {scannedResult}
        </Text>
      )}
    </Box>
  );
};

export default Scanner;