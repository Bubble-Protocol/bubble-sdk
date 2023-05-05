// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../AccessControlledStorage.sol";
import "../AccessControlBits.sol";
import "../BubbleStandardContent.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";


/**
 * An example of data tokenisation, using an ERC721 contract to control access to content.  The holder of  
 * a token is permitted read access to a file with the same name as the token id.  
 * 
 * This example also provides a single public directory that anyone can read to discover information about 
 * the token.
 */
contract ERC721ControlledBubble is AccessControlledStorage {

    IERC721 nftContract;
    address owner = msg.sender;
    bool terminated = false;

    constructor(IERC721 nft) {
      nftContract = nft;
    }

    /**
     * The off-chain storage service's Guardian software uses this method to determine the access
     * permissions for a user request.
     * 
     * In this case, each ERC721 token has a corresponding file within the bubble named after the token id.
     */
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

      /**
       * If the bubble has been terminated, the off-chain storage service will delete the bubble and 
       * all its contents.
       */
      if (terminated) return BUBBLE_TERMINATED_BIT;

      /**
       * This template includes a single public directory.  A public directory can be useful for discovery 
       * purposes, allowing anyone to read its contents. The Bubble Standard Public Discovery Directory 
       * offers a standard way of providing discovery.  The directory must contain a `metadata` file 
       * containing the Bubble Standard public metadata fields, and may contain other files, such as 
       * images, videos and html to support discovery.
       * 
       * If your use case doesn't need a public directory then this functionality should be removed.
       */
      uint directoryBit = 
        (contentId == PUBLIC_DISCOVERY_DIRECTORY) 
        ? DIRECTORY_BIT 
        : NO_PERMISSIONS;

      /**
       * The owner has full rwa permissions for all files and directories in the bubble (including 
       * the special file 0 used for permission to construct the bubble on an off-chain storage service).
       */
      if (user == owner) return directoryBit | READ_BIT | WRITE_BIT | APPEND_BIT;

      /**
       * File 0 is a special file that represents the bubble itself.  Token holders should not have
       * access to this.  (If the ERC721 contract does not allow token 0 then this line can be removed).
       */
      else if (contentId == 0) return NO_PERMISSIONS;

      /**
       * Token holders have read access to a token's content if they own the token.  In this case
       * the token's content is held in a file named after the token itself.  This could be modified
       * to be a directory if preferred.
       */
      else if (nftContract.ownerOf(contentId) == user) return directoryBit | READ_BIT;

      /**
       * Otherwise the user does not have permission to access the content
       */
      else return NO_PERMISSIONS;
    }


    /**
     * Terminating the bubble will force the off-chain storage service to delete the bubble and all its
     * contents.  In this case, the contract owner can terminate the bubble at any time.  If this is
     * not desirable for your use case then consider other options like preventing termination until 
     * a date in the future.
     */
    function terminate() public {
      require(msg.sender == owner, "permission denied");
      terminated = true;
    }
    
}