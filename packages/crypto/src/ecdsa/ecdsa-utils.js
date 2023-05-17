// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { hexToUint8Array, uint8ArrayToHex, strip0x } from '../utils';
import * as assert from './assertions';
import secp256k1 from 'secp256k1';
import Web3 from 'web3';


/**
 * Signs the given hash with the given private key using secp256k1
 * 
 * @param {string} hash hash as a hex string
 * @param {string} privateKey private key as a hex string
 * @returns the signature;
 */
export function sign(hash, privateKey) {
  assert.isHash(hash, "hash");
  assert.isPrivateKey(privateKey, "privateKey");
  hash = strip0x(hash);
  privateKey = strip0x(privateKey);
  const sig = secp256k1.ecdsaSign(Buffer.from(hash, 'hex'), Buffer.from(privateKey, 'hex'));
  return Buffer.from(sig.signature).toString('hex')+Buffer.from([sig.recid]).toString('hex');
}


/**
 * Verifies that the signatory of the given hash and secp256k1 signature matches the given address
 */
export function verify(hash, signature, address) {
  assert.isAddress(address, "address");
  return recover(hash, signature) === address;
}


/**
 * Recovers the address of the signatory of the given hash and secp256k1 signature
 * 
 * @param {string} hash hash as a hex string
 * @param {string} signature signature as a hex string
 * @param {boolean} asPublicKey optional. If true the public key will be returned instead.
 * @returns the address of the signatory (or public key if the `asPublicKey` parameter is `true`)
 */
export function recover(hash, signature, asPublicKey=false) {
  assert.isHash(hash, 'hash');
  assert.isSignature(signature, "signature");
  hash = strip0x(hash);
  signature = strip0x(signature);
  const sig = {
    signature: hexToUint8Array(signature.slice(0, -1)),
    recid: parseInt(signature.slice(-1))
  }
  const publicKey = secp256k1.ecdsaRecover(sig.signature, sig.recid, hexToUint8Array(hash), false);
  if (asPublicKey) return uint8ArrayToHex(publicKey);
  else return publicKeyToAddress(uint8ArrayToHex(publicKey));
}


/**
 * Generates a keccak256 hash of the given data
 * 
 * @param {string} data data as a string
 * @param {string} encoding optional, defaults to utf8 - @see Buffer.from
 * @returns the hash (without leading `0x`)
 */
export function hash(data, encoding) {
  assert.isString(data, 'data');
  return Web3.utils.keccak256(Buffer.from(data, encoding)).slice(2);
}


/**
 * Calculates the address associated with a public key
 */
export function publicKeyToAddress(publicKey) {
  assert.isString(publicKey, 'publicKey');
  publicKey = strip0x(publicKey);
  if (publicKey.slice(0,2) !== '04') {
    assert.isCompressedPublicKey(publicKey, 'compressed publicKey');
    publicKey = _publicKeyConvert(publicKey);
  }
  assert.isUncompressedPublicKey(publicKey, 'publicKey');
  console.log(publicKey, hash(publicKey.slice(2)))
  return '0x' + hash(publicKey.slice(2), 'hex').slice(-40);
}


//
// Internal functions
//

/**
 * Convert a compressed publicKey string to an uncompressed one
 */
function _publicKeyConvert(cPub) {
  return uint8ArrayToHex(secp256k1.publicKeyConvert(hexToUint8Array(cPub), false));
}

