// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { EncryptionPolicy } from "./EncryptionPolicy.js";
import { ErrorCodes, assert } from "@bubble-protocol/core";
import { ecies } from "@bubble-protocol/crypto";

/**
 * Base class for a Bubble Manager. Used by a ManagedBubble to manage content within a bubble.
 */
export class UserManager {

  encryptionPolicy;
  metadata;

  /**
   * Called during the bubble create process to write the encryption policy to the bubble.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options for the manager, and options to be passed to any Bubble class methods 
   * used by the manager. In the interest of security, the manager should remove any of its own  
   * options before passing the options object on to a Bubble class method.
   * @option {any} userMetadata optional metadata to include with the written file.
   * @returns Promise
   */
  create(bubble, options){
    return Promise.resolve();
  }

  /**
   * Called during the bubble initialisation process to read the encryption policy from the bubble. 
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options for the manager, and options to be passed to any Bubble class methods 
   * used by the manager. In the interest of security, the manager should remove any of its own  
   * options before passing the options object on to a Bubble class method.
   * @returns Promise
   */
  initialise(bubble, options){
    return Promise.resolve();
  }

  /**
   * Sets the encryption policy for this manager.
   * 
   * @param {EncryptionPolicy} policy 
   */
  setEncryptionPolicy(policy) {
    assert.isInstanceOf(policy, EncryptionPolicy, 'encryption policy');
    this.encryptionPolicy = policy;
  }

  /**
   * @dev serializes the encryption policy then writes it to the given file, ECIES encrypted with
   * the given public key.
   * @option {any} userMetadata optional metadata to include with the written file.  Will be
   * removed from the options object before passing on to the Bubble class.
   */
  async _writeUserMetadata(bubble, file, publicKey, options={}) {
    return bubble.encryptionPolicy.serialize()
      .then(policyStr => {
        const metadata = {userEncryptionPolicy: policyStr};
        if (options.userMetadata) {
          metadata.metadata = options.userMetadata;
          options = {...options};
          delete options.userMetadata;
        }
        const encryptedMetadata = ecies.encrypt(publicKey, JSON.stringify(metadata));
        return bubble.write(file, encryptedMetadata, {...options, encrypted: false});
      })
  }
  
  /**
   * @dev reads the given metadata file, decrypts it and deserializes the encryption policy. If
   * the metadata contains user metadata, it will be written to bubble.userMetadata.
   */
  async _loadUserMetadata(bubble, file, decryptFunction, options={}) {
    return bubble.read(file, {...options, encrypted: false})
      .then(decryptFunction)
      .then(jsonData => {
        const metadata = JSON.parse(jsonData);
        if (!assert.isObject(metadata)) return Promise.reject(new Error('user metadata in bubble is invalid: not an object'));
        if (!assert.isNotNull(metadata.userEncryptionPolicy)) return Promise.reject(new Error('user metadata in bubble is invalid: missing encryption policy'));
        const policy = metadata.userEncryptionPolicy;
        if (metadata.metadata) bubble.userMetadata = metadata.metadata;
        return this.encryptionPolicy.deserialize(policy)
      })
      .then(() => {
        return bubble.userMetadata;
      })
      .catch(error => {
        if (error.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) 
          throw new Error('user metadata file is missing - the bubble user manager cannot be initialised', {cause: error})
        else throw error;
      });
  }

}

