// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ProviderMetadata.sol";

/**
 * Holds metadata about a bubble's host provider and optionally enforces the provider to be within
 * a list of permitted providers.
 */
abstract contract PermittedProvider is ProviderMetadata {

    // Permitted providers list
    bytes32[] private permittedProviders;

    /**
     * @dev Constructor that initialises the permitted providers. Will revert if the provider URL
     * is not one of the permitted providers. Passing a zero length array will allow any provider.
     */
    constructor(string memory _providerUrl, bytes32[] memory _permittedProviders)
    ProviderMetadata(_providerUrl) 
    {
        _setPermittedProviders(_permittedProviders);
    }

    /**
     * @dev Returns true if any provider is allowed.
     */
    function isAnyProviderAllowed() public view returns (bool) {
        return permittedProviders.length == 0;
    }

    /**
     * @dev Returns true if the provider is permitted.
     */
    function isPermittedProvider(bytes32 provider) public view returns (bool) {
        if (isAnyProviderAllowed()) return true;
        for (uint i = 0; i < permittedProviders.length; i++) {
            if (permittedProviders[i] == provider) {
                return true;
            }
        }
    }

    /**
     * @dev Call this from the inheriting contract to update the permitted providers. Will revert
     * if the current provider is not one of the permitted providers. Passing a zero length array
     * will allow any provider.
     */
    function _setPermittedProviders(bytes32[] memory _permittedProviders) internal {
        permittedProviders = _permittedProviders;
        _setProviderUrl(getProviderUrl());
    }

    /**
     * @dev Call this from the inheriting contract to update the provider URL. Will revert if the
     * provider is not one of the permitted providers.
     */
    function _setProviderUrl(string memory _providerUrl) internal override {
        require(isPermittedProvider(keccak256(abi.encodePacked(_providerUrl))), "Provider not permitted");
        super._setProviderUrl(_providerUrl);
    }

}
