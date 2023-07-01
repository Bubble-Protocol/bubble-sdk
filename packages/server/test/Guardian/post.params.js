import { jest } from '@jest/globals';
import { BubbleError } from '@bubble-protocol/core';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';
import { Guardian } from '../../src/Guardian.js';
import { 
  VALID_CONTRACT, VALID_DIR, VALID_FILE_PART, VALID_RPC_PARAMS, 
  generateKey, signRPC, publicKeyToEthereumAddress, 
  TestDataServer, TestBlockchainProvider, 
  ErrorCodes, Permissions
} from './common';


export function testPostParams(options={}) {

  let key1, key2, dataServer, blockchainProvider, guardian;

  beforeAll(async () => {
    key1 = await generateKey(['sign']);
    key1.address = await publicKeyToEthereumAddress(key1.publicKey);
    key2 = await generateKey(['sign']);
    key2.address = await publicKeyToEthereumAddress(key2.publicKey);
    dataServer = new TestDataServer();
    blockchainProvider = new TestBlockchainProvider();
    guardian = new Guardian(dataServer, blockchainProvider, '');
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
      await signRPC(method, params, key1);
      return expect(guardian.post(method, params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method'));
    });

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = '';
      await signRPC(method, params, key1);
      return expect(guardian.post(method, params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = 1;
      await signRPC(method, params, key1);
      return expect(guardian.post(method, params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_REQUEST, 'malformed method'));
    });

    test("is unknown", async () => {
      const params = {...VALID_RPC_PARAMS};
      const method = 'garbled';
      await signRPC(method, params, key1);
      blockchainProvider.recoverSignatory.mockResolvedValueOnce(key1.address);
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
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed chainId'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.chainId = '1';
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed chainId'));
    });

    test("is not supported", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.chainId = 2;
      await signRPC('write', params, key1);
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockReturnValueOnce(Promise.resolve(key1.address));
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED});
    });

  });


  describe("contract", () => {

    test("is missing", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = undefined;
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = '';
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is too long", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = VALID_CONTRACT+'0';
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is too short", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = VALID_CONTRACT.slice(0, VALID_CONTRACT.length-1);
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = 1;
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

    test("is missing leading '0x'", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.contract = params.contract.slice(2);
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed contract'));
    });

  });


  describe("file", () => {

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = '';
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("as directory is not a 32-byte hex string", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = 'my_dir';
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("as directory is too long", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR+'0';
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("is too short", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR.slice(0, VALID_DIR.length-1);
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("does not have a 32-byte hex directory part", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = 'my_dir/'+VALID_FILE_PART;
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("has a directory part that is too long", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR+'0'+'/'+VALID_FILE_PART;
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("has a directory part that is too short", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = VALID_DIR.slice(0, VALID_DIR.length-1)+'/'+VALID_FILE_PART;
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.file = 1;
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed file'));
    });

  });


  describe("data", () => {

    test("is not a string", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.data = {};
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed data'));
    });

  });


  describe("options", () => {

    test("is not an object", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.options = "options";
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed options'));
    });

  });


  describe("signature", () => {

    test("is missing", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.signature = undefined;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signature'));
    });

    test("is empty", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.signature = '';
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signature'));
    });

    test("is invalid type", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.signature = 1;
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signature'));
    });

    test("cannot be decoded (blockchain provider recoverSignatory throws)", async () => {
      const params = {...VALID_RPC_PARAMS};
      await signRPC('write', params, key1);
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockImplementation(() => { throw new Error('failed') });
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'cannot decode signature'));
    });

    test("cannot be decoded (blockchain provider recoverSignatory rejects)", async () => {
      const params = {...VALID_RPC_PARAMS};
      await signRPC('write', params, key1);
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.recoverSignatory.mockRejectedValueOnce(new Error('failed'));
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'cannot decode signature'));
    });

  });


  describe("signaturePrefix", () => {

    test("is not a string", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.signaturePrefix = {};
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed signaturePrefix'));
    });

  })

  describe("delegate", () => {

    test("is not an object", async () => {
      const params = {...VALID_RPC_PARAMS};
      params.delegate = "a delegate";
      await signRPC('write', params, key1);
      return expect(guardian.post('write', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS, 'malformed delegate'));
    });

  })

}
