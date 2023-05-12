// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import web3 from "web3";
import { EncryptionPolicy } from "./EncryptionPolicy";
import { NullEncryptionPolicy } from "./encryption-policies/NullEncryptionPolicy";
import { BubblePermissions, BubbleProvider, ContentId, ROOT_PATH, assert } from '@bubble-protocol/core';

const Crypto = crypto || (window ? window.crypto : undefined);


export class Bubble {

  /**
   * @dev the bubble's content id
   */
  contentId;
  
  /**
   * @dev api to the bubble server
   */
  provider;

  /**
   * @dev RPCFactory used to construct remote procedure calls ready for sending
   */
  rpcFactory;

  /**
   * @dev optional policy that identifies which files in the bubble are to be encrypted and
   * defines the encryption/decryption functions
   */
  encryptionPolicy = new NullEncryptionPolicy();

  /**
   * Represents a Bubble hosted on an external Bubble server.
   * 
   * @param {ContentId} contentId the id of this bubble
   * @param {BubbleProvider} provider the interface to the storage service
   * @param {Function} signFunction function that signs all transactions. (The storage service
   * identifies the user from the transaction signature). Takes the form:
   * 
   *   (Buffer: hash) => { return Promise to resolve the signature of the hash as a Buffer }
   * 
   * The type and format of the signature must be appropriate to the blockchain platform.
   * @param {EncryptionPolicy} encryptionPolicy optional encryption policy
   */
  constructor(contentId, provider, signFunction, encryptionPolicy ) {
    if (!Crypto) throw new Error('missing crypto object');
    assert.isInstanceOf(provider, BubbleProvider, "provider");
    this.contentId = contentId;
    this.provider = provider;
    if (encryptionPolicy) this.setEncryptionPolicy(encryptionPolicy);
    this.rpcFactory = new RPCFactory(contentId.chain, contentId.contract, signFunction);
    this.post = this.post.bind(this);
  }

  /**
   * Optional function to set an encryption policy.  Encryption policies determine which files in the 
   * bubble are encrypted, and contain the encryption and decryption functions.
   * 
   * @param {EncryptionPolicy} policy the policy to adopt
   */
  setEncryptionPolicy(policy) {
    assert.isInstanceOf(policy, EncryptionPolicy, "encryption policy");
    this.encryptionPolicy = policy;
  }

  /**
   * Construct the bubble on the bubble server.
   * 
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve when the bubble is constructed
   */
  create(options) {
    return this.rpcFactory.create(options)
      .then(this.post)
      .then(() => { 
        return this.getContentId() 
      });
  }

  /**
   * Writes the given data to the given file.  The data will be encrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param {String} path file to write to
   * @param {any} data the data to write
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with the file's ContentId when complete
   */
  write(path, data, options = {}) {
    const encrypt = data && (options.encrypted || this.encryptionPolicy.isEncrypted(this.getContentId(path)));
    return (encrypt ? this.encryptionPolicy.encrypt(data, path) : Promise.resolve(data))
      .then(dataToSend => {
        return this.rpcFactory.write(path, dataToSend, options);
      })
      .then(this.post)
      .then(() => { 
        return this.getContentId(path) 
      });
  }

  /**
   * Appends the given data to the given file.  The data will be encrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param {String} path file to append to
   * @param data the data to append
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with the file's ContentId when complete
   */
  append(path, data, options = {}) {
    const encrypt = data && (options.encrypted || this.encryptionPolicy.isEncrypted(this.getContentId(path)));
    return (encrypt ? this.encryptionPolicy.encrypt(data, path) : Promise.resolve(data))
      .then(dataToSend => {
        return this.rpcFactory.append(path, dataToSend, options);
      })
      .then(this.post)
      .then(() => { 
        return this.getContentId(path) 
      });
  }

  /**
   * Reads the given file.  The contents will be decrypted if the encryption policy
   * requires it or the `encrypted` option is given.
   * 
   * @param {String} path file to read from
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with the file contents
   */
  read(path = ROOT_PATH, options = {}) {
    const decrypt = options.encrypted || this.encryptionPolicy.isEncrypted(this.getContentId(path));
    return this.rpcFactory.read(path, options)
      .then(this.post)
      .then(data => {
        return (data && decrypt) 
          ? this.encryptionPolicy.decrypt(data, path).then(buf => { return Buffer.from(buf).toString() }) 
          : data || '';
      })
  }

  /**
   * Deletes the given file.  
   * 
   * `providerOpts`:
   *    `force` - force delete of a non-empty directory
   *    `silent` - don't throw an error if file does not exist
   * 
   * @param {String} path file to delete
   * @param {Object} options passed transparently to the bubble server.
   * @returns {Promise} Promise to resolve when complete
   */
  delete(path, options) {
    return this.rpcFactory.delete(path, options)
      .then(this.post);
  }

  /**
   * Creates the given directory.  
   * 
   * `providerOpts`:
   *    `silent` - don't throw an error if directory already exists
   * 
   * @param {String} path directory to create
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with the directory's ContentId when complete
   */
  mkdir(path, options) {
    return this.rpcFactory.mkdir(path, options)
      .then(this.post)
      .then(() => { 
        return this.getContentId(path) 
      });
  }

  /**
   * Lists the given file or directory.  Equivalent to `ls` on a POSIX system.
   * 
   * @param {String} path file or directory to list
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with the listing
   */
  list(path, options) {
    return this.rpcFactory.list(path, options)
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
   * @param {String} path file or directory
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with the listing
   */
  getPermissions(path, options) {
    return this.rpcFactory.getPermissions(path, options)
      .then(this.post)
      .then(result => {
        if (!assert.isHexString(result)) throw new Error('bubble server returned invalid permissions');
        return new BubblePermissions(BigInt(result, 16));
      });
  }

  /**
   * Resolves to true if the bubble's smart contract has been terminated.
   * 
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve with a boolean
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
   * @param {Object} options passed transparently to the bubble server
   * @returns {Promise} Promise to resolve when complete
   */
  terminate(options) {
    return this.rpcFactory.terminate(options)
      .then(this.post);
  }

  /**
   * Posts the given RPC to the bubble server.  May be used if the bubble server
   * implements non-standard methods.  
   * 
   * @param rpc the remote procedure call
   * @returns {Promise} Promise to resolve with any response data when complete
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

  /**
   * Constructs a ContentId object from this bubble's details and the given path.  If the path
   * is not given, the ContentId for this bubble is returned.
   * 
   * @param {String} path optional file or directory 
   * @returns {ContentId} the unique content id that globally identifies the content.
   * @throws if the path is not a valid bubble path
   */
  getContentId(path) {
    const id = new ContentId({
      chain: this.contentId.chain,
      contract: this.contentId.contract,
      provider: this.contentId.provider
    });
    if (path) id.setFile(path);
    return id;
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
        nonce: Crypto.randomUUID(),
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
    return this.sign({
      method: 'write',
      params: {
        timestamp: Date.now(),
        nonce: Crypto.randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        data: data,
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
    return this.sign({
      method: 'append',
      params: {
        timestamp: Date.now(),
        nonce: Crypto.randomUUID(),
        chainId: this.chainId,
        contract: this.contract,
        file: _path,
        data: data,
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
        nonce: Crypto.randomUUID(),
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
        nonce: Crypto.randomUUID(),
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
        nonce: Crypto.randomUUID(),
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
        nonce: Crypto.randomUUID(),
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
        nonce: Crypto.randomUUID(),
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
        nonce: Crypto.randomUUID(),
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


