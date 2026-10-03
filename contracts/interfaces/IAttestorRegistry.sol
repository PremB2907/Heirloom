// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAttestorRegistry {
    event AttestorRegistered(address indexed assetOwner, address indexed attestor, string metadata);
    event AttestorRemoved(address indexed assetOwner, address indexed attestor);

    function registerAttestor(address assetOwner, address attestor, string calldata metadata) external;
    function removeAttestor(address assetOwner, address attestor) external;
    function isAttestor(address assetOwner, address attestor) external view returns (bool);
    function getAttestors(address assetOwner) external view returns (address[] memory);
}
