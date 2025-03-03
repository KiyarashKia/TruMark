const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);

    // Contract details
    const name = "TruMark";
    const product = "Hello World";
    const creator = "Kiarash - Upayan";
    const date = "3/2/2025";

    // Deploy contract
    const TruMark = await hre.ethers.getContractFactory("TruMark");
    const truMark = await TruMark.deploy(name, product, creator, date);

    await truMark.waitForDeployment();
    console.log("Contract deployed to:", await truMark.getAddress());
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
