// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Access control bits, as returned by the AccessControlledStorage getAccessPermissions 
 * method.
 * 
 * Permissions are a 256 bit field formatted with posix-like file permissions.  Only the top
 * 16 most significant bits are reserved for Bubble Protocol.  The rest are free for
 * application use.
 * 
 *   Bit    Purpose
 *   -----  -------------------------------------------------
 *   255       terminated (1 = bubble terminated, 0 = active)
 *   254       directory
 *   253       read
 *   252       write
 *   251       append
 *   250       execute
 *   240..249  reserved for Bubble Protocol future extension
 *   0..239    user-defined
 */

// Bits
uint constant BUBBLE_TERMINATED_BIT = 1 << 255;
uint constant DIRECTORY_BIT = 1 << 254;
uint constant READ_BIT = 1 << 253;
uint constant WRITE_BIT = 1 << 252;
uint constant APPEND_BIT = 1 << 251;
uint constant EXECUTE_BIT = 1 << 250;

// Combinations
uint constant NO_PERMISSIONS = 0;
uint constant RWA_BITS = 7 << 251;
uint constant DRWA_BITS = 15 << 251;
uint constant RWAX_BITS = 15 << 250;
