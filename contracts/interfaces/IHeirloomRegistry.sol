// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHeirloomRegistry {
    enum RecoveryState {
        ACTIVE,
        RECOVERY_REQUESTED,
        EVIDENCE_COLLECTION,
        THRESHOLD_REACHED,
        CHALLENGE_PERIOD,
        CANCELLED,
        RELEASED
    }

    struct Asset {
        uint256 id;
        address owner;
        address beneficiary;
        bytes32 encryptedAssetHash;
        string ipfsCid;
        uint256 inactivityPeriod;
        uint256 lastHeartbeat;
        uint256 challengePeriod;
        uint256 recoveryThreshold;
        uint256 attestorCount;
        bool recoveryActive;
        bool released;
        RecoveryState state;
        uint256 recoveryInitiatedAt;
        uint256 thresholdReachedAt;
        string assetName;
        string assetType;
    }

    struct Evidence {
        address submitter;
        string evidenceUri;
        bytes32 evidenceHash;
        uint256 timestamp;
    }

    event AssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        address indexed beneficiary,
        bytes32 encryptedAssetHash,
        uint256 inactivityPeriod,
        uint256 challengePeriod,
        uint256 recoveryThreshold
    );
    event AssetUpdated(uint256 indexed assetId, string assetName, uint256 inactivityPeriod, uint256 challengePeriod);
    event HeartbeatRecorded(uint256 indexed assetId, address indexed owner, uint256 timestamp);
    event RecoveryInitiated(uint256 indexed assetId, address indexed initiator, uint256 timestamp);
    event EvidenceSubmitted(uint256 indexed assetId, address indexed submitter, string evidenceUri, bytes32 evidenceHash);
    event RecoveryApproved(uint256 indexed assetId, address indexed attestor, uint256 currentApprovals, uint256 threshold);
    event ThresholdReached(uint256 indexed assetId, uint256 timestamp);
    event ChallengePeriodStarted(uint256 indexed assetId, uint256 challengeEndTime);
    event RecoveryCancelled(uint256 indexed assetId, address indexed cancelledBy, string reason);
    event AssetReleased(uint256 indexed assetId, address indexed beneficiary, uint256 timestamp);

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
    ) external returns (uint256);

    function updateAsset(uint256 assetId, string calldata assetName, uint256 inactivityPeriod, uint256 challengePeriod) external;
    function heartbeat(uint256 assetId) external;
    function initiateRecovery(uint256 assetId) external;
    function submitEvidence(uint256 assetId, string calldata evidenceUri, bytes32 evidenceHash) external;
    function approveRecovery(uint256 assetId) external;
    function cancelRecovery(uint256 assetId) external;
    function finalizeRecovery(uint256 assetId) external;
    function getAsset(uint256 assetId) external view returns (Asset memory);
    function getRecoveryStatus(uint256 assetId) external view returns (
        RecoveryState state,
        uint256 lastHeartbeat,
        uint256 inactivityPeriod,
        uint256 challengePeriod,
        uint256 currentApprovals,
        uint256 threshold,
        uint256 challengeEndTime,
        bool isEligibleForRecovery,
        bool isEligibleForFinalization
    );
}
