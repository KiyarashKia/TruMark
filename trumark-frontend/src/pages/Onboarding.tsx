import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text, Button } from "@chakra-ui/react";
import { motion } from "framer-motion";

// Onboarding Screens Data
const onboardingData = [
  {
    image: "/images/welcome.png",
    title: "Your Food, Fully Verified",
    description: (
      <>
        Track your food’s journey from source to shelf with{" "}
        <Text as="span" fontWeight="extrabold" color="#4C8BF5">
          blockchain-backed
        </Text>{" "}
        transparency
      </>
    ),
    boxBg: "#A7C7FC",
    buttonText: "Next",
    buttonColor: "#1C1C1C",
  },
  {
    image: "/images/scan_verify.png",
    title: "Scan & Verify",
    description: (
      <>
        Simply scan the barcode to check product safety and{" "}
        <Text as="span" fontWeight="extrabold" color="#D97706">
          trace
        </Text>{" "}
        its{" "}
        <Text as="span" fontWeight="extrabold" color="#D97706">
          journey
        </Text>
      </>
    ),
    boxBg: "#F6D365",
    buttonText: "Next",
    buttonColor: "#1C1C1C",
  },
  {
    image: "/images/blockchain_security.png",
    title: "Blockchain Security",
    description: (
      <>
        Every product is verified through an{" "}
        <Text as="span" fontWeight="extrabold" color="#344054">
          immutable blockchain record
        </Text>{" "}
        on{" "}
        <Text as="span" fontWeight="extrabold" color="#344054">
          Polygon network
        </Text>
      </>
    ),
    boxBg: "#D1E8FF",
    buttonText: "Let's Go",
    buttonColor: "#6B21A8",
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const nextStep = () => {
    if (step < onboardingData.length - 1) {
      setStep(step + 1);
    } else {
      navigate("/scanner");
    }
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      minH="820px"
      position="relative"
      bg="white"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      className="onboarding-container"
    >
      {/* Curved Background Shape */}
      <Box
        position="absolute"
        top="-70px"
        left="-55px"
        w="530px"
        h="500px"
        bg={onboardingData[step].boxBg}
        borderRadius="50px"
        transform="rotate(-15deg)"
        boxShadow="inset 7px -20px 15px -13px rgba(0, 0, 0, 0.15)"
      />

      <Box mt="64px" w="246px" h="8px" bg="#E5E5EA" borderRadius="999px" overflow="hidden" zIndex={2} >
        <Box w={`${(step + 1) * 33.3}%`} h="100%" bg="black" borderRadius="999px" transition="width 1s ease"/>
      </Box>

      {/* Title (Spacing Independent) */}
      <Box minH="50px" display="flex" alignItems="center" justifyContent="center">
      <Text fontSize="24px" fontWeight="bold" fontFamily="SF Pro Display" zIndex={2}>
        {onboardingData[step].title}
      </Text>
    </Box>

      {/* Image (Spacing Independent) */}
      <motion.img
      key={onboardingData[step].image}
      src={onboardingData[step].image}
      alt="Onboarding Step"
      style={{
        width: "260px",
        height: "260px",
        objectFit: "contain",
        marginTop: "16px",
        zIndex: 2,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
          duration: 0.3,
          scale: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
      }}
  />

      {/* Description (With Bold & Colored Text) */}
      <Box h="96px" display="flex" alignItems="center" justifyContent="center" mt={16}>
      <Text
        fontSize="16px"
        fontFamily="SF UI Text"
        fontWeight="medium"
        color="#1C1C1E"
        px={16}
        textAlign="center"
        zIndex={2}
      >
        {onboardingData[step].description}
      </Text>
    </Box>

      {/* Button (Always Visible & Independent) */}
      <Button
        bg={onboardingData[step].buttonColor}
        color="white"
        borderRadius="36px"
        w="168px"
        h="53px"
        px="28px"
        fontSize="17px"
        fontWeight="600"
        fontFamily="SF Pro Display"
        boxShadow="0px 4px 6px rgba(0, 0, 0, 0.16)"
        _hover={{ opacity: 0.85 }}
        _active={{ opacity: 0.7 }}
        mt="24px"
        mb="max(172px, env(safe-area-inset-bottom))"
        zIndex={2}
        onClick={nextStep}
        className="onboarding-button"
      >
        {onboardingData[step].buttonText}
      </Button>
    </Box>
  );
};

export default Onboarding;