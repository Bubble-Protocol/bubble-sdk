// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from '@bubble-protocol/core';
import { Bubble } from '../Bubble.js';
import { MultiUserManager } from '../user-managers/MultiUserManager.js';
import { AESGCMEncryptionPolicy } from '../encryption-policies/AESGCMEncryptionPolicy.js';

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
export class MultiUserEncryptedBubble extends Bubble {

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
   * @param {Array} otherUsers optional list of users, other than the local user, who are users of
   * this bubble. Each user must be either a compressed public key or an object of the form:
   * 
   *   { publicKey|cPublicKey: <compressed-public-key>, metadataFile: <optional filename> }
   * 
   * @option {String} userMetadataFile override default filename of the local user's 
   * userMetadataFile.
   */
  constructor(contentId, provider, user, encryptionPolicy, otherUsers, options={}) {
    const userManager = new MultiUserManager(user, options.userMetadataFile, otherUsers);
    super(contentId, provider, user.signFunction, encryptionPolicy || new AESGCMEncryptionPolicy(), userManager);
  }
  
}
