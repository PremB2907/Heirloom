/**
 * Storage Layer for Heirloom Protocol
 * Handles IPFS simulation / local storage fallback.
 * NEVER stores plaintext secrets.
 */

export interface StoredEncryptedAsset {
  cid: string;
  encryptedDataBase64: string;
  ivHex: string;
  assetName: string;
  assetType: string;
  owner: string;
  beneficiary: string;
  createdAt: number;
}

export interface DemoKeyFragment {
  assetId: number;
  attestorAddress: string;
  shareHex: string;
  commitmentHash: string;
}

const STORAGE_KEY_PREFIX = "heirloom_asset_";
const FRAGMENTS_KEY_PREFIX = "heirloom_fragments_";

export function storeEncryptedAssetLocally(
  assetId: number,
  asset: StoredEncryptedAsset
): string {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${assetId}`, JSON.stringify(asset));
    localStorage.setItem(`heirloom_cid_${asset.cid}`, JSON.stringify(asset));
  }
  return asset.cid;
}

export function getEncryptedAssetLocally(assetId: number): StoredEncryptedAsset | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${assetId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function storeDemoFragmentsLocally(assetId: number, fragments: DemoKeyFragment[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${FRAGMENTS_KEY_PREFIX}${assetId}`, JSON.stringify(fragments));
  }
}

export function getDemoFragmentsLocally(assetId: number): DemoKeyFragment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(`${FRAGMENTS_KEY_PREFIX}${assetId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
