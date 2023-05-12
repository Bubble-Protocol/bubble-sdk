// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ContentId, assert } from "@bubble-protocol/core";
import { Bubble } from "./Bubble.js";
import { HTTPBubbleProvider } from "./bubble-providers/HTTPBubbleProvider.js";
import { EncryptionPolicy } from "./EncryptionPolicy.js";
import { NullEncryptionPolicy } from "./encryption-policies/NullEncryptionPolicy.js";


/**
 * Largest file id (2^256-1)
 */
const MAX_FILE_ID = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

/**
 * Null file id (64 zeros)
 */
const file0 = "0000000000000000000000000000000000000000000000000000000000000000";



/**
 * A wrapper around a Bubble that allows file and directory content to be accessed directly with
 * a content id.
 */
export class BubbleContentManager {

  /**
   * @dev optional function used to sign all calls to the Bubble server
   */
  signFunction;

  /**
   * @dev optional policy that identifies which files in the bubble are to be encrypted and
   * defines the encryption/decryption functions
   */
  encryptionPolicy = new NullEncryptionPolicy();


  /**
   * 
   * @param {Function} signFunction optional function to sign all transactions.  If not given in 
   * the constructor it must be given in each method call.  Takes the form:
   * 
   *   (Buffer: hash) => { return Promise to resolve the signature of the hash as a Buffer } 
   * 
   * @param {EncryptionPolicy} encryptionPolicy optional encryption policy
   */
  constructor(signFunction, encryptionPolicy) {
    this.signFunction = signFunction;
    if (encryptionPolicy) this.setEncryptionPolicy(encryptionPolicy);
  }

  /**
   * Optional function to set an encryption policy.  Encryption policies determine which files to
   * encrypt and decrypt, and contain the encryption functions.
   * 
   * @param {EncryptionPolicy} policy the policy to adopt
   */
  setEncryptionPolicy(policy) {
    assert.isInstanceOf(policy, EncryptionPolicy, "encryption policy");
    this.encryptionPolicy = policy;
  }

  /**
   * Reads the remotely stored content represented by the given content id.  The user must have
   * permission to access the data or this function will reject with a permission denied error.
   *  
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve the content
   */
  read(contentId, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId);
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).read(id.file, options);
  }

  /**
   * Writes the given data to the file represented by the given content id.  The user must have
   * write permission or this function will reject with a permission denied error.
   *  
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {any} data the content to write
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve when complete
   */
  write(contentId, data, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId); 
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).write(id.file, data, options);
  }

  /**
   * Appends the given data to the file represented by the given content id.  The user must have
   * append or write permission or this function will reject with a permission denied error.
   *  
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {any} data the content to append
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve when complete
   */
  append(contentId, data, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId);
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).append(id.file, data, options);
  }

  /**
   * Deletes the file represented by the given content id.  The user must have write permission 
   * or this function will reject with a permission denied error.
   *  
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve when complete
   */
  delete(contentId, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId);
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).delete(id.file, options);
  }

  /**
   * Creates the directory represented by the given content id.  The user must have write permission 
   * or this function will reject with a permission denied error.
   *  
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve when complete
   */
  mkdir(contentId, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId);
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).mkdir(id.file, options);
  }

  /**
   * Lists the given file or directory.  Equivalent to `ls` on a POSIX system.
   * 
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve with the listing array
   */
  list(contentId, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId);
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).list(id.file, options);
  }

  /**
   * Returns the signer's permissions for the given content id.
   * 
   * @param {ContentId|String|Object} contentId the globally unique content id
   * @param {Object} options? optional options to pass to the bubble server
   * @param {Function} signFunction function to sign the transaction (not needed if given in the constructor)
   * @returns Promise to resolve with the permissions as a BubblePermissions object
   */
  getPermissions(contentId, options, signFunction) {
    [options, signFunction] = _validateOptions(options, signFunction);
    const id = new ContentId(contentId);
    return _getBubble(id, signFunction || this.signFunction, this.encryptionPolicy).getPermissions(id.file, options);
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
  toFileId(value, extension) {
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
  
}


/**
 * @dev constructs a Bubble from a ContentId and sign function.  Throws if the sign function is
 * missing or invalid.
 */
function _getBubble(contentId, signFunction, encryptionPolicy) {
  if (signFunction === undefined) throw new TypeError("missing signFunction");
  if (!assert.isFunction(signFunction)) throw new TypeError("invalid signFunction");
  return new Bubble(
    contentId, 
    new HTTPBubbleProvider(new URL(contentId.provider)),
    signFunction,
    encryptionPolicy)
}


/**
 * @dev validates the optional `options` parameter and shifts the signFunction if required.
 */
function _validateOptions(options, signFunction) {
  if (signFunction === undefined && assert.isFunction(options)) return [undefined, options];
  if (options !== undefined && !assert.isObject(options)) throw new TypeError("invalid options");
  return [options, signFunction];
}

