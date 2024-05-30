// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { EncryptionPolicy } from '../EncryptionPolicy.js';
import { assert } from '@bubble-protocol/core';
import { ecies } from '@bubble-protocol/crypto';

/**
 * Encryption Policy that encrypts all files with the user's public key using ECIES encryption.
 * Override `isEncrypted()` to change the policy.
 */

export class ECIESEncryptionPolicy extends EncryptionPolicy {

  /**
   * @dev local user's public key and private key or decrypt function
   */
  userKeys;

  constructor(publicKey, privateKeyOrDecryptFunction) {
    super();
    ecies.assert.isCompressedPublicKey(publicKey, 'publicKey');
    let decryptFunction = privateKeyOrDecryptFunction;
    if (ecies.assert.isPrivateKey(privateKeyOrDecryptFunction)) {
      decryptFunction = (data) => Promise.resolve(ecies.decrypt(privateKeyOrDecryptFunction, data));
    }
    else assert.isFunction(privateKeyOrDecryptFunction, 'privateKeyOrDecryptFunction');
    this.userKeys = {publicKey: publicKey, decryptFunction: decryptFunction};
  }

  isEncrypted() {
    return true;
  }

  encrypt(data) {
    return Promise.resolve(ecies.encrypt(this.userKeys.publicKey, data));
  }

  decrypt(data) {
    return this.userKeys.decryptFunction(data);
  }

  serialize() {
    return Promise.resolve({ type: 'ECIESEncryptionPolicy' });
  }

  deserialize(data) {
    if (!assert.isObject(data)) return Promise.reject('cannot deserialize ECIESEncryptionPolicy: policy data is invalid - expected object');
    if (data.type !== 'ECIESEncryptionPolicy') return Promise.reject('cannot deserialize policy: not a ECIESEncryptionPolicy');
    return Promise.resolve();
  }

}
