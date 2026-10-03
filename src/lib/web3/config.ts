import deployedData from "@/contracts/deployed.json";
import HeirloomRegistryArtifact from "../../../artifacts/contracts/HeirloomRegistry.sol/HeirloomRegistry.json";
import AttestorRegistryArtifact from "../../../artifacts/contracts/AttestorRegistry.sol/AttestorRegistry.json";
import KeyEscrowArtifact from "../../../artifacts/contracts/KeyEscrow.sol/KeyEscrow.json";

export const CONTRACT_ADDRESSES = {
  heirloomRegistry: deployedData.heirloomRegistry || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  attestorRegistry: deployedData.attestorRegistry || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  keyEscrow: deployedData.keyEscrow || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

export const CONTRACT_ABIS = {
  heirloomRegistry: HeirloomRegistryArtifact.abi,
  attestorRegistry: AttestorRegistryArtifact.abi,
  keyEscrow: KeyEscrowArtifact.abi,
};

export const BSC_TESTNET_CHAIN_ID = 97;
export const LOCALHOST_CHAIN_ID = 31337;

// Default demo attestors
export const DEFAULT_DEMO_ATTESTORS = [
  { name: "Attestor A (Legal Guardian)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { name: "Attestor B (Trusted Executor)", address: "0x3C44CdD38a9007593815693d5aA010Eb282841E" },
  { name: "Attestor C (Institutional Escrow)", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  { name: "Attestor D (Family Trustee)", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
  { name: "Attestor E (Backup Identity Verification)", address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" },
];
