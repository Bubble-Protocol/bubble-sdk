// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleFilename, ErrorCodes, assert } from "@bubble-protocol/core";
import { BubbleManager } from "../BubbleManager.js";
import { ecies } from "@bubble-protocol/crypto";
import { toFileId } from "../utils";


/**
 * Manages a single metadata file for a user of a bubble. The metadata includes the bubble's 
 * encryption policy (including any encryption keys) allowing an encrypted bubble to be 
 * reconstructed with just the user's private key or decrypt function.  The metadata file is
 * ECIES encrypted with the user's public key so that only the user can decrypt it.
 * 
 * The metadata file is named after the user's account address unless explicitly overridden in 
 * the constructor options. 
 * 
 * Custom metadata can be stored alongside the encryption policy by passing it as an
 * option to the constructor or the create function.
 * 
 * The ECIES encryption of the user metadata file overrides any encryption policy in the bubble.
 */
export class UserEncryptedBubbleManager extends BubbleManager {

  /**
   * 
   * @param {Key|Object} user the cryptographic details of the local user.  Must be a crypto Key
   * object or a plain object containing the user's `address`, `cPublicKey` (compressed public key), 
   * and either `privateKey` or `decryptFunction`, where the decrypt function takes the form:
   * 
   *   (String: data) => { return Promise to resolve data decrypted with the user's private key }
   * 
   * @param {Object} options see the options below.
   * @option {Object} userMetadata metadata to include in the user's encrypted metadata file
   * @option {String} userMetadataFile override default filename of the userMetadataFile
   */
  constructor(user, options={}) {
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
    this.userMetadataFile = options.userMetadataFile || toFileId(user.address);
    const userMetadataFilename = new BubbleFilename(this.userMetadataFile);
    if (!userMetadataFilename.isValid()) throw new Error('invalid userMetadataFile option');
 }

  /**
   * Writes the user's encrypted metadata file.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options options are passed to bubble.write after removing the options below.
   * @option {Object} userMetadata optional metadata to include in the user's metadata file.
   * @returns Promise to encrypt and write the user metadata file
   */
  create(bubble, options={}){
    bubble.userMetadata = options.userMetadata || {};
    const writeOptions = {...options, userMetadata: undefined};
    return this._writeUserMetadata(bubble, this.userMetadataFile, this.user.cPublicKey, bubble.userMetadata, writeOptions);
  }

  /**
   * Reads and decrypts the user metadata file and forces the bubble's encryption policy to
   * be deserialized from the metadata, and therefore to take on the encryption keys stored 
   * within. This function returns any custom metadata and stores it in the userMetadata
   * property.
   * 
   * @param {Bubble} bubble the bubble being managed
   * @param {Object} options options are passed to bubble.read.
   * @returns Promise to read and process the user's metadata file and resolve with any
   * custom metadata.  Resolves with an empty plain object if no custom metadata.
   */
  initialise(bubble, options){
    const readOptions = {...options, encrypted: false};
    return bubble.read(this.userMetadataFile, readOptions)
      .then(this.userDecryptFunction)
      .then(jsonData => {
        const metadata = JSON.parse(jsonData);
        if (!assert.isObject(metadata)) return Promise.reject(new Error('user metadata in bubble is invalid: not an object'));
        if (!assert.isNotNull(metadata.userEncryptionPolicy)) return Promise.reject(new Error('user metadata in bubble is invalid: missing encryption policy'));
        bubble.userMetadata = {...metadata};
        delete bubble.userMetadata.userEncryptionPolicy;
        return bubble.encryptionPolicy.deserialize(metadata.userEncryptionPolicy);
      })
      .then(() => bubble.userMetadata)
      .catch(error => {
        if (error.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) 
          throw new Error('user metadata file is missing - the bubble cannot be initialised', {cause: error})
        else throw error;
      });
  }

  /**
   * @dev writes the class' user metadata to the given file, ECIES encrypted with the given public key.
   */
  async _writeUserMetadata(bubble, file, publicKey, metadata, options) {
    return bubble.encryptionPolicy.serialize()
      .then(policyStr => {
        const encryptedMetadata = ecies.encrypt(publicKey, JSON.stringify({...metadata, userEncryptionPolicy: policyStr}));
        return bubble.write(file, encryptedMetadata, {...options, encrypted: false})
      })
  }

}
