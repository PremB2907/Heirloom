import { expect } from "chai";
import { ethers } from "hardhat";
import { HeirloomRegistry, AttestorRegistry, KeyEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Heirloom Protocol Test Suite", function () {
  let heirloomRegistry: HeirloomRegistry;
  let attestorRegistry: AttestorRegistry;
  let keyEscrow: KeyEscrow;

  let owner: HardhatEthersSigner;
  let beneficiary1: HardhatEthersSigner;
  let beneficiary2: HardhatEthersSigner;
  let attestor1: HardhatEthersSigner;
  let attestor2: HardhatEthersSigner;
  let attestor3: HardhatEthersSigner;
  let attestor4: HardhatEthersSigner;
  let attestor5: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const sampleKeyHash = ethers.keccak256(ethers.toUtf8Bytes("demo-master-key"));
  const frag1 = ethers.keccak256(ethers.toUtf8Bytes("frag-1"));
  const frag2 = ethers.keccak256(ethers.toUtf8Bytes("frag-2"));
  const frag3 = ethers.keccak256(ethers.toUtf8Bytes("frag-3"));
  const frag4 = ethers.keccak256(ethers.toUtf8Bytes("frag-4"));
  const frag5 = ethers.keccak256(ethers.toUtf8Bytes("frag-5"));

  const sampleFragments = [frag1, frag2, frag3, frag4, frag5];

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    beneficiary1 = signers[1];
    beneficiary2 = signers[2];
    attestor1 = signers[3];
    attestor2 = signers[4];
    attestor3 = signers[5];
    attestor4 = signers[6];
    attestor5 = signers[7];
    stranger = signers[8];

    // Deploy AttestorRegistry
    const AttestorRegistryFactory = await ethers.getContractFactory("AttestorRegistry");
    attestorRegistry = (await AttestorRegistryFactory.deploy()) as AttestorRegistry;

    // Deploy HeirloomRegistry
    const HeirloomRegistryFactory = await ethers.getContractFactory("HeirloomRegistry");
    heirloomRegistry = (await HeirloomRegistryFactory.deploy(await attestorRegistry.getAddress())) as HeirloomRegistry;

    // Deploy KeyEscrow
    const KeyEscrowFactory = await ethers.getContractFactory("KeyEscrow");
    keyEscrow = (await KeyEscrowFactory.deploy(await heirloomRegistry.getAddress())) as KeyEscrow;

    // Link KeyEscrow
    await heirloomRegistry.setKeyEscrow(await keyEscrow.getAddress());
  });

  const attestorsList = () => [
    attestor1.address,
    attestor2.address,
    attestor3.address,
    attestor4.address,
    attestor5.address,
  ];

  async function createDefaultAsset(inactivity = 60, challenge = 30, threshold = 3) {
    const tx = await heirloomRegistry.connect(owner).registerAsset(
      beneficiary1.address,
      ethers.keccak256(ethers.toUtf8Bytes("ipfs-encrypted-content")),
      "ipfs://QmTestCid123",
      inactivity,
      challenge,
      threshold,
      attestorsList(),
      sampleKeyHash,
      sampleFragments,
      "Family Vault",
      "Encrypted Credentials"
    );
    await tx.wait();
    return 1; // Asset ID 1
  }

  // 1. Asset registration
  it("1. Should successfully register an asset with commitments and attestors", async function () {
    const assetId = await createDefaultAsset();
    expect(assetId).to.equal(1);

    const asset = await heirloomRegistry.getAsset(1);
    expect(asset.owner).to.equal(owner.address);
    expect(asset.beneficiary).to.equal(beneficiary1.address);
    expect(asset.recoveryThreshold).to.equal(3);
    expect(asset.attestorCount).to.equal(5);
    expect(asset.state).to.equal(0); // ACTIVE
  });

  // 2. Owner heartbeat
  it("2. Should update lastHeartbeat when owner triggers heartbeat", async function () {
    const assetId = await createDefaultAsset();
    const initialAsset = await heirloomRegistry.getAsset(assetId);
    
    // Fast forward time slightly
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine", []);

    await heirloomRegistry.connect(owner).heartbeat(assetId);
    const updatedAsset = await heirloomRegistry.getAsset(assetId);

    expect(updatedAsset.lastHeartbeat).to.be.gt(initialAsset.lastHeartbeat);
  });

  // 3. Cannot recover before inactivity period
  it("3. Should revert recovery initiation if owner is still active (before inactivity period)", async function () {
    const assetId = await createDefaultAsset(100, 30, 3);
    await expect(
      heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Owner is still active");
  });

  // 4. Recovery initiation
  it("4. Should allow beneficiary to initiate recovery after inactivity period", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);

    // Fast forward 61 seconds
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);

    await expect(heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId))
      .to.emit(heirloomRegistry, "RecoveryInitiated");

    const asset = await heirloomRegistry.getAsset(assetId);
    expect(asset.state).to.equal(1); // RECOVERY_REQUESTED
    expect(asset.recoveryActive).to.be.true;
  });

  // 5. Evidence submission
  it("5. Should allow submitting evidence during recovery", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("death-certificate-doc"));
    await expect(
      heirloomRegistry.connect(beneficiary1).submitEvidence(assetId, "ipfs://QmEvidenceDoc", evidenceHash)
    ).to.emit(heirloomRegistry, "EvidenceSubmitted");

    const asset = await heirloomRegistry.getAsset(assetId);
    expect(asset.state).to.equal(2); // EVIDENCE_COLLECTION

    const evidences = await heirloomRegistry.getAssetEvidences(assetId);
    expect(evidences.length).to.equal(1);
    expect(evidences[0].evidenceHash).to.equal(evidenceHash);
  });

  // 6. Attestor approval
  it("6. Should record attestor approvals correctly", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await expect(heirloomRegistry.connect(attestor1).approveRecovery(assetId))
      .to.emit(heirloomRegistry, "RecoveryApproved")
      .withArgs(assetId, attestor1.address, 1, 3);

    expect(await heirloomRegistry.hasAttested(assetId, attestor1.address)).to.be.true;
  });

  // 7. Duplicate approval rejected
  it("7. Should revert if an attestor attempts to approve twice", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await expect(
      heirloomRegistry.connect(attestor1).approveRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Already approved by this attestor");
  });

  // 8. Threshold calculation & Challenge period transition
  it("8. Should transition to CHALLENGE_PERIOD when threshold is reached", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor2).approveRecovery(assetId);

    await expect(heirloomRegistry.connect(attestor3).approveRecovery(assetId))
      .to.emit(heirloomRegistry, "ThresholdReached")
      .and.to.emit(heirloomRegistry, "ChallengePeriodStarted");

    const asset = await heirloomRegistry.getAsset(assetId);
    expect(asset.state).to.equal(4); // CHALLENGE_PERIOD
  });

  // 9. Recovery cannot finalize before threshold
  it("9. Should revert finalization if threshold is not reached", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);

    await expect(
      heirloomRegistry.connect(beneficiary1).finalizeRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Not in challenge period");
  });

  // 10. Challenge period enforcement
  it("10. Should revert finalization if challenge period has not elapsed", async function () {
    const assetId = await createDefaultAsset(60, 30, 3); // 30s challenge
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor2).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor3).approveRecovery(assetId);

    // Fast forward only 10 seconds into 30s challenge period
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      heirloomRegistry.connect(beneficiary1).finalizeRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Challenge period not elapsed");
  });

  // 11. Owner emergency cancellation
  it("11. Should allow owner to cancel recovery during challenge period", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor2).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor3).approveRecovery(assetId);

    // Owner intervenes and cancels
    await expect(heirloomRegistry.connect(owner).cancelRecovery(assetId))
      .to.emit(heirloomRegistry, "RecoveryCancelled");

    const asset = await heirloomRegistry.getAsset(assetId);
    expect(asset.state).to.equal(0); // Restored to ACTIVE
    expect(asset.recoveryActive).to.be.false;
  });

  // 12. Final release
  it("12. Should finalize recovery and release asset after challenge period expires", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor2).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor3).approveRecovery(assetId);

    // Fast forward past challenge period (31s)
    await ethers.provider.send("evm_increaseTime", [31]);
    await ethers.provider.send("evm_mine", []);

    await expect(heirloomRegistry.connect(beneficiary1).finalizeRecovery(assetId))
      .to.emit(heirloomRegistry, "AssetReleased");

    const asset = await heirloomRegistry.getAsset(assetId);
    expect(asset.state).to.equal(6); // RELEASED
    expect(asset.released).to.be.true;

    // Verify KeyEscrow is marked as released
    const escrow = await keyEscrow.getEscrow(assetId);
    expect(escrow.isReleased).to.be.true;
  });

  // 13. Double release rejected
  it("13. Should revert if trying to finalize an already released asset", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);
    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor2).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor3).approveRecovery(assetId);

    await ethers.provider.send("evm_increaseTime", [31]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).finalizeRecovery(assetId);

    await expect(
      heirloomRegistry.connect(beneficiary1).finalizeRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Not in challenge period");
  });

  // 14. Unauthorized cancellation rejected
  it("14. Should revert cancellation if requested by non-owner", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await expect(
      heirloomRegistry.connect(stranger).cancelRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Only asset owner");
  });

  // 15. Unregistered attestor rejected
  it("15. Should revert approval from an unassigned attestor", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    await expect(
      heirloomRegistry.connect(stranger).approveRecovery(assetId)
    ).to.be.revertedWith("HeirloomRegistry: Not an authorized attestor");
  });

  // 16. Missing attestor does not break threshold recovery
  it("16. Should successfully finalize recovery even if 2 out of 5 attestors are unresponsive", async function () {
    const assetId = await createDefaultAsset(60, 30, 3); // 3 of 5 threshold
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId);

    // Attestors 1, 2, 3 approve. Attestors 4 and 5 are offline / unresponsive.
    await heirloomRegistry.connect(attestor1).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor2).approveRecovery(assetId);
    await heirloomRegistry.connect(attestor3).approveRecovery(assetId);

    await ethers.provider.send("evm_increaseTime", [31]);
    await ethers.provider.send("evm_mine", []);

    await heirloomRegistry.connect(beneficiary1).finalizeRecovery(assetId);
    const asset = await heirloomRegistry.getAsset(assetId);
    expect(asset.released).to.be.true;
  });

  // 17. Multiple assets
  it("17. Should manage multiple assets for an owner independently", async function () {
    await createDefaultAsset(); // Asset 1
    const tx = await heirloomRegistry.connect(owner).registerAsset(
      beneficiary2.address,
      ethers.keccak256(ethers.toUtf8Bytes("ipfs-2")),
      "ipfs://Qm222",
      120,
      40,
      2,
      [attestor1.address, attestor2.address],
      sampleKeyHash,
      [frag1, frag2],
      "Crypto Keys",
      "Seed Phrase"
    );
    await tx.wait();

    const ownerAssets = await heirloomRegistry.getOwnerAssets(owner.address);
    expect(ownerAssets.length).to.equal(2);
    expect(ownerAssets[0]).to.equal(1);
    expect(ownerAssets[1]).to.equal(2);
  });

  // 18. Multiple beneficiaries
  it("18. Should isolate assets across different beneficiaries", async function () {
    await createDefaultAsset(); // Asset 1 -> beneficiary1
    await heirloomRegistry.connect(owner).registerAsset(
      beneficiary2.address,
      ethers.keccak256(ethers.toUtf8Bytes("ipfs-2")),
      "ipfs://Qm222",
      120,
      40,
      2,
      [attestor1.address, attestor2.address],
      sampleKeyHash,
      [frag1, frag2],
      "Crypto Keys",
      "Seed Phrase"
    );

    const b1Assets = await heirloomRegistry.getBeneficiaryAssets(beneficiary1.address);
    const b2Assets = await heirloomRegistry.getBeneficiaryAssets(beneficiary2.address);

    expect(b1Assets.length).to.equal(1);
    expect(b1Assets[0]).to.equal(1);

    expect(b2Assets.length).to.equal(1);
    expect(b2Assets[0]).to.equal(2);
  });

  // 19. Event emission check
  it("19. Should emit appropriate events for all lifecycle actions", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);
    
    // Heartbeat event
    await expect(heirloomRegistry.connect(owner).heartbeat(assetId))
      .to.emit(heirloomRegistry, "HeartbeatRecorded");

    // Initiate recovery event
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    await expect(heirloomRegistry.connect(beneficiary1).initiateRecovery(assetId))
      .to.emit(heirloomRegistry, "RecoveryInitiated");

    // Evidence event
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
    await expect(heirloomRegistry.connect(beneficiary1).submitEvidence(assetId, "ipfs://evidence", evidenceHash))
      .to.emit(heirloomRegistry, "EvidenceSubmitted");
  });

  // 20. Access control violations
  it("20. Should reject unauthorized calls to update asset or set key escrow", async function () {
    const assetId = await createDefaultAsset(60, 30, 3);

    // Stranger cannot update asset
    await expect(
      heirloomRegistry.connect(stranger).updateAsset(assetId, "Hacked Name", 60, 30)
    ).to.be.revertedWith("HeirloomRegistry: Only asset owner");

    // Stranger cannot relink key escrow
    await expect(
      heirloomRegistry.connect(stranger).setKeyEscrow(keyEscrow.target)
    ).to.be.revertedWithCustomError(heirloomRegistry, "OwnableUnauthorizedAccount");
  });
});
