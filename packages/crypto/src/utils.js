// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const VALID_HEX_STRING_REGEX = /^(0x)?[0-9a-fA-F]+$/;

/**
 * Converts a hex string (with or without leading `0x`) to a Uint8Array
 * 
 * @param {string} hexString the hex to convert
 * @returns the Uint8Array
 */
export function hexToUint8Array(hexString) {
  if(hexString === undefined || !VALID_HEX_STRING_REGEX.test(hexString)) throw new TypeError('hexString type. Expected hex string');
  return Uint8Array.from(Buffer.from(strip0x(hexString), 'hex'));
}


/**
 * Converts a Uint8Array to a hex string 
 * 
 * @param {Uint8Array} buffer 
 * @returns the hex string (without a leading `0x`)
 */
export function uint8ArrayToHex(buffer) {
  if (!(buffer instanceof Uint8Array)) throw new TypeError('buffer type. Expected Uint8Array');
  return Buffer.from(buffer).toString('hex');
}


/**
 * Strips any leading `0x` from the given hex string
 */
export function strip0x(hexString) {
  return (hexString && hexString.slice(0,2) === '0x') ? hexString.slice(2) : hexString;
}


/**
 * Platform agnostic crypto object. Works in node and in the browser.
 * @throws if the crypto object is missing
 */
const _crypto = crypto || window.crypto;
export function getCrypto() {
  if (!_crypto) throw new Error("Missing crypto capability");
  return _crypto;
}
