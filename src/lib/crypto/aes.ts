/**
 * AES-256-GCM Cryptographic Services
 * Built using Web Crypto API (crypto.subtle)
 */

export interface EncryptedPackage {
  encryptedData: ArrayBuffer;
  keyBytes: Uint8Array;
  keyHex: string;
  keyHash: string; // SHA-256 hash of encryption key
  iv: Uint8Array;
  ivHex: string;
  encryptedAssetHash: string; // Hash of the encrypted ciphertext
}

async function getCrypto(): Promise<Crypto> {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  } else {
    // Node environment fallback
    const nodeCrypto = await import("crypto");
    return nodeCrypto.webcrypto as unknown as Crypto;
  }
}

/**
 * Computes SHA-256 hex string for an ArrayBuffer or Uint8Array.
 */
export async function computeHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  const crypto = await getCrypto();
  const buffer = data instanceof Uint8Array ? data.buffer : data;
  const hashBuf = await crypto.subtle.digest("SHA-256", buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Encrypts arbitrary file/data using AES-256-GCM.
 */
export async function encryptAsset(data: ArrayBuffer): Promise<EncryptedPackage> {
  const crypto = await getCrypto();

  // Generate 256-bit AES-GCM key
  const cryptoKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Export raw key bytes (32 bytes)
  const keyBuffer = await crypto.subtle.exportKey("raw", cryptoKey);
  const keyBytes = new Uint8Array(keyBuffer);
  const keyHex = Buffer.from(keyBytes).toString("hex");

  // Generate 12-byte IV (96 bits)
  const iv = new Uint8Array(12);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(iv);
  } else {
    const nodeCrypto = await import("crypto");
    nodeCrypto.randomFillSync(iv);
  }
  const ivHex = Buffer.from(iv).toString("hex");

  // Encrypt plaintext ArrayBuffer
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    cryptoKey,
    data
  );

  // Compute key commitment and encrypted asset hash
  const keyHash = await computeHash(keyBytes);
  const encryptedAssetHash = await computeHash(encryptedData);

  return {
    encryptedData,
    keyBytes,
    keyHex,
    keyHash,
    iv,
    ivHex,
    encryptedAssetHash,
  };
}

/**
 * Decrypts AES-256-GCM encrypted payload using reconstructed key bytes and IV.
 */
export async function decryptAsset(
  encryptedData: ArrayBuffer,
  keyBytes: Uint8Array,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const crypto = await getCrypto();

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    cryptoKey,
    encryptedData
  );

  return decrypted;
}
