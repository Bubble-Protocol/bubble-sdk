// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";
import { ecdsa } from "@bubble-protocol/crypto";
import { UserEncryptedBubbleManager } from "./UserEncryptedBubbleManager.js";
import { toFileId } from "../utils.js";

/**
 * Extension of UserEncryptedBubbleManager that manages encrypted metadata files for multiple
 * users of a bubble. Allows a bubble to be encrypted and for each user to have access to 
 * the encryption key, read from their own metadata file which is ECIES encrypted with their
 * public key.
 * 
 * The user who creates the bubble will automatically have a metadata file. All other users
 * must be added via the addUser method.
 */
export class MultiUserEncryptedBubbleManager extends UserEncryptedBubbleManager {

  /**
   * Adds a user to this bubble, saving the metadata and encryption policy to the user's metadata
   * file. The metadata file is named after the user's account address unless explicitly overridden 
   * the userMetadataFile option. 
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {compress-public-key} publicKey the user's public key.
   * @param {Object} options options are passed to bubble.write after removing the options below.
   * @option {Object} userMetadata optional metadata to include in the user's metadata file.
   * @option {String} userMetadataFile use this filename for the metadata file.
   * @returns Promise to encrypt and write the user's metadata file
   */
  addUser(bubble, publicKey, options={}){
    const file = options.userMetadataFile || toFileId(ecdsa.publicKeyToAddress(publicKey));
    assert.isHex32(file, 'options.userMetadataFile');
    const writeOptions = {...options, userMetadata: undefined, userMetadataFile: undefined};
    return this._writeUserMetadata(bubble, file, publicKey, options.userMetadata, writeOptions);
  }

  /**
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {String} addressOrFile the user's account address or metadata filename.
   * @param {Object} options options are passed to bubble.delete.
   * @returns Promise to delete the user's metadata file
   */
  removeUser(bubble, addressOrFile, options) {
    try {
      addressOrFile = toFileId(addressOrFile);
    }
    catch(_) {
      return Promise.reject(new Error('TypeError: invalid addressOrFile'));
    }
    return bubble.delete(addressOrFile, options)  
  }

}

