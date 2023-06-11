// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControlledStorage.sol";

uint constant BUBBLE_TERMINATED_BIT = 1 << 255;
uint constant DIRECTORY_BIT = 1 << 254;
uint constant READ_BIT = 1 << 253;
uint constant WRITE_BIT = 1 << 252;
uint constant APPEND_BIT = 1 << 251;
uint constant EXECUTE_BIT = 1 << 250;
uint constant ALL_PERMISSIONS = 15 << 250;
uint constant NO_PERMISSIONS = 0;

contract MultiUserContract is AccessControlledStorage {

    address public owner;
    address public requester;
    bool terminated = false;


    constructor( address _owner, address _requester ) {
      owner = _owner;
      requester = _requester;
    }


    // Permissions are set to support a variety of tests:
    //   - Vault Root: owner:rwa, requester:r
    //   - cid 1: owner:drwa, requester:dr
    //   - cid 2: owner:drwa, requester:-
    //   - cid 3: owner:rwa, requester:ra
    //   - cid requester: owner:rwa, requester:r
    //   - others: owner: rwa, requester:-
    function getAccessPermissions( address user, uint256 contentId ) external view override returns (uint256) {
      if (terminated) return BUBBLE_TERMINATED_BIT;
      uint256 directoryBit = contentId == 1 || contentId == 2 ? DIRECTORY_BIT : 0;
      if (user == owner) return directoryBit | READ_BIT | WRITE_BIT | APPEND_BIT;
      if (user == requester) {
        if (contentId == 1 || contentId == uint256(uint160(user))) return directoryBit | READ_BIT;
        if (contentId == 3) return READ_BIT | APPEND_BIT;
      }
      return NO_PERMISSIONS;
    }

    // terminates the contract if the sender is permitted and any termination conditions are met
    function terminate() public {
      terminated = true;
    }


}