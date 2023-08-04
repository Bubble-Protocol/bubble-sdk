// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleFilename, assert } from "@bubble-protocol/core";
import { UserManager } from "../UserManager.js";
import { toFileId } from "../utils.js";
import { ecies } from "@bubble-protocol/crypto";

/**
 * Base class for a Bubble Manager. Used by a ManagedBubble to manage content within a bubble.
 */
export class SingleUserManager extends UserManager {

  user;
  bubble;
  metadataFile;
  
  /**
   * 
   * @param {Key|Object} user the cryptographic details of the local user.  Must be a crypto Key
   * object or a plain object containing the user's `address`, `cPublicKey` (compressed public key), 
   * and either `privateKey` or `decryptFunction`, where the decrypt function takes the form:
   * 
   *   (String: data) => { return Promise to resolve data decrypted with the user's private key }
   * 
   * @param {*} metadataFile 
   */
  constructor(user, metadataFile) {
    super();
    assert.isObject(user, 'user');
    assert.isHexString(user.address, 'user address');
    ecies.assert.isCompressedPublicKey(user.cPublicKey, 'user cPublicKey');
    if (user.decryptFunction) {
      assert.isFunction(user.decryptFunction, 'user decrypt function');
      this.userDecryptFunction = user.decryptFunction;
    }
    else {
      ecies.assert.isPrivateKey(user.privateKey, 'user private key');
      this.userDecryptFunction = (data) => Promise.resolve(ecies.decrypt(user.privateKey, data));
    }
    this.user = user;
    this.metadataFile = metadataFile || toFileId(user.address);
    const metadataFilename = new BubbleFilename(this.metadataFile);
    if (!metadataFilename.isValid()) throw new Error('invalid metadataFile option');
  }

  /**
   * Called during the bubble create process to construct any content. It is called after the 
   * provider has been opened and the bubble has been created.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options passed through to the Bubble class after removing the options below.
   * @option {any} userMetadata optional metadata to include with the written file.
   * @returns Promise
   */
  create(bubble, options={}){
    return this._writeUserMetadata(bubble, this.metadataFile, this.user.cPublicKey, options)
      .then(() => {
        this.bubble = bubble;
        if (options.userMetadata !== undefined) bubble.userMetadata = options.userMetadata;
      })
  }

  /**
   * Called during the bubble initialisation process to read content. It is called after the 
   * provider has been opened.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options passed through to the Bubble class
   * @returns Promise
   */
  initialise(bubble, options){
    return this._loadUserMetadata(bubble, this.metadataFile, this.userDecryptFunction, options)
      .then(result => { 
        this.bubble = bubble;
        return result;
    })
  }

  updateUserMetadata(userMetadata, options) {
    if (!this.bubble) throw new Error('cannot update user metadata until the bubble is created or initialised');
    assert.isNotNull(userMetadata, 'userMetadata');
    return this._writeUserMetadata(this.bubble, this.metadataFile, this.user.cPublicKey, options)
      .then(() => {
        this.bubble.userMetadata = userMetadata;
      })
  }


}

