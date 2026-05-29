import { Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Scanner from "./pages/Scanner";
import ProductDetails from "./pages/ProductDetails";
import Verification from "./pages/Verification";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/scanner" element={<Scanner />} />
      {/* Deep-linkable result screens — a UPC fully addresses a product. */}
      <Route path="/product/:upc" element={<ProductDetails />} />
      <Route path="/verification/:upc" element={<Verification />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
