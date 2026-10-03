import { expect } from "chai";
import { splitSecret, combineShares } from "../src/lib/crypto/shamir";
import { encryptAsset, decryptAsset } from "../src/lib/crypto/aes";

describe("Cryptographic Module End-to-End Security Tests", function () {
  const originalKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) originalKey[i] = (i * 7 + 13) % 256;

  it("1. Shamir Secret Sharing: Should split a 32-byte key into 5 shares with threshold 3, and reconstruct accurately with any 3 shares", function () {
    const shares = splitSecret(originalKey, 3, 5);
    expect(shares.length).to.equal(5);

    // Reconstruct with first 3 shares (1, 2, 3)
    const reconstructed1 = combineShares([shares[0].hex, shares[1].hex, shares[2].hex]);
    expect(Buffer.from(reconstructed1).toString("hex")).to.equal(Buffer.from(originalKey).toString("hex"));

    // Reconstruct with arbitrary 3 shares (2, 4, 5)
    const reconstructed2 = combineShares([shares[1].hex, shares[3].hex, shares[4].hex]);
    expect(Buffer.from(reconstructed2).toString("hex")).to.equal(Buffer.from(originalKey).toString("hex"));
  });

  it("2. Shamir Secret Sharing: Should fail to reconstruct correct key when given only 2 shares (insufficient threshold)", function () {
    const shares = splitSecret(originalKey, 3, 5);
    const reconstructedInsufficient = combineShares([shares[0].hex, shares[1].hex]);
    expect(Buffer.from(reconstructedInsufficient).toString("hex")).to.not.equal(Buffer.from(originalKey).toString("hex"));
  });

  it("3. Shamir Secret Sharing: Should reject corrupted share data", function () {
    const shares = splitSecret(originalKey, 3, 5);
    const corruptedShare = shares[0].hex.substring(0, shares[0].hex.length - 2) + "ff";
    const reconstructedCorrupted = combineShares([corruptedShare, shares[1].hex, shares[2].hex]);
    expect(Buffer.from(reconstructedCorrupted).toString("hex")).to.not.equal(Buffer.from(originalKey).toString("hex"));
  });

  it("4. AES-256-GCM: Should encrypt and decrypt valid file contents accurately", async function () {
    const sampleText = "CONFIDENTIAL: Heirloom Recovery Vault Credentials 2026";
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const dataBuffer = encoder.encode(sampleText).buffer;

    const encryptedPkg = await encryptAsset(dataBuffer);
    expect(encryptedPkg.keyBytes.length).to.equal(32);
    expect(encryptedPkg.iv.length).to.equal(12);

    const decryptedBuffer = await decryptAsset(
      encryptedPkg.encryptedData,
      encryptedPkg.keyBytes,
      encryptedPkg.iv
    );

    const decryptedText = decoder.decode(decryptedBuffer);
    expect(decryptedText).to.equal(sampleText);
  });

  it("5. AES-256-GCM: Should throw an explicit error when attempting to decrypt modified/tampered ciphertext", async function () {
    const sampleText = "CONFIDENTIAL: Heirloom Secret Document";
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(sampleText).buffer;

    const encryptedPkg = await encryptAsset(dataBuffer);
    
    // Corrupt ciphertext
    const tamperedData = new Uint8Array(encryptedPkg.encryptedData.slice(0));
    tamperedData[0] ^= 0xff; // Flip bits in ciphertext

    let caughtError = false;
    try {
      await decryptAsset(tamperedData.buffer, encryptedPkg.keyBytes, encryptedPkg.iv);
    } catch (err) {
      caughtError = true;
    }
    expect(caughtError).to.be.true;
  });

  it("6. AES-256-GCM: Should throw an explicit error when attempting to decrypt with incorrect IV", async function () {
    const sampleText = "CONFIDENTIAL: Heirloom Secret Document";
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(sampleText).buffer;

    const encryptedPkg = await encryptAsset(dataBuffer);

    const wrongIv = new Uint8Array(12);
    wrongIv.fill(0xab);

    let caughtError = false;
    try {
      await decryptAsset(encryptedPkg.encryptedData, encryptedPkg.keyBytes, wrongIv);
    } catch (err) {
      caughtError = true;
    }
    expect(caughtError).to.be.true;
  });
});
