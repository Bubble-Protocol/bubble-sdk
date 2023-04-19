import { jest } from '@jest/globals';
import { BlockchainProvider, BubbleError } from '@bubble-protocol/core';
import { DataServer } from '../../src/DataServer';

/**
 * Errors
 */

export const ErrorCodes = {
  JSON_RPC_ERROR_INVALID_REQUEST: -32600,
  JSON_RPC_ERROR_METHOD_NOT_FOUND: -32601,
  JSON_RPC_ERROR_INVALID_METHOD_PARAMS: -32602,
  BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED: -32000,
  BUBBLE_ERROR_BUBBLE_TERMINATED: -32001,
  BUBBLE_ERROR_PERMISSION_DENIED: -32002,
  BUBBLE_ERROR_AUTHENTICATION_FAILURE: -32003,
  BUBBLE_ERROR_METHOD_FAILED: -32004,
  BUBBLE_ERROR_INTERNAL_ERROR: -32005
}

expect.extend({

  withBubbleError(received, expected) {
    if (!received) return {pass: false, message: () => `Expected a BubbleError but received nothing`}
    if (!(received instanceof BubbleError)) return {pass: false, message: () => `not a BubbleError - ${received ? received.toString() +' ('+ JSON.stringify(received.stack) +')' : 'null'}`}
    if (expected.code && received.code !== expected.code) return {pass: false, message: () => `Expected error code ${expected.code}, received ${received.code} (message: '${received.message}')`}
    if (expected.message && received.message !== expected.message) return {pass: false, message: () => `Expected "${expected.message}", received "${received.message}"`}
    return {pass: true, message: () => 'Expected error not to be BubbleError'}
  },
  
  withBubbleErrorMatches(received, expected) {
    if (!received) return {pass: false, message: () => `Expected a BubbleError but received nothing`}
    if (!(received instanceof BubbleError)) return {pass: false, message: () => `not a BubbleError - ${received ? received.toString() +' ('+ JSON.stringify(received.stack) +')' : 'null'}`}
    if (received.code !== expected.code) return {pass: false, message: () => `Expected error code ${expected.code}, received ${received.code} (message: '${received.message}')`}
    if (new RegExp(expected.message).test(received.message) !== true) return {pass: false, message: () => `Expected "${expected.message}", received "${received.message}"`}
    return {pass: true, message: () => 'Expected error not to be BubbleError'}
  },
  
});


/**
 * ACC Permissions
 */

export const Permissions = {
  ALL_PERMISSIONS: (1n << 254n) - 1n,
  BUBBLE_TERMINATED_BIT: 1n << 255n,
  DIRECTORY_BIT: 1n << 254n,
  READ_BIT: 1n << 253n,
  WRITE_BIT: 1n << 252n,
  APPEND_BIT: 1n << 251n,
  EXECUTE_BIT: 1n << 250n
}


/**
 * RPCs
 */

export const ROOT_PATH = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const VALID_CONTRACT = '0x0000000000000000000000000000000000000001';
export const VALID_DIR = '0x0000000000000000000000000000000000000000000000000000000000000002';
export const VALID_FILE_PART = 'valid_file';
export const VALID_FILE = VALID_DIR+'/'+VALID_FILE_PART;

export const COMMON_RPC_PARAMS = {
  timestamp: 1,
  nonce: "a1",
  chainId: 1,
  contract: VALID_CONTRACT,
  signatory: undefined, // must populate based on signature
};

export const VALID_RPC_PARAMS = {
  ...COMMON_RPC_PARAMS,
  file: VALID_FILE,
  data: 'hello world',
  options: undefined,
};


/**
 * Cryptographic functions
 */

export const ECDSA_PARAMS = {name: 'ECDSA', hash: 'SHA-256'};
export const ECDSA_KEYGEN_PARAMS = {name: 'ECDSA', namedCurve: 'P-256'};

export async function generateKey(usages) {
  return await crypto.subtle.generateKey(ECDSA_KEYGEN_PARAMS, true, usages)
}

export function signRPC(method, params, key) {
  const packet = {
    method: method,
    params: params
  }
  packet.params.signatory = '0x1c141b67ae5b05349fba6d2f6b74b4045d5c3535';
  packet.params.signature = '79754bd4ec467b5003fe5417429badb5c66c2ff0e8eadc9fe9d8856b5a419d8db960a51ec70a815eded53e32190d71ec777c359e2f8b484493026b862d85a516';
  return Promise.resolve();
  return publicKeyToEthereumAddress(key.publicKey)
    .then(signatory => {
      packet.params.signatory = signatory;
      return crypto.subtle.sign(ECDSA_PARAMS, key.privateKey, Buffer.from(JSON.stringify(packet)));
    })
    .then(signature => {
      packet.params.signature = uint8ArrayToHex(signature);
    })
}

export async function publicKeyToEthereumAddress(publicKey) {
  const rawKey = await crypto.subtle.exportKey('raw', publicKey);
  const hash = await crypto.subtle.digest('SHA-256', rawKey.slice(1));
  return '0x'+uint8ArrayToHex(hash.slice(-20));
}


/**
 * Utils
 */

export function hexToUint8Array(hexString) {
  return Buffer.from(hexString, 'hex');
}

export function uint8ArrayToHex(buffer) {
  return Buffer.from(buffer).toString('hex');
}


/**
 * Stubs
 */

export class TestDataServer extends DataServer {

  resetStubs() {
    this.create = jest.fn(() => Promise.reject(new Error('unexpected stub call: create')));
    this.write = jest.fn(() => Promise.reject(new Error('unexpected stub call: write')));
    this.append = jest.fn(() => Promise.reject(new Error('unexpected stub call: append')));
    this.read = jest.fn(() => Promise.reject(new Error('unexpected stub call: read')));
    this.delete = jest.fn(() => Promise.reject(new Error('unexpected stub call: delete')));
    this.mkdir = jest.fn(() => Promise.reject(new Error('unexpected stub call: mkdir')));
    this.list = jest.fn(() => Promise.reject(new Error('unexpected stub call: list')));
    this.terminate = jest.fn(() => Promise.reject(new Error('unexpected stub call: terminate')));
  }

}


export class TestBlockchainProvider extends BlockchainProvider {

  resetStubs() {
    this.getPermissions = jest.fn(() => Promise.reject(new Error('unexpected stub call: getPermissions')));
    this.getChainId = jest.fn(() => { throw new Error('unexpected stub call: getChainId') });
    this.recoverSignatory = jest.fn(() => Promise.reject(new Error('unexpected stub call: recoverSignature')));
  }

}

