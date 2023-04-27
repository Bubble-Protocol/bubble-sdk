// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BubbleACC.sol";

uint constant BUBBLE_TERMINATED_BIT = 1 << 255;
uint constant DIRECTORY_BIT = 1 << 254;
uint constant READ_BIT = 1 << 253;
uint constant WRITE_BIT = 1 << 252;
uint constant APPEND_BIT = 1 << 251;
uint constant EXECUTE_BIT = 1 << 250;
uint constant ALL_PERMISSIONS = 15 << 250;
uint constant NO_PERMISSIONS = 0;

contract TestContract is BubbleACC {

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
    function getPermissions( address signatory, uint256 cid ) public virtual view override returns (uint256) {
      if (terminated) return BUBBLE_TERMINATED_BIT;
      if ( cid == 0 ) {
        if (signatory == owner) return ALL_PERMISSIONS;
        if (signatory == requester) return NO_PERMISSIONS | READ_BIT;
      }
      else if ( cid == 1 ) {
        if (signatory == owner) return NO_PERMISSIONS | READ_BIT | WRITE_BIT | APPEND_BIT;
        if (signatory == requester) return NO_PERMISSIONS | READ_BIT;
      }
      else if ( cid == 2 ) {
        if (signatory == owner) return NO_PERMISSIONS | READ_BIT;
        if (signatory == requester) return NO_PERMISSIONS | WRITE_BIT;
      }
      else if ( cid == 3 ) {
        if (signatory == owner) return NO_PERMISSIONS | READ_BIT;
        if (signatory == requester) return NO_PERMISSIONS | APPEND_BIT;
      }
      else if ( cid == 4 ) {
        if (signatory == owner) return NO_PERMISSIONS | DIRECTORY_BIT | APPEND_BIT;
        if (signatory == requester) return NO_PERMISSIONS | DIRECTORY_BIT | READ_BIT;
      }
      else if ( cid == 5 ) {
        if (signatory == owner) return NO_PERMISSIONS | DIRECTORY_BIT | READ_BIT;
        if (signatory == requester) return NO_PERMISSIONS | DIRECTORY_BIT | WRITE_BIT | APPEND_BIT;
      }
      else if ( cid == 6 ) {
        if (signatory == owner) return ALL_PERMISSIONS;
      }
      return NO_PERMISSIONS;
    }

    // terminates the contract if the sender is permitted and any termination conditions are met
    function terminate() public {
      terminated = true;
    }


}