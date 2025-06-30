require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ethers = require('ethers');

// Simulation toggle
const SIMULATE = process.env.SIMULATE === "false";

// Load ABI + Bytecode only if needed
let truMarkArtifact;
if (!SIMULATE) {
  truMarkArtifact = require('../artifacts/contracts/TruMark.sol/TruMark.json');
}

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3001;

// load provider + wallet if not simulating
let provider, wallet, factory;
if (!SIMULATE) {
  provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
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

    // Deploy contract with 6 arguments matching TruMark.sol
    const contract = await factory.deploy(
      product.role || "Unknown Role",
      product.upc || "",
      product.lot || "",
      productType,
      date,
      creator
    );
    console.log("🚀 Deploying... TX:", contract.deploymentTransaction().hash);

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed at:", contractAddress);

    // Attempt verification using Hardhat CLI as a child process (spawn, not exec)
    try {
      // Wait for the contract to be indexed by the explorer
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
      const { spawn } = require("child_process");
      const args = [
        "verify",
        "--network", "amoy",
        contractAddress,
        product.role || "Unknown Role",
        product.upc || "",
        product.lot || "",
        productType,
        date,
        creator
      ];
      const child = spawn("npx", ["hardhat", ...args], { cwd: process.cwd(), shell: true });
      child.stdout.on("data", data => console.log(data.toString()));
      child.stderr.on("data", data => console.error(data.toString()));
      child.on("close", code => {
        if (code === 0) {
          console.log("🎉 Contract verified on explorer!");
        } else {
          console.error("❌ Verification failed with exit code", code);
        }
      });
    } catch (verifyErr) {
      console.error("❌ Verification process error:", verifyErr.message || verifyErr);
    }

    res.json({
      success: true,
      contractAddress: contractAddress,
      transactionHash: contract.deploymentTransaction().hash
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
