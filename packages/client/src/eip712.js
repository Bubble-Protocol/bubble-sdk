// Copyright (c) 2025 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { assert } from "@bubble-protocol/core";

/**
 * EIP-712 definitions
 */

const EIP712_DOMAIN = {
  name: "BubbleProtocol",
  version: "1.0",
  verifyingContract: "0x0000000000000000000000000000000000000000"
}

const EIP712_REQUEST_TYPES = {
  BubbleDataRequest: [
    { name: "purpose", type: "string" },
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
  BubbleDelegate: [
    { name: "purpose", type: "string" },
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
    purpose: "Off-Chain Bubble Data Request",
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
    purpose: "Authorize Delegate Account to Access Off-Chain Content",
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

function packetToTypedData(packet, context) {
  assert.isObject(packet, 'packet');
  assert.isString(context, 'context');
  switch (context) {
    case 'rpc':
      assert.isObject(packet.params, 'params');
      assert.isNumber(packet.params.chainId, 'params.chainId');
      return {
        domain: getEIP712Domain(packet.params.chainId),
        types: EIP712_REQUEST_TYPES,
        primaryType: "BubbleDataRequest",
        message: rpcToEIP712Message(packet)
      };
    case 'delegate':
      assert.isString(packet.delegate, 'delegate');
      assert.isNumber(packet.expires, 'expires');
      assert.isArray(packet.permissions, 'permissions');
      return {
        domain: getEIP712Domain(),
        types: EIP712_DELEGATE_TYPES,
        primaryType: "BubbleDelegate",
        message: delegateToEIP712Message(packet)
      };
    default:
      throw new Error(`invalid context '${context}'. Should be 'rpc' or 'delegate'`);
  }
}

function getEIP712SignFunction(context, signFn) {
  assert.isString(context, 'context');
  assert.isFunction(signFn, 'signFn');
  return async (packet) => {
    assert.isObject(packet, 'packet');
    const typedData = packetToTypedData(packet, context);
    const sig = await signFn(typedData.domain, typedData.types, typedData.message)
    .catch((err) => {throw new Error(`EIP712 sign function error: ${err.message}`, {cause: err})});
    return {
      type: 'eip712',
      signature: sig,
    }
  }
}

function getEIP191SignFunction(signFn) {
  assert.isFunction(signFn, 'signFn');
  return async (packet) => {
    assert.isObject(packet, 'packet');
    const sig = await signFn(JSON.stringify(packet))
    .catch((err) => {throw new Error(`EIP191 sign function error: ${err.message}`, {cause: err})});
    return {
      type: 'eip191',
      signature: sig,
    }
  }
}

function getSignFunction(signFn) {
  assert.isFunction(signFn, 'signFn');
  return async (packet) => {
    assert.isObject(packet, 'packet');
    const sig = await signFn(JSON.stringify(packet))
    .catch((err) => {throw new Error(`Sign function error: ${err.message}`, {cause: err})});
    return {
      type: 'plain',
      signature: sig,
    }
  }
}

export const eip712 = {
  getEIP712Domain,
  EIP712_REQUEST_TYPES,
  EIP712_DELEGATE_TYPES,
  rpcToEIP712Message,
  delegateToEIP712Message,
  packetToTypedData,
  getEIP191SignFunction,
  getEIP712SignFunction,
  getSignFunction
}