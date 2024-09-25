// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./ConsentManagement.sol";
import "./GDPRRoles.sol";
import "../AccessControlledStorage.sol";
import "../extensions/PermittedProvider.sol";
import "../extensions/Terminatable.sol";


/**
 * Abstract GDPR compliant bubble. Inherit and implement getAccessPermissions to define the
 * structure of the bubble.
 *
 * Automates the following Rights of the Individual:
 *
 * - Right to Erasure: subject can unconditionally terminate the bubble to delete their data
 * - Right to Restrict Processing: subject can unconditionally block and unblock processing
 * - Right to Object: subject can update their consent at any time
 * - Right of Access: handled by the inheriting contract
 * - Right of Rectification: handled by the inheriting contract
 * - Right to Data Portability: subject can read their personal data at any time and can 
 *   choose their host provider
 *
 * The Right to be Informed is handled at the application level.
 * The Rights of automated decision making and profiling are supported by the consent field but
 * are mostly handled at the application level.
 */
abstract contract GDPRCompliantBubble is ERC165, AccessControlledStorage, PermittedProvider, ConsentManagement, GDPRRoles, Terminatable {

    // Processing blocked flag for the Right to Restrict Processing
    bool private blocked = false;

    /**
     * @dev Constructor that initialises the bubble with the subject, controller, processor, consent,
     * mandatory consent bits, provider URL and any optional permitted providers.
     */
    constructor(
        address subject, 
        address controller, 
        address processor, 
        bytes32 consent, 
        IConsentPolicy consentPolicy,
        string memory providerUrl, 
        IProviderList permittedProviders
    )
    GDPRRoles(subject, controller, processor)
    ConsentManagement(consent, consentPolicy)
    PermittedProvider(providerUrl, permittedProviders)
    {}

    /**
     * @dev Allow the subject to block or unblock processing for the Right to Restrict Processing.
     */
    function blockProcess(bool enabled) external onlySubject {
        blocked = enabled;
    }

    /**
     * @dev Returns true if processing is blocked.
     */
    function isBlocked() public view returns (bool) {
        return blocked;
    }

    /**
     * @dev Allow the subject to update their consent for the Right to Object.
     */
    function updateConsent(bytes32 _consent) external onlySubject {
        _setConsent(_consent);
    }

    /**
     * @dev Allow the subject to change the host provider of their data.
     */
    function updateProvider(string memory providerUrl) external onlySubject() {
        _setProviderUrl(providerUrl);
    }

    /**
     * @dev Allow the subject to terminate the bubble for the Right to Erasure.
     * Allow the controller or processor to terminate the bubble on behalf of the subject.
     * Override to change the default termination behaviour.
     */
    function terminate() external onlyStakeholders {
        _terminate();
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165) returns (bool) {
        return
            interfaceId == type(GDPRCompliantBubble).interfaceId ||
            interfaceId == type(AccessControlledStorage).interfaceId ||
            interfaceId == type(ProviderMetadata).interfaceId ||
            interfaceId == type(ConsentManagement).interfaceId ||
            interfaceId == type(GDPRRoles).interfaceId ||
            interfaceId == type(Terminatable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
    
}
