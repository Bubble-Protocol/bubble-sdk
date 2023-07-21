// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleFilename, ErrorCodes, assert } from '@bubble-protocol/core';
import { ecies } from '@bubble-protocol/crypto';
import { Bubble } from '../Bubble.js';
import { AESGCMEncryptionPolicy } from '../encryption-policies/AESGCMEncryptionPolicy.js';

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
 */
export class UserEncryptedBubble extends Bubble {

  /**
   * @dev file id of the user's metadata within the bubble
   */
  metadataFile;

  /**
   * @dev user's metadata read from the bubble
   */
  metadata;

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
   */
  constructor(contentId, provider, user, encryptionPolicy, options={}) {
    assert.isObject(user, 'user');
    assert.isHexString(user.address, 'user address');
    ecies.assert.isCompressedPublicKey(user.cPublicKey, 'user cPublicKey');
    super(contentId, provider, user.signFunction, encryptionPolicy || new AESGCMEncryptionPolicy());
    if (user.decryptFunction) {
      assert.isFunction(user.decryptFunction, 'user decrypt function');
      this.userDecryptFunction = user.decryptFunction;
    }
    else {
      ecies.assert.isPrivateKey(user.privateKey, 'user private key');
      this.userDecryptFunction = (data) => Promise.resolve(ecies.decrypt(user.privateKey, data));
    }
    this.user = user;
    this.metadataFile = options.metadataFile || this.toFileId(user.address);
    this.metadataFilename = new BubbleFilename(this.metadataFile);
    if (!this.metadataFilename.isValid()) throw new Error('invalid metadataFile option');
  }

  /**
   * Initialises the bubble.  Must be called before using any other method unless the bubble is
   * to be created.  Reads and decrypts the local user's metadata from the bubble, including the 
   * bubble's encryption policy.  Calls the deserialize method of this bubble's encryption policy 
   * passing it the policy state contained in the metadata.
   * 
   * @returns Promise to resolve if the bubble has been successfully initialised.
   */
  initialise() {
    return this._readMetadata(this.metadataFile, this.userDecryptFunction)
      .then(metadata => {
        return this.encryptionPolicy.deserialize(metadata.encryptionPolicy).then(() => metadata);
      })
      .then(metadata => {
        delete metadata.encryptionPolicy;
        this.metadata = metadata;
        return metadata;
      })
      .catch(error => {
        if (error.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) 
          throw new Error('metadata file is missing - the bubble cannot be initialised', {cause: error})
        else throw error;
      })
  }

  /**
   * Create the bubble on the remote bubble server then write the local user's metadata file.
   * 
   * @param {Object} metadata optional metadata to save to the bubble (readable only by the owner of the bubble).
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve when the bubble is created and the file has been written.
   */
  create(metadata = {}, options) {
    return super.create(options)
      .then(contentId => {
        if (this.metadataFilename.hasDirectory()) return this.mkdir(this.metadataFilename.getPermissionedPart()).then(() => contentId);
        else return contentId;
      })
      .then(contentId => {
        return this.writeMetadata(metadata).then(() => contentId);
      })
  }

  /**
   * Updates this user's metadata in the bubble, writing the given metadata plus the encryption policy state
   * to the local user's metadata file, encrypted with the local user's public key.  Also updates this 
   * object's `metadata` field.
   * 
   * @param {Object} metadata the metadata to write
   * @returns Promise to save the metadata
   */
  writeMetadata(metadata={}) {
    assert.isObject(metadata, 'metadata');
    return this._writeMetadata(this.metadataFile, this.user.cPublicKey, metadata)
      .then(() => {
        this.metadata = metadata;
      })
  }

  /**
   * @dev writes the given metadata plus the bubble's encryption policy to the given file,
   * encrypted with the given public key.
   * 
   * @returns Promise to write the metadata file
   */
  _writeMetadata(file, publicKey, metadata = {}) {
    return this.encryptionPolicy.serialize()
      .then(policyStr => {
        const userMetadata = {
          ...metadata,
          encryptionPolicy: policyStr
        }
        return ecies.encrypt(publicKey, JSON.stringify(userMetadata));
      }) 
      .then(encryptedMetadata => {
        return this.write(file, encryptedMetadata, {encrypted: false});
      });
  }

  /**
   * @dev writes the given metadata plus the bubble's encryption policy to the given file,
   * encrypted with the given public key.
   * 
   * @returns Promise to resolve with the the metadata, including the serialised encryption policy
   */
  _readMetadata(file, decryptFunction) {
    return this.read(file, {encrypted: false})
      .then(encryptedData => {
        if(!assert.isString(encryptedData)) throw new Error('metadata is bubble is invalid');
        return decryptFunction(encryptedData);
      })
      .then(metadataStr => {
        if (!assert.isString(metadataStr)) throw new Error('metadata in bubble is invalid: not a string');
        let metadata;
        try {
          metadata = JSON.parse(metadataStr);
        }
        catch(error) {
          throw new Error('metadata in bubble is invalid: invalid json');
        }
        if (!assert.isObject(metadata)) throw new Error('metadata in bubble is invalid: not an object');
        if (!assert.isNotNull(metadata.encryptionPolicy)) throw new Error('metadata in bubble is invalid: missing encryption policy');
        return metadata;
      });
  }

}

