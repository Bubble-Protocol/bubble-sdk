// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import web3 from "web3";
import { EncryptionPolicy, NullEncryptionPolicy } from "./EncryptionPolicy";
import { BubblePermissions, BubbleProvider, ROOT_PATH, assert } from '@bubble-protocol/core';


export class Bubble {

  /**
   * @dev api to the bubble server
   */
  provider;

  /**
   * @dev RPCFactory used to construct remote procedure calls ready for sending
   */
  rpcFactory;

  /**
   * Represents a Bubble hosted on an external Bubble server.
   * 
   * @param _provider {BubbleProvider} - the storage service provider
   * @param _contract {Address} - the contract address that identifies the bubble
   * @param _signFunction - function that takes a hash as a Buffer and promises to resolve the
   *   user's signature of that data in a format appropriate to the blockchain controlling this
   *   bubble.
   */
  constructor(_provider, _chainId, _contract, _signFunction ) {
    assert.isInstanceOf(_provider, BubbleProvider, "provider");
    this.provider = _provider;
    this.rpcFactory = new RPCFactory(_chainId, _contract, _signFunction);
    this.post = this.post.bind(this);
  }

  /**
   * Optional function to set an encryption policy.  Encryption policies determine which files in the 
   * bubble are encrypted and contain the encryption function.
   * 
   * @param _policy {EncryptionPolicy} - the policy to adopt
   */
  setEncryptionPolicy(_policy) {
    this.rpcFactory.setEncryptionPolicy(_policy);
  }

  /**
   * Construct the bubble on the bubble server.
   * 
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve when the bubble is constructed
   */
  create(options) {
    return this.rpcFactory.create(options)
      .then(this.post);
  }

  /**
   * Writes the given data to the given file.  The data will be encrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param _path file to write to
   * @param data the data to write
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve when complete
   */
  write(_path, data, options) {
    const encrypt = (options && options.encrypted) || this.rpcFactory.encryptionPolicy.isEncrypted(_path);
    const dataToSend = (data && encrypt) ? this.rpcFactory.encryptionPolicy.encrypt(_path, data) : data;
    return this.rpcFactory.write(_path, dataToSend, options)
      .then(this.post);
  }

  /**
   * Appends the given data to the given file.  The data will be encrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param _path file to append to
   * @param data the data to append
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve when complete
   */
  append(_path, data, options) {
    const encrypt = (options && options.encrypted) || this.rpcFactory.encryptionPolicy.isEncrypted(_path);
    const dataToSend = (data && encrypt) ? this.rpcFactory.encryptionPolicy.encrypt(_path, data) : data;
    return this.rpcFactory.append(_path, dataToSend, options)
      .then(this.post);
  }

  /**
   * Reads the given file.  The contents will be decrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param _path file to read from
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve with the file contents
   */
  read(_path = ROOT_PATH, options) {
    const decrypt = (options && options.encrypted) || this.rpcFactory.encryptionPolicy.isEncrypted(_path);
    return this.rpcFactory.read(_path, options)
      .then(this.post)
      .then(data => {
        return (data && decrypt) ? this.rpcFactory.encryptionPolicy.decrypt(_path, data) : data || '';
      })
  }

  /**
   * Deletes the given file.  
   * 
   * `providerOpts`:
   *    `force` - force delete of a non-empty directory
   *    `silent` - don't throw an error if file does not exist
   * 
   * @param _path file to delete
   * @param options passed transparently to the bubble server.
   * @returns Promise to resolve when complete
   */
  delete(_path, options) {
    return this.rpcFactory.delete(_path, options)
      .then(this.post);
  }

  /**
   * Creates the given directory.  
   * 
   * `providerOpts`:
   *    `silent` - don't throw an error if directory already exists
   * 
   * @param _path directory to create
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve when complete
   */
  mkdir(_path, options) {
    return this.rpcFactory.mkdir(_path, options)
      .then(this.post);
  }

  /**
   * Lists the given file or directory.  Equivalent to `ls` on a POSIX system.
   * 
   * @param _path file or directory to list
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve with the listing
   */
  list(_path, options) {
    return this.rpcFactory.list(_path, options)
      .then(this.post)
      .then(result => {
        if (!result) throw new Error('list returned null');
        return result;
      });
  }

  /**
   * Gets the permissions bitmap for the given file or directory as specified by the smart 
   * contract.  Use the `Permissions` class to decode.
   * 
   * @param _path file or directory
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve with the listing
   */
  getPermissions(_path, options) {
    return this.rpcFactory.getPermissions(_path, options)
      .then(this.post)
      .then(result => {
        if (!assert.isHexString(result)) throw new Error('bubble server returned invalid permissions');
        return new BubblePermissions(BigInt(result, 16));
      });
  }

  /**
   * Resolves to true if the bubble's smart contract has been terminated.
   * 
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve with a boolean
   */
  isTerminated(options) {
    return this.getPermissions(ROOT_PATH, options)
    .then(permissions => {
      return permissions.bubbleTerminated();
    });
  }

  /**
   * Delete the bubble on the server.  This will only succeed if the bubble's smart contract has
   * already been terminated.
   * 
   * @param options passed transparently to the bubble server
   * @returns Promise to resolve when complete
   */
  terminate(options) {
    return this.rpcFactory.terminate(options)
      .then(this.post);
  }

  /**
   * 
   * @param data Encrypts the given data using the encrypt function within this bubble's 
   * encryption policy.
   * 
   * @returns the encrypted data
   */
  encrypt(data) {
    assert.isString(data, "data");
    return this.rpcFactory.encryptionPolicy.encrypt(data, ROOT_PATH);
  }

  /**
   * 
   * @param data Decrypts the given data using the decrypt function within this bubble's 
   * encryption policy.
   * 
   * @returns the decrypted data
   */
  decrypt(data) {
    assert.isString(data, "data");
    return this.rpcFactory.encryptionPolicy.decrypt(data, ROOT_PATH);
  }

  /**
   * Posts the given RPC to the bubble server.  May be used if the bubble server
   * implements non-standard methods.  
   * 
   * @param rpc the remote procedure call
   * @returns Promise to resolve with any response data when complete
   */
  post(rpc) {
    return this.provider.post(rpc.method, rpc.params);
  }

  /**
   * Posts all the given RPCs to the bubble server in one transaction.
   * 
   * @param rpcs array of RPCs to send
   * @returns Promise to resolve with an object containing the results to each RPC.  Match the
   *          response id to the RPC id.
   */
  postAll(rpcs) {
    return this.provider.postAll(rpcs);
  }

}



export class RPCFactory {

  /**
   * @dev chainId of the blockchain hosting this bubble's ACC
   */
  chainId;

  /**
   * @dev blockchain address of the bubble's ACC
   */
  contract;

  /**
   * @dev function used to sign all calls to the Bubble server
   */
  signFunction;

  /**
   * @dev optional policy that identifies which files in the bubble are to be encrypted
   */
  encryptionPolicy = new NullEncryptionPolicy();

  /**
   * @dev id to be included with the next RPC
   */
  nextId = 0;

  /**
   * Represents a Bubble hosted on an external Bubble server.
   * 
   * @param _chainId {number} - the chain id of the blockchain hosting this bubble's ACC
   * @param _contract {Address} - the contract address that identifies the bubble
   * @param _signFunction - function to sign service provider requests
   */
  constructor(_chainId, _contract, _signFunction ) {
    assert.isNumber(_chainId, "chainId");
    assert.isAddress(_contract, "contract");
    assert.isFunction(_signFunction, "signFunction");
    this.chainId = _chainId;
    this.contract = _contract;
    this.signFunction = _signFunction;
  }

  /**
   * Optional function to set an encryption policy.  Encryption policies determine which files in the 
   * bubble are encrypted and contain the encryption function.
   * 
   * @param _policy {EncryptionPolicy} - the policy to adopt
   */
  setEncryptionPolicy(_policy) {
    assert.isInstanceOf(_policy, EncryptionPolicy, "provider");
    this.encryptionPolicy = _policy;
  }

  /**
   * RPC to construct the bubble on the bubble server.
   * 
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  create(options = {}) {
    assert.isObject(options, "options");
    return this.sign({
      method: 'create',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        options: options 
      }
    });
  }

  /**
   * RPC to write the given data to the given file.  The data will be encrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param _path file to write to
   * @param data the data to write
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  write(_path, data, options = {}) {
    assert.isString(_path, "path");
    assert.isString(data, "data");
    assert.isObject(options, "options");
    const encrypt = (options && options.encrypted) || this.encryptionPolicy.isEncrypted(_path);
    return this.sign({
      method: 'write',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        data: encrypt ? this.encryptionPolicy.encrypt(_path, data) : data,
        options: options 
      }
    });
  }

  /**
   * RPC to append the given data to the given file.  The data will be encrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param _path file to append to
   * @param data the data to append
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  append(_path, data, options = {}) {
    assert.isString(_path, "path");
    assert.isString(data, "data");
    assert.isObject(options, "options");
    const encrypt = (options && options.encrypted) || this.encryptionPolicy.isEncrypted(_path);
    return this.sign({
      method: 'append',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        data: encrypt ? this.encryptionPolicy.encrypt(_path, data) : data,
        options: options 
      }
    });
  }

  /**
   * RPC to read the given file.
   * 
   * @param _path file to read from
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  read(_path = ROOT_PATH, options = {}) {
    assert.isString(_path, "path");
    assert.isObject(options, "options");
    return this.sign({
      method: 'read',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        options: options 
      }
    });
  }

  /**
   * RPC to delete the given file.  
   * 
   * `options`:
   *    `force` - force delete of a non-empty directory
   *    `silent` - don't throw an error if file does not exist
   * 
   * @param _path file to delete
   * @param options passed transparently to the bubble server.
   * @returns RPC
   */
  delete(_path, options = {}) {
    assert.isString(_path, "path");
    assert.isObject(options, "options");
    return this.sign({
      method: 'delete',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        options: options 
      }
    });
  }

  /**
   * RPC to create the given directory.  
   * 
   * `providerOpts`:
   *    `silent` - don't throw an error if directory already exists
   * 
   * @param _path directory to create
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  mkdir(_path, options = {}) {
    assert.isString(_path, "path");
    assert.isObject(options, "options");
    return this.sign({
      method: 'mkdir',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        options: options 
      }
    });
  }

  /**
   * RPC to list the given file or directory.  Equivalent to `ls` on a POSIX system.
   * 
   * @param _path file or directory to list
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  list(_path, options = {}) {
    assert.isString(_path, "path");
    assert.isObject(options, "options");
    return this.sign({
      method: 'list',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        options: options 
      }
    });
  }

  /**
   * RPC to get the permissions bitmap for the given file or directory as specified by the smart 
   * contract.  Use the `Permissions` class to decode.
   * 
   * @param _path file or directory
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  getPermissions(_path, options = {}) {
    assert.isString(_path, "path");
    assert.isObject(options, "options");
    return this.sign({
      method: 'getPermissions',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        options: options 
      }
    })
  }

  /**
   * RPC to delete the bubble on the server.
   * 
   * @param options passed transparently to the bubble server
   * @returns RPC
   */
  terminate(options = {}) {
    assert.isObject(options, "options");
    return this.sign({
      method: 'terminate',
      params: {
        timestamp: Date.now(),
        nonce: (crypto || window.crypto).randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        options: options 
      }
    });
  }

  /**
   * Signs and posts the given RPC to the bubble server.  May be used if the bubble server
   * implements non-standard methods.  
   * 
   * @param rpc the remote procedure call
   * @returns Promise to resolve with any response data when complete
   */
  sign(rpc) {
    if (rpc.options === undefined) delete rpc.options;
    return this.signFunction(web3.utils.keccak256(JSON.stringify(rpc)))
      .then(signature => {
        rpc.params.signature = signature;
        return rpc;
      })
  }

}


