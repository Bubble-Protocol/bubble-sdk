// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ROOT_PATH } from '../core/constants';
import { BubbleProvider } from '../core/BubbleProvider';
import {isHash, isPOSIXFilename} from '../../core/src/assertions';
import * as assert from '../../core/src/assertions';
import { BubblePermissions } from '../core/Permissions';
import { BubbleError, ErrorCodes } from '../core/errors';


/**
 * JSON RPC 2.0 error codes
 */

const JSON_RPC_ERROR_INVALID_REQUEST = -32600;
const JSON_RPC_ERROR_METHOD_NOT_FOUND = -32601;
const JSON_RPC_ERROR_INVALID_METHOD_PARAMS = -32602;


/**
 * Guardian of a Bubble server.
 * 
 * Protects all bubbles on a bubble server by enforcing the conditions of their access 
 * control contracts.  If the client request is permitted then it is passed to the DataServer
 * provided to the constructor.  If not permitted an error is passed back to the client.
 * The DataServer must unconditionally service any requests passed to it.
 */
export class Guardian extends BubbleProvider {

  dataServer;
  blockchainProvider;

  /**
   * @param _dataServer the data server that handles permitted RPCs
   * @param _blockchainProvider web3 provider for access to the blockchain
   */
  constructor(_dataServer, _blockchainProvider) {
    super();
    this.dataServer = _dataServer;
    this.blockchainProvider = _blockchainProvider;
  }


  /**
   * Receives a remote procedure call.  Passes it to the DataServer if valid and if the 
   * access control contract permits it.
   * 
   * @param method the RPC method
   * @param params the RPC params
   * @returns Promise to service the call resolving with data if appropriate
   */
  async post(method, params) {

    /** 
     * Basic RPC field validation
     */

    if (!assert.isString(method))
      throw new BubbleError(JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method');

    if (!assert.isObject(params))
      throw new BubbleError(JSON_RPC_ERROR_INVALID_REQUEST, 'malformed params');

    if (!assert.isNumber(params.timestamp)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed timestamp');

    if (!assert.isString(params.nonce)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed nonce');

    if (!assert.isNumber(params.chainId)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed chainId');

    if (!assert.isAddress(params.contract)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract');

    if (!assert.isAddress(params.signatory)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signatory');

    if (!assert.isHexString(params.signature)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signature');

    if (params.file !== undefined && !assert.isString(params.file)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file');

    if (params.file === undefined && ['write', 'append', 'read', 'delete', 'mkdir', 'list'].includes(method)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'missing file param');
      
    if (params.data !== undefined && !assert.isString(params.data)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed data');

    if (params.options && !assert.isObject(params.options)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed options');


    /**
     * Parse and validate params.file
     */

    const file = new BubbleFilename(params.file || ROOT_PATH);
    if (!file.isValid()) throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file');


    /**
     * Recover signatory from signature and validate against params.signatory
     */
    const packet = {
      method: method,
      params: {...params}
    }
    delete packet.params.signature;
    const signatory = await this.blockchainProvider.recoverSignatory(JSON.stringify(packet), params.signature);
    if (!assert.isAddress(signatory)) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'Blockchain unavailable - please try again later');
    if (signatory.toLowerCase() !== params.signatory.toLowerCase()) 
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_AUTHENTICATION_FAILURE, "signature is invalid");


    /** 
     * Validate params.chainId
     */

    if (params.chainId !== this.blockchainProvider.getChainId()) 
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED, 'blockchain not supported');


    /** 
     * Get permissions from ACC
     */

    const permissionBits = await this.blockchainProvider.getPermissions(params.contract, signatory, file.getPermissionedPart());
    if (permissionBits === undefined) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'Blockchain unavailable - please try again later.');
    file.setPermissions(new BubblePermissions(permissionBits));


    /**
     * Throw if the bubble has been terminated. Since the ACC is the bubble's master and we now 
     * know it has been terminated, instruct the data server to delete the bubble.  If the data
     * server fails to delete the bubble then instruct the client to send a terminate request
     * (the data server is responsible for logging the cause of the error in this case).
     */

    if (file.permissions.bubbleTerminated()) {
      const terminateOptions = (method === 'terminate') ? params.options : undefined;
      return this.dataServer.terminate(params.contract, terminateOptions)
        .then(() => {
          if (method === 'terminate') return;
          else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_BUBBLE_TERMINATED, 'bubble has been terminated');
        })
        .catch((err) => {
          if (method === 'terminate') return _validateDataServerError(err);
          else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_BUBBLE_TERMINATED, "bubble has been terminated - send a 'terminate' request to delete the bubble data");
        })
    }


    /** 
     * Check whether the file is still valid after setting permissions (a file path with both directory
     * and file parts is invalid if the permissions indicate the directory part is not a directory)
     */

    if (!file.isValid()) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');


    /**
     * Service the RPC
     */

    switch (method) {

      case "create":
        if (file.isRoot() && file.permissions.canWrite()) {
          return this.dataServer.create(params.contract, params.options)
            .catch(_validateDataServerError);
        }
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "write":
        if (params.data === undefined) throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'no data');
        else if (file.isFile() && file.permissions.canWrite())
          return this.dataServer.write(params.contract, file.fullFilename, params.data, params.options)
            .catch(_validateDataServerError);
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "append":
        if (params.data === undefined) throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'no data');
        else if (file.isFile() && (file.permissions.canAppend() || file.permissions.canWrite()))
          return this.dataServer.append(params.contract, file.fullFilename, params.data, params.options)
            .catch(_validateDataServerError);
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "read":
        if (file.permissions.canRead()) 
          return this.dataServer.read(params.contract, file.fullFilename, params.options)
            .catch(_validateDataServerError);
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "delete":
        if (!file.isRoot() && file.permissions.canWrite())
          return this.dataServer.delete(params.contract, file.fullFilename, params.options)
            .catch(_validateDataServerError);
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "mkdir":
        if (!file.isRoot() && file.isDirectory() && file.permissions.canWrite())
          return this.dataServer.mkdir(params.contract, file.fullFilename, params.options)
            .catch(_validateDataServerError);
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "list":
        if (file.permissions.canRead())
          return this.dataServer.list(params.contract, file.fullFilename, params.options)
            .catch(_validateDataServerError);
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "terminate": // terminate is handled above if ACC has been terminated
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      default:
        throw new BubbleError(JSON_RPC_ERROR_METHOD_NOT_FOUND, 'unknown method: '+method);
    }
  }

}


/**
 * Deconstructs a string filename representing a file or directory in a bubble.  Bubble
 * path names consist of <file-or-directory-hash>[/<posix-filename>].  Bubbles don't have
 * the concept of nested directories at the storage level - if required it can be implemented at
 * application level.
 * 
 * @dev Always confirm isValid() before relying on any other accessor function.
 */
class BubbleFilename {

  fullFilename;
  permissions;

  constructor(filenameStr) {
    this.fullFilename = filenameStr;
    this._parts = filenameStr.split('/');
    this._valid = 
      this._parts.length === 1 ? isHash(this._parts[0]) :
      this._parts.length === 2 ? isHash(this._parts[0]) && isPOSIXFilename(this._parts[1]) :
      false;
  }

  setPermissions(permissions) {
    this.permissions = permissions;
    if (this._parts.length === 2 && !permissions.isDirectory()) this._valid = false;
  }

  getPermissionedPart() {
    return this._parts[0];
  }

  isFile() {
    return !this.isDirectory();
  }

  isDirectory() {
    return this._parts.length === 1 && this.permissions.isDirectory() === true;
  }

  isRoot() {
    return this._parts[0].toLowerCase() === ROOT_PATH;
  }

  isValid() {
    return this._valid;
  }

}


function _validateDataServerError(err = new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server error')) {
  throw err.code === undefined ? new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, err.message || err) : err;
}

