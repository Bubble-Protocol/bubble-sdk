// Copyright (c) 2025 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";

/**
 * EIP-712 definitions
 */

const EIP712_DOMAIN = {
  name: "BubbleProtocol",
  version: "1.0"
}

const EIP712_REQUEST_TYPES = {
  Request: [
    { name: "version", type: "uint256" },
    { name: "method", type: "string" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "contract", type: "address" },
    { name: "file", type: "string" },
    { name: "data", type: "string" },
    { name: "options", type: "string" }
  ]
};

const EIP712_DELEGATE_TYPES = {
  Delegation: [
    { name: "version", type: "uint256" },
    { name: "delegate", type: "address" },
    { name: "expires", type: "uint256" },
    { name: "permissions", type: "Permission[]" },
  ],
  Permission: [
    { name: "type", type: "string" },
    { name: "chain", type: "uint256" },
    { name: "contract", type: "address" },
    { name: "provider", type: "string" }, // optional field, can be empty string
  ]
};

function getEIP712Domain(chainId) {
  const chain = (chainId === undefined) ? {} : { chainId: chainId }
  return {
    ...EIP712_DOMAIN,
    ...chain
  }
}

function rpcToEIP712Message(packet) {
  assert.isObject(packet, 'packet');
  assert.isObject(packet.params, 'params');
  return {
    version: packet.params.version,
    method: packet.method,
    timestamp: packet.params.timestamp,
    nonce: packet.params.nonce,
    chainId: packet.params.chainId,
    contract: packet.params.contract,
    file: packet.params.file ?? '',
    data: packet.params.data ?? '',
    options: JSON.stringify(packet.params.options ?? {})
  }
}

function delegateToEIP712Message(packet) {
  assert.isObject(packet, 'packet');
  assert.isArray(packet.permissions, 'permissions');
  return {
    version: packet.version,
    delegate: packet.delegate,
    expires: packet.expires,
    permissions: packet.permissions.map(p => {
      return {
        type: p.type,
        chain: p.chain,
        contract: p.contract,
        provider: p.provider ?? ''
      }
    })
  }
}


export const eip712 = {
  getEIP712Domain,
  EIP712_REQUEST_TYPES,
  EIP712_DELEGATE_TYPES,
  rpcToEIP712Message,
  delegateToEIP712Message
}