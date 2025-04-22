// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ROOT_PATH, BubbleProvider, BubblePermissions, assert, BubbleError, ErrorCodes, BubbleFilename } from '@bubble-protocol/core';


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
  async post(method, params, subscriptionListener) {

    if (method === 'subscribe') assert.isFunction(subscriptionListener, 'subscriptionListener');

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

    if (!assert.isNotNull(params.signature))
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'missing signature');

    if (params.file !== undefined && (!assert.isString(params.file) || !assert.isNotEmpty(params.file))) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file');

    if (params.file === undefined && ['write', 'append', 'read', 'delete', 'mkdir', 'list', 'getPermissions', 'subscribe'].includes(method)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'missing file param');
      
    if (params.data !== undefined && !assert.isString(params.data)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed data');

    if (params.subscriptionId === undefined && method === 'unsubscribe') 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'missing subscriptionId param');

    if (params.options && !assert.isObject(params.options)) 
      throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed options');


    /**
     * Enforce form of contract as lowercase.  Filename enforcement is performed by BubbleFilename.
     */
    
    params.contract = params.contract.toLowerCase();


    /**
     * Validate request
     */

    const file = await this._validateRequest(params);


    /**
     * Service an unsubscribe request regardless of the sender
     */

    if (method === 'unsubscribe') {
      return this.dataServer.unsubscribe(params.subscriptionId, params.options)
        .catch(_validateDataServerError);
    }


    /**
     * Recover signatory
     */

    const signatory = await this._recoverSignatory(method, params);


    /** 
     * Get permissions from ACC
     */

    const permissionBits = await this._getPermissions(params.contract, file.getPermissionedPart(), signatory);
    file.setPermissions(new BubblePermissions(permissionBits)); 


    /**
     * Service getPermissions request regardless of whether or not the bubble has been terminated or whether
     * the permissions are valid.
     */
    
    if (method === 'getPermissions') return Promise.resolve('0x'+permissionBits.toString(16));


    /**
     * Check whether the file is still valid now that permissions have been set (a file path with both directory
     * and file parts is invalid if the permissions indicate the directory part is not a directory).
     * 
     * Note, this must be checked AFTER bubbleTerminated() since 
     */

    if (!file.isValid()) throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');


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

      case "subscribe":
        if (file.permissions.canRead()) {
          const subscription = new ProtectedSubscription(this.blockchainProvider, params.contract, file, signatory, subscriptionListener);
          return this.dataServer.subscribe(params.contract, file.fullFilename, subscription.listener, params.options)
            .catch(_validateDataServerError);
        }
        else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      case "terminate": // terminate is handled above if ACC has been terminated
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'permission denied');

      default:
        throw new BubbleError(JSON_RPC_ERROR_METHOD_NOT_FOUND, 'unknown method: '+method);
    }
  }


  /**
   * Validates the chain id and timestamp, and ensures params.file has a valid form
   * 
   * @returns promise to resolve a BubbleFilename object constructed from params.file
   * @throws if the chain is not supported, the timestamp is out of date or the file is invalid.
   */
  async _validateRequest(params) {

    /**
     * Parse and validate params.file
     */

    const file = new BubbleFilename(params.file || ROOT_PATH);
    if (!file.isValid()) throw new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file');
    
    /**
     * Validate timestamp
     */

    // TODO

    /** 
     * Validate params.chainId
     */

    if (params.chainId !== this.blockchainProvider.getChainId()) 
    throw new BubbleError(ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED, 'blockchain not supported');

    return file;
  }


  /**
   * Recovers the signatory of the request. If a delegate is present then it is validated
   * and confirmed to delegate permission to the request signatory.
   * 
   * @returns promise to resolve the signatory or delegate signatory of the request
   * @throws if the signature or delegate is invalid or the delegate does not permit the signatory
   */
  async _recoverSignatory(method, params) {

    const packet = {
      method: method,
      params: {...params}
    }
    delete packet.params.signature;

    let signature = params.signature;

    try {
      return await this.blockchainProvider.recoverSignatory(packet, signature, 'rpc');
    }
    catch(error) {
     throw error.code ? error : new BubbleError(JSON_RPC_ERROR_INVALID_METHOD_PARAMS, `invalid signature - ${error.message}`, {cause: error.cause});
    }
  }


  async _getPermissions(contract, file, signatory) {
    return getPermissions(this.blockchainProvider, contract, file, signatory);
  }


}


/**
 * Ensures the given error has an error code. If not, a new internal BubbleError is constructed.
 */

function _validateDataServerError(err = new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server error')) {
  throw err.code === undefined ? new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, err.message || err) : err;
}


/** 
 * Get permissions from the ACC
 * 
 * @returns promise to resolve the permission bits
 * @throws if the blockchain cannot be reached or the contract is not an ACC
 */

async function getPermissions(blockchainProvider, contract, file, signatory) {
  try {
    return await blockchainProvider.getPermissions(contract, signatory, file);
  }
  catch(error) {
    if(error && error.message && error.message.match("execution reverted")) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_METHOD_FAILED, 'Blockchain reverted. Is this an Access Control Contract?', {cause: error.message});
    }
    else throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'Blockchain unavailable - please try again later.', {cause: error.message});
  }
}


/**
 * A ProtectedSubsciption listener is designed to be called by the data server to serve notice of a
 * subscription event to a client. It wraps a client subscription listener with a permission check
 * to ensure the client is still permitted to access the subscribed file when a notification from
 * the data server is received. If permitted, the notification is forwarded to the client listener.
 * If not, the data server is instructed to terminate the subscription by returning the permission
 * error, and an error is passed to the client listener informing it that permission is denied and
 * that the subscription has been terminated.
 * 
 * @returns an error if permission is denied or the blockchain cannot be reached.  The data server
 * must check for a permission denied error and unsubscribe the client.
 */
class ProtectedSubscription {

  constructor(blockchainProvider, contract, file, signatory, clientListener) {
    this.blockchainProvider = blockchainProvider;
    this.contract = contract;
    this.file = file;
    this.signatory = signatory;
    this.clientListener = clientListener;
    this.listener = this.listener.bind(this);
  }

  async listener(subscriptionId, result, error) {
    assert.isNotNull(subscriptionId, 'subscriptionId');
    const permissionBits = await getPermissions(this.blockchainProvider, this.contract, this.file.getPermissionedPart(), this.signatory);
    const permissions = new BubblePermissions(permissionBits);
    if (!permissions.canRead()) {
      const terminatedError = new BubbleError(ErrorCodes.BUBBLE_ERROR_SUBSCRIPTION_TERMINATED, 'permission denied - subscription terminated');
      this.clientListener(subscriptionId, undefined, terminatedError);
      return error;
    }
    else {
      this.clientListener(subscriptionId, result, error)
    }
  }

}
