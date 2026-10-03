# Heirloom Protocol: Comprehensive Threat Model & Security Matrix

## Protocol Security Objectives
1. **Prevent Early Disclosure**: Protected secrets must NEVER be accessible before unavailability and threshold conditions are met.
2. **Prevent Unilateral Access**: No single attestor, owner, platform, or admin can compromise or decrypt an asset.
3. **Prevent Permanent Loss**: Resilient against up to $(n - k)$ missing, compromised, or unresponsive attestors.
4. **Prevent False Inactivity Claims**: Inactivity alone cannot release assets without threshold attestations and challenge period.
5. **Verifiable Auditability**: All state transitions emit immutable smart contract events on BNB Smart Chain.

---

## Threat Matrix & Security Analysis

| Threat / Attack Vector | Impact | Attack Mechanics | Protocol Mitigation | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Malicious Beneficiary** | High | Beneficiary attempts premature recovery while owner is active. | Owner is active and sends liveness heartbeat or calls `cancelRecovery()`. Challenge period ensures owner has 7 days (30s demo) to cancel. | Owner must monitor or have automated heartbeat active. |
| **Malicious / Compromised Attestor** | Critical | Single attestor attempts to leak key or approve false recovery. | Shamir threshold architecture requires $k=3$ independent attestor approvals. 1 or 2 malicious attestors possess zero information about the master key. | Collusion of $k$ or more attestors. |
| **Colluding Attestors ($k \ge 3$)** | Critical | 3 out of 5 attestors conspire to approve recovery without owner being dead/inactive. | Emergency challenge period allows owner to intervene on-chain. Owner heartbeat immediately cancels active recovery. | If owner is incapacitated AND 3 attestors collude corruptly. |
| **Lost / Unresponsive Attestor** | High | An attestor loses key share or disappears permanently. | Protocol requires only $k=3$ out of $n=5$ approvals. The loss of up to 2 attestors does not halt recovery. | If $>2$ attestors disappear simultaneously. |
| **Blockchain Metadata Leakage** | Low | Passive observer reads smart contract storage. | Plaintext secrets and AES keys are NEVER stored on-chain. Only keccak256 hash commitments (`keyCommitment`) are recorded. | Metadata (owner, beneficiary, timestamps) is public. |
| **Storage Node / IPFS Compromise** | Medium | Adversary gains access to IPFS ciphertext. | Payload is encrypted with AES-256-GCM. Without the 256-bit key reconstructed via SSS, ciphertext is computationally unbreakable. | Future quantum threats to AES-256 (mitigated by 256-bit key length). |
| **Front-Running / MEV** | Low | Adversary front-runs `approveRecovery()` or `finalizeRecovery()`. | Attestations are tied to msg.sender address validations in `AttestorRegistry`. Final release only sends to registered beneficiary. | Minor gas fee priority variations. |
| **Reentrancy Attack** | High | Malicious smart contract calls back during state transitions. | All external state transitions implement OpenZeppelin `ReentrancyGuard` and Checks-Effects-Interactions pattern. | None. |

---

## State Transition Integrity

```
               +-------------------------------------------------------+
               |                                                       |
               v                                                       |
         [ 1. ACTIVE ] --(owner inactive)--> [ 2. RECOVERY REQUESTED ] |
               |                                    |                  |
               | (heartbeat / cancel)               v                  | (owner heartbeat / cancel)
               +----------------------- [ 3. EVIDENCE COLLECTION ]    |
               |                                    |                  |
               |                                    v                  |
               +----------------------- [ 4. THRESHOLD REACHED ]      |
               |                                    |                  |
               |                                    v                  |
               +----------------------- [ 5. CHALLENGE PERIOD ] -------+
                                                    |
                                          (challenge elapsed)
                                                    v
                                           [ 6. RELEASED ]
```

---

## Formal Security Checklist
- [x] AES-256-GCM authenticated encryption for all off-chain asset payloads
- [x] Shamir Secret Sharing polynomial over $GF(256)$ ($0x11b$) for 256-bit master key
- [x] Keccak256 hash commitments stored on-chain
- [x] Independent threshold attestation ($3/5$) enforced by smart contract
- [x] Emergency owner cancellation mechanism
- [x] ReentrancyGuard and Checks-Effects-Interactions pattern applied
- [x] Zero plaintext secrets committed to source control or blockchain
