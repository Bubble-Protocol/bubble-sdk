// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ROOT_PATH, BubbleProvider, BubblePermissions, assert, BubbleError, ErrorCodes, BubbleFilename } from '@bubble-protocol/core';
import Web3 from 'web3';
import { parseDelegation } from './Delegation.js';


/**
 * Signatory used to get permissions if the request is a public request.
 * (Account address of a private key generated from the hash of '<Bubble Protocol Public Signatory>')
 */

const PUBLIC_SIGNATORY = "0x99e2c875341d1cbb70432e35f5350f29bf20aa52";


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
  constructor(_dataServer, _blockchainProvider, _id) {
    super();
    assert.isString(_id, 'id');
    this.dataServer = _dataServer;
    this.blockchainProvider = _blockchainProvider;
    this.id = _id;
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

    if (!assert.isString(method) || !assert.isNotEmpty(method))
      throw new BubbleError(JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method');

    if (!assert.isObject(params))
      throw new BubbleError(JSON_RPC_ERROR_INVALID_REQUEST, 'malformed params');

    if (!assert.isNumber(params.timestamp)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed timestamp');

    if (!assert.isString(params.nonce) || !assert.isNotEmpty(params.nonce)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed nonce');

    if (!assert.isNumber(params.chainId)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed chainId');

    if (!this.blockchainProvider.validateContract(params.contract)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract');

    if (params.signature !== 'public' && !assert.isHexString(params.signature)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signature');

    if (params.signaturePrefix && !assert.isString(params.signaturePrefix)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signaturePrefix');

    if (params.file !== undefined && (!assert.isString(params.file) || !assert.isNotEmpty(params.file))) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file');

    if (params.file === undefined && ['write', 'append', 'read', 'delete', 'mkdir', 'list', 'getPermissions'].includes(method)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'missing file param');
      
    if (params.data !== undefined && !assert.isString(params.data)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed data');

    if (params.options && !assert.isObject(params.options)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed options');

    if (params.delegate && !assert.isObject(params.delegate)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed delegate');


    // TODO validate timestamp

    /**
     * Parse and validate params.file
     */

    const file = new BubbleFilename(params.file || ROOT_PATH);
    if (!file.isValid()) throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file');


    /**
     * Recover signatory from signature.  Allow for a public request and an optional signature prefix.
     */

    let signatory;

    if (params.signature === 'public') signatory = PUBLIC_SIGNATORY;

    else {
      
      const signaturePrefix = params.signaturePrefix;

      const packet = {
        method: method,
        params: {...params}
      }
      delete packet.params.signature;
      delete packet.params.signaturePrefix;
      delete packet.params.delegate;

      let hash = Web3.utils.keccak256(JSON.stringify(packet)).slice(2);
      if (signaturePrefix) hash = Web3.utils.keccak256(signaturePrefix+hash).slice(2);

      const signature = params.signature.slice(0,2) === '0x' ? params.signature.slice(2) : params.signature;

      try {
        signatory = await this.blockchainProvider.recoverSignatory(hash, signature);
      }
      catch(error) {
        throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'cannot decode signature');
      }
      if (!assert.isHexString(signatory)) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'Blockchain unavailable - please try again later');

    }


    /** 
     * Validate params.chainId
     */

    if (params.chainId !== this.blockchainProvider.getChainId()) 
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED, 'blockchain not supported');


    /**
     * Recover delegate signatory, if present, and set as this requests signatory
     */

    if (params.delegate) {

      const delegate = await parseDelegation(params.delegate, this.blockchainProvider);
      if (!delegate.isValid()) 
        throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'cannot decode delegate', {cause: delegate.error.message || delegate.error});

      const revoked = await this.blockchainProvider.hasBeenRevoked(delegate.hash);
      const contentId = {chain: params.chainId, contract: params.contract, provider: this.id};
      if (revoked || !delegate.canAccessContent(signatory, contentId)) 
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'delegate denied');

      signatory = delegate.signatory;

    }


    /** 
     * Get permissions from ACC
     */

    let permissionBits;
    try {
      permissionBits = await this.blockchainProvider.getPermissions(params.contract, signatory, file.getPermissionedPart());
      file.setPermissions(new BubblePermissions(permissionBits));
    }
    catch(error) {
      if(error && error.message && error.message.match("execution reverted")) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_METHOD_FAILED, 'Blockchain reverted. Is this an Access Control Contract?', {cause: error.message});
      }
      else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'Blockchain unavailable - please try again later.', {cause: error.message});
    }

    /**
     * Handle getPermissions request
     */

    if (method === 'getPermissions') return Promise.resolve('0x'+permissionBits.toString(16));


    /**
     * Enforce form of contract as lowercase.  Filename enforcement is performed by BubbleFilename.
     */
    
    params.contract = params.contract.toLowerCase();


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
          return file.isDirectory()
            ? this.dataServer.list(params.contract, file.fullFilename, params.options)
                .catch(_validateDataServerError)
            : this.dataServer.read(params.contract, file.fullFilename, params.options)
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


function _validateDataServerError(err = new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server error')) {
  throw err.code === undefined ? new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, err.message || err) : err;
}

