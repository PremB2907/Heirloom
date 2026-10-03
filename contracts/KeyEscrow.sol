// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KeyEscrow
 * @dev Manages cryptographic commitments for off-chain encryption key fragments (Shamir Secret Shares).
 * CRITICAL SECURITY REQUIREMENT: DO NOT store plaintext secrets or key fragments on-chain.
 * Only cryptographic commitments (keccak256 hashes) are stored on-chain.
 */
contract KeyEscrow {
    struct EscrowRecord {
        uint256 assetId;
        bytes32 keyCommitment;       // keccak256 hash of the full AES encryption key
        bytes32[] fragmentCommitments; // keccak256 hashes of individual secret shares
        address[] attestors;           // Authorized attestors corresponding to key fragments
        bool isReleased;               // Flag indicating if recovery threshold was met & released
        uint256 registeredAt;
    }

    // Asset ID => EscrowRecord
    mapping(uint256 => EscrowRecord) private _escrows;
    // Asset ID => Attestor address => fragment commitment index + 1 (1-based index)
    mapping(uint256 => mapping(address => uint256)) private _attestorFragmentIndex;
    // Authorized HeirloomRegistry contract address
    address public immutable registryContract;

    event EscrowRegistered(
        uint256 indexed assetId,
        bytes32 keyCommitment,
        uint256 totalFragments,
        address[] attestors
    );
    event EscrowReleased(uint256 indexed assetId, uint256 timestamp);

    modifier onlyRegistry() {
        require(msg.sender == registryContract, "KeyEscrow: Only registry can execute");
        _;
    }

    constructor(address _registryContract) {
        require(_registryContract != address(0), "KeyEscrow: Invalid registry address");
        registryContract = _registryContract;
    }

    /**
     * @notice Registers key commitments for an asset.
     */
    function registerEscrow(
        uint256 assetId,
        bytes32 keyCommitment,
        bytes32[] calldata fragmentCommitments,
        address[] calldata attestors
    ) external onlyRegistry {
        require(keyCommitment != bytes32(0), "KeyEscrow: Invalid key commitment");
        require(fragmentCommitments.length > 0, "KeyEscrow: Empty fragments");
        require(fragmentCommitments.length == attestors.length, "KeyEscrow: Mismatched length");
        require(_escrows[assetId].registeredAt == 0, "KeyEscrow: Escrow already exists");

        EscrowRecord storage record = _escrows[assetId];
        record.assetId = assetId;
        record.keyCommitment = keyCommitment;
        record.fragmentCommitments = fragmentCommitments;
        record.attestors = attestors;
        record.isReleased = false;
        record.registeredAt = block.timestamp;

        for (uint256 i = 0; i < attestors.length; i++) {
            require(attestors[i] != address(0), "KeyEscrow: Invalid attestor address");
            _attestorFragmentIndex[assetId][attestors[i]] = i + 1;
        }

        emit EscrowRegistered(assetId, keyCommitment, fragmentCommitments.length, attestors);
    }

    /**
     * @notice Marks escrow as released when protocol finalizes recovery.
     */
    function releaseEscrow(uint256 assetId) external onlyRegistry {
        require(_escrows[assetId].registeredAt > 0, "KeyEscrow: Escrow not found");
        require(!_escrows[assetId].isReleased, "KeyEscrow: Already released");

        _escrows[assetId].isReleased = true;
        emit EscrowReleased(assetId, block.timestamp);
    }

    /**
     * @notice Verifies a provided fragment against its stored commitment for a given attestor.
     */
    function verifyFragment(
        uint256 assetId,
        address attestor,
        bytes calldata fragment
    ) external view returns (bool) {
        uint256 indexPlusOne = _attestorFragmentIndex[assetId][attestor];
        if (indexPlusOne == 0) return false;

        bytes32 commitment = _escrows[assetId].fragmentCommitments[indexPlusOne - 1];
        return keccak256(fragment) == commitment;
    }

    /**
     * @notice Verifies a reconstructed master key against the key commitment.
     */
    function verifyMasterKey(uint256 assetId, bytes calldata masterKey) external view returns (bool) {
        if (_escrows[assetId].registeredAt == 0) return false;
        return keccak256(masterKey) == _escrows[assetId].keyCommitment;
    }

    /**
     * @notice Gets escrow commitments for an asset.
     */
    function getEscrow(uint256 assetId)
        external
        view
        returns (
            bytes32 keyCommitment,
            bytes32[] memory fragmentCommitments,
            address[] memory attestors,
            bool isReleased
        )
    {
        EscrowRecord storage record = _escrows[assetId];
        require(record.registeredAt > 0, "KeyEscrow: Escrow does not exist");
        return (record.keyCommitment, record.fragmentCommitments, record.attestors, record.isReleased);
    }

    function isEscrowRegistered(uint256 assetId) external view returns (bool) {
        return _escrows[assetId].registeredAt > 0;
    }
}
