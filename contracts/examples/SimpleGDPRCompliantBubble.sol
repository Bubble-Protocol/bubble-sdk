// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../gdpr/GDPRCompliantBubble.sol";
import "../AccessControlBits.sol";


/**
 * Simple GDPR compliant bubble derived from GDPRCompliantBubble. 
 *
 * The bubble contains three directories:
 *
 *   - Subject's Personal Data Directory: 0x01 (writeable only by the subject, readable by the processor)
 *   - Processor's Service Directory: 0x02 (writeable only by the processor, readable by all stakeholders)
 *   - Secure Chat Directory: 0x03 (appendable by all stakeholders)
 *
 * Any stakeholder can construct the off-chain bubble and terminate it.
 *
 * Features/Limitations:
 *   - See GDPRCompliantBubble.sol for a full list of GDPR compliance features
 *   - Any stakeholder can construct the off-chain bubble.
 *   - Any stakeholder can terminate the bubble at any time.
 *   - The controller can optionally limit the off-chain bubble to a set of permitted providers.
 *   - The subject can block and unblock processing at any time.
 *   - Blocking processing prevents the processor and controller from accessing the subject's
 *     personal data and the service deirectory. Stakeholders can still chat.
 *   - The subject can update their consent at any time.
 *   - The subject can read and update their personal data at any time.
 *   - The processor can read the subject's personal data at any time unless blocked.
 *   - The processor writes any working data to the processor's service directory.
 *   - Both the subject and the processor can read the processor's working directory at any time.
 */
contract SimpleGDPRCompliantBubble is GDPRCompliantBubble {

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
    GDPRCompliantBubble(subject, controller, processor, consent, consentPolicy, providerUrl, permittedProviders)
    {}

    /**
     * @dev The access permissions for the bubble.
     */
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        if (isTerminated()) return BUBBLE_TERMINATED_BIT;

        if (user == getSubject()) {
            if (contentId == 0) return DRWA_BITS;
            if (contentId == PERSONAL_DATA_DIRECTORY) return DRWA_BITS;
            if (contentId == SERVICE_DIRECTORY) return DIRECTORY_BIT | READ_BIT;
            if (contentId == CHAT_DIRECTORY) return DIRECTORY_BIT | APPEND_BIT;
            return NO_PERMISSIONS;
        }

        if (user == getProcessor()) {
            if (contentId == 0) return DRWA_BITS;
            if (contentId == PERSONAL_DATA_DIRECTORY && !isBlocked()) return DIRECTORY_BIT | READ_BIT;
            if (contentId == SERVICE_DIRECTORY && !isBlocked()) return DRWA_BITS;
            if (contentId == CHAT_DIRECTORY) return DIRECTORY_BIT | APPEND_BIT;
            return NO_PERMISSIONS;
        }

        if (user == getController() && !isBlocked()) {
            if (contentId == 0) return DRWA_BITS;
            if (contentId == PERSONAL_DATA_DIRECTORY) return NO_PERMISSIONS;
            if (contentId == SERVICE_DIRECTORY && !isBlocked()) return DIRECTORY_BIT | READ_BIT;
            if (contentId == CHAT_DIRECTORY) return DIRECTORY_BIT | APPEND_BIT;
            return NO_PERMISSIONS;
        }

        return NO_PERMISSIONS;
    }

}

// Bubble structure
uint constant PERSONAL_DATA_DIRECTORY = 0x01;
uint constant SERVICE_DIRECTORY = 0x02;
uint constant CHAT_DIRECTORY = 0x03;

