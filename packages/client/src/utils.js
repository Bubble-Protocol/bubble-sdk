// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";


/**
 * Takes a signature produced by an Ethereum wallet and prepares it for adding to a request.
 * 
 * Ethereum wallets always prefix signed messages to ensure a user can't be manipulated into
 * signing a transaction.  A storage server's Guardian needs to take this into account when 
 * recovering the signatory from a signed request.
 * 
 * @param {string} sig signature
 * @returns signature object
 */
export function toEthereumSignature(sig) {
  return {
    signaturePrefix: "\x19Ethereum Signed Message:\n64",
    signature: sig
  }
}


/**
 * Alternative method of preparing an Ethereum signature for adding to a request 
 * (@see `toEthereumSignature`).
 * 
 * @param {function} signFunction sign function whose signature must be converted
 * @returns the same signFunction
 */
export function toEthereumSignFunction(signFunction) {
  return (hash) => signFunction(hash).then(toEthereumSignature);
}


/**
 * Converts a number, BigInt, ArrayBuffer or hex string (with or without 0x prefix) to a valid file id part of
 * a content id.
 * 
 * @param {Number|BigInt|ArrayBuffer|hex string} value the value to convert
 * @param {string} extension optional path extension to append to the converted value
 * @returns String containing the 32-byte hex filename prefixed with 0x
 * @throws if the parameter is an invalid type of is out of range
 */
export function toFileId(value, extension) {
  const pathExtension = extension ? '/'+extension : '';
  // Numbers
  if (assert.isNumber(value) || assert.isBigInt(value)) {
    if (value < 0 || assert.isBigInt(value) && value > MAX_FILE_ID) throw new Error('parameter out of range');
    return '0x' + (file0 + value.toString(16)).slice(-64) + pathExtension;
  }
  // Buffers and hex strings
  if (assert.isBuffer(value)) value = value.toString('hex');
  if (assert.isHexString(value)) {
    if (value.slice(0,2) === '0x') value = value.slice(2);
    if (value.length > 64) throw new Error('parameter out of range');
    return '0x' + (file0 + value).slice(-64) + pathExtension;
  }
  // Invalid type
  throw new TypeError('Invalid parameter. Must be a number, BigInt or hex string');
}
