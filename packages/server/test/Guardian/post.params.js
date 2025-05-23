import { jest } from '@jest/globals';
import { BubbleError } from '@bubble-protocol/core';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';
import { Guardian } from '../../src/Guardian.js';
import { 
  VALID_CONTRACT, VALID_DIR, VALID_FILE_PART, VALID_RPC_PARAMS, 
  TestDataServer, TestBlockchainProvider, 
  ErrorCodes, Permissions
} from './common';


export function testPostParams() {

  const signatory = '0x1234567890123456789012345678901234567890';

  let dataServer, blockchainProvider, guardian;

  beforeAll(async () => {
    dataServer = new TestDataServer();
    blockchainProvider = new TestBlockchainProvider();
    guardian = new Guardian(dataServer, blockchainProvider);
  })

  beforeEach( () => {
    jest.resetAllMocks();
    dataServer.resetStubs();
    blockchainProvider.resetStubs();
  });

  describe("method", () => {

    test("is missing", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = undefined;
      return expect(guardian.post(method, params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method'));
    });

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = '';
      return expect(guardian.post(method, params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = 1;
      return expect(guardian.post(method, params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method'));
    });

    test("is unknown", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = 'garbled';
      blockchainProvider.recoverSignatory.mockResolvedValueOnce(signatory);
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.getPermissions.mockResolvedValueOnce(Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS);
      return guardian.post(method, params)
      .then(() => {throw new Error("forced fail")})
      .catch(err => {
        expect(err).toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_METHOD_NOT_FOUND});
        expect(blockchainProvider.recoverSignatory.mock.calls).toHaveLength(1);
        expect(blockchainProvider.getChainId.mock.calls).toHaveLength(1);
        expect(blockchainProvider.getPermissions.mock.calls).toHaveLength(1);
      });
    });

  })


  describe("chainId", () => {

    test("is missing", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.chainId = undefined;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed chainId'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.chainId = '1';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed chainId'));
    });

    test("is not supported", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.chainId = 2;
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockReturnValueOnce(Promise.resolve(signatory));
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED});
    });

  });


  describe("contract", () => {

    test("is missing", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = undefined;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = '';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is too long", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = VALID_CONTRACT+'0';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is too short", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = VALID_CONTRACT.slice(0, VALID_CONTRACT.length-1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = 1;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is missing leading '0x'", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = params.contract.slice(2);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

  });


  describe("file", () => {

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = '';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("as directory is not a 32-byte hex string", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = 'my_dir';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("as directory is too long", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR+'0';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("is too short", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR.slice(0, VALID_DIR.length-1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("does not have a 32-byte hex directory part", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = 'my_dir/'+VALID_FILE_PART;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("has a directory part that is too long", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR+'0'+'/'+VALID_FILE_PART;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("has a directory part that is too short", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR.slice(0, VALID_DIR.length-1)+'/'+VALID_FILE_PART;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = 1;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

  });


  describe("data", () => {

    test("is not a string", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.data = {};
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed data'));
    });

  });


  describe("options", () => {

    test("is not an object", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.options = "options";
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed options'));
    });

  });


  describe("signature", () => {

    test("is missing", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.signature = undefined;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'missing signature'));
    });

    test("cannot be decoded (blockchain provider recoverSignatory throws)", async () => {
      const params = {...VALID_RPC_PARAMS};
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockImplementation(() => { throw new Error('failed') });
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'invalid signature - failed'));
    });

    test("cannot be decoded (blockchain provider recoverSignatory rejects)", async () => {
      const params = {...VALID_RPC_PARAMS};
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockRejectedValueOnce(new Error('failed'));
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'invalid signature - failed'));
    });

    test("rejects with provider error if a BubbleError is thrown", async () => {
      const params = {...VALID_RPC_PARAMS};
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockImplementation(() => { throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'internal failure') });
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'internal failure'));
    });

    test("rejects with provider error if a BubbleError is rejected", async () => {
      const params = {...VALID_RPC_PARAMS};
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockRejectedValueOnce(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'internal failure'));
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'internal failure'));
    });

  });

}
