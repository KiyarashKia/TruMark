require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");

/**
 * TruMark blockchain service.
 *
 * Talks to ONE long-lived registry contract (TruMark.sol) deployed at
 * CONTRACT_ADDRESS — it no longer deploys a fresh contract per product.
 *
 *   POST /blockchain/register     register a product against its UPC (owner only)
 *   GET  /blockchain/product/:upc read a product's on-chain provenance
 *
 * Simulation is ON by default and only turns off when SIMULATE === "false",
 * so you can never accidentally spend real funds by forgetting an env var.
 */

const SIMULATE = process.env.SIMULATE !== "false";
const PORT = process.env.PORT || 3001;
const NETWORK = process.env.CHAIN_NETWORK || "Polygon Amoy";
const EXPLORER = process.env.EXPLORER_BASE || "https://amoy.polygonscan.com";
// Optional shared secret. If set, register calls must send it as x-api-key.
const REGISTER_API_KEY = process.env.REGISTER_API_KEY || "";

let contract;
if (!SIMULATE) {
  const artifact = require("../artifacts/contracts/TruMark.sol/TruMark.json");
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS is required when SIMULATE=false");
  }
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, wallet);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send(`TruMark Blockchain Service running (${SIMULATE ? "SIMULATION" : "LIVE"})`);
});

/** Simple deterministic sim so /product responses are stable without a chain. */
function simulateProduct(upc, body = {}) {
  return {
    status: "verified",
    network: NETWORK,
    contractAddress: "0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF",
    transactionHash: "0xFAKETXNFAKETXNFAKETXNFAKETXNFAKETXNFAKETXNFAKETXNFAKETXNFAKETXN",
    registeredAt: new Date().toISOString(),
    trace: [
      {
        role: body.role || "producer",
        label: "Registered",
        location: body.location,
        date: body.date_of_production || body.date,
      },
    ],
  };
}

// ---- Register ------------------------------------------------------------ //
app.post("/blockchain/register", async (req, res) => {
  if (REGISTER_API_KEY && req.get("x-api-key") !== REGISTER_API_KEY) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const product = req.body || {};
  const upc = String(product.upc || "").trim();
  if (!upc) {
    return res.status(400).json({ success: false, error: "upc is required" });
  }

  const role = product.role || "Unknown Role";
  const lot = product.lot || "";
  const productType =
    product.category || product.storage_standard || product.transport_standard || "Generic";
  const date = product.date_of_production || product.date || new Date().toISOString();
  const creator = product.signature || "Unknown";

  if (SIMULATE) {
    await new Promise((r) => setTimeout(r, 800));
    return res.json({
      success: true,
      simulated: true,
      contractAddress: process.env.CONTRACT_ADDRESS || "0xSIMULATED",
      transactionHash: "0xSIMULATEDTX",
    });
  }

  try {
    // Arg order matches TruMark.registerProduct(upc, role, lot, productType, date, creator).
    const tx = await contract.registerProduct(upc, role, lot, productType, date, creator);
    console.log("Submitting registration:", tx.hash);
    await tx.wait();
    return res.json({
      success: true,
      contractAddress: await contract.getAddress(),
      transactionHash: tx.hash,
      explorer: `${EXPLORER}/tx/${tx.hash}`,
    });
  } catch (err) {
    console.error("Registration failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---- Read ---------------------------------------------------------------- //
app.get("/blockchain/product/:upc", async (req, res) => {
  const upc = String(req.params.upc || "").trim();
  if (!upc) return res.status(400).json({ error: "upc is required" });

  if (SIMULATE) {
    await new Promise((r) => setTimeout(r, 400));
    return res.json(simulateProduct(upc));
  }

  try {
    if (!(await contract.isRegistered(upc))) {
      return res.status(404).json({ status: "unverified", network: NETWORK, trace: [] });
    }
    const p = await contract.getProduct(upc);
    const registeredAt = new Date(Number(p.timestamp) * 1000).toISOString();
    return res.json({
      status: "verified",
      network: NETWORK,
      contractAddress: await contract.getAddress(),
      registeredAt,
      trace: [
        {
          role: p.role || "producer",
          label: "Registered on-chain",
          location: p.creator || undefined,
          date: p.date || registeredAt,
        },
      ],
    });
  } catch (err) {
    console.error("Lookup failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `TruMark blockchain service (${SIMULATE ? "SIMULATION" : "LIVE"}) on http://localhost:${PORT}`,
  );
});
