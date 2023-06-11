// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";
import { EncryptionPolicy } from "../EncryptionPolicy.js";

/**
 * Encryption Policy that encrypts all files with AES-GCM encryption using a single private key.
 * Override `isEncrypted()` to change the policy.
 */

const Crypto = crypto || (window ? window.crypto : undefined);


export class AESGCMEncryptionPolicy extends EncryptionPolicy {

  constructor(privateKey) {
    super();
    if (privateKey === undefined) privateKey = Buffer.from(Crypto.getRandomValues(new Uint8Array(32))).toString('hex');
    this.setKey(privateKey);
  }

  setKey(privateKey) {
    isAesKey(privateKey, 'private key');
    if (!Crypto.subtle) throw new Error('missing crypto.subtle');
    this.privateKey = Buffer.from(privateKey, 'hex');
  }

  isEncrypted() {
    return true;
  }

  encrypt(data) {
    const iv = Crypto.getRandomValues(new Uint8Array(12));
    return this._getKey()
      .then(key => {
        return Crypto.subtle.encrypt({name: 'AES-GCM', iv: iv}, key, data);
      })
      .then(encryptedData => {
        return buf2hex(concat(iv, encryptedData));
      });
  }

  decrypt(data) {
    const buf = hexToBuf(data);
    const iv = buf.slice(0,12);
    const encryptedData = buf.slice(12);
    return this._getKey()
      .then(key => {
        return Crypto.subtle.decrypt({name: 'AES-GCM', iv: iv}, key, encryptedData);
      });
  }

  serialize() {
    return Promise.resolve({
      type: 'AESGCMEncryptionPolicy',
      privateKey: this.privateKey.toString('hex')
    })
  }

  deserialize(data) {
    if (!assert.isObject(data)) return Promise.reject('cannot deserialize AESGCMEncryptionPolicy: policy data is invalid - expected object');
    if (data.type !== 'AESGCMEncryptionPolicy') return Promise.reject('cannot deserialize policy: not a AESGCMEncryptionPolicy');
    try {
      this.setKey(data.privateKey);
      return Promise.resolve();
    }
    catch(error) {
      return Promise.reject(error);
    }
  }

  _getKey() {
    if (this.key) return Promise.resolve(this.key);
    else {
      if (!this.privateKey) throw new Error('private key has not been set');
      return Crypto.subtle.importKey("raw", this.privateKey, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt'])
        .then(key => {
          this.key = key;
          return key;
        })
    }
  }

}


//
// Internal functions
//

const VALID_KEY_REGEX = /^(0x)?[0-9a-fA-F]{64}$/;

function isAesKey(value, name) {
  const result = VALID_KEY_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 64");
  else return result;
};


function buf2hex(buffer, prefix0x=true) {
  return (prefix0x ? '0x' : '')+[...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}


function hexToBuf(hex) {
  return Uint8Array.from(hex.replace('0x','').match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}


function concat(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}