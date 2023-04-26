// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import * as assert from './assertions';

/**
 * BubblePermissions class represents the permissions bitmap returned from a Bubble ACC (Access 
 * Control Contract).  
 * 
 *   Bit    Purpose
 *   -----  -------------------------------------------------
 *   31      0 = smart contract has ended.  1 otherwise
 *   30      directory
 *   29      read
 *   28      write
 *   27      append
 *   26      execute
 *   20..25  reserved
 *   0..19   user-defined\
 */

export const BUBBLE_TERMINATED_BIT = 1n << 255n;
export const DIRECTORY_BIT = 1n << 254n;
export const READ_BIT = 1n << 253n;
export const WRITE_BIT = 1n << 252n;
export const APPEND_BIT = 1n << 251n;
export const EXECUTE_BIT = 1n << 250n;


export class BubblePermissions {

  permissions;

  constructor(_permissions) {
    assert.isBigInt(_permissions, 'permissions');
    this.permissions = _permissions;
  }

  bubbleTerminated() {
    return (this.permissions & BUBBLE_TERMINATED_BIT) > 0;
  }

  isDirectory() {
    return (this.permissions & DIRECTORY_BIT) > 0;
  }

  canRead() {
    return !this.bubbleTerminated() && (this.permissions & READ_BIT) > 0;
  }

  canWrite() {
    return !this.bubbleTerminated() && (this.permissions & WRITE_BIT) > 0;
  }

  canAppend() {
    return !this.bubbleTerminated() && (this.permissions & APPEND_BIT) > 0;
  }

  canExecute() {
    return !this.bubbleTerminated() && (this.permissions & EXECUTE_BIT) > 0;
  }

}