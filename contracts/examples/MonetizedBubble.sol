// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../AccessControlledStorage.sol";
import "../AccessControlBits.sol";

/**
 * Bubble that allows anyone to pay to access data.  Users send ETH to the `topup` function to give
 * them access for a period of time, based on a price per minute set by the owner.
 */
contract MonetizedBubble is AccessControlledStorage {

    address owner = msg.sender;
    bool public terminated = false;

    // The timestamp at which a user's access expires
    mapping (address => uint) expiryTimes;

    // Price per duration of access (wei per minute)
    uint public price;


    constructor(uint initialPrice) {
      price = initialPrice;
    }


    // Bubble Protocol API
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

      // If the bubble has been terminated, the off-chain storage service will delete the bubble and its contents
      if (terminated) return BUBBLE_TERMINATED_BIT;

      // Owner has rwa access to directory 1
      if (contentId == 1 && user == owner) return DIRECTORY_BIT | READ_BIT | WRITE_BIT | APPEND_BIT;

      // Paid-up users have access to directory 1 until their payment expires
      if (contentId == 1 && expiryTimes[user] >= block.timestamp) return DIRECTORY_BIT | READ_BIT;

      // Otherwise permission is denied
      else return NO_PERMISSIONS;
    }


    // Anyone can topup their balance to access the data for a duration
    function topup() external payable {
      uint expires = expiryTimes[msg.sender];
      if (expires < block.timestamp) expires = block.timestamp;
      expiryTimes[msg.sender] = expires + msg.value * 60/price;
    }


    // Owner can set the price of data access (wei per minute)
    function setPrice(uint p) external {
      require(msg.sender == owner, "permission denied");
      price = p;
    }


    // Owner can terminate the bubble forcing the off-chain storage service to delete the bubble and its contents
    function terminate() external {
      require(msg.sender == owner, "permission denied");
      terminated = true;
    }


}