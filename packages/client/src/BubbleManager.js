// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * Base class for a Bubble Manager. Used by a ManagedBubble to manage content within a bubble.
 */
export class BubbleManager {

  /**
   * Called during the bubble create process to construct any content. It is called after the 
   * provider has been opened and the bubble has been created.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options for the manager, and options to be passed to any Bubble class methods 
   * used by the manager. In the interest of security, the manager should remove any of its own  
   * options before passing the options object on to a Bubble class method.
   * @param  {...any} params user params passed through by the ManagedBubble
   * @returns Promise
   */
  create(bubble, options, ...params){
    return Promise.resolve();
  }

  /**
   * Called during the bubble initialisation process to read content. It is called after the 
   * provider has been opened.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param {Object} options for the manager, and options to be passed to any Bubble class methods 
   * used by the manager. In the interest of security, the manager should remove any of its own  
   * options before passing the options object on to a Bubble class method.
   * @param  {...any} params user params passed through by the ManagedBubble
   * @returns Promise
   */
  
  initialise(bubble, options, ...params){
    return Promise.resolve();
  }

  /**
   * Designed to be called following a provider reconnect to re-subscribe to content if
   * subscriptions made at initialisation have been closed.
   * 
   * @param {Bubble} bubble the bubble being managed.
   * @param  {...any} params user params passed through by the ManagedBubble
   * @returns Promise
   */
  reconnect(bubble, ...params) {
    return Promise.resolve();
  }

}

