import { beforeAll, describe, jest } from '@jest/globals';
import { BubbleError } from '@bubble-protocol/core';
import { Guardian } from '../../src/Guardian.js';
import { ErrorCodes, Permissions, TestBlockchainProvider, TestDataServer, COMMON_RPC_PARAMS, VALID_FILE, ROOT_PATH, VALID_DIR } from './common.js';
import { testPostParams } from './post.params.js';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';

describe("Guardian", () => {

  describe("'post' method rejects gracefully when", () => { testPostParams() });


  describe('Scenarios', () => {

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
  
  
    function post(method, params, mockPermissions, options = {}) {
      const newParams = {...params};
      if (options.stubs) options.stubs();
      blockchainProvider.recoverSignatory.mockResolvedValueOnce(signatory);
      blockchainProvider.getChainId.mockReturnValueOnce(1);
      blockchainProvider.getPermissions.mockResolvedValueOnce(mockPermissions);
      return guardian.post(method, newParams, options.listener)
    }

  
    function commonTests(method, params, requiredPermissions, options={}) {

      if (requiredPermissions > 0) {

        test('rejects with permission denied error if signatory has no permissions', async () => {
          const mockPermissions = Permissions.DIRECTORY_BIT | (Permissions.ALL_PERMISSIONS & ~requiredPermissions);
          return expect(post(method, params, mockPermissions, options))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })

        test('resolves if user has (and only has) the required permissions', async () => {
          blockchainProvider.recoverSignatory.mockResolvedValueOnce(signatory);
          blockchainProvider.getChainId.mockReturnValueOnce(1);
          blockchainProvider.getPermissions.mockResolvedValueOnce(Permissions.DIRECTORY_BIT | requiredPermissions);
          dataServer[method].mockResolvedValueOnce();
          return expect(guardian.post(method, params, options.listener)).resolves.not.toThrow()
            .then(() => {
              const expectedSignedPacket = {
                method: method,
                params: {...params}
              }
              delete expectedSignedPacket.params.signature;
              expect(blockchainProvider.recoverSignatory.mock.calls).toHaveLength(1);
              expect(typeof blockchainProvider.recoverSignatory.mock.calls[0][0]).toBe('object');
              expect(blockchainProvider.recoverSignatory.mock.calls[0][0]).toEqual(expect.objectContaining(expectedSignedPacket));
              expect(blockchainProvider.recoverSignatory.mock.calls[0][1]).toBe(params.signature);
              expect(blockchainProvider.getChainId.mock.calls).toHaveLength(1);
              expect(blockchainProvider.getPermissions.mock.calls).toHaveLength(1);
              expect(blockchainProvider.getPermissions.mock.calls[0][0]).toBe(params.contract);
              expect(blockchainProvider.getPermissions.mock.calls[0][1]).toBe(signatory);
              expect(blockchainProvider.getPermissions.mock.calls[0][2]).toBe(params.file ? VALID_DIR : ROOT_PATH);
              expect(dataServer[method].mock.calls).toHaveLength(1);
              let paramIndex = 0;
              expect(dataServer[method].mock.calls[0][paramIndex++]).toBe(params.contract);
              if (params.file) expect(dataServer[method].mock.calls[0][paramIndex++]).toBe(params.file);
              if (params.data) expect(dataServer[method].mock.calls[0][paramIndex++]).toBe(params.data);
              if (params.options) expect(dataServer[method].mock.calls[0][paramIndex++]).toBe(params.options);
            })
        })
  
      }
  
      test('rejects when the data server rejects and passes the error through if a BubbleError', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce(new BubbleError(1234, 'data server rejection'));
        return expect(post(method, params, mockPermissions, options))
          .rejects.toBeBubbleError(new BubbleError(1234, 'data server rejection'));
      })

      test('rejects when the data server rejects and wraps a non-bubble error in a BubbleError Internal Error', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce(new Error('data server simple error'));
        return expect(post(method, params, mockPermissions, options))
          .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server simple error'));
      })
  
      test('rejects with an Internal BubbleError when the data server rejects with no error', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce();
        return expect(post(method, params, mockPermissions, options))
          .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server error'));
      })
  
      test('rejects with a Blockchain BubbleError if not the correct chainId', async () => {
        const newParams = {...params, chainId: 2};
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce();
        return expect(post(method, newParams, mockPermissions, options))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED});
      })
  
      test('calls terminate and rejects with Terminated BubbleError when ACC has been terminated (and options are not passed through)', async () => {
        const paramOptions = { val: 1, str: "hello" };
        const newParams = {...params, options: paramOptions};
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT;
        dataServer.terminate.mockResolvedValueOnce();
        return expect(post(method, newParams, mockPermissions, options))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_BUBBLE_TERMINATED})
          .then(() => {
            expect(dataServer.terminate.mock.calls).toHaveLength(1);
            expect(dataServer.terminate.mock.calls[0][0]).toBe(params.contract);
            expect(dataServer.terminate.mock.calls[0][1]).toBe(undefined);
          });
      })
  
      test('passes options through to the data server', async () => {
        const paramOptions = { val: 1, str: "hello" };
        const newParams = {...params, options: paramOptions};
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, newParams, mockPermissions, options)).resolves.not.toThrow()
        .then(() => {
          expect(blockchainProvider.recoverSignatory.mock.calls).toHaveLength(1);
          let paramIndex = params.file ? params.data || options.listener ? 3 : 2 : 1;
          expect(dataServer[method].mock.calls[0][paramIndex++]).toBe(paramOptions);
        })
      })

      test('enforces lowercase contract', async () => {
        const contractIn = '0x'+'1234ABCDEF'.repeat(4);
        const expectedContract = '0x'+'1234abcdef'.repeat(4);
        const newParams = {...params, contract: contractIn};
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, newParams, mockPermissions, options)).resolves.not.toThrow()
        .then(() => {
          expect(dataServer[method].mock.calls[0][0]).toBe(expectedContract);
        })
      })

      if (params.file) {

        test('enforces lowercase filename hex', async () => {
          const isDirectory = params.file.indexOf('/') < 0;
          var filenameIn = '0x'+'0123456789ABCDEF'.repeat(4);
          var expectedFilename = '0x'+'0123456789abcdef'.repeat(4);
          filenameIn += isDirectory ? '' : '/MyFile.txt';
          expectedFilename += isDirectory ? '' : '/MyFile.txt';
          const newParams = {...params, file: filenameIn};
          const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
          dataServer[method].mockResolvedValueOnce();
          return expect(post(method, newParams, mockPermissions, options)).resolves.not.toThrow()
          .then(() => {
            expect(dataServer[method].mock.calls[0][1]).toBe(expectedFilename);
          })
        })

        test(`enforces leading '0x' in filename`, async () => {
          const newParams = {...params, file: params.file.slice(2)};
          const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
          dataServer[method].mockResolvedValueOnce();
          return expect(post(method, newParams, mockPermissions, options)).resolves.not.toThrow()
          .then(() => {
            expect(dataServer[method].mock.calls[0][0]).toBe(params.contract);
            expect(dataServer[method].mock.calls[0][1]).toBe(params.file);
          })
        })

      }

    }
  

    describe("rpc create", () => {

      const method = 'create';

      commonTests(method, {...COMMON_RPC_PARAMS}, Permissions.WRITE_BIT);

      test('rejects if a file parameter is given that is not the root directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_FILE
        }
        return expect(post(method, params, Permissions.WRITE_BIT))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })
  
      test('is successful if a file parameter is given that is the root directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: ROOT_PATH
        }
        blockchainProvider.recoverSignatory.mockResolvedValueOnce(signatory);
        blockchainProvider.getChainId.mockReturnValueOnce(1);
        blockchainProvider.getPermissions.mockResolvedValueOnce(Permissions.WRITE_BIT);
        dataServer[method].mockResolvedValueOnce();
        return expect(guardian.post(method, params)).resolves.not.toThrow()
        .then(() => {
          expect(blockchainProvider.recoverSignatory.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getChainId.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getPermissions.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getPermissions.mock.calls[0][0]).toBe(params.contract);
          expect(blockchainProvider.getPermissions.mock.calls[0][1]).toBe(signatory);
          expect(blockchainProvider.getPermissions.mock.calls[0][2]).toBe(ROOT_PATH);
        })
      })
  
    })
      

    describe("rpc write", () => {

      const method = 'write';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE,
        data: "hello world"
      };

      commonTests(method, params, Permissions.WRITE_BIT);

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('rejects if the data param is missing', async () => {
        const newParams = {...params};
        delete newParams.data;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

    })

    
    describe("rpc append", () => {

      const method = 'append';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE,
        data: "hello world"
      };

      commonTests(method, params, (Permissions.WRITE_BIT | Permissions.APPEND_BIT));

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('rejects if the data param is missing', async () => {
        const newParams = {...params};
        delete newParams.data;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('is successful if user has only append permissions', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_FILE,
          data: "hello world"
        };
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.APPEND_BIT)).resolves.not.toThrow();
      })
  
      test('is successful if user has only write permissions', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_FILE,
          data: "hello world"
        };
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.APPEND_BIT)).resolves.not.toThrow();
      })
  
    })

      
    describe("rpc read", () => {

      const method = 'read';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE
      };

      commonTests(method, params, Permissions.READ_BIT);

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('resolves with the file contents', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_FILE
        };
        dataServer[method].mockResolvedValueOnce("the data");
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT)).resolves.toBe("the data");
      })
  
      test('returns directory listing if the file is a directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_DIR
        };
        const method = 'list';
        dataServer[method].mockResolvedValueOnce("the listing");
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT)).resolves.toBe("the listing")
          .then(() => {
            expect(dataServer[method].mock.calls).toHaveLength(1);
            expect(dataServer[method].mock.calls[0][1]).toBe(VALID_DIR);
          })
      })
  
    })


    describe("rpc delete", () => {

      const method = 'delete';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE
      };

      commonTests(method, params, Permissions.WRITE_BIT);

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('cannot delete the root directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: ROOT_PATH
        };
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.WRITE_BIT))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })
  
      test('can delete a directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_DIR
        };
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.WRITE_BIT)).resolves.not.toThrow()
          .then(() => {
            expect(dataServer[method].mock.calls).toHaveLength(1);
            expect(dataServer[method].mock.calls[0][1]).toBe(VALID_DIR);
          })
      })
  
    })

      
    describe("rpc mkdir", () => {

      const method = 'mkdir';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_DIR
      };

      commonTests(method, params, Permissions.WRITE_BIT);

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('cannot mkdir the root directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: ROOT_PATH
        };
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.WRITE_BIT))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })
  
      test('cannot mkdir a file', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_FILE
        };
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.WRITE_BIT))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })
  
    })

      
    describe("rpc list", () => {

      const method = 'list';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE
      };

      commonTests(method, params, Permissions.READ_BIT);

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('is successful if the file is a directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_DIR
        };
        dataServer[method].mockResolvedValueOnce("the data");
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT)).resolves.toBe("the data")
          .then(() => {
            expect(dataServer[method].mock.calls).toHaveLength(1);
            expect(dataServer[method].mock.calls[0][1]).toBe(VALID_DIR);
          })
      })
  
      test('is successful if the file is the root directory', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: ROOT_PATH
        };
        dataServer[method].mockResolvedValueOnce("the data");
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT)).resolves.toBe("the data")
          .then(() => {
            expect(dataServer[method].mock.calls).toHaveLength(1);
            expect(dataServer[method].mock.calls[0][1]).toBe(ROOT_PATH);
          })
      })
  
    })


    describe("rpc getPermissions", () => {

      const method = 'getPermissions';

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE
      };

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        return expect(post(method, newParams, 0n))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('resolves with the file permissions regardless of user permissions', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: VALID_FILE
        };
        const mockPermissions = BigInt("0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF");
        const permissions = await post(method, params, mockPermissions);
        expect(typeof permissions).toBe('string');
        expect(permissions).toMatch(/^0x[0-9a-fA-F]*$/);
        expect(BigInt(permissions)).toBe(mockPermissions);
      })
  
    })


    describe("rpc subscribe", () => {

      const method = 'subscribe';

      const VALID_SUBSCRIPTION = { subscriptionId: 1 };

      const UNEXPECTED_LISTENER = () => { throw new Error('listener called when not expected')};

      const params = {
        ...COMMON_RPC_PARAMS,
        file: VALID_FILE
      };

      // Test a notification by constructing a subscription then calling the listener that the
      // Guardian passed to the mock data server.
      async function testNotification(listener, notification, notifyPermissions) {
        // subscribe
        dataServer[method].mockResolvedValueOnce(VALID_SUBSCRIPTION);
        await post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT, {listener: listener});
        expect(dataServer[method].mock.calls[0][0]).toBe(params.contract);
        expect(dataServer[method].mock.calls[0][1]).toBe(params.file);
        const guardianListener = dataServer[method].mock.calls[0][2]
        expect(typeof guardianListener).toBe('function');
        // simulate notification
        blockchainProvider.getPermissions.mockResolvedValueOnce(Permissions.DIRECTORY_BIT | notifyPermissions);
        await guardianListener(notification.subscriptionId, notification.result, notification.error);        
      }

      commonTests(method, params, Permissions.READ_BIT, {listener: UNEXPECTED_LISTENER});

      test('rejects if the file param is missing', async () => {
        const newParams = {...params};
        delete newParams.file;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions, {listener: UNEXPECTED_LISTENER}))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('rejects if the listener param is missing', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, params, mockPermissions, {listener: undefined}))
          .rejects.toThrow('subscriptionListener is null');
      })

      test('rejects if the listener param is an invalid type', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, params, mockPermissions, {listener: 'hello'}))
          .rejects.toThrow('subscriptionListener type. Expected function');
      })

      test('fails if user does not have read access', async () => {
        dataServer[method].mockResolvedValueOnce(VALID_SUBSCRIPTION);
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.WRITE_BIT | Permissions.APPEND_BIT | Permissions.EXECUTE_BIT;
        return expect(post(method, params, mockPermissions, {listener: UNEXPECTED_LISTENER}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })
  
      test('resolves with the data server response if permitted', async () => {
        dataServer[method].mockResolvedValueOnce(VALID_SUBSCRIPTION);
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT, {listener: UNEXPECTED_LISTENER}))
          .resolves.toStrictEqual(VALID_SUBSCRIPTION);
      })
  
      test('resolves if permitted and has no path extension', async () => {
        dataServer[method].mockResolvedValueOnce(VALID_SUBSCRIPTION);
        const newParams = {
          ...params,
          file: VALID_DIR
        }
        return expect(post(method, newParams, Permissions.READ_BIT, {listener: UNEXPECTED_LISTENER}))
          .resolves.toStrictEqual(VALID_SUBSCRIPTION);
      })
  
      test('passes the subscriber and wrapped listener to the data server', async () => {
        dataServer[method].mockResolvedValueOnce(VALID_SUBSCRIPTION);
        const subscription = await post(method, params, Permissions.DIRECTORY_BIT | Permissions.READ_BIT, {listener: UNEXPECTED_LISTENER});
        expect(subscription).toStrictEqual(VALID_SUBSCRIPTION);
        expect(dataServer[method].mock.calls[0][0]).toBe(params.contract);
        expect(dataServer[method].mock.calls[0][1]).toBe(params.file);
        expect(typeof dataServer[method].mock.calls[0][2]).toBe('function');
      })
  
      test('forwards a notification to the listener if still permitted', async () => {
        const listener = jest.fn();
        await testNotification(listener, {subscriptionId: 1, result: 'notification'}, Permissions.READ_BIT);
        expect(listener.mock.calls).toHaveLength(1);
        expect(listener.mock.calls[0][0]).toBe(1);
        expect(listener.mock.calls[0][1]).toBe('notification');
        expect(listener.mock.calls[0][2]).toBeUndefined();
      })
  
      test('forwards an error notification to the listener if still permitted', async () => {
        const listener = jest.fn();
        const error = new BubbleError(123, 'Test Error');
        await testNotification(listener, {subscriptionId: 1, error: error}, Permissions.READ_BIT);
        expect(listener.mock.calls).toHaveLength(1);
        expect(listener.mock.calls[0][0]).toBe(1);
        expect(listener.mock.calls[0][1]).toBeUndefined();
        expect(listener.mock.calls[0][2]).toStrictEqual(error);
      })
  
      test('forwards a subscription terminated error to the listener if the client no longer has read permissions', async () => {
        const listener = jest.fn();
        await testNotification(listener, {subscriptionId: 1, result: 'notification'}, Permissions.WRITE_BIT | Permissions.APPEND_BIT | Permissions.EXECUTE_BIT);
        expect(listener.mock.calls).toHaveLength(1);
        expect(listener.mock.calls[0][0]).toBe(1);
        expect(listener.mock.calls[0][1]).toBeUndefined();
        expect(listener.mock.calls[0][2]).toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_SUBSCRIPTION_TERMINATED})
      })
  
    })


    describe("rpc unsubscribe", () => {

      const method = 'unsubscribe';

      const params = {
        ...COMMON_RPC_PARAMS,
        subscriptionId: 1
      };

      test('rejects if the subscriptionId param is missing', async () => {
        const newParams = {...params};
        delete newParams.subscriptionId;
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('rejects when the data server rejects and passes the error through if a BubbleError', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce(new BubbleError(1234, 'data server rejection'));
        return expect(post(method, params, mockPermissions))
          .rejects.toBeBubbleError(new BubbleError(1234, 'data server rejection'));
      })

      test('rejects when the data server rejects and wraps a non-bubble error in a BubbleError Internal Error', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce(new Error('data server simple error'));
        return expect(post(method, params, mockPermissions))
          .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server simple error'));
      })
  
      test('rejects with an Internal BubbleError when the data server rejects with no error', async () => {
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce();
        return expect(post(method, params, mockPermissions))
          .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server error'));
      })
  
      test('rejects with a Blockchain BubbleError if not the correct chainId', async () => {
        const newParams = {...params, chainId: 2};
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce();
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED});
      })
  
      test('passes subscriptionId and options through to the data server', async () => {
        const newParams = {
          ...params, 
          options: { val: 1, str: "hello" }
        };
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, newParams, mockPermissions)).resolves.not.toThrow()
        .then(() => {
          expect(dataServer[method].mock.calls[0][0]).toBe(newParams.subscriptionId);
          expect(dataServer[method].mock.calls[0][1]).toBe(newParams.options);
        })
      })

      test('passes subscriptionId through to the server regardless of the subscriptionId type', async () => {
        const newParams = {
          ...params,
          subscriptionId: {a: 'str', b: 1},
          options: { val: 1, str: "hello" }
        }
        const mockPermissions = Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, newParams, mockPermissions)).resolves.not.toThrow()
        .then(() => {
          expect(dataServer[method].mock.calls[0][0]).toBe(newParams.subscriptionId);
          expect(dataServer[method].mock.calls[0][1]).toBe(newParams.options);
        })
      })
  
      test(`resolves regardless of the sender's permissions`, async () => {
        const mockPermissions = BigInt(0);
        dataServer[method].mockResolvedValueOnce();
        return expect(post(method, params, mockPermissions)).resolves.not.toThrow();
      })
  
    })

      
    describe("rpc terminate", () => {

      const method = 'terminate';

        const params = {
          ...COMMON_RPC_PARAMS,
          file: ROOT_PATH
        }

      test('rejects when the data server rejects and passes the error through if a BubbleError', async () => {
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT | Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce(new BubbleError(1234, 'data server rejection'));
        return expect(post(method, params, mockPermissions))
          .rejects.toBeBubbleError(new BubbleError(1234, 'data server rejection'));
      })

      test('rejects when the data server rejects and wraps a non-bubble error in a BubbleError Internal Error', async () => {
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT | Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce(new Error('data server simple error'));
        return expect(post(method, params, mockPermissions))
          .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server simple error'));
      })
  
      test('rejects with an Internal BubbleError when the data server rejects with no error', async () => {
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT | Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce();
        return expect(post(method, params, mockPermissions))
          .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'data server error'));
      })
  
      test('rejects with a Blockchain BubbleError if not the correct chainId', async () => {
        const newParams = {...params, chainId: 2};
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT | Permissions.ALL_PERMISSIONS;
        dataServer[method].mockRejectedValueOnce();
        return expect(post(method, newParams, mockPermissions))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_BLOCKCHAIN_NOT_SUPPORTED});
      })
  
      test('is successful if the data server resolves and regardless of write permissions', async () => {
        const params = {
          ...COMMON_RPC_PARAMS
        }
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT;
        dataServer[method].mockReturnValueOnce(Promise.resolve());
        return expect(post(method, params, mockPermissions)).resolves.not.toThrow()
        .then(() => {
          expect(dataServer.terminate.mock.calls).toHaveLength(1);
          expect(dataServer.terminate.mock.calls[0][0]).toBe(params.contract);
        })
      })
  
      test('options are passed through', async () => {
        const options = {val: 1, str: 'a1'};
        const params = {
          ...COMMON_RPC_PARAMS,
          options: options
        }
        const mockPermissions = Permissions.BUBBLE_TERMINATED_BIT;
        dataServer[method].mockReturnValueOnce(Promise.resolve());
        return expect(post(method, params, mockPermissions)).resolves.not.toThrow()
        .then(() => {
          expect(dataServer.terminate.mock.calls).toHaveLength(1);
          expect(dataServer.terminate.mock.calls[0]).toHaveLength(2);
          expect(dataServer.terminate.mock.calls[0][0]).toBe(params.contract);
          expect(dataServer.terminate.mock.calls[0][1]).toBe(options);
        })
      })
  
      test('rejects if the contract is not terminated', async () => {
        const params = {
          ...COMMON_RPC_PARAMS,
          file: ROOT_PATH
        }
        return expect(post(method, params, Permissions.DIRECTORY_BIT | Permissions.ALL_PERMISSIONS))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })
  
    })  // rpc terminate
      
    describe('fails gracefully when blockchain is unavailable', () => {

      test('BlockchainProvider throws', async () => {
        const params = {...COMMON_RPC_PARAMS};
        blockchainProvider.recoverSignatory.mockResolvedValueOnce(signatory);
        blockchainProvider.getChainId.mockReturnValueOnce(1);
        blockchainProvider.getPermissions.mockImplementation(() => { throw new Error('getPermissions mock force failed') });
        return expect(guardian.post('create', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, "Blockchain unavailable - please try again later."))
        .then(() => {
          expect(blockchainProvider.recoverSignatory.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getChainId.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getPermissions.mock.calls).toHaveLength(1);
        });
      })
  
      test('BlockchainProvider rejects', async () => {
        const params = {...COMMON_RPC_PARAMS};
        blockchainProvider.recoverSignatory.mockResolvedValueOnce(signatory);
        blockchainProvider.getChainId.mockReturnValueOnce(1);
        blockchainProvider.getPermissions.mockRejectedValueOnce(new Error('getPermissions mock force failed'));
        return expect(guardian.post('create', params))
        .rejects.toBeBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, "Blockchain unavailable - please try again later."))
        .then(() => {
          expect(blockchainProvider.recoverSignatory.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getChainId.mock.calls).toHaveLength(1);
          expect(blockchainProvider.getPermissions.mock.calls).toHaveLength(1);
        });
      })
  
    }) // fails gracefully when blockchain is unavailable

  }) // Scenarios

});
