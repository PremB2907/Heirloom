// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAttestorRegistry.sol";

/**
 * @title AttestorRegistry
 * @dev Manages independent recovery attestors per asset owner / asset context.
 * Enforces that no single attestor can unilaterally release an asset.
 */
contract AttestorRegistry is IAttestorRegistry {
    // Owner => list of attestors
    mapping(address => address[]) private _ownerAttestors;
    // Owner => Attestor => isRegistered
    mapping(address => mapping(address => bool)) private _isAttestorMap;
    // Owner => Attestor => metadata string
    mapping(address => mapping(address => string)) public attestorMetadata;

    modifier onlySelfOrOwner(address assetOwner) {
        require(msg.sender == assetOwner || msg.sender == address(this), "AttestorRegistry: Unauthorized");
        _;
    }

    /**
     * @notice Registers a new attestor for a given asset owner.
     */
    function registerAttestor(address assetOwner, address attestor, string calldata metadata) external override {
        require(attestor != address(0), "AttestorRegistry: Invalid address");
        require(!_isAttestorMap[assetOwner][attestor], "AttestorRegistry: Already registered");
        require(attestor != assetOwner, "AttestorRegistry: Owner cannot be attestor");

        _isAttestorMap[assetOwner][attestor] = true;
        _ownerAttestors[assetOwner].push(attestor);
        attestorMetadata[assetOwner][attestor] = metadata;

        emit AttestorRegistered(assetOwner, attestor, metadata);
    }

    /**
     * @notice Removes an attestor for an asset owner.
     */
    function removeAttestor(address assetOwner, address attestor) external override {
        require(msg.sender == assetOwner, "AttestorRegistry: Only owner can remove");
        require(_isAttestorMap[assetOwner][attestor], "AttestorRegistry: Not an attestor");

        _isAttestorMap[assetOwner][attestor] = false;

        address[] storage list = _ownerAttestors[assetOwner];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == attestor) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        emit AttestorRemoved(assetOwner, attestor);
    }

    /**
     * @notice Checks if an address is a registered attestor for an owner.
     */
    function isAttestor(address assetOwner, address attestor) external view override returns (bool) {
        return _isAttestorMap[assetOwner][attestor];
    }

    /**
     * @notice Returns all registered attestors for an owner.
     */
    function getAttestors(address assetOwner) external view override returns (address[] memory) {
        return _ownerAttestors[assetOwner];
    }
}
