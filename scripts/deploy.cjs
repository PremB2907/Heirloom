const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying Heirloom Protocol Contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB/ETH");
  console.log("==================================================");

  // 1. Deploy AttestorRegistry
  const AttestorRegistryFactory = await ethers.getContractFactory("AttestorRegistry");
  const attestorRegistry = await AttestorRegistryFactory.deploy();
  await attestorRegistry.waitForDeployment();
  const attestorRegistryAddress = await attestorRegistry.getAddress();
  console.log("✓ AttestorRegistry deployed to:", attestorRegistryAddress);

  // 2. Deploy HeirloomRegistry
  const HeirloomRegistryFactory = await ethers.getContractFactory("HeirloomRegistry");
  const heirloomRegistry = await HeirloomRegistryFactory.deploy(attestorRegistryAddress);
  await heirloomRegistry.waitForDeployment();
  const heirloomRegistryAddress = await heirloomRegistry.getAddress();
  console.log("✓ HeirloomRegistry deployed to:", heirloomRegistryAddress);

  // 3. Deploy KeyEscrow
  const KeyEscrowFactory = await ethers.getContractFactory("KeyEscrow");
  const keyEscrow = await KeyEscrowFactory.deploy(heirloomRegistryAddress);
  await keyEscrow.waitForDeployment();
  const keyEscrowAddress = await keyEscrow.getAddress();
  console.log("✓ KeyEscrow deployed to:", keyEscrowAddress);

  // 4. Link KeyEscrow in HeirloomRegistry
  const linkTx = await heirloomRegistry.setKeyEscrow(keyEscrowAddress);
  await linkTx.wait();
  console.log("✓ KeyEscrow linked to HeirloomRegistry successfully.");

  // Save deployment artifact for frontend
  const deployedData = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    attestorRegistry: attestorRegistryAddress,
    heirloomRegistry: heirloomRegistryAddress,
    keyEscrow: keyEscrowAddress,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "deployed.json"),
    JSON.stringify(deployedData, null, 2)
  );

  console.log("==================================================");
  console.log("Deployment complete! Artifacts saved to src/contracts/deployed.json");
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
