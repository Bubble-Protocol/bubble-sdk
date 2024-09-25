// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ProviderMetadata.sol";
import "./IProviderPolicy.sol";

/**
 * Holds metadata about a bubble's host provider and optionally enforces the provider to be 
 * permitted by a policy.
 */
abstract contract PermittedProvider is ProviderMetadata {

    // Permitted providers list
    IProviderPolicy providerPolicy;

    /**
     * @dev Constructor that initialises the provider and policy. Will revert if the provider URL
     * is not permitted by the policy. Passing a null policy (address 0) will allow
     * any provider.
     */
    constructor(string memory _providerUrl, IProviderPolicy _policy)
    ProviderMetadata(_providerUrl) 
    {
        providerPolicy = _policy;
        require(isPermittedProvider(keccak256(abi.encodePacked(_providerUrl))), "Provider not permitted");
    }

    /**
     * @dev Returns true if the provider is permitted by the provider policy.
     */
    function isPermittedProvider(bytes32 provider) public view returns (bool) {
        if (address(providerPolicy) == address(0)) return true;
        return providerPolicy.isPermittedProvider(provider);
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
