// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { getCrypto, hexToUint8Array, uint8ArrayToHex, strip0x } from '../utils';
import { publicKeyToAddress, sign } from './ecdsa-utils';
import * as assert from './assertions';
import secp256k1 from 'secp256k1';

/**
 * Encapsulates a private key and provides cryptographic functions that use it
 */
export class Key {

  /**
   * Private key as a hex string
   */
  privateKey;

  /**
   * Private key as a Uint8Array
   */
  privateKeyBuf;

  /**
   * Uncompressed public key as a hex string
   */
  uPublicKey;

  /**
   * Compressed public key as a hex string
   */
  cPublicKey;

  /**
   * Account address
   */
  address;


  /**
   * Construct a Key from a given private key or generate a new random Key.
   * 
   * @param {string} privateKey optional hex string containing a 32-byte valid private key. If
   * missing a new random key will be generated.
   */
  constructor(privateKey) {
    this.privateKey = privateKey || _generatePrivateKey();
    assert.isPrivateKey(this.privateKey, 'privateKey');
    this.privateKey = strip0x(this.privateKey);
    this.privateKeyBuf = hexToUint8Array(this.privateKey);
    [this.uPublicKey, this.cPublicKey] = _generatePublicKeys(this.privateKeyBuf);
    this.address = publicKeyToAddress(this.uPublicKey);
  }


  /**
   * Signs the given hash with this key
   */
  sign(hash) {
    return sign(hash, this.privateKey);
  }

}


//
// Internal functions
//


/**
* Generates a new random private key as a hex string
*/
function _generatePrivateKey() {
  const crypto = getCrypto();
  var privateKey;
  do {
    privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);
  } while (!secp256k1.privateKeyVerify(privateKey));
  return uint8ArrayToHex(privateKey);
}

/**
 * Calculate compressed and uncompressed public keys from a private key
 */
function _generatePublicKeys(privateKeyBuf) {
  const uPub = secp256k1.publicKeyCreate(privateKeyBuf, false);
  const cPub = secp256k1.publicKeyConvert(uPub, true);
  return [uint8ArrayToHex(uPub), uint8ArrayToHex(cPub)];
}

