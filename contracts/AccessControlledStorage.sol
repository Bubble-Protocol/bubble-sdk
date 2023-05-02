// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// SDAC
//
// Params use widest possible fields for flexibility
//
// Reserved CIDs:
//
//   CID  Purpose
//   ---  ------------------------------------------------------------------------------------------
//   0    The bubble itself.  
//          - Writeable means requester has create permissions.
//          - Directory bit is meaningless - is always considered a directory
//          - Writing does nothing
//          - Reading returns the directory listing of the root of the bubble 
//
// Returns:
//
//   Bit    Purpose
//   -----  -------------------------------------------------
//   31      1 = bubble has been terminated.  0 otherwise
//   30      directory
//   29      read
//   28      write
//   27      append
//   26      execute
//   20..25  reserved
//   0..19   user-defined
//
//

abstract contract AccessControlledStorage {

  function getAccessPermissions( address user, uint256 contentId ) public virtual view returns (uint256);

}


