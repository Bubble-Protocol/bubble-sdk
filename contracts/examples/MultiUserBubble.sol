// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../AccessControlledStorage.sol";
import "../AccessControlBits.sol";
import "../extensions/Terminatable.sol";


contract MultiUserBubble is AccessControlledStorage, Terminatable {

    address owner = msg.sender;
    mapping(address => bool) friends;


    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        // If the bubble has been terminated, the off-chain storage service will delete the bubble and its contents
        if (isTerminated()) return BUBBLE_TERMINATED_BIT;

        // ContentId 1 is a directory, all other contents are files
        uint256 directoryBit = contentId == 1 ? DIRECTORY_BIT : 0;

        // Owner has rwa access to the whole bubble
        if (user == owner) return directoryBit | READ_BIT | WRITE_BIT | APPEND_BIT;

        // Friends have read access to the directory and their own metadata file
        if (friends[user] && (contentId == 1 || contentId == uint256(uint160(user)))) return directoryBit | READ_BIT;

        // Otherwise permission is denied
        else return NO_PERMISSIONS;
    }


    // Owner can set who their friends are
    function setFriend(address friend, bool permitted) external {
      require(msg.sender == owner, "permission denied");
      friends[friend] = permitted;
    }


    // Owner can terminate the bubble forcing the off-chain storage service to delete the bubble and its contents
    function terminate() external {
        require(msg.sender == owner, "permission denied");
        _terminate();
    }

}