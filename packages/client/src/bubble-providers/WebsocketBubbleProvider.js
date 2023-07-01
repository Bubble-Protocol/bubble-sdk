// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleError, BubbleProvider, assert } from '@bubble-protocol/core';
import WebSocket from 'ws';

export const ErrorCodes = {
  SEND_TIMEOUT_ERROR_CODE: 408
}

const DEFAULT_OPTIONS = {
  sendTimeout: 3000,
}

/**
 * BubbleProvider using the websocket protocols.
 * 
 * Provides `post`, `subscribe` and `unsubscribe` methods plus the websocket methods `close`, 
 * `on` and `off`.
 */
export class WebsocketBubbleProvider extends BubbleProvider {

  subscriptions = new Map();

  requests = new Map();

  requestId = 0;


  constructor(url, options={}) {
    super();

    // Process params
    if (typeof url === 'string') url = new URL(url);
    assert.isInstanceOf(url, URL, 'url');
    this.url = url;
    this.sendTimeout = options.sendTimeout || DEFAULT_OPTIONS.sendTimeout;

    // Websocket
    this.ws = new WebSocket(this.url.href);
    this.ws.on('message', this._handleMessage.bind(this));
    this.ws.on('close', this._rejectAllRequests.bind(this));

    // Expose Websocket methods
    this.close = this.ws.close.bind(this.ws);
    this.on = this.ws.on.bind(this.ws);
    this.off = this.ws.off.bind(this.ws);
  }


  post(method, params) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const timeout = setTimeout(() => {
        this.requests.delete(id);
        reject({code: ErrorCodes.SEND_TIMEOUT_ERROR_CODE, message: `request timed out`});
      }, this.sendTimeout)
      this.requests.set(id, {resolve, reject, timeout});
      this.ws.send(JSON.stringify({ id, method, params }));
    })
    .catch(error => {
      if (error.code !== undefined) throw new BubbleError(error.code, error.message, {cause: error.cause});
      else throw new Error(error.message, {cause: error.cause})    
    })
  }


  subscribe(params, listener) {
    return this.post('subscribe', params)
      .then(response => {
        if (!assert.isObject(response)) throw new Error('invalid server response');
        if (!assert.isNotNull(response.subscriptionId)) throw new Error('invalid server response');
        this.subscriptions.set(response.subscriptionId, listener);
        return response;
      })
  }


  unsubscribe(params={}) {
    if (!params.subscriptionId || !subscriptions.has(params.subscriptionId)) {
      if (params.silent) return Promise.resolve();
      else return Promise.reject(new Error('subscription does not exist'));
    }
    return this.post('unsubscribe', {...params, subscriptionId})
      .then(() => {
        this.subscriptions.delete(subscriptionId);
      })
      .catch(error => {
        if (params.force) this.subscriptions.delete(subscriptionId);
        else throw error;
      })
  }


  _handleMessage(data) { 
    const response = JSON.parse(data);
    if (response.method === 'subscription') this._handleSubscription(response.params);
    else if (this.requests.has(response.id)) { 
      const {resolve, reject, timeout} = this.requests.get(response.id);
      clearTimeout(timeout);
      this.requests.delete(response.id);
      if (!assert.isObject(response)) reject(new Error('invalid server response'));
      if (response.error) {
        if (response.error.code !== undefined) reject(new BubbleError(response.error.code, response.error.message, {cause: response.error.cause}));
        else reject(new Error(response.error.message, {cause: response.error.cause}));    
      }
      else resolve(response.result);
    }
    else console.error('unexpected response - id not found in requests map', response);
  }

  _handleSubscription(notification) {
    const listener = this.subscriptions.get(notification.subscriptionId);
    if (listener) listener(notification);
  }

  _rejectAllRequests(error) {
    for (const {reject} of this.requests.values()) {
      reject(error);
    }
    this.requests.clear();
    this.subscriptions.clear();
  }

}

