// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import * as assert from './assertions.js';
import { ROOT_PATH } from './constants.js';

/**
 * Deconstructs a string filename representing a file or directory in a bubble.  Bubble
 * path names consist of <file-or-directory-hash>[/<posix-filename>].  Bubbles don't have
 * the concept of nested directories at the storage level - if required it can be implemented at
 * application level.
 * 
 * @dev Always confirm isValid() before relying on any other accessor function.
 */
export class BubbleFilename {

  fullFilename;
  permissions;

  constructor(filenameStr) {
    if (!assert.isString(filenameStr)) {
      this._valid = false;
      this.fullFilename = filenameStr;
    }
    else {
      this.fullFilename = filenameStr.slice(0,2) !== '0x' ? '0x' + filenameStr : filenameStr;
      this._parts = this.fullFilename.split('/');
      this._valid = 
        this._parts.length === 1 ? assert.isHash(this._parts[0]) :
        this._parts.length === 2 ? assert.isHash(this._parts[0]) && assert.isPOSIXFilename(this._parts[1]) :
        false;
      if (!this._valid) this.fullFilename = filenameStr;
    }
  }

  setPermissions(permissions) {
    this.permissions = permissions;
    if (this._parts.length === 2 && !permissions.isDirectory()) this._valid = false;
  }

  getPermissionedPart() {
    if (!this._valid) throw new Error("BubbleFilename.getPermissionedPart: filename is invalid");
    return this._parts[0];
  }

  isFile() {
    return !this.isDirectory();
  }

  isDirectory() {
    if (!this._valid) throw new Error("BubbleFilename.getPermissionedPart: filename is invalid");
    return this._parts.length === 1 && (!this.permissions || this.permissions.isDirectory());
  }

  isRoot() {
    if (!this._valid) throw new Error("BubbleFilename.getPermissionedPart: filename is invalid");
    return this._parts[0].toLowerCase() === ROOT_PATH;
  }

  isValid() {
    return this._valid;
  }

}
