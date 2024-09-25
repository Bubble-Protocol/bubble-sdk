// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ProviderMetadata.sol";
import "./IProviderList.sol";

/**
 * Holds metadata about a bubble's host provider and optionally enforces the provider to be within
 * a list of permitted providers.
 */
abstract contract PermittedProvider is ProviderMetadata {

    // Permitted providers list
    IProviderList permittedProviders;

    /**
     * @dev Constructor that initialises the permitted providers. Will revert if the provider URL
     * is not one of the permitted providers. Passing a null provider list (address 0) will allow
     * any provider.
     */
    constructor(string memory _providerUrl, IProviderList _permittedProviders)
    ProviderMetadata(_providerUrl) 
    {
        permittedProviders = _permittedProviders;
        require(isPermittedProvider(keccak256(abi.encodePacked(_providerUrl))), "Provider not permitted");
    }

    /**
     * @dev Returns true if the provider is permitted.
     */
    function isPermittedProvider(bytes32 provider) public view returns (bool) {
        if (address(permittedProviders) == address(0)) return true;
        return permittedProviders.contains(provider);
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
