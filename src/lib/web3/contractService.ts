import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "./config";

export interface OnChainAsset {
  id: number;
  owner: string;
  beneficiary: string;
  encryptedAssetHash: string;
  ipfsCid: string;
  inactivityPeriod: number;
  lastHeartbeat: number;
  challengePeriod: number;
  recoveryThreshold: number;
  attestorCount: number;
  recoveryActive: boolean;
  released: boolean;
  state: number; // 0: ACTIVE, 1: RECOVERY_REQUESTED, 2: EVIDENCE_COLLECTION, 3: THRESHOLD_REACHED, 4: CHALLENGE_PERIOD, 5: CANCELLED, 6: RELEASED
  assetName: string;
  assetType: string;
}

export interface OnChainRecoveryStatus {
  state: number;
  lastHeartbeat: number;
  inactivityPeriod: number;
  challengePeriod: number;
  currentApprovals: number;
  threshold: number;
  challengeEndTime: number;
  isEligibleForRecovery: boolean;
  isEligibleForFinalization: boolean;
}

export function getProvider(): ethers.Provider {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return new ethers.JsonRpcProvider("http://127.0.0.1:8545");
}

export async function getSigner(userAddress?: string): Promise<ethers.Signer> {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    return await provider.getSigner();
  }
  // Local hardhat signer fallback
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  if (userAddress) {
    return await provider.getSigner(userAddress);
  }
  return await provider.getSigner(0);
}

export function getHeirloomContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.heirloomRegistry,
    CONTRACT_ABIS.heirloomRegistry,
    signerOrProvider
  );
}

export function getKeyEscrowContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.keyEscrow,
    CONTRACT_ABIS.keyEscrow,
    signerOrProvider
  );
}

export function getAttestorRegistryContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.attestorRegistry,
    CONTRACT_ABIS.attestorRegistry,
    signerOrProvider
  );
}

/**
 * Registers an asset on the HeirloomRegistry smart contract.
 */
export async function registerAssetOnChain(params: {
  beneficiary: string;
  encryptedAssetHash: string;
  ipfsCid: string;
  inactivityPeriod: number;
  challengePeriod: number;
  recoveryThreshold: number;
  attestors: string[];
  keyCommitment: string;
  fragmentCommitments: string[];
  assetName: string;
  assetType: string;
  signerAddress?: string;
}): Promise<{ assetId: number; txHash: string; blockNumber: number }> {
  const signer = await getSigner(params.signerAddress);
  const contract = getHeirloomContract(signer);

  const tx = await contract.registerAsset(
    params.beneficiary,
    params.encryptedAssetHash,
    params.ipfsCid,
    params.inactivityPeriod,
    params.challengePeriod,
    params.recoveryThreshold,
    params.attestors,
    params.keyCommitment,
    params.fragmentCommitments,
    params.assetName,
    params.assetType
  );

  const receipt = await tx.wait();
  
  // Extract AssetRegistered event log
  let assetId = 1;
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "AssetRegistered") {
          assetId = Number(parsed.args.assetId);
          break;
        }
      } catch (e) {}
    }
  }

  return {
    assetId,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Executes heartbeat on-chain.
 */
export async function recordHeartbeatOnChain(assetId: number, signerAddress?: string): Promise<{ txHash: string; blockNumber: number }> {
  const signer = await getSigner(signerAddress);
  const contract = getHeirloomContract(signer);
  const tx = await contract.heartbeat(assetId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Initiates recovery on-chain.
 */
export async function initiateRecoveryOnChain(assetId: number, signerAddress?: string): Promise<{ txHash: string; blockNumber: number }> {
  const signer = await getSigner(signerAddress);
  const contract = getHeirloomContract(signer);
  const tx = await contract.initiateRecovery(assetId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Submits evidence on-chain.
 */
export async function submitEvidenceOnChain(
  assetId: number,
  evidenceUri: string,
  evidenceHash: string,
  signerAddress?: string
): Promise<{ txHash: string; blockNumber: number }> {
  const signer = await getSigner(signerAddress);
  const contract = getHeirloomContract(signer);
  const tx = await contract.submitEvidence(assetId, evidenceUri, evidenceHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Approves recovery by an attestor on-chain.
 */
export async function approveRecoveryOnChain(assetId: number, attestorAddress: string): Promise<{ txHash: string; blockNumber: number }> {
  const signer = await getSigner(attestorAddress);
  const contract = getHeirloomContract(signer);
  const tx = await contract.approveRecovery(assetId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Cancels recovery process on-chain (Emergency intervention).
 */
export async function cancelRecoveryOnChain(assetId: number, ownerAddress?: string): Promise<{ txHash: string; blockNumber: number }> {
  const signer = await getSigner(ownerAddress);
  const contract = getHeirloomContract(signer);
  const tx = await contract.cancelRecovery(assetId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Finalizes recovery on-chain.
 */
export async function finalizeRecoveryOnChain(assetId: number, beneficiaryAddress?: string): Promise<{ txHash: string; blockNumber: number }> {
  const signer = await getSigner(beneficiaryAddress);
  const contract = getHeirloomContract(signer);
  const tx = await contract.finalizeRecovery(assetId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Reads asset details directly from smart contract.
 */
export async function getAssetFromChain(assetId: number): Promise<OnChainAsset | null> {
  try {
    const provider = getProvider();
    const contract = getHeirloomContract(provider);
    const rawAsset = await contract.getAsset(assetId);
    return {
      id: Number(rawAsset.id),
      owner: rawAsset.owner,
      beneficiary: rawAsset.beneficiary,
      encryptedAssetHash: rawAsset.encryptedAssetHash,
      ipfsCid: rawAsset.ipfsCid,
      inactivityPeriod: Number(rawAsset.inactivityPeriod),
      lastHeartbeat: Number(rawAsset.lastHeartbeat),
      challengePeriod: Number(rawAsset.challengePeriod),
      recoveryThreshold: Number(rawAsset.recoveryThreshold),
      attestorCount: Number(rawAsset.attestorCount),
      recoveryActive: rawAsset.recoveryActive,
      released: rawAsset.released,
      state: Number(rawAsset.state),
      assetName: rawAsset.assetName,
      assetType: rawAsset.assetType,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Reads recovery status directly from smart contract.
 */
export async function getRecoveryStatusFromChain(assetId: number): Promise<OnChainRecoveryStatus | null> {
  try {
    const provider = getProvider();
    const contract = getHeirloomContract(provider);
    const status = await contract.getRecoveryStatus(assetId);
    return {
      state: Number(status[0]),
      lastHeartbeat: Number(status[1]),
      inactivityPeriod: Number(status[2]),
      challengePeriod: Number(status[3]),
      currentApprovals: Number(status[4]),
      threshold: Number(status[5]),
      challengeEndTime: Number(status[6]),
      isEligibleForRecovery: Boolean(status[7]),
      isEligibleForFinalization: Boolean(status[8]),
    };
  } catch (e) {
    return null;
  }
}
