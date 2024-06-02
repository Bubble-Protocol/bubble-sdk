// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ContentId, assert, ErrorCodes } from '@bubble-protocol/core';
import { Bubble } from './Bubble.js';

/**
 * Construction state
 */
export const CONSTRUCTION_STATE = {
  new: 'new',
  contractDeployed: 'contract-deployed',
  bubbleDeployed: 'bubble-deployed',
  constructed: 'constructed',
  deleted: 'deleted'
}


/**
 * Initialisation state
 */
export const INIT_STATE = {
  uninitialised: 'uninitialised',
  initialising: 'initialising',
  initialised: 'initialised',
  failed: 'failed'
}


/**
 * A DeployableBubble is a base class for managing the construction and deletion of both the on-chain
 * and off-chain components of a bubble. 
 * 
 * It is designed to be extended to create specific bubble types. Pass the source code for the bubble
 * into the constructor and override the `_constructBubbleContents` and `_initialiseBubbleContents` 
 * functions to create a custom internal file structure of the bubble.
 * 
 * The class instance uses a metadata object to track the construction state of the bubble and to store
 * the bubble's globally unique Bubble ID. The metadata object can be stored in the application's
 * persistent storage to allow the bubble to be reconstructed in the future.
 * 
 * The class instance requires a Wallet object to interact with the blockchain. The Wallet object
 * must have the following functions: `deploy`, `send` and `getChainId`. The Wallet object is passed
 * into the constructor and is used to deploy the bubble contract and to send transactions.
 */
export class DeployableBubble {

  /**
   * State of construction
   */
  constructionState = CONSTRUCTION_STATE.new;

  /**
   * State of initialisation
   */
  initState;

  /**
   * Error message if init state has failed
   */
  error;

  /**
   * The bubble's contract
   */
  contract;

  /**
   * The bubble's globally unique ContentId
   */
  bubbleId = {};

  /**
   * The off-chain bubble
   */
  bubble;

  /**
   * Sign function used for off-chain bubble requests
   */
  signFunction;

  /**
   * Object containing wallet functions used for contract interactions.
   * 
   * Must contain the following functions:
   * 
   * `deploy(abi, bytecode, constructor_params) returns Promise<contract_address>`
   * `send(contract_address, abi, method, params) returns Promise`
   * `getChainId() returns number`
   */
  wallet;

  /**
   * Object containing the abi and bytecode for the bubble smart contract.
   */
  contractSourceCode;


  /**
   * Constructor
   * 
   * @param {Object} metadata - initialisation metadata for the bubble (constructionState and bubbleId).
   * @param {Object} wallet - object containing wallet functions used for contract interactions. @see this.wallet
   * @param {Object} contractSourceCode - Source code for the bubble smart contract. Requires `abi` and `bytecode` fields.
   * @param {Function} signFunction - Function to sign off-chain bubble requests.
   * @param {String|Object} options.provider provider to use for the off-chain bubble, if not already set in metadata.bubbleId. See `setBubbleProvider()`.
   * @param {EncryptionPolicy} options.encryptionPolicy encryption policy for the bubble
   * @param {UserManager} options.userManager user manager for the bubble
   * @param {async Function} options.contentConstructor custom function to construct bubble contents
   * @param {async Function} options.contentInitialiser custom function to initialise bubble contents
   * @param {async Function} options.contractTerminator custom function to terminate the bubble contract
   */
  constructor(metadata={}, wallet, contractSourceCode, signFunction, options={}) {
    // validate params
    assert.isObject(metadata, 'metadata');
    assert.isObject(wallet, 'wallet');
    assert.isFunction(wallet.deploy, 'wallet.deploy');
    assert.isFunction(wallet.send, 'wallet.send');
    assert.isFunction(wallet.getChainId, 'wallet.getChainId');
    assert.isObject(contractSourceCode, 'contractSourceCode');
    assert.isArray(contractSourceCode.abi, 'contractSourceCode.abi');
    assert.isString(contractSourceCode.bytecode || contractSourceCode.bin, 'contractSourceCode.bytecode');
    assert.isFunction(signFunction, "signFunction");
    // parse options
    this.setTerminateFunction(options.contractTerminator || this._terminateContract.bind(this));
    if (options.contentConstructor) this.setContentConstructor(options.contentConstructor);
    if (options.contentInitialiser) this.setContentInitialiser(options.contentInitialiser);
    if (options.provider) this.setBubbleProvider(options.provider);
    if (options.encryptionPolicy) this.setEncryptionPolicy(options.encryptionPolicy);
    if (options.userManager) this.setUserManager(options.userManager);
    // Setup contract functions
    this.contract = {
      address: this.bubbleId ? this.bubbleId.contract : undefined,
      call: this._callContract.bind(this),
      send: this._sendContract.bind(this),
      isDeployed: this.isContractDeployed.bind(this)
    }
    // set local state
    if (metadata.constructionState) {
      assert.isNotEmpty(metadata.bubbleId, 'metadata.bubbleId');
      this.constructionState = metadata.constructionState;
      if (metadata.bubbleId) this.bubbleId = new ContentId(metadata.bubbleId);
      if (!options.provider && this.bubbleId.provider) this.setBubbleProvider(this.bubbleId.provider);
    }
    this.wallet = wallet;
    this.contractSourceCode = contractSourceCode;
    this.signFunction = signFunction;
    this.initState = INIT_STATE.uninitialised;
  }

