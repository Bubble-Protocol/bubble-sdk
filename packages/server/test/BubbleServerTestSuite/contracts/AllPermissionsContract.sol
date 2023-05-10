// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControlledStorage.sol";

uint constant BUBBLE_TERMINATED_BIT = 1 << 255;
uint constant DIRECTORY_BIT = 1 << 254;
uint constant ALL_PERMISSIONS = 15 << 250;

contract TestContract is AccessControlledStorage {

    bool terminated = false;


    // Files 3, 4 and 5 are directories.
    function getAccessPermissions( address /*user*/, uint256 contentId ) external view override returns (uint256) {
      if (terminated) return BUBBLE_TERMINATED_BIT;
      uint directory = (contentId == 3 || contentId == 4 || contentId == 5) ? DIRECTORY_BIT : 0;
      return directory | ALL_PERMISSIONS;
    }

    function setTerminated(bool to) public {
      terminated = to;
    }


}