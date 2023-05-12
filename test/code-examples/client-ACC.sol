// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControlledStorage.sol";
import "./AccessControlBits.sol";


contract ExampleBubble is AccessControlledStorage {

    address owner = msg.sender;
    mapping(address => bool) friends;
    bool terminated = false;


    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        // If the bubble has been terminated, the off-chain storage service will delete the bubble and its contents
        if (terminated) return BUBBLE_TERMINATED_BIT;

        // File 0 is a special file that represents the root of the bubble. Only users with write permission 
        // to file 0 can construct the bubble on an off-chain storage service.
        else if (contentId == 0 && user == owner) return READ_BIT | WRITE_BIT | APPEND_BIT;

        // Owner has rwa access to both directories
        else if ((contentId == 1 || contentId == 2) && user == owner) return DIRECTORY_BIT | READ_BIT | WRITE_BIT | APPEND_BIT;

        // Friends have read access to the public directory
        else if (contentId == 1 && friends[user]) return DIRECTORY_BIT | READ_BIT;

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
        terminated = true;
    }

}