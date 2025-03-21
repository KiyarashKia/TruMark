import { Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Scanner from "./pages/Scanner";
import ProductDetails from "./pages/ProductDetails";
import Verification from "./pages/Verification";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/product-details" element={<ProductDetails />} />
      <Route path="/verification" element={<Verification />} />
    </Routes>
  );
};

export default App;