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

contract TestContract is AccessControlledStorage {

    address public owner;
    address public requester;
    bool terminated = false;


    constructor( address _owner, address _requester ) {
      owner = _owner;
      requester = _requester;
    }


    // Permissions are set to support a variety of tests:
    //   - Vault Root: owner:rwa, requester:r
    //   - cid 1: owner:rwa, requester:r
    //   - cid 2: owner:r, requester:w
    //   - cid 3: owner:r, requester:a
    //   - cid 4: owner:da, requester:dr
    //   - cid 5: owner:dr, requester:dwa
    //   - cid 6: owner:rwa, requester:-
    function getAccessPermissions( address user, uint256 contentId ) public virtual view override returns (uint256) {
      if (terminated) return BUBBLE_TERMINATED_BIT;
      if ( contentId == 0 ) {
        if (user == owner) return ALL_PERMISSIONS;
        if (user == requester) return NO_PERMISSIONS | READ_BIT;
      }
      else if ( contentId == 1 ) {
        if (user == owner) return NO_PERMISSIONS | READ_BIT | WRITE_BIT | APPEND_BIT;
        if (user == requester) return NO_PERMISSIONS | READ_BIT;
      }
      else if ( contentId == 2 ) {
        if (user == owner) return NO_PERMISSIONS | READ_BIT;
        if (user == requester) return NO_PERMISSIONS | WRITE_BIT;
      }
      else if ( contentId == 3 ) {
        if (user == owner) return NO_PERMISSIONS | READ_BIT;
        if (user == requester) return NO_PERMISSIONS | APPEND_BIT;
      }
      else if ( contentId == 4 ) {
        if (user == owner) return NO_PERMISSIONS | DIRECTORY_BIT | APPEND_BIT;
        if (user == requester) return NO_PERMISSIONS | DIRECTORY_BIT | READ_BIT;
      }
      else if ( contentId == 5 ) {
        if (user == owner) return NO_PERMISSIONS | DIRECTORY_BIT | READ_BIT;
        if (user == requester) return NO_PERMISSIONS | DIRECTORY_BIT | WRITE_BIT | APPEND_BIT;
      }
      else if ( contentId == 6 ) {
        if (user == owner) return ALL_PERMISSIONS;
      }
      return NO_PERMISSIONS;
    }

    // terminates the contract if the sender is permitted and any termination conditions are met
    function terminate() public {
      terminated = true;
    }


}