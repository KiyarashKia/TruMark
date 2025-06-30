const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);

    // Contract details (example values)
    const role = "farmer";
    const upc = "123456";
    const lot = "LOT001";
    const productType = "Vegetables";
    const date = "2025-06-29";
    const signature = "Kiarash - Upayan";

    // Deploy contract with 6 arguments
    const TruMark = await hre.ethers.getContractFactory("TruMark");
    const truMark = await TruMark.deploy(role, upc, lot, productType, date, signature);

    // ethers v6+ deployment
    await truMark.waitForDeployment();
    const deployTx = await truMark.deploymentTransaction();
    console.log("Contract deployed to:", await truMark.getAddress());
    console.log("Deployment transaction hash:", deployTx.hash);
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
