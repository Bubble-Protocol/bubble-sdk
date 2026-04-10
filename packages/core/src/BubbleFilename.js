// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import * as assert from './assertions.js';
import { ROOT_PATH } from './constants.js';
import { BubblePermissions } from './Permissions.js';

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

  /**
   * Accepts a string filename and deconstructs it into its components.  If the filename is not of
   * the form <file-or-directory-hash> or <directory-hash>/<posix-filename> then it will be
   * marked as invalid and all accessor functions will throw an error.  If the filename is valid 
   * then the hash will be normalized to lowercase.
   */
  constructor(filenameStr) {
    if (!assert.isString(filenameStr)) {
      this._valid = false;
      this.fullFilename = filenameStr;
    }
    else {
      this.fullFilename = filenameStr.slice(0,2) !== '0x' ? '0x' + filenameStr : filenameStr;
      this._parts = this.fullFilename.split('/');
      this._valid = 
        this._parts.length === 1 ? assert.isHex32(this._parts[0]) :
        this._parts.length === 2 ? assert.isHex32(this._parts[0]) && assert.isPOSIXFilename(this._parts[1]) :
        false;
      if (this._valid) {
        this._parts[0] = this._parts[0].toLowerCase();
        this.fullFilename = this._parts.length === 1 ? this._parts[0] : this._parts[0]+'/'+this._parts[1];
      }
      else this.fullFilename = filenameStr;
    }
  }

  /**
   * Sets the permissions for the permissioned part of the filename as retrieved from the smart 
   * contract. If the filename includes a file part then the permissions must indicate the 
   * permissioned part is a directory.
   */
  setPermissions(permissions) {
    if (!(permissions instanceof BubblePermissions)) throw new Error("BubbleFilename.setPermissions: invalid permissions type");
    this.permissions = permissions;
    if (!permissions.bubbleTerminated() && this._parts.length === 2 && !permissions.isDirectory()) this._valid = false;
  }

  /**
   * Returns the permissioned hash part of the file or directory
   */
  getPermissionedPart() {
    if (!this._valid) throw new Error("BubbleFilename.getPermissionedPart: filename is invalid");
    return this._parts[0];
  }

  /**
   * Returns the last part of the filename (filename if present, otherwise the permissioned part)
   */
  getFilePart() {
    if (!this._valid) throw new Error("BubbleFilename.getFilePart: filename is invalid");
    return this._parts.length === 2 ? this._parts[1] : this._parts[0];
  }

  /**
   * Returns true if the filename is of the form <directory-hash>/<filename>.
   */
  isFile() {
    return !this.isDirectory();
  }

  /**
   * Returns true if the filename is of the form <directory-hash> and permissions (if set) indicate 
   * it is a directory.  If permissions are not set then it is considered a directory if the 
   * filename does not have a file part.
   */
  isDirectory() {
    if (!this._valid) throw new Error("BubbleFilename.isDirectory: filename is invalid");
    return this._parts.length === 1 && (!this.permissions || this.permissions.isDirectory());
  }

  /**
   * Returns true if the filename is of the form <directory-hash>/<filename>.
   */
  hasDirectory() {
    if (!this._valid) throw new Error("BubbleFilename.hasDirectory: filename is invalid");
    return this._parts.length === 2;
  }

  /**
   * Returns true if this filename represents the root of the bubble (i.e. file 0 with no subpath).
   */
  isRoot() {
    if (!this._valid) throw new Error("BubbleFilename.isRoot: filename is invalid");
    return this._parts[0].toLowerCase() === ROOT_PATH;
  }

  /**
   * Returns true if this filename is a child of the specified directory.  If the directory has 
   * its permissions set then they must indicate it is a directory.
   * @param {BubbleFilename|string} directory
   */
  isChildOf(directory) {
    if (assert.isString(directory)) directory = new BubbleFilename(directory);
    return this._valid && this.hasDirectory() && directory instanceof BubbleFilename && directory._valid && directory._parts.length === 1 && this._parts[0] === directory.getPermissionedPart();
  }

  /**
   * Returns true if full filenames match
   * @param {BubbleFilename|string} other
   */
  equals(other) {
    if (assert.isString(other)) other = new BubbleFilename(other);
    return this._valid && other instanceof BubbleFilename && other._valid && this.fullFilename === other.fullFilename;
  }

  /**
   * Returns true if full filenames and permissions match
   * @param {BubbleFilename|string} other
   */
  deepEquals(other) {
    return this.equals(other) && ( (!this.permissions && !other.permissions) || (this.permissions && other.permissions && this.permissions.permissions === other.permissions.permissions) );
  }

  /**
   * Returns true if the filename is a valid Bubble filename and permissions (if set) are consistent
   * with the filename (e.g. if permissions indicate it is a directory then the filename must not 
   * have a file part).
   */
  isValid() {
    return this._valid;
  }

}
