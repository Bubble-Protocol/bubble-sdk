// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from '@bubble-protocol/core';
import { AESGCMEncryptionPolicy } from '../encryption-policies/AESGCMEncryptionPolicy.js';
import { UserEncryptedBubbleManager } from '../bubble-managers/UserEncryptedBubbleManager.js';
import { ManagedBubble } from './ManagedBubble.js';
import { SequentialBubbleMultiManager } from '../bubble-managers/SequentialBubbleMultiManager.js';
import { BubbleManager } from '../BubbleManager.js';

/**
 * A bubble with a user metadata file named after the user's account address, encrypted using 
 * the user's public key and ECIES.  The saved metadata includes the bubble's encryption policy,
 * including any encryption keys, allowing the bubble to be reconstructed with just the user's
 * private key or decrypt function.
 * 
 * Unless the bubble is being created, the initialise method must be called before attempting 
 * to access the bubble.
 * 
 * The encryption policy used with this bubble must implement the serialize and deserialize
 * methods, which are used to reconstruct the policy from the user's metadata file.
 * 
 * To include additional metadata in the user's metadata file, use the userMetadata option
 * when creating the bubble or call writeUserMetadata. 
 */
export class UserEncryptedBubble extends ManagedBubble {

  /**
   * @dev user's metadata read from the bubble
   */
  userMetadata;

  /**
   * @dev the BubbleManager that manages the user encrypted metadata
   */
  userEncryptedBubbleManager;

  /**
   * 
   * @param {ContentId} contentId the id of this bubble
   * @param {String|BubbleProvider} provider the interface to the storage service
   * @param {Key|Object} user the cryptographic details of the local user.  Must be a crypto Key
   * object or a plain object containing the user's `address`, `cPublicKey` (compressed public key), 
   * `signFunction` (see Bubble.js) and either `privateKey` or `decryptFunction`, where the decrypt 
   * function takes the form:
   * 
   *   (String: data) => { return Promise to resolve data decrypted with the user's private key }
   * 
   * @param {EncryptionPolicy} encryptionPolicy optional encryption policy for this bubble. If not 
   * given, a random AESGCM encryption policy will be used.
   * 
   * @option {BubbleManager} contentManager optional content manager to include in this bubble.
   * @option {String} userMetadataFile override default filename of the userMetadataFile
   */
  constructor(contentId, provider, user, encryptionPolicy, options={}) {
    const userManager = new UserEncryptedBubbleManager(user, options);
    let contentManager = userManager;
    if (options.contentManager) {
      assert.isInstanceOf(contentManager, BubbleManager, 'contentManager');
      contentManager = new SequentialBubbleMultiManager(userManager, options.contentManager)
    }
    super(contentId, provider, user.signFunction, encryptionPolicy || new AESGCMEncryptionPolicy(), contentManager);
    this.userEncryptedBubbleManager = userManager;
  }

  /**
   * Updates this user's metadata in the bubble, writing the given metadata plus the encryption policy state
   * to the local user's metadata file, encrypted with the local user's public key.  Also updates this 
   * object's `userMetadata` field.
   * 
   * @param {Object} metadata the metadata to write
   * @param {Object} options options passed to the bubble server
   * @returns Promise to save the metadata
   */
  writeUserMetadata(metadata={}, options) {
    assert.isObject(metadata, 'metadata');
    return this.userEncryptedBubbleManager._writeUserMetadata(
      this, 
      this.userEncryptedBubbleManager.userMetadataFile, 
      this.userEncryptedBubbleManager.user.cPublicKey, 
      metadata, 
      options
    )
    .then(() => {
      this.userMetadata = metadata;
    })
  }

}

