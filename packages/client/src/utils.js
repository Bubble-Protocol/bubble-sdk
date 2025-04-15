// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleFilename, assert } from "@bubble-protocol/core";


/**
 * Largest file id (2^256-1)
 */
const MAX_FILE_ID = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

/**
 * Null file id (64 zeros)
 */
const file0 = "0000000000000000000000000000000000000000000000000000000000000000";


/**
 * Converts a number, BigInt, ArrayBuffer or hex string (with or without 0x prefix) to a valid file id part of
 * a content id.  If the `value` is already a valid file id (with or without a path extension) it is simply 
 * returned.
 * 
 * @param {Number|BigInt|ArrayBuffer|hex string} value the value to convert
 * @param {string} extension optional path extension to append to the converted value
 * @returns String containing the 32-byte hex filename prefixed with 0x
 * @throws if the parameter is an invalid type of is out of range
 */
export function toFileId(value, extension) {
  const pathExtension = extension ? '/'+extension : '';
  // Pass through if already a valid file id
  if (extension === undefined && (new BubbleFilename(value)).isValid()) return value;
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
