// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/**
 * Contract to manage user consent. Stores up to 256 consent flags, any of which can be mandatory.
 * Application layer is responsible for what those flags represent and for informing the user.
 */
abstract contract ConsentManagement {

    // Consent bitfield
    bytes32 private consent;

    // Mandatory consent bits
    bytes32 private mandatoryConsent;

    /**
     * @dev Constructor that initialises the user consent and mandatory consent bits.
     * Will revert if mandatory bits are not set in the consent.
     */
    constructor(bytes32 _consent, bytes32 _mandatoryBits) {
        _setMandatoryConsentBits(_mandatoryBits);
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
     * @dev Retrieve the mandatory consent bits.
     */
    function getMandatoryConsentBits() public view returns (bytes32) {
        return mandatoryConsent;
    }

    /**
     * @dev Call this from the inheriting contract to update the user consent.
     */
    function _setConsent(bytes32 _consent) internal {
        require(_consent & mandatoryConsent == mandatoryConsent, "mandatory bits must be set");
        consent = _consent;
    }

    /**
     * @dev Call this from the inheriting contract to update the mandatory consent bits.
     */
    function _setMandatoryConsentBits(bytes32 _mandatoryBits) internal {
        mandatoryConsent = _mandatoryBits;
    }

}
