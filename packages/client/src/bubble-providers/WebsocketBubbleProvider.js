// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleError, BubbleProvider, assert } from '@bubble-protocol/core';

let WebSocket;
if (typeof window === 'undefined') {
  import('ws').then(ws => {
      WebSocket = ws.default;
  });
} else {
  WebSocket = window.WebSocket;
}

export const ErrorCodes = {
  PROVIDER_CLOSED_ERROR_CODE: 4000,
  SEND_TIMEOUT_ERROR_CODE: 4001,
}

const DEFAULT_OPTIONS = {
  connectTimeout: 3000,
  sendTimeout: 3000,
  heartbeatPeriod: 3600_000,
  reconnectAttempts: 3,
  reconnectPeriod: 5000
}


const STATE = {
  closed: 'closed',
  connecting: 'connecting',
  reconnecting: 'reconnecting',
  open: 'open',
  closing: 'closing'
}

/**
 * BubbleProvider using the websocket protocols.
 * 
 * Provides `post`, `subscribe` and `unsubscribe` methods plus the websocket methods `close`, 
 * `on` and `off`.  
 */
export class WebsocketBubbleProvider extends BubbleProvider {

  STATES = STATE;

  state = STATE.closed;
  subscriptions = new Map();
  requests = new Map();
  requestId = 0;

  eventListeners = {
    open: [],
    close: [],
    error: [],
    available: []
  }

  timers = {
    connectTimer: undefined,
    closeTimer: undefined,
    heartbeatTimer: undefined,
    reconnectTimer: undefined
  }


  constructor(url, options={}) {
    super();

    // Process params
    if (typeof url === 'string') url = new URL(url);
    assert.isInstanceOf(url, URL, 'url');
    this.url = url;

    // Setup options
    this.options = {...DEFAULT_OPTIONS, ...options};

    // Bind handlers
    this.sendHeartbeat = this._sendHeartbeat.bind(this);
    this._handleMessage = this._handleMessage.bind(this);
    this._onClose = this._onClose.bind(this);
    this._reconnect = this._reconnect.bind(this);
  }


  connect() {
    if (this.state !== STATE.closed && this.state !== STATE.reconnecting) throw new Error('cannot connect in the' + this.state + 'state');
    if (this.state !== STATE.reconnecting) this.state = STATE.connecting;

    // Construct websocket
    this.ws = new WebSocket(this.url.href);
    if (!this.ws.on) this.ws.on = (event, listener) => this.ws.addEventListener(event, listener);
    if (!this.ws.off) this.ws.off = (event, listener) => this.ws.removeEventListener(event, listener);
    this.ws.on('message', this._handleMessage);
    this.ws.on('close', this._onClose);
    this.ws.on('error', error => this._notifyListeners('error', error));

    // Respond to client
    if (this.ws.readyState === WebSocket.OPEN) {
      this.state = STATE.open;
      return Promise.resolve();
    }
    else return new Promise((resolve, reject) => {
      this.timers.connectTimer = setTimeout(() => { this.ws.close(4000, 'connect timeout'); reject('timeout') }, this.options.connectTimeout);
      this.ws.on('error', reject);
      this.ws.on('open', () => {
        clearTimeout(this.timers.connectTimer);
        this.state = STATE.open;
        this._sendHeartbeat();
        this._notifyListeners('open');
        this._notifyListeners('available', true);
        resolve();
      });
    })

  }


  post(method, params) {
    return new Promise((resolve, reject) => {
      if (this.state !== STATE.open) reject({code: ErrorCodes.PROVIDER_CLOSED_ERROR_CODE, message: 'provider is not open'});
      if (this.ws.readyState !== WebSocket.OPEN) reject({code: ErrorCodes.PROVIDER_CLOSED_ERROR_CODE, message: 'websocket is not open'});
      const id = this.requestId++;
      const timeout = setTimeout(() => {
        this.requests.delete(id);
        reject({code: ErrorCodes.SEND_TIMEOUT_ERROR_CODE, message: `request timed out`});
      }, this.options.sendTimeout)
      this.requests.set(id, {resolve, reject, timeout});
      this.ws.send(JSON.stringify({ id, method, params }));
    })
    .catch(error => {
      if (error.code !== undefined) throw new BubbleError(error.code, error.message, {cause: error.cause});
      else if (error.message) throw new Error(error.message, {cause: error.cause})    
      else throw error;    
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
    const options = params.options || {};
    if (!options.force && (params.subscriptionId === undefined || !this.subscriptions.has(params.subscriptionId))) {
      if (options.silent) return Promise.resolve(); 
      else return Promise.reject(new Error('subscription does not exist'));
    }
    return this.post('unsubscribe', params)
      .then(() => {
        this.subscriptions.delete(params.subscriptionId);
      })
      .catch(error => {
        if (options.force) this.subscriptions.delete(params.subscriptionId);
        if (!options.silent) throw error;
      })
  }

  
  close() {
    this._clearTimers();
    this.state = STATE.closing;
    return new Promise(resolve => {
      this.ws.on('close', resolve);
      this.ws.close();
    })
  }

  on(event, listener) {
    if (this.eventListeners[event] === undefined) throw new Error('invalid event');
    if (!this.eventListeners[event].find(listener)) this.eventListeners[event].push(listener);
  }

  off(event, listener) {
    if (this.eventListeners[event] === undefined) throw new Error('invalid event');
    this.eventListeners[event] = this.eventListeners[event].filter(l => l !== listener);
  }

  _handleMessage(data) {
    if (typeof window !== 'undefined') data = data.data;  // browser version passes an event
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
    else console.warn('WebsocketBubbleProvider: unexpected response - id not found in requests map', response);
  }

  _handleSubscription(notification) {
    const listener = this.subscriptions.get(notification.subscriptionId);
    if (listener) listener(notification);
  }

  _sendHeartbeat() {
    this.post('ping').catch(error => {
      console.warn('WebsocketBubbleProvider: heartbeat could not be sent:', error);
    });
    if (this.options.heartbeatPeriod > 0) this.timers.heartbeatTimer = setTimeout(this._sendHeartbeat, this.options.heartbeatPeriod);
  }

  _rejectAllRequests(error) {
    for (const {reject} of this.requests.values()) {
      reject(error);
    }
    this.requests.clear();
    this.subscriptions.clear();
  }

  _onClose(event) {
    this._clearTimers();
    this._notifyListeners('available', false, event);
    this._rejectAllRequests(event);
    if (this.state === STATE.open) {
      this.reconnectAttempts = 0;
      this.reconnectTriggerEvent = event;
      this._reconnect();
    }
    else {
      this.state = STATE.closed;
      this._notifyListeners('close', event);
    }
  }

  _reconnect() {
    if (this.reconnectAttempts++ >= this.options.reconnectAttempts) {
      this.state = STATE.closed;
      this._notifyListeners('close', this.reconnectTriggerEvent);
    }
    else {
      this.state = STATE.reconnecting;
      this.connect()
        .catch(error => {
          this.timers.reconnectTimer = setTimeout(this._reconnect, this.options.reconnectPeriod);
        })
    }
  }

  _clearTimers(timers=Object.values(this.timers)) {
    timers.forEach(t => {
      if (t != null) clearTimeout(t); 
    })
  }

  _notifyListeners(event, ...payload) {
    this.eventListeners[event].forEach(l => l(...payload));
  }

}

