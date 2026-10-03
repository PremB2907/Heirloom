# Heirloom Protocol: Security Architecture & Cryptographic Audit Document

## Overview
Heirloom is a trust-minimized digital inheritance protocol designed to prevent both unauthorized early disclosure and permanent loss of sensitive digital assets.

## Core Cryptographic Principles

### 1. Off-Chain AES-256-GCM Asset Encryption
- Sensitive plaintext payload (passwords, credentials, seed phrases, legal wills) is **NEVER** stored directly on-chain.
- Payload is encrypted client-side using standard AES-256-GCM (`crypto.subtle`) with a freshly generated 256-bit key and 96-bit (12-byte) initialization vector (IV).
- Authenticated data tags prevent tampering.

### 2. Shamir Secret Sharing (SSS) over GF(256)
- The 256-bit master encryption key is split into $n$ key fragments using polynomial secret sharing over Galois Field $GF(256)$ with primitive polynomial $x^8 + x^4 + x^3 + x + 1$ ($0x11b$).
- Default configuration: $k = 3$ of $n = 5$ threshold.
- Any subset of 3 valid shares reconstructs the exact master key using Lagrange interpolation.
- Any subset of $<3$ shares yields zero statistical information about the encryption key.

### 3. Commitment On-Chain, Plaintext Off-Chain
- The blockchain records only:
  - `keyCommitment`: `keccak256(masterAESKey)`
  - `fragmentCommitments`: Array of `keccak256(share_i)`
  - Asset metadata, owner address, beneficiary address, timestamps, threshold states, and audit logs.
- Plaintext secrets remain stored strictly in client-controlled off-chain storage or IPFS nodes.

### 4. Smart Contract Lifecycle Protection
- **ReentrancyGuard**: Applied to state-changing methods (`approveRecovery`, `finalizeRecovery`).
- **Access Control & Modifiers**: Enforces strict authorization (`onlyAssetOwner`, `onlyRegistry`, `assetExists`).
- **Checks-Effects-Interactions**: Updates state variables prior to triggering key escrow release or external calls.

## Emergency Intervention & Owner Heartbeat
- The owner can update `lastHeartbeat` at any time during `ACTIVE` state or during `CHALLENGE_PERIOD`.
- If an unauthorized or premature recovery is detected, calling `cancelRecovery()` or `heartbeat()` immediately aborts recovery, clears attestations, and restores status to `ACTIVE`.

## Demo Mode vs. Production Configuration

| Parameter | Production Setting | Demo Mode Setting |
| :--- | :--- | :--- |
| Inactivity Period | 180 Days ($15,552,000\text{ seconds}$) | 60 Seconds |
| Challenge Period | 7 Days ($604,800\text{ seconds}$) | 30 Seconds |
| Attestor Threshold | 3 of 5 | 3 of 5 |
