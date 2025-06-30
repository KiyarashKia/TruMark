const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // Define contract address
    const contractAddress = "0x5C1b8ab1bB0DA255d9D01603D3cDea3edBbdB1E5"; 

    // Get the deployed contract
    const contract = await ethers.getContractAt("TruMark", contractAddress);

    // Fetch data from the contract
    const name = await contract.name();
    const product = await contract.product();
    const creator = await contract.creator();
    const date = await contract.date();
    

    // Format the data
    const data = `
    Contract Data: ${contractAddress}
    ---------------------
    Name: ${name}
    Product: ${product}
    By: ${creator}
    Date: ${date}
    ---------------------
    `;

    // Write data to a text file
    fs.writeFileSync("contractData.txt", data, "utf8");

    console.log("✅ Data extracted and saved to contractData.txt!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
