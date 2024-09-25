// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * Holds metadata about a bubble's host provider, in this case the URL of the provider.
 */
abstract contract ProviderMetadata {

    /**
     * @dev The URL of the provider.
     */
    string private providerUrl;

    /**
     * @dev Constructor that initialises the provider URL.
     */
    constructor(string memory _providerUrl) {
        providerUrl = _providerUrl;
    }

    /**
     * @dev Retrieve the provider URL.
     */
    function getProviderUrl() public view returns (string memory) {
        return providerUrl;
    }

    /**
     * @dev Call this from the inheriting contract to update the provider URL.
     */
    function _setProviderUrl(string memory _providerUrl) internal virtual {
        providerUrl = _providerUrl;
    }

}
