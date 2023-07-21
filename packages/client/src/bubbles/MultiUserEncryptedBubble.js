// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from '@bubble-protocol/core';
import { ecies } from '@bubble-protocol/crypto';
import { UserEncryptedBubble } from './UserEncryptedBubble.js';

/**
 * An encrypted bubble that can be accessed by multiple users without pre-sharing the encryption
 * key(s).  
 * 
 * The bubble maintains a metadata file for each user added to the bubble. The file is named
 * after the user's account (typically their public account address but can be any file unique to
 * the user provided they have read permission granted in the bubble's smart contract).  A user's 
 * metadata file is ECIES encrypted using the user's public key and contains the encryption
 * policy for the bubble plus any custom metadata.
 *
 * The developer/owner of the bubble must:
 * 
 *   1) Grant each user read access to their unique metadata file within the bubble's access 
 *      control contract.
 *   2) Use the 'addUser' method to write the bubble's encryption policy to the user's 
 *      metadata file. Optional metadata can be included in this file.  (The user's public key
 *      is needed to add a user.  This can be recovered from any signature provided by the user).
 * 
 * Unless the bubble is being created, all users of the bubble must call the initialise method 
 * before attempting to access the bubble.
 * 
 * The encryption policy used with this bubble must implement the serialize and deserialize
 * methods, which are used to reconstruct the policy from the user's metadata file.
 */
export class MultiUserEncryptedBubble extends UserEncryptedBubble {

  /**
   * Adds a user to the bubble, writing the user's metadata file encrypted with the user's 
   * public key. The metadata file contains the given metadata and this bubble's encryption 
   * policy.
   * 
   * @param {String} metadataFile file id or user's account as a hex string
   * @param {String} publicKey user's compressed public key as a hex string
   * @param {Object} metadata optional metadata to include for the user
   * @returns Promise to write the user's metadata file to this bubble
   */
  addUser(metadataFile, publicKey, metadata = {}) {
    assert.isString(metadataFile, 'metadataFile');
    ecies.assert.isCompressedPublicKey(publicKey, 'publicKey');
    assert.isObject(metadata, 'metadata');
    return this._writeMetadata(this.toFileId(metadataFile), publicKey, metadata)
  }

  /**
   * Deletes a user's metadata file, preventing them from being able to decrypt the bubble.
   * 
   * @param {String} metadataFile file id or user's account as a hex string
   * @returns Promise to remove the user's metadata file from this bubble
   */
  removeUser(metadataFile) {
    return this.delete(this.toFileId(metadataFile), {silent: true});
  }

}
