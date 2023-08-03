// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { Bubble } from "../Bubble.js";
import { assert } from "@bubble-protocol/core";
import { BubbleManager } from "../BubbleManager.js";

/**
 * A bubble with a BubbleManager to manage its content. The Bubble Manager will be called when
 * the bubble is created or initialised.  It will also be called whenever the bubble's provider
 * reconnects after a disconnection so that any subscriptions can be reinstated.
 */
export class ManagedBubble extends Bubble {

  /**
   * Represents a Bubble hosted on an external Bubble server. Some or all content and 
   * subscriptions are managed by a BubbleManager.
   * 
   * @param {ContentId} bubbleId See the Bubble class for details
   * @param {String|BubbleProvider} provider See the Bubble class for details
   * @param {Function} signFunction See the Bubble class for details
   * @param {EncryptionPolicy} encryptionPolicy See the Bubble class for details
   * @param {BubbleManager} contentManager the manager of this bubble
   */
  constructor(bubbleId, provider, signFunction, encryptionPolicy, contentManager) {
    super(bubbleId, provider, signFunction, encryptionPolicy);
    assert.isInstanceOf(contentManager, BubbleManager, 'contentManager')
    this.contentManager = contentManager;
  }

  /**
   * Construct the bubble on the bubble server then construct content managed by the Bubble 
   * Manager. If this bubble's provider has an `open` method, it will be called first. Once created
   * the bubble will also be initialised.
   * 
   * @param {Object} options passed transparently to the Bubble Manager and on to the bubble server.
   * The Bubble Manager will remove any options not intended for the bubble server.
   * @param  {...any} params passed transparently to the Bubble Manager
   * @returns Promise to open the provider and call the Bubble Manager's create method.
   */
  create(options, ...params) {
    const promise = assert.isFunction(this.provider.open) ? this.provider.open() : Promise.resolve();
    return promise
      .then(() => super.create(options))
      .then(() => {
        return this.contentManager.create(this, options, ...params);
      })
      .then(() => this.contentId)
  }
  
  /**
   * Initialises from an existing bubble by reading content managed by the Bubble Manager. If this
   * bubble's provider has an `open` method, it will be called first.
   * 
   * @param {Object} options passed transparently to the Bubble Manager and on to the bubble server.
   * The Bubble Manager will remove any options not intended for the bubble server.
   * @param  {...any} params passed transparently to the Bubble Manager
   * @returns Promise to open the provider and call the Bubble Manager's initialise method.
   */
  initialise(options, ...params) {
    const promise = assert.isFunction(this.provider.open) ? this.provider.open() : Promise.resolve();
    return promise
      .then(() => {
        return this.contentManager.initialise(this, options, ...params);
      })
  }

  /**
   * Handles a reconnect event from the bubble's provider by calling the Bubble Manager's 
   * reconnect method. Allows the Bubble Manager to re-establish any subscriptions that were
   * closed by the disconnect.
   * 
   * @param  {...any} params passed transparently to the Bubble Manager
   * @returns Promise to call the Bubble Manager's reconnect method.
   */
  reconnect(...params) {
    return this.contentManager.reconnect(this, ...params);
  }

}