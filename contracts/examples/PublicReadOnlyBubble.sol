// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../AccessControlledStorage.sol";
import "../AccessControlBits.sol";

/**
 * The simplest of all bubbles (possibly!).  All files are public with read access for all.  The owner
 * has full rwa access to all files and to the bubble itself.
 */
contract PublicReadOnlyBubble is AccessControlledStorage {

    address owner = msg.sender;
    bool terminated = false;


    /**
     * The off-chain storage service's Guardian software uses this method to determine the access
     * permissions for a user request.
     */
    function getAccessPermissions( address user, uint256 /*contentId*/ ) override external view returns (uint256) {

        /**
         * If the bubble has been terminated, the off-chain storage service will delete the bubble and 
         * all its contents.
         */
        if (terminated) return BUBBLE_TERMINATED_BIT;

        /**
         * Owner has full access rights to all files and to the bubble itself
         */
        else if (user == owner) return RWA_BITS;

        /**
         * All files within the bubble are public.  Anyone can read.
         */
        else return READ_BIT;
    }


    /**
     * Terminating the bubble will force the off-chain storage service to delete the bubble and all its
     * contents.  Only the contract owner can terminate the bubble.
     */
    function terminate() external {
        require(msg.sender == owner, "permission denied");
        terminated = true;
    }

}