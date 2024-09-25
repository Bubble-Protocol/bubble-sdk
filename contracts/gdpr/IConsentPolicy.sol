// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/**
 * Contract to manage user consent. Stores up to 256 consent flags, any of which can be mandatory.
 * Application layer is responsible for what those flags represent and for informing the user.
 */
interface IConsentPolicy {

    /**
     * @dev Returns true if the given consent meets the minimal mandatory consent requirements
     * for this policy.
     */
    function meetsMandatoryConsent(bytes32 _consent) external view returns (bool);

}
