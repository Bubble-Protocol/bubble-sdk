import { jest } from '@jest/globals';
import { IBlockchainProvider } from '../../src/blockchain-providers/IBlockchainProvider.js';
import { DataServer } from '../../src/DataServer.js';

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
export const DUMMY_SIGNATURE = 'dummy-signature';

export const COMMON_RPC_PARAMS = {
  version: 1,
  timestamp: 1,
  nonce: "a1",
  chainId: 1,
  contract: VALID_CONTRACT,
  signature: DUMMY_SIGNATURE
};

export const VALID_RPC_PARAMS = {
  ...COMMON_RPC_PARAMS,
  file: VALID_FILE,
  data: 'hello world',
  options: undefined,
};


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
    this.subscribe = jest.fn(() => Promise.reject(new Error('unexpected stub call: subscribe')));
    this.unsubscribe = jest.fn(() => Promise.reject(new Error('unexpected stub call: unsubscribe')));
    this.terminate = jest.fn(() => Promise.reject(new Error('unexpected stub call: terminate')));
  }

}


export class TestBlockchainProvider extends IBlockchainProvider {

  resetStubs() {
    this.getPermissions = jest.fn(() => Promise.reject(new Error('unexpected stub call: getPermissions')));
    this.getChainId = jest.fn(() => { throw new Error('unexpected stub call: getChainId') });
    this.recoverSignatory = jest.fn(() => Promise.reject(new Error('unexpected stub call: recoverSignature')));
    this.hasBeenRevoked = jest.fn(() => Promise.reject(new Error('unexpected stub call: hasBeenRevoked')));
  }

  validateContract(contract) {
    return VALID_EVM_CONTRACT_ADDRESS_REGEX.test(contract);
  }

}

const VALID_EVM_CONTRACT_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;