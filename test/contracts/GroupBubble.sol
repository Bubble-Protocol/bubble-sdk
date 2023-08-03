// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControlledStorage.sol";
import "./AccessControlBits.sol";


contract GroupBubble is AccessControlledStorage {

  mapping(address => bool) users;
  bool terminated = false;

  constructor(address[] memory _users) {
    for(uint i=0; i<_users.length; i++) {
      users[_users[i]] = true;
    }
  }

  function setUsers(address[] memory _users, bool state)  external {
    require(users[msg.sender], "permission denied");
    for(uint i=0; i<_users.length; i++) {
      users[_users[i]] = state;
    }
  }

  function getAccessPermissions( address user, uint256 contentId ) external view override returns (uint256) {
    if (terminated) return BUBBLE_TERMINATED_BIT;
    if (!users[user]) return NO_PERMISSIONS;
    if (contentId <= 100) return DIRECTORY_BIT | READ_BIT | WRITE_BIT | APPEND_BIT;
    else return READ_BIT | WRITE_BIT | APPEND_BIT;
  }

  function terminate() public {
    require(users[msg.sender], "permission denied");
    terminated = true;
  }

}