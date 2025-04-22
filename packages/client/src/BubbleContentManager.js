// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ContentId, assert } from "@bubble-protocol/core";
import { Bubble } from "./Bubble.js";
import { EncryptionPolicy } from "./EncryptionPolicy.js";
import { NullEncryptionPolicy } from "./encryption-policies/NullEncryptionPolicy.js";
import { toFileId } from "./utils.js";


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
   *   (Object: packet) => { return Promise to resolve the signature }
   * 
   * The type and format of the signature must be appropriate to the blockchain platform.
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

  toFileId = toFileId;

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
    contentId.provider,
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

