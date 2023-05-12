// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleError, BubbleProvider, assert } from '@bubble-protocol/core';
import jayson from 'jayson';

export class HTTPBubbleProvider extends BubbleProvider {

  url;
  client;

  constructor(_url) {
    super();
    if (typeof _url === 'string') _url = new URL(_url);
    assert.isInstanceOf(_url, URL, 'url');
    this.url = _url;
    this.client = this.url.protocol === 'https' ? jayson.Client.https(this.url.href) : jayson.Client.http(this.url.href);
  }

  post(method, params) {
    return new Promise((resolve, reject) => {
      this.client.request(method, params, (err, response) => {
        if (err) reject(err);
        else {
          if (response.error) {
            if (response.error.code) reject(new BubbleError(response.error.code, response.error.message, {cause: response.error.cause}));
            else reject(new Error(response.error.message, {cause: response.error.cause}))
          }
          else resolve(response.result);
        }
      });
    })
  }

}
