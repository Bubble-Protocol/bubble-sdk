
// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleFilename } from './BubbleFilename.js';
import * as assert from './assertions.js';
import { BubbleError, ErrorCodes } from './errors.js';

export class ContentId {

  chain;
  contract;
  provider;
  file;

  /**
   * Constructs a new Bubble ContentId from a base64 encoded id, a Bubble DID or a plain object
   * 
   * @param {String|Object} stringOrObject either a base64 encoded content ID or a plain content ID 
   * object with at least chain, contract and provider fields.
   */
  constructor(stringOrObject) {

    // Basic parameter validation
    const isString = assert.isString(stringOrObject);
    const isObj = assert.isObject(stringOrObject);
    if (!isString && !isObj) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INVALID_CONTENT_ID, "Invalid content id");
    
    let id = stringOrObject;

    // Decode if string or DID
    if (isString) {

      // Validate the DID method (if present)      
      if (id.slice(0,4) === 'did:' && id.slice(0,11) !== 'did:bubble:') 
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INVALID_CONTENT_ID, "Invalid content id", {cause: 'not a Bubble DID'});

      // Extract the base64 if a DID
      const b64Id = id.slice(0,11) === 'did:bubble:' ? id.slice(11) : id;

      // Decode from base64
      if (!assert.isBase64OrBase64UrlString(b64Id))
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INVALID_CONTENT_ID, "Invalid content id");
      try {
        id = _decodeId(b64Id);
        assert.isObject(id, 'decoded content id');
      }
      catch(error) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INVALID_CONTENT_ID, "Invalid content id", {cause: error.message || error});
      }

    }

    // Validate id fields
    const error = 
      !assert.isNumber(id.chain) || 
      !assert.isHexString(id.contract) || 
      !assert.isString(id.provider) || 
      id.file ? !(new BubbleFilename(id.file)).isValid() : false;
    if (error) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INVALID_CONTENT_ID, "Invalid content id", {cause: "invalid object field(s)"});
    
    // Construct this object
    this.chain = id.chain;
    this.contract = id.contract;
    this.provider = id.provider;
    this.file = id.file;
  }


  /**
   * Sets or replaces this content id's file field.
   * 
   * @param {String} file must be a valid bubble path
   */
  setFile(file) {
    if (!(new BubbleFilename(file)).isValid()) throw new TypeError('Invalid file parameter');
    this.file = file;
  }


  /**
   * @returns the base64 encoded id
   */
  toString() {
    return _encodeId(this.toObject());
  }


  /**
   * @returns a plain object representing this content id
   */
  toObject() {
    const plainObj = {
      chain: this.chain,
      contract: this.contract,
      provider: this.provider
    };
    if (this.file) plainObj.file = this.file;
    return plainObj;
  }

  
  /**
   * @returns the base64 encoded decentralised identifier
   */
  toDID() {
    return 'did:bubble:' + this.toString();
  }

}


function _encodeId(id) {
  return Buffer.from(JSON.stringify(id), 'utf8').toString('base64url');
}


function _decodeId(str) {
  return JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
}