require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');

// Simulation toggle
const SIMULATE = process.env.SIMULATE === "true";

// Load ABI + Bytecode only if needed
let truMarkArtifact;
if (!SIMULATE) {
  truMarkArtifact = require('./artifacts/contracts/TruMark.sol/TruMark.json');
}

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3001;

// load provider + wallet if not simulating
let provider, wallet, factory;
if (!SIMULATE) {
  provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

app.get('/', (req, res) => {
    res.send("✅ TruMark Blockchain Service is Running!");
  });

// ✅ POST /blockchain/register
app.post('/blockchain/register', async (req, res) => {
  const product = req.body;
  console.log("📥 Product received:", product);

  // Extract contract inputs
  const contractName = product.role || "Unknown Role";
  const productType =
    product.category || product.storage_standard || product.transport_standard || "Generic";
  const creator = product.signature || "Unknown";
  const date = product.date_of_production || product.date || new Date().toISOString();

  // -- SIMULATION MODE -- //
  if (SIMULATE) {
    console.log("⚗️ Running in SIMULATION mode...");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate delay

    return res.json({
      success: res.statusCode === 200 ? "Success" : "Failure",
      success: res.statusCode === 200 ? "Success" : "Failure",
      contractAddress: "0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF",
      transactionHash: "0xFAKETXNFAKETXNFAKETXNFAKETXNFAKETXNFAKETXN"
    });
  }

  // REAL DEPLOYMENT
  try {
    factory = new ethers.ContractFactory(
      truMarkArtifact.abi,
      truMarkArtifact.bytecode,
      wallet
    );

    const contract = await factory.deploy(contractName, productType, creator, date);
    console.log("🚀 Deploying... TX:", contract.deployTransaction.hash);

    await contract.deployed();
    console.log("✅ Contract deployed at:", contract.address);

    res.json({
      success: true,
      contractAddress: contract.address,
      transactionHash: contract.deployTransaction.hash
    });
  } catch (err) {
    console.error("❌ Error during deployment:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Start the server
app.listen(port, () => {
  const mode = SIMULATE ? "SIMULATION" : "REAL DEPLOYMENT";
  console.log(`🟢 Blockchain service (${mode}) running at http://localhost:${port}`);
});
