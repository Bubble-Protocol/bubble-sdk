// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/**
 * Contract to define a consent policy. A consent policy is a set of rules that define the
 * minimum valid consent for a given application. The application layer is responsible for
 * informing the user what the consent bits represent.
 *
 * Consent is stored as a bitfield, with each bit representing a different consent flag.
 */
interface IConsentPolicy {

    /**
     * @dev Returns true if the given consent bitfield meets the minimal mandatory consent 
     * requirements for this policy.
     */
    function meetsMandatoryConsent(bytes32 _consent) external view returns (bool);

}
