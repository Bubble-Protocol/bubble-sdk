// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * AccessControlledStorage interface
 * 
 * Any smart contract that implements this interface can control off-chain storage using the 
 * Bubble Protocol.
 */

interface AccessControlledStorage {

  /**
   * Provides the access permissions for off-chain content controlled by this contract.  An 
   * off-chain storage service calls this method to obtain a specific user's permissions for 
   * accessing a given file or directory.  The method must return a bit field, with POSIX-like 
   * bits for terminated, directory, read, write, append and execute (tdrwax).
   * 
   * See AccessControlBits.sol for a complete definition of the bit field returned by this
   * method.
   * 
   * Note, the following content IDs are reserved:
   * 
   *   CID  Purpose
   *   ---  ------------------------------------------------------------------------------------------
   *   0    The root of the bubble itself.  Any user with write permission to id 0 can construct the 
   *        bubble on an off-chain storage service.  Any user with read permission can list the
   *        contents of the bubble's root directory.  ID 0 is always considered a directory and so the 
   *        Directory Bit permission returned by this contract is ignored.  
   * 
   * @param user the user requesting access
   * @param contentId the id of the content (file or directory) being requested
   */

  function getAccessPermissions( address user, uint256 contentId ) external view returns (uint256);

}

