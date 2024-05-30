// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleProvider, ContentId, assert, ErrorCodes } from '@bubble-protocol/core';
import { Bubble } from '@bubble-protocol/client';

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
   * The bubble's globally unique ContentId
   */
  bubbleId;

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
   */
  constructor(metadata={}, wallet, contractSourceCode, signFunction) {
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
    // set local state
    if (metadata.constructionState) {
      assert.isNotEmpty(metadata.bubbleId, 'metadata.bubbleId');
      this.constructionState = metadata.constructionState;
      if (metadata.bubbleId) this.bubbleId = new ContentId(metadata.bubbleId);
    }
    this.wallet = wallet;
    this.contractSourceCode = contractSourceCode;
    this.signFunction = signFunction;
    this.initState = INIT_STATE.uninitialised;
  }

  /**
   * Initialises the bubble based on its current construction state (passed in the metadata during 
   * construction). As necessary, deploys the contract, creates the off-chain bubble, constructs 
   * the bubble contents and initialises the bubble contents. Override the `_constructBubbleContents`
   * and `_readBubbleContents` functions to create the internal structure of the bubble.
   * 
   * @param {Array} contractParams constructor params passed when deploying the contract
   * @param {String} bubbleProvider URI of the off-chain bubble provider
   * @param {BubbleProvider} options.provider custom BubbleProvider to use as the interface to the off-chain bubble
   * @param {EncryptionPolicy} options.encryptionPolicy encryption policy for the bubble
   * @param {UserManager} options.userManager user manager for the bubble
   */
  async initialise(contractParams, providerUri, options={}) {
    try {
      this.initState = INIT_STATE.initialising;
      await this._initialisationSequence(contractParams, providerUri, options);
      this.bubble.addTerminatedListener(this._handleBubbleTerminated.bind(this));
      this.initState = INIT_STATE.initialised;
    } catch (error) {
      console.debug("Error initialising bubble", error);
      this.initState = INIT_STATE.failed;
      this.error = error;
      this._checkForTerminatedBubble(error);
    }
  }

  /**
   * Deletes the bubble by terminating the contract and off-chain bubble.
   */
  async deleteBubble() {
    await this.wallet.send(this.bubbleId.contract, this.contractSourceCode.abi, 'terminate', []);
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
   * Override to add additional metadata.
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
  // Protected functions
  //

  /**
   * Override this method to construct any custom bubble contents during bubble construction.
   */
  async _constructBubbleContents() {}

  /**
   * Override this method to read any custom bubble contents during initialisation.
   */
  async _initialiseBubbleContents() {}

  /**
   * Constructs and returns a Bubble class instance. Override to use a custom Bubble class.
   * 
   * @param {String|BubbleProvider} provider - URI of the off-chain bubble provider or a custom BubbleProvider instance
   * @param {Object} options - contains optional encryptionPolicy and userManager
   */
  _constructBubbleInstance(provider, options) {
    return this.bubble || 
    new Bubble(this.bubbleId, provider, this.signFunction, options.encryptionPolicy, options.userManager);
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
   */
  async _initialisationSequence(contractParams, providerUri, options) {
    assert.isArray(contractParams, 'contractParams');
    assert.isString(providerUri, 'providerUri');
    if (this.constructionState === CONSTRUCTION_STATE.new) {
      await this._deployContract(contractParams);
      this.bubbleId.provider = providerUri;
      this.constructionState = CONSTRUCTION_STATE.contractDeployed;
    }
    this.bubble = this._constructBubbleInstance(options.provider || this.bubbleId.provider, options);
    if (this.constructionState === CONSTRUCTION_STATE.contractDeployed) {
      await this._deployOffChainBubble();
      this.constructionState = CONSTRUCTION_STATE.bubbleDeployed;
    }
    if (this.constructionState === CONSTRUCTION_STATE.bubbleDeployed) {
      await this._constructBubbleContents();
      this.constructionState = CONSTRUCTION_STATE.constructed;
    }
    if (this.constructionState === CONSTRUCTION_STATE.constructed) {
      await this._initialiseBubbleContents();
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
      provider: ""
    });
  }

  /**
   * Deploys the off-chain bubble.
   */
  async _deployOffChainBubble() {
    await this.bubble.create();
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

}