  /**
   * Allows the client to set a custom function to construct bubble contents during bubble construction.
   * 
   * @param {async Function} fn - The custom function to construct bubble contents.
   */
  setContentConstructor(fn) {
    if (fn.constructor.name !== 'AsyncFunction') throw new Error("setContentConstructor must be an async function");
    this._bubbleContentConstructor = fn;
  }

  /**
   * Allows the client to set a custom function to read bubble contents during initialisation.
   * 
   * @param {async Function} fn - The custom function to read bubble contents.
   */
  setContentInitialiser(fn) {
    if (fn.constructor.name !== 'AsyncFunction') throw new Error("setContentInitialiser must be an async function");
    this._bubbleContentInitialiser = fn;
  }

  /**
   * Allows the client to set a custom function to terminate the bubble contract.
   * 
   * @param {async Function} fn 
   */
  setTerminateFunction(fn) {
    if (fn.constructor.name !== 'AsyncFunction') throw new Error("setTerminateFunction must be an async function");
    this._contractTerminator = fn;
  }

  /**
   * Allows the client to set a custom function to construct the off-chain bubble class instance.
   * 
   * @param {*} fn - The custom function to construct the off-chain bubble.
   */
  setBubbleConstructor(fn) {
    if (fn.constructor.name !== 'Function') throw new Error("setBubbleConstructor must be a sync function");
    this._bubbleConstructor = fn;
  }

  /**
   * Sets the encryption policy for the off-chain bubble.
   * 
   * @param {EncryptionPolicy} policy 
   */
  setEncryptionPolicy(policy) {
    this._encryptionPolicy = policy;
  }

  /**
   * Sets the user manager for the off-chain bubble.
   * 
   * @param {UserManager} userManager 
   */
  setUserManager(userManager) {
    this._userManager = userManager;
  }

  /**
   * Allows the client to set the provider url or a custom BubbleProvider for the off-chain bubble.
   * 
   * @param {String|Object} provider - The provider url or an object with the structure {url: String, provider: BubbleProvider}
   */
  setBubbleProvider(provider) {
    if (assert.isString(provider)) this._bubbleProvider = {url: provider};
    else {
      assert.isObject(provider, 'provider');
      assert.isString(provider.url, 'provider.url');
      assert.isObject(provider.provider, 'provider.provider');
      this._bubbleProvider = provider;
    }
  }


  /**
   * Initialises the bubble based on its current construction state (passed in the metadata during 
   * construction). As necessary, deploys the contract, creates the off-chain bubble, constructs 
   * the bubble contents and initialises the bubble contents. Use setContentConstructor and
   * setContentInitialiser to set custom functions for constructing and initialising the bubble contents.
   * 
   * @param {Array} contractParams constructor params passed when deploying the contract
   */
  async initialise(contractParams) {
    if (!this._bubbleProvider) throw new Error("Bubble provider not set");
    try {
      this.initState = INIT_STATE.initialising;
      await this._initialisationSequence(contractParams);
      this.bubble.addTerminatedListener(this._handleBubbleTerminated.bind(this));
      this.initState = INIT_STATE.initialised;
    } catch (error) {
      this.initState = INIT_STATE.failed;
      this.error = error;
      this._checkForTerminatedBubble(error);
    }
  }

  /**
   * Deletes the bubble by terminating the contract and off-chain bubble.
   * 
   * @param {Boolean} terminateContract - Set to false to only delete the off-chain bubble. Default is true.
   */
  async deleteBubble(terminateContract=true) {
    if (terminateContract) await this._contractTerminator();
    if (this.constructionState !== CONSTRUCTION_STATE.contractDeployed) {
      this.bubble.terminate();
    }
    this.constructionState = CONSTRUCTION_STATE.deleted;
  }

  /**
   * Returns the unique id for this bubble.
   * 
   * @returns {String} - id concatenated from chain and contract address
   */
  getId() {
    if (this.constructionState === CONSTRUCTION_STATE.new) throw new Error("Cannot get bubble id until the bubble has been deployed");
    return this.bubbleId.chain + '-' + this.bubbleId.contract;
  }

  /**
   * Returns this object's metadata (used to construct this class instance in the future).
   * 
   * @returns {Object} - metadata for the bubble.
   */
  getMetadata() {
    return {
      id: this.getId(),
      constructionState: this.constructionState,
      bubbleId: this.bubbleId ? this.bubbleId.toObject() : undefined
    }
  }

  /**
   * Returns the Bubble object for the off-chain bubble.
   * 
   * @returns {Bubble} - the off-chain bubble object
   */
  getOffChainBubble() {
    if (!this.bubble) throw new Error("Cannot get bubble until it has been deployed");
    return this.bubble;
  }

  
  //
  // Off-chain bubble functions
  //

  write(path, data, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.write(path, data, options);
  }

  append(path, data, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.append(path, data, options);
  }

  read(path, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.read(path, options);
  }

  delete(path, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.delete(path, options);
  }

  mkdir(path, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.mkdir(path, options);
  }

  list(path, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.list(path, options);
  }

  getPermissions(path, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.getPermissions(path, options);
  }

  subscribe(path, listener, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.subscribe(path, listener, options);
  }

