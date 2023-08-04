// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { toFileId } from "../utils.js";
import { BubbleFilename, assert } from "@bubble-protocol/core";
import { ecdsa } from "@bubble-protocol/crypto";
import { SingleUserManager } from "./SingleUserManager.js";

/**
 * Base class for a Bubble Manager. Used by a ManagedBubble to manage content within a bubble.
 */
export class MultiUserManager extends SingleUserManager {

  users = [];

  /**
   * @param {Key|Object} user the cryptographic details of the local user.  Must be a crypto Key
   * object or a plain object containing the user's `address`, `cPublicKey` (compressed public key), 
   * and either `privateKey` or `decryptFunction`, where the decrypt function takes the form:
   * 
   *   (String: data) => { return Promise to resolve data decrypted with the user's private key }
   * 
   * @param {String} metadataFile optional metadata file. If not given the user's address will be 
   * used.
   * @param {Array} otherUsers optional list of other users to add to the bubble when the bubble
   * is created.  Each user must be a public key or an object of the form:
   * 
   *   { publicKey|cPublicKey: <compressed-public-key>, metadataFile: <optional filename> }
   */
  constructor(user, metadataFile, otherUsers=[]) {
    super(user, metadataFile);
    assert.isArray(otherUsers, 'otherUsers');
    this.users = otherUsers.map((u,i) => this._getUser(u,i));
  }

  /**
   * Called during the bubble create process after the bubble has been created. Writes this
   * user's metadata file and those of any other users supplied in the constructor.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options passed through to the Bubble class after removing the options below.
   * @option {any} userMetadata optional metadata to include with the written file.
   * @returns Promise
   */
  create(bubble, options){
    return super.create(bubble, options)
      .then(() => { 
        return Promise.all(this.users.map(user => {
          return this._writeUserMetadata(this.bubble, user.metadataFile, user.publicKey, options);
        }));
      })
  }

  /**
   * Adds the given user to the bubble, writing their metadata file. The bubble must be 
   * created or initialised.
   * 
   * The user must be either a compressed public key or an object of the form:
   * 
   *   { publicKey|cPublicKey: <compressed-public-key>, metadataFile: <optional filename> }
   * 
   * @param {publicKey|Object} user The user to add
   * @param {Object} options passed through to the Bubble class
   * @returns Promise to add the user to the bubble, writing their metadata file.
   */
  addUser(user, options) {
    if (!this.bubble) throw new Error('cannot add user until the bubble is created or initialised');
    user = this._getUser(user);
    return this._writeUserMetadata(this.bubble, user.metadataFile, user.publicKey, options)
      .then(() => {
        this.users.push(user);
      })
  }

  /**
   * Removes the given user from the bubble, deleting their metadata file. The bubble must
   * be created or initialised.
   * 
   * The user must be either a compressed public key or an object of the form:
   * 
   *   { publicKey|cPublicKey: <compressed-public-key>, metadataFile: <optional filename> }
   * 
   * @param {publicKey|Object} user The user to remove
   * @param {Object} options passed through to the Bubble class
   * @returns Promise to remove the user's metadata file from this bubble
   */
  removeUser(user, options) {
    if (!this.bubble) throw new Error('cannot remove user until the bubble is created or initialised');
    user = this._getUser(user);
    return this.bubble.delete(user.metadataFile, options)
      .then(() => {
        this.users = this.users.filter(u => u.metadataFile === user.metadataFile);
      })
  }

  /**
   * @dev converts a client passed public key or user object into a user object.
   * @throws if the user is invalid
   */
  _getUser(u, i) {
    const iText = i >= 0 ? ' '+i+' ' : ' ';
    let user = {};
    if (assert.isObject(u)) {
      user.publicKey = u.publicKey || u.cPublicKey;
      user.metadataFile = u.metadataFile;
    }
    else {
      user.publicKey = u;
    }
    ecdsa.assert.isCompressedPublicKey(user.publicKey, 'user'+iText+'must have a valid publicKey or cPublicKey property');
    user.metadataFile = user.metadataFile || toFileId(ecdsa.publicKeyToAddress(user.publicKey))
    const metadataFilename = new BubbleFilename(user.metadataFile);
    if (!metadataFilename.isValid()) throw new Error('user'+iText+'metadataFile is invalid');
    return user;
  }
  
}

