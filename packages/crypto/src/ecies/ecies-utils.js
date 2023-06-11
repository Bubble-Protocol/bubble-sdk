// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { strip0x } from '../utils.js';
import eccrypto from 'eccrypto';
import * as assert from './assertions.js';

/**
 * Encrypt data with ECIES using the given the public key.
 * 
 * @param {String} publicKey Compressed public key as a hex string
 * @param {String} data data to encrypt
 * @returns Promise to resolve with the encrypted data as a string
 */
export function encrypt(publicKey, data) {
  assert.isCompressedPublicKey(publicKey, 'publicKey');
  assert.isString(data, 'data');
  publicKey = strip0x(publicKey);
  data = strip0x(data);
  return eccrypto.encrypt(Buffer.from(publicKey, 'hex'), Buffer.from(data)).then(eciesStructureToHex);
}


/**
 * Decrypt data with ECIES using the given private key.
 * 
 * @param {String} privateKey Private key as a hex string
 * @param {String} data encrypted data
 * @returns Promise to resolve the decrypted data as a string
 */
export function decrypt(privateKey, data) {
  assert.isPrivateKey(privateKey, 'privateKey');
  assert.isString(data, 'data');
  privateKey = strip0x(privateKey);
  data = strip0x(data);
  return eccrypto.decrypt(Buffer.from(privateKey, 'hex'), hexToEciesStructure(data))
    .then(buf => {
      return buf.toString();
    })
    .catch(error => {
      throw new Error('could not decrypt ECIES data: ' + error.message || error);
    });
}


//
// Internal functions
//

/**
 * @dev converts eccrypto encryption format to hex string
 */
function eciesStructureToHex(s) {
  const buf = Buffer.concat([s.iv, s.ephemPublicKey, s.mac, s.ciphertext]);
  return buf.toString('hex');
}

/**
 * @dev converts hex string to eccrypto encryption format
 */
function hexToEciesStructure(hex) {
  const buf = Buffer.from(hex, 'hex');
  const result = {
    iv: buf.slice(0,16),
    ephemPublicKey: buf.slice(16,81),
    mac: buf.slice(81,113),
    ciphertext: buf.slice(113)
  }
  return result;
}