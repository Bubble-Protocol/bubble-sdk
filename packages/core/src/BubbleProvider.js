// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

/**
 * BubbleProvider - abstract interface to a remote Bubble server.
 */
export class BubbleProvider {

  /**
   * Posts a remote procedure call to the server
   * 
   * @param {String} method the RPC method to call
   * @param {Object} params the method parameters
   * @returns Promise to resolve if the call was successful or to reject if not
   */
  post(method, params) {
    throw new Error('BubbleProvider.post is a virtual function and must be implemented');
  }

}


