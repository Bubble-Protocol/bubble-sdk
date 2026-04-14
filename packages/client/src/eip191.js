// Copyright (c) 2025 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";

/**
 * EIP-191 signature support
 */

function getEIP191SignFunction(signFn) {
  assert.isFunction(signFn, 'signFn');
  return async (data) => {
    const sig = await signFn(data)
    return {
      type: 'eip191',
      signature: sig,
    }
  }
}

export const eip191 = {
  getEIP191SignFunction
}