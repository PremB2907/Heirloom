/**
 * Shamir's Secret Sharing over GF(256)
 * Field polynomial: x^8 + x^4 + x^3 + x + 1 (0x11b - AES standard)
 */

// Precompute log and exp tables for GF(256)
const LOG_TABLE = new Uint8Array(256);
const EXP_TABLE = new Uint8Array(256);

(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    let x2 = (x << 1) ^ (x & 0x80 ? 0x11b : 0);
    x = x2 ^ x; // Multiply by 3 (0x03 generator for 0x11b)
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfAdd(a: number, b: number): number {
  return a ^ b;
}

function gfSub(a: number, b: number): number {
  return a ^ b;
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error("GF(256) Division by zero");
  if (a === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] - LOG_TABLE[b] + 255) % 255];
}

function evalPoly(poly: Uint8Array, x: number): number {
  let result = 0;
  for (let i = poly.length - 1; i >= 0; i--) {
    result = gfAdd(gfMul(result, x), poly[i]);
  }
  return result;
}

export interface Share {
  id: number; // Share index (1..n)
  data: Uint8Array; // Share bytes
  hex: string;
}

/**
 * Split a secret byte array into `totalShares` shares with `threshold` required to reconstruct.
 */
export function splitSecret(secret: Uint8Array, threshold: number, totalShares: number): Share[] {
  if (threshold < 1 || threshold > totalShares) {
    throw new Error("Invalid threshold or total shares configuration");
  }

  const shares: Share[] = [];
  for (let i = 1; i <= totalShares; i++) {
    shares.push({
      id: i,
      data: new Uint8Array(secret.length),
      hex: "",
    });
  }

  // For each byte in the secret, construct a random polynomial of degree (threshold - 1)
  for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
    const poly = new Uint8Array(threshold);
    poly[0] = secret[byteIdx]; // Constant term is the secret byte

    // Fill coefficients with random bytes
    const randomCoeffs = new Uint8Array(threshold - 1);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(randomCoeffs);
    } else {
      const cryptoNode = require("crypto");
      const bytes = cryptoNode.randomBytes(threshold - 1);
      randomCoeffs.set(bytes);
    }

    for (let c = 1; c < threshold; c++) {
      poly[c] = randomCoeffs[c - 1];
    }

    // Evaluate polynomial for each share id (1..n)
    for (let s = 0; s < totalShares; s++) {
      const x = shares[s].id;
      shares[s].data[byteIdx] = evalPoly(poly, x);
    }
  }

  // Format shares as hex (first byte: share id, rest: share data)
  for (const s of shares) {
    const combined = new Uint8Array(1 + s.data.length);
    combined[0] = s.id;
    combined.set(s.data, 1);
    s.hex = Buffer.from(combined).toString("hex");
  }

  return shares;
}

/**
 * Reconstruct secret byte array from array of hex or Share objects using Lagrange Interpolation over GF(256) at x = 0.
 */
export function combineShares(sharesInput: Array<Share | string>): Uint8Array {
  const parsedShares: { id: number; data: Uint8Array }[] = sharesInput.map((input) => {
    if (typeof input === "string") {
      const buf = Buffer.from(input, "hex");
      return {
        id: buf[0],
        data: new Uint8Array(buf.subarray(1)),
      };
    } else {
      return { id: input.id, data: input.data };
    }
  });

  if (parsedShares.length === 0) {
    throw new Error("No shares provided for reconstruction");
  }

  const secretLength = parsedShares[0].data.length;
  const k = parsedShares.length;
  const reconstructed = new Uint8Array(secretLength);

  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    let secretByte = 0;

    for (let j = 0; j < k; j++) {
      const xj = parsedShares[j].id;
      const yj = parsedShares[j].data[byteIdx];

      // Calculate Lagrange basis polynomial L_j(0)
      let num = 1;
      let den = 1;

      for (let m = 0; m < k; m++) {
        if (m === j) continue;
        const xm = parsedShares[m].id;
        num = gfMul(num, xm); // (0 - x_m) in GF(256) is x_m
        den = gfMul(den, gfSub(xj, xm)); // (x_j - x_m) in GF(256) is xj ^ xm
      }

      const lagrangeL = gfMul(num, gfDiv(1, den));
      const term = gfMul(yj, lagrangeL);
      secretByte = gfAdd(secretByte, term);
    }

    reconstructed[byteIdx] = secretByte;
  }

  return reconstructed;
}
