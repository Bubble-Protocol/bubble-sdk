// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IConsentPolicy.sol";

/**
 * Contract to manage user consent. Stores up to 256 consent flags, and an optional consent policy
 * for validating user consent. Application layer is responsible for what those flags represent 
 * and for informing the user.
 */
abstract contract ConsentManagement {

    // Consent bitfield
    bytes32 private consent;

    // Mandatory consent bits
    IConsentPolicy private consentPolicy;

    /**
     * @dev Constructor that initialises the user consent and optional consent policy.
     * Will revert if user consent is invalid against the requirements of the policy.
     * Setting a null policy (address 0) will allow any consent.
     */
    constructor(bytes32 _consent, IConsentPolicy _policy) {
        consentPolicy = _policy;
        _setConsent(_consent);
    }

    /**
     * @dev Retrieve the user consent bitfield.
     */
    function getConsent() public view returns (bytes32) {
        return consent;
    }

    /**
     * @dev Check if the user has given consent for specific bits.
     */
    function hasConsent(bytes32 _consent) public view returns (bool) {
        return (consent & _consent) == _consent;
    }

    /**
     * @dev Call this from the inheriting contract to update the user consent.
     */
    function _setConsent(bytes32 _consent) internal {
        if (address(consentPolicy) != address(0)) {
            require(consentPolicy.isValid(_consent), "mandatory bits must be set");
        }
        consent = _consent;
    }

}
