// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IHeirloomRegistry.sol";
import "./interfaces/IAttestorRegistry.sol";
import "./KeyEscrow.sol";

/**
 * @title HeirloomRegistry
 * @dev Core protocol contract managing digital asset inheritance lifecycle, heartbeat,
 * unavailability detection, threshold attestation, challenge period, and emergency cancellation.
 */
contract HeirloomRegistry is IHeirloomRegistry, ReentrancyGuard, Ownable {
    uint256 private _nextAssetId;

    // Asset ID => Asset struct
    mapping(uint256 => Asset) private _assets;
    // Asset ID => Evidence list
    mapping(uint256 => Evidence[]) private _assetEvidences;
    // Asset ID => Attestor address => Has attested
    mapping(uint256 => mapping(address => bool)) private _hasAttested;
    // Asset ID => Attestor list assigned to this asset
    mapping(uint256 => address[]) private _assetAttestors;
    // Asset ID => Current approval count
    mapping(uint256 => uint256) private _approvalCount;
    // Owner address => list of asset IDs
    mapping(address => uint256[]) private _ownerAssets;
    // Beneficiary address => list of asset IDs
    mapping(address => uint256[]) private _beneficiaryAssets;

    IAttestorRegistry public attestorRegistry;
    KeyEscrow public keyEscrow;

    modifier onlyAssetOwner(uint256 assetId) {
        require(_assets[assetId].owner == msg.sender, "HeirloomRegistry: Only asset owner");
        _;
    }

    modifier assetExists(uint256 assetId) {
        require(_assets[assetId].id == assetId && _assets[assetId].owner != address(0), "HeirloomRegistry: Asset does not exist");
        _;
    }

    constructor(address _attestorRegistry) Ownable(msg.sender) {
        require(_attestorRegistry != address(0), "HeirloomRegistry: Invalid attestor registry");
        attestorRegistry = IAttestorRegistry(_attestorRegistry);
    }

    /**
     * @notice Links KeyEscrow contract (called after deployment of KeyEscrow).
     */
    function setKeyEscrow(address _keyEscrow) external onlyOwner {
        require(_keyEscrow != address(0), "HeirloomRegistry: Invalid key escrow");
        require(address(keyEscrow) == address(0), "HeirloomRegistry: KeyEscrow already set");
        keyEscrow = KeyEscrow(_keyEscrow);
    }

    /**
     * @notice Register a new digital inheritance asset.
     */
    function registerAsset(
        address beneficiary,
        bytes32 encryptedAssetHash,
        string calldata ipfsCid,
        uint256 inactivityPeriod,
        uint256 challengePeriod,
        uint256 recoveryThreshold,
        address[] calldata attestors,
        bytes32 keyCommitment,
        bytes32[] calldata fragmentCommitments,
        string calldata assetName,
        string calldata assetType
    ) external override returns (uint256) {
        require(beneficiary != address(0), "HeirloomRegistry: Invalid beneficiary");
        require(beneficiary != msg.sender, "HeirloomRegistry: Beneficiary cannot be owner");
        require(inactivityPeriod >= 10 seconds, "HeirloomRegistry: Inactivity period too short");
        require(challengePeriod >= 5 seconds, "HeirloomRegistry: Challenge period too short");
        require(attestors.length > 0, "HeirloomRegistry: At least one attestor required");
        require(recoveryThreshold > 0 && recoveryThreshold <= attestors.length, "HeirloomRegistry: Invalid threshold");

        _nextAssetId++;
        uint256 assetId = _nextAssetId;

        Asset storage asset = _assets[assetId];
        asset.id = assetId;
        asset.owner = msg.sender;
        asset.beneficiary = beneficiary;
        asset.encryptedAssetHash = encryptedAssetHash;
        asset.ipfsCid = ipfsCid;
        asset.inactivityPeriod = inactivityPeriod;
        asset.lastHeartbeat = block.timestamp;
        asset.challengePeriod = challengePeriod;
        asset.recoveryThreshold = recoveryThreshold;
        asset.attestorCount = attestors.length;
        asset.recoveryActive = false;
        asset.released = false;
        asset.state = RecoveryState.ACTIVE;
        asset.assetName = assetName;
        asset.assetType = assetType;

        _ownerAssets[msg.sender].push(assetId);
        _beneficiaryAssets[beneficiary].push(assetId);

        // Register attestors in AttestorRegistry and asset list
        for (uint256 i = 0; i < attestors.length; i++) {
            address attestor = attestors[i];
            require(attestor != address(0), "HeirloomRegistry: Invalid attestor address");
            require(attestor != msg.sender, "HeirloomRegistry: Owner cannot be attestor");
            require(attestor != beneficiary, "HeirloomRegistry: Beneficiary cannot be attestor");
            
            if (!attestorRegistry.isAttestor(msg.sender, attestor)) {
                attestorRegistry.registerAttestor(msg.sender, attestor, "Assigned Attestor");
            }
            _assetAttestors[assetId].push(attestor);
        }

        // Register key escrow commitments
        if (address(keyEscrow) != address(0)) {
            keyEscrow.registerEscrow(assetId, keyCommitment, fragmentCommitments, attestors);
        }

        emit AssetRegistered(
            assetId,
            msg.sender,
            beneficiary,
            encryptedAssetHash,
            inactivityPeriod,
            challengePeriod,
            recoveryThreshold
        );

        return assetId;
    }

    /**
     * @notice Update asset metadata and configuration while asset is ACTIVE.
     */
    function updateAsset(
        uint256 assetId,
        string calldata assetName,
        uint256 inactivityPeriod,
        uint256 challengePeriod
    ) external override assetExists(assetId) onlyAssetOwner(assetId) {
        Asset storage asset = _assets[assetId];
        require(asset.state == RecoveryState.ACTIVE, "HeirloomRegistry: Cannot update inactive asset");
        require(inactivityPeriod >= 10 seconds, "HeirloomRegistry: Inactivity period too short");
        require(challengePeriod >= 5 seconds, "HeirloomRegistry: Challenge period too short");

        asset.assetName = assetName;
        asset.inactivityPeriod = inactivityPeriod;
        asset.challengePeriod = challengePeriod;

        emit AssetUpdated(assetId, assetName, inactivityPeriod, challengePeriod);
    }

    /**
     * @notice Prove owner liveness and reset heartbeat timestamp.
     * If recovery was initiated or in progress, calling heartbeat cancels recovery and restores ACTIVE state.
     */
    function heartbeat(uint256 assetId) external override assetExists(assetId) onlyAssetOwner(assetId) {
        Asset storage asset = _assets[assetId];
        require(!asset.released, "HeirloomRegistry: Asset already released");

        asset.lastHeartbeat = block.timestamp;

        // If recovery was pending or in challenge period, owner heartbeat cancels recovery
        if (asset.state != RecoveryState.ACTIVE) {
            asset.state = RecoveryState.ACTIVE;
            asset.recoveryActive = false;
            _approvalCount[assetId] = 0;
            
            // Reset attestations
            address[] storage attestors = _assetAttestors[assetId];
            for (uint256 i = 0; i < attestors.length; i++) {
                _hasAttested[assetId][attestors[i]] = false;
            }

            emit RecoveryCancelled(assetId, msg.sender, "Owner Heartbeat Intervention");
        }

        emit HeartbeatRecorded(assetId, msg.sender, block.timestamp);
    }

    /**
     * @notice Initiate recovery process after owner inactivity period has elapsed.
     */
    function initiateRecovery(uint256 assetId) external override assetExists(assetId) {
        Asset storage asset = _assets[assetId];
        require(asset.state == RecoveryState.ACTIVE, "HeirloomRegistry: Recovery already initiated or completed");
        require(block.timestamp >= asset.lastHeartbeat + asset.inactivityPeriod, "HeirloomRegistry: Owner is still active");
        require(msg.sender == asset.beneficiary || msg.sender == owner() || _isAssignedAttestor(assetId, msg.sender), "HeirloomRegistry: Unauthorized recovery initiator");

        asset.state = RecoveryState.RECOVERY_REQUESTED;
        asset.recoveryActive = true;
        asset.recoveryInitiatedAt = block.timestamp;

        emit RecoveryInitiated(assetId, msg.sender, block.timestamp);
    }

    /**
     * @notice Submit off-chain evidence supporting recovery.
     */
    function submitEvidence(
        uint256 assetId,
        string calldata evidenceUri,
        bytes32 evidenceHash
    ) external override assetExists(assetId) {
        Asset storage asset = _assets[assetId];
        require(asset.recoveryActive && !asset.released, "HeirloomRegistry: Recovery not active");
        require(asset.state == RecoveryState.RECOVERY_REQUESTED || asset.state == RecoveryState.EVIDENCE_COLLECTION, "HeirloomRegistry: Invalid state for evidence");

        _assetEvidences[assetId].push(Evidence({
            submitter: msg.sender,
            evidenceUri: evidenceUri,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp
        }));

        if (asset.state == RecoveryState.RECOVERY_REQUESTED) {
            asset.state = RecoveryState.EVIDENCE_COLLECTION;
        }

        emit EvidenceSubmitted(assetId, msg.sender, evidenceUri, evidenceHash);
    }

    /**
     * @notice Approve asset recovery by an independent authorized attestor.
     */
    function approveRecovery(uint256 assetId) external override assetExists(assetId) nonReentrant {
        Asset storage asset = _assets[assetId];
        require(asset.recoveryActive && !asset.released, "HeirloomRegistry: Recovery not active");
        require(asset.state == RecoveryState.RECOVERY_REQUESTED || asset.state == RecoveryState.EVIDENCE_COLLECTION, "HeirloomRegistry: Invalid recovery state");
        require(_isAssignedAttestor(assetId, msg.sender), "HeirloomRegistry: Not an authorized attestor");
        require(!_hasAttested[assetId][msg.sender], "HeirloomRegistry: Already approved by this attestor");

        _hasAttested[assetId][msg.sender] = true;
        _approvalCount[assetId]++;

        emit RecoveryApproved(assetId, msg.sender, _approvalCount[assetId], asset.recoveryThreshold);

        // Check if threshold reached
        if (_approvalCount[assetId] >= asset.recoveryThreshold) {
            asset.state = RecoveryState.CHALLENGE_PERIOD;
            asset.thresholdReachedAt = block.timestamp;

            emit ThresholdReached(assetId, block.timestamp);
            emit ChallengePeriodStarted(assetId, block.timestamp + asset.challengePeriod);
        }
    }

    /**
     * @notice Emergency cancellation of recovery process by owner before final release.
     */
    function cancelRecovery(uint256 assetId) external override assetExists(assetId) onlyAssetOwner(assetId) {
        Asset storage asset = _assets[assetId];
        require(asset.recoveryActive && !asset.released, "HeirloomRegistry: No active recovery to cancel");

        asset.state = RecoveryState.CANCELLED;
        asset.recoveryActive = false;
        asset.lastHeartbeat = block.timestamp;
        _approvalCount[assetId] = 0;

        // Reset attestations
        address[] storage attestors = _assetAttestors[assetId];
        for (uint256 i = 0; i < attestors.length; i++) {
            _hasAttested[assetId][attestors[i]] = false;
        }

        // Return asset state back to ACTIVE for future protection
        asset.state = RecoveryState.ACTIVE;

        emit RecoveryCancelled(assetId, msg.sender, "Emergency Owner Cancellation");
    }

    /**
     * @notice Finalize asset recovery after challenge period has expired.
     */
    function finalizeRecovery(uint256 assetId) external override assetExists(assetId) nonReentrant {
        Asset storage asset = _assets[assetId];
        require(asset.state == RecoveryState.CHALLENGE_PERIOD, "HeirloomRegistry: Not in challenge period");
        require(block.timestamp >= asset.thresholdReachedAt + asset.challengePeriod, "HeirloomRegistry: Challenge period not elapsed");
        require(!asset.released, "HeirloomRegistry: Asset already released");

        asset.state = RecoveryState.RELEASED;
        asset.released = true;
        asset.recoveryActive = false;

        // Trigger KeyEscrow release status
        if (address(keyEscrow) != address(0)) {
            keyEscrow.releaseEscrow(assetId);
        }

        emit AssetReleased(assetId, asset.beneficiary, block.timestamp);
    }

    /**
     * @notice Gets asset details.
     */
    function getAsset(uint256 assetId) external view override assetExists(assetId) returns (Asset memory) {
        return _assets[assetId];
    }

    /**
     * @notice Returns comprehensive recovery status for an asset.
     */
    function getRecoveryStatus(uint256 assetId)
        external
        view
        override
        assetExists(assetId)
        returns (
            RecoveryState state,
            uint256 lastHeartbeat,
            uint256 inactivityPeriod,
            uint256 challengePeriod,
            uint256 currentApprovals,
            uint256 threshold,
            uint256 challengeEndTime,
            bool isEligibleForRecovery,
            bool isEligibleForFinalization
        )
    {
        Asset storage asset = _assets[assetId];
        bool eligibleRec = block.timestamp >= asset.lastHeartbeat + asset.inactivityPeriod && asset.state == RecoveryState.ACTIVE;
        uint256 challengeEnd = asset.thresholdReachedAt > 0 ? asset.thresholdReachedAt + asset.challengePeriod : 0;
        bool eligibleFin = asset.state == RecoveryState.CHALLENGE_PERIOD && block.timestamp >= challengeEnd;

        return (
            asset.state,
            asset.lastHeartbeat,
            asset.inactivityPeriod,
            asset.challengePeriod,
            _approvalCount[assetId],
            asset.recoveryThreshold,
            challengeEnd,
            eligibleRec,
            eligibleFin
        );
    }

    /**
     * @notice Returns assigned attestors for an asset.
     */
    function getAssetAttestors(uint256 assetId) external view assetExists(assetId) returns (address[] memory) {
        return _assetAttestors[assetId];
    }

    /**
     * @notice Checks if an address has approved recovery for an asset.
     */
    function hasAttested(uint256 assetId, address attestor) external view assetExists(assetId) returns (bool) {
        return _hasAttested[assetId][attestor];
    }

    /**
     * @notice Returns evidences submitted for an asset.
     */
    function getAssetEvidences(uint256 assetId) external view assetExists(assetId) returns (Evidence[] memory) {
        return _assetEvidences[assetId];
    }

    /**
     * @notice Returns asset IDs owned by address.
     */
    function getOwnerAssets(address ownerAddr) external view returns (uint256[] memory) {
        return _ownerAssets[ownerAddr];
    }

    /**
     * @notice Returns asset IDs where address is beneficiary.
     */
    function getBeneficiaryAssets(address beneficiaryAddr) external view returns (uint256[] memory) {
        return _beneficiaryAssets[beneficiaryAddr];
    }

    /**
     * @notice Total registered assets.
     */
    function totalAssets() external view returns (uint256) {
        return _nextAssetId;
    }

    function _isAssignedAttestor(uint256 assetId, address addr) internal view returns (bool) {
        address[] storage attestors = _assetAttestors[assetId];
        for (uint256 i = 0; i < attestors.length; i++) {
            if (attestors[i] == addr) return true;
        }
        return false;
    }
}
