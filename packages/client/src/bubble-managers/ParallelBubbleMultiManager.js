// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";
import { BubbleManager } from "../BubbleManager.js";

/**
 * Utility class to chain Bubble Managers. Allows a bubble's content management to be
 * encapsulated across different managers. Managers' create, initialise and reconnect
 * methods are called in parallel, not sequentially.
 */
export class ParallelBubbleMultiManager extends BubbleManager {

  /**
   * 
   * @param  {...BubbleManager} managers the managers to chain. 
   */
  constructor(...managers) {
    super();
    assert.isArray(managers, 'managers');
    managers.forEach((m, i) => assert.isInstanceOf(m, BubbleManager, 'manager '+i+' within managers'));
    this.managers = managers;
  }

  create(bubble, options, ...params){
    return Promise.all(this.managers.map(m => m.create(bubble, options, ...params)));
  }

  initialise(bubble, options, ...params){
    return Promise.all(this.managers.map(m => m.initialise(bubble, options, ...params)));
  }

  reconnect(bubble, options, ...params) {
    return Promise.all(this.managers.map(m => m.reconnect(bubble, options, ...params)));
  }

}

