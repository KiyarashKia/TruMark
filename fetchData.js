const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Reads a product from the deployed TruMark registry by UPC and writes it to
 * contractData.txt.
 *
 * Usage:  CONTRACT_ADDRESS=0x... UPC=123456 npx hardhat run fetchData.js --network amoy
 */
async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const upc = process.env.UPC || "123456";
  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS to the deployed registry address.");
  }

  const contract = await ethers.getContractAt("TruMark", contractAddress);

  if (!(await contract.isRegistered(upc))) {
    console.log(`No product registered for UPC ${upc}.`);
    return;
  }

  const p = await contract.getProduct(upc);
  const registeredAt = new Date(Number(p.timestamp) * 1000).toISOString();

  const data = `
  Registry: ${contractAddress}
  ---------------------
  UPC:        ${p.upc}
  Role:       ${p.role}
  Lot:        ${p.lot}
  Type:       ${p.productType}
  Date:       ${p.date}
  Creator:    ${p.creator}
  Registered: ${registeredAt} by ${p.registeredBy}
  ---------------------
  `;

  fs.writeFileSync("contractData.txt", data, "utf8");
  console.log(data);
  console.log("Saved to contractData.txt");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
