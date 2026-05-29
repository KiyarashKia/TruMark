import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Flex, Spinner } from "@chakra-ui/react";
import Onboarding from "./pages/Onboarding";

// Code-split the heavy routes: the scanner pulls in the zxing decoder, and the
// result screens pull in the data layer. Keeping them out of the entry chunk
// means onboarding loads fast; each route's bundle loads on navigation.
const Scanner = lazy(() => import("./pages/Scanner"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Verification = lazy(() => import("./pages/Verification"));

function RouteFallback() {
  return (
    <Flex minH="100dvh" align="center" justify="center" bg="app-bg">
      <Spinner color="trust.500" size="lg" thickness="3px" />
    </Flex>
  );
}

const App = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/scanner" element={<Scanner />} />
        {/* Deep-linkable result screens — a UPC fully addresses a product. */}
        <Route path="/product/:upc" element={<ProductDetails />} />
        <Route path="/verification/:upc" element={<Verification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
