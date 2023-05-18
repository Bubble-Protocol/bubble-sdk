import { jest } from '@jest/globals';
import { BlockchainProvider } from '@bubble-protocol/core';
import { DataServer } from '../../src/DataServer.js';
import { ecdsa } from '@bubble-protocol/crypto';

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
  BUBBLE_ERROR_INTERNAL_ERROR: -32005,
  BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS: -32020,
  BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST: -32021,
  BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST: -32022,
  BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS: -32023,
  BUBBLE_SERVER_ERROR_DIR_NOT_EMPTY: -32024
}


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
  return crypto.subtle.sign(ECDSA_PARAMS, key.privateKey, Buffer.from(JSON.stringify(packet)))
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
    this.getPermissions = jest.fn(() => Promise.reject(new Error('unexpected stub call: getPermissions')));
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