  unsubscribe(id, options) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.unsubscribe(id, options);
  }

  addTerminatedListener(listener) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    this.bubble.addTerminatedListener(listener);
  }

  removeTerminatedListener(listener) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    this.bubble.removeTerminatedListener(listener);
  }

  getContentId(path) {
    if (!this.bubble) throw new Error("bubble is not deployed");
    return this.bubble.getContentId(path);
  }


  //
  // State getter functions
  //

  /**
   * Returns true if the contract has not yet been deployed
   */
  isNew() {
    return this.constructionState == CONSTRUCTION_STATE.new;
  }

  /**
   * Returns true if the contract has been deployed and hasn't been terminated
   */
  isContractDeployed() {
    return this.constructionState != CONSTRUCTION_STATE.new && this.constructionState != CONSTRUCTION_STATE.deleted;
  }

  /**
   * Returns true if the contract and off-chain bubble have been deployed and the bubble hasn't been terminated.
   * To be sure that the bubble is fully constructed and initialised, see `isConstructed()`.
   */
  isBubbleDeployed() {
    return this.constructionState === CONSTRUCTION_STATE.bubbleDeployed || this.constructionState === CONSTRUCTION_STATE.constructed;
  }

  /**
   * Returns true if the bubble is fully constructed and it's contents setup
   */
  isConstructed() {
    return this.constructionState === CONSTRUCTION_STATE.constructed;
  }

  /**
   * Returns true if the bubble has been terminated
   */
  isDeleted() {
    return this.constructionState === CONSTRUCTION_STATE.deleted;
  }

  /**
   * Returns true if the bubble has been constructed and contents initialised
   */
  isInitialised() {
    return this.initState === INIT_STATE.initialised;
  }

  /**
   * Returns true if the bubble is currently initialising
   */
  isInitialising() {
    return this.initState === INIT_STATE.initialising;
  }

  /**
   * Returns true if the bubble construction or initialisation has failed. Use `this.error` to get
   * the error message.
   */
  isFailed() {
    return this.initState === INIT_STATE.failed;
  }


  //
  // Internal functions
  //

  /**
   * Initialises the bubble based on its current construction state. 
   * 
   * As necessary:
   *   1) deploys the contract if it has not already been deployed
   *   2) creates the off-chain bubble if it has not already been created
   *   3) constructs any custom bubble content if it has not already been constructed
   *   4) initialises (reads) any custom bubble content
   * 
   * @param {Array} contractParams constructor params passed when deploying the contract
   */
  async _initialisationSequence(contractParams=[]) {
    assert.isArray(contractParams, 'contractParams');
    if (this.constructionState === CONSTRUCTION_STATE.new) {
      await this._deployContract(contractParams);
      this.constructionState = CONSTRUCTION_STATE.contractDeployed;
    }
    this.contract.address = this.bubbleId.contract;
    this.bubble = this._constructBubbleInstance(this._bubbleProvider);
    if (this.constructionState === CONSTRUCTION_STATE.contractDeployed) {
      await this._deployOffChainBubble();
      this.constructionState = CONSTRUCTION_STATE.bubbleDeployed;
    }
    if (this.constructionState === CONSTRUCTION_STATE.bubbleDeployed) {
      if (this._bubbleContentConstructor) await this._bubbleContentConstructor();
      this.constructionState = CONSTRUCTION_STATE.constructed;
    }
    if (this.constructionState === CONSTRUCTION_STATE.constructed) {
      if (this._bubbleContentInitialiser) await this._bubbleContentInitialiser();
    }
  }

  /**
   * Deploys the bubble contract using the given contract params.
   */
  async _deployContract(params) {
    const chainId = this.wallet.getChainId();
    const contractAddress = await this.wallet.deploy(this.contractSourceCode.abi, this.contractSourceCode.bytecode, params);
    this.bubbleId = new ContentId({
      chain: chainId,
      contract: contractAddress,
      provider: this._bubbleProvider.url
    });
  }

  /**
   * Default function to terminate the bubble contract.
   */
  async _terminateContract() {
    await this.contract.send('terminate', []);
  }

  /**
   * Deploys the off-chain bubble.
   */
  async _deployOffChainBubble() {
    await this.bubble.create();
  }

  /**
   * Constructs the off-chain Bubble class instance.
   */
  _constructBubbleInstance() {
    if (this.bubble) return this.bubble;
    this.bubbleId.provider = this._bubbleProvider.url;
    if (this._bubbleConstructor) return this._bubbleConstructor(this._bubbleProvider, this.signFunction);
    else return new Bubble(this.bubbleId, this._bubbleProvider.provider || this._bubbleProvider.url, this.signFunction, this._encryptionPolicy, this._userManager);
  }

  /**
   * Checks if the given error is a terminated bubble error and sets the bubble's state accordingly.
   */
  _handleBubbleTerminated() {
    this.constructionState = CONSTRUCTION_STATE.deleted;
    this.initState = INIT_STATE.failed;
    this.error = new Error("Bubble has been terminated");
  }

  /**
   * Checks if the given error is a terminated bubble error and sets the bubble's state accordingly.
   */
  _checkForTerminatedBubble(error) {
    if (error && error.code == ErrorCodes.BUBBLE_ERROR_BUBBLE_TERMINATED) {
      this._handleBubbleTerminated();
    }
  }

  async _callContract(method, params) {
    if (!this.isContractDeployed()) throw new Error("Contract has not been deployed");
    return this.wallet.call(this.bubbleId.contract, this.contractSourceCode.abi, method, params);
  }

  async _sendContract(method, params) {
    if (!this.isContractDeployed()) throw new Error("Contract has not been deployed");
    return this.wallet.send(this.bubbleId.contract, this.contractSourceCode.abi, method, params);
  }


}
