const hre = require("hardhat");

/**
 * Deploys the TruMark registry (one long-lived contract) and registers a sample
 * product so there's something to read back. The printed address goes into the
 * blockchain service's CONTRACT_ADDRESS env var.
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const TruMark = await hre.ethers.getContractFactory("TruMark");
  const truMark = await TruMark.deploy(); // registry constructor takes no args
  await truMark.waitForDeployment();
  const address = await truMark.getAddress();
  console.log("TruMark registry deployed to:", address);

  // Seed a sample product.
  const tx = await truMark.registerProduct(
    "123456", // upc
    "farmer", // role
    "LOT001", // lot
    "Vegetables", // productType
    "2025-06-29", // date
    "Kiarash - Upayan", // creator
  );
  await tx.wait();
  console.log("Sample product registered. Tx:", tx.hash);
  console.log("\nSet CONTRACT_ADDRESS in blockchain_service/.env to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
