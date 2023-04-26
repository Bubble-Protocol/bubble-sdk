// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.


/**
 * Bubble server error codes
 */

export const ErrorCodes = {
  BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED: -32000,
  BUBBLE_ERROR_BUBBLE_TERMINATED: -32001,
  BUBBLE_ERROR_PERMISSION_DENIED: -32002,
  BUBBLE_ERROR_AUTHENTICATION_FAILURE: -32003,
  BUBBLE_ERROR_METHOD_FAILED: -32004,
  BUBBLE_ERROR_INTERNAL_ERROR: -32005,
  BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS: -32020,
  BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST: -32021,
  BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST: -32022,
  BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS: -32023,
  BUBBLE_SERVER_ERROR_DIR_NOT_EMPTY: -32024
    // -32040..-32099 reserved for data server errors
}


/**
 * Base class for all Bubble errors
 */

export class BubbleError extends Error {

  constructor(code, message, options) {
    super(message, options);
    this.code = code;
  }

  toJSON() {
    return JSON.stringify({
      error: {
        code: this.code,
        message: this.message,
        cause: this.options && this.options.cause ? this.options.cause : undefined
      }
    })
  }

  toObject() {
    return {
      code: this.code,
      message: this.message,
      options: this.options
    }
  }
  
}