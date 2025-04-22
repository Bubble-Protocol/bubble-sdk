import { describe, jest } from '@jest/globals';
import { BubbleError, ErrorCodes } from '@bubble-protocol/core';
import { EVMProvider } from '../../src/blockchain-providers/EVM/EVMProvider.js';
import { privateKeyToAccount, sign } from 'viem/accounts';
import { keccak256, serializeSignature, toBytes } from 'viem';
import { generatePrivateKey } from 'viem/accounts';
import { eip712 } from '../../src/blockchain-providers/EVM/eip712.js';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';


describe("EVMProvider", () => {

  let uut;
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const delegateKey = generatePrivateKey();
  const delegateAccount = privateKeyToAccount(delegateKey);
  let activeBubbleDelegate;


  //
  // Constants
  //

  const PROTOCOL_VERSION = "1.0";
  const CHAIN_ID = 1;
  const PROVIDER = "TODO";
  const HOST_DOMAIN = 'bubble.io';
  
  const DUMMY_SIGNATURE = {
    type: 'plain',
    signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  }
  
  const VALID_CONTRACT = '0x0000000000000000000000000000000000000001';
  const VALID_DIR = '0x0000000000000000000000000000000000000000000000000000000000000002';
  const VALID_FILE_PART = 'valid_file';
  const VALID_FILE = VALID_DIR+'/'+VALID_FILE_PART;

  const COMMON_RPC_PARAMS = {
    version: 1,
    timestamp: 1,
    nonce: "a1",
    chainId: 1,
    contract: VALID_CONTRACT,
  };
  
  const MIN_VALID_RPC_PACKET = {
    method: 'create',
    params: {
      ...COMMON_RPC_PARAMS
    }
  }
  
  const MAX_VALID_RPC_PACKET = {
    method: 'write',
    params: {
      ...COMMON_RPC_PARAMS,
      file: VALID_FILE,
      data: 'hello world',
      options: {o1: 'test-option-1', o2: 'test-option-2'},
    }
  }
  
  const MIN_VALID_DELEGATE_PACKET = {
    version: 1,
    delegate: account.address,
    expires: 1,
    permissions: [
      {
        type: 'contract',
        chain: 1,
        contract: VALID_CONTRACT
      }
    ]
  }
  
  const MAX_VALID_DELEGATE_PACKET = {
    version: 1,
    delegate: account.address,
    expires: 2**31-1,
    permissions: [
      {
        type: 'bubble',
        chain: 1,
        contract: VALID_CONTRACT,
        provider: 'example.com'
      },
      {
        type: 'bubble',
        chain: 1,
        contract: VALID_CONTRACT,
        provider: HOST_DOMAIN
      }
    ]
  }
  
  const VALID_DELEGATE = {
    version: 1,
    delegate: account.address,
    expires: 2**31-1,
    permissions: [
      {
        type: 'bubble',
        chain: 1,
        contract: VALID_CONTRACT,
        provider: HOST_DOMAIN
      }
    ]
  }
  

  //
  // Setup
  //

  beforeAll(async () => {
    uut = new EVMProvider(PROTOCOL_VERSION, CHAIN_ID, PROVIDER, HOST_DOMAIN);
    activeBubbleDelegate = await _constructSignedDelegate(VALID_DELEGATE, account.address, delegateKey);
  })

  beforeEach( () => {
    jest.resetAllMocks();
  });

  async function _constructSignedDelegate(packet, delegate, privateKey, signatureType='plain') {
    const delegatePacket = {
      ...packet
    }
    delegatePacket.delegate = delegate;
    const hash = keccak256(toBytes(JSON.stringify(packet)));
    const sig = serializeSignature(await sign({hash, privateKey}));
    delegatePacket.signature = {type: signatureType, signature: sig};
    return delegatePacket;
  }


  //
  // Tests
  //

  describe("getChainId", () => {

    test("returns the chainId passed in the constructor", () => {
      const uut = new EVMProvider(PROTOCOL_VERSION, 1, PROVIDER, HOST_DOMAIN);
      expect(uut.getChainId()).toBe(1);
      const uut2 = new EVMProvider(PROTOCOL_VERSION, 1337, PROVIDER, HOST_DOMAIN);
      expect(uut2.getChainId()).toBe(1337);
    });
  
  });


  describe("recoverSignatory", () => {

    describe("params", () => {

      test("message is missing", async () => {
        return expect(uut.recoverSignatory(undefined, DUMMY_SIGNATURE, 'message'))
          .rejects.toThrow("message is null");
      });

      test("signature is missing", async () => {
        return expect(uut.recoverSignatory("hello world", undefined, 'message'))
          .rejects.toThrow("signature is null");
      });

      test("signature is an invalid type", async () => {
        return expect(uut.recoverSignatory("hello world", "0x1234", 'message'))
          .rejects.toThrow("signature type. Expected Object");
      });

      test("signature is an empty object", async () => {
        return expect(uut.recoverSignatory("hello world", {}, 'message'))
          .rejects.toThrow("signature type is null");
      });

      test("signature type is missing", async () => {
        return expect(uut.recoverSignatory("hello world", {signature: DUMMY_SIGNATURE.signature}, 'message'))
          .rejects.toThrow("signature type is null");
      });

      test("signature type is invalid", async () => {
        return expect(uut.recoverSignatory("hello world", {type: 'invalid', signature: DUMMY_SIGNATURE.signature}, 'message'))
          .rejects.toThrow("signature type not supported");
      });

      test("signature hex is missing", async () => {
        return expect(uut.recoverSignatory("hello world", {type: DUMMY_SIGNATURE.type}, 'message'))
          .rejects.toThrow("signature hex is missing or empty");
      });

      test("signature hex is not a string", async () => {
        return expect(uut.recoverSignatory("hello world", {type: DUMMY_SIGNATURE.type, signature: 123}, 'message'))
          .rejects.toThrow("signature hex type. Expected hex string");
      });

      test("signature hex is not hex", async () => {
        return expect(uut.recoverSignatory("hello world", {type: DUMMY_SIGNATURE.type, signature: "0x1234g"}, 'message'))
          .rejects.toThrow("signature hex type. Expected hex string");
      });

      test("context is missing", async () => {
        return expect(uut.recoverSignatory("hello world", DUMMY_SIGNATURE))
          .rejects.toThrow("context is null");
      });

    });  // params

    test("returns the hard coded public address when the 'public' signature type is given", async () => {
      const result = await uut.recoverSignatory(MIN_VALID_RPC_PACKET, {type: 'public'}, "rpc");
      expect(result).toBe("0x99e2c875341d1cbb70432e35f5350f29bf20aa52");
    })

    describe("plain signature", () => {

      test("recovers from a message", async () => {
        const message = "Hello World";
        const hash = keccak256(toBytes(message));
        const sig = serializeSignature(await sign({hash, privateKey}));
        const result = await uut.recoverSignatory(message, { type: "plain", signature: sig }, "message");
        expect(result).toBe(account.address);
      });
  
      test("recovers from a hash", async () => {
        const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const sig = serializeSignature(await sign({hash, privateKey}));
        const result = await uut.recoverSignatory(hash, { type: "plain", signature: sig }, "digest");
        expect(result).toBe(account.address);
      });

      test("recovers from an rpc", async () => {
        const hash = keccak256(toBytes(JSON.stringify(MIN_VALID_RPC_PACKET)));
        const sig = serializeSignature(await sign({hash, privateKey}));
        const result = await uut.recoverSignatory(MIN_VALID_RPC_PACKET, { type: "plain", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });

      test("handles a signature without leading 0x", async () => {
        const hash = keccak256(toBytes(JSON.stringify(MIN_VALID_RPC_PACKET)));
        const sig = serializeSignature(await sign({hash, privateKey})).slice(2);
        const result = await uut.recoverSignatory(MIN_VALID_RPC_PACKET, { type: "plain", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });

      test("recovers from a delegate", async () => {
        const hash = keccak256(toBytes(JSON.stringify(MIN_VALID_DELEGATE_PACKET)));
        const sig = serializeSignature(await sign({hash, privateKey}));
        const result = await uut.recoverSignatory(MIN_VALID_DELEGATE_PACKET, { type: "plain", signature: sig }, "delegate");
        expect(result).toBe(account.address);
      });

      test("recovers the delegate signatory from an rpc with permitted delegate", async () => {
        const rpc = MIN_VALID_RPC_PACKET;
        const hash = keccak256(toBytes(JSON.stringify(rpc)));
        const sigObj = { 
          type: "plain", 
          signature: serializeSignature(await sign({hash, privateKey})),
          delegate: activeBubbleDelegate
        };
        const result = await uut.recoverSignatory(rpc, sigObj, "rpc");
        expect(result).not.toBe(account.address);
        expect(result).toBe(delegateAccount.address);
      });

    });  // plain signature


    describe("eip191 signature", () => {

      test("recovers from a message", async () => {
        const message = "Hello, EIP191!";
        const sig = await account.signMessage({ message });
        const result = await uut.recoverSignatory(message, { type: "eip191", signature: sig }, "message");
        expect(result).toBe(account.address);
      });
  
      test("recovers from a hash", async () => {
        const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const sig = await account.signMessage({ message: {raw: hash} });
        const result = await uut.recoverSignatory(hash, { type: "eip191", signature: sig }, "digest");
        expect(result).toBe(account.address);
      });

      test("recovers from an rpc", async () => {
        const message = JSON.stringify(MIN_VALID_RPC_PACKET);
        const sig = await account.signMessage({ message });
        const result = await uut.recoverSignatory(MIN_VALID_RPC_PACKET, { type: "eip191", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });

      test("handles a signature without the leading 0x", async () => {
        const message = JSON.stringify(MIN_VALID_RPC_PACKET);
        const sig = (await account.signMessage({ message })).slice(2);
        const result = await uut.recoverSignatory(MIN_VALID_RPC_PACKET, { type: "eip191", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });

      test("recovers from a delegate", async () => {
        const message = JSON.stringify(MIN_VALID_DELEGATE_PACKET);
        const sig = await account.signMessage({ message });
        const result = await uut.recoverSignatory(MIN_VALID_DELEGATE_PACKET, { type: "eip191", signature: sig }, "delegate");
        expect(result).toBe(account.address);
      });

      test("recovers the delegate signatory from an rpc with permitted delegate", async () => {
        const rpc = MIN_VALID_RPC_PACKET;
        const sigObj = { 
          type: "eip191", 
          signature: await account.signMessage({ message: JSON.stringify(rpc) }),
          delegate: activeBubbleDelegate
        };
        const result = await uut.recoverSignatory(rpc, sigObj, "rpc");
        expect(result).not.toBe(account.address);
        expect(result).toBe(delegateAccount.address);
      });

      test("recovers the delegate signatory when the delegate is also signed with eip191", async () => {
        const delegate = {...activeBubbleDelegate};
        delete delegate.signature;
        const delegateSig = await delegateAccount.signMessage({ message: JSON.stringify(delegate) });
        delegate.signature = { type: "eip191", signature: delegateSig };
        const rpc = MIN_VALID_RPC_PACKET;
        const sigObj = { 
          type: "eip191", 
          signature: await account.signMessage({ message: JSON.stringify(rpc) }),
          delegate: delegate
        };
        const result = await uut.recoverSignatory(rpc, sigObj, "rpc");
        expect(result).not.toBe(account.address);
        expect(result).toBe(delegateAccount.address);
      });

    });  // eip191 signature


    describe("eip712 signature", () => {
    
      test("recovers from a minimal RPC", async () => {
        const packet = MIN_VALID_RPC_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain(CHAIN_ID)},
          types: eip712.EIP712_REQUEST_TYPES,
          primaryType: "BubbleDataRequest",
          message: {
            purpose: "Off-Chain Bubble Data Request",
            method: packet.method,
            ...packet.params,
            file: packet.params.file ?? '',
            data: packet.params.data ?? '',
            options: JSON.stringify(packet.params.options ?? {})
          }
        };
        const sig = await account.signTypedData(typedData);    
        const result = await uut.recoverSignatory(packet, { type: "eip712", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });
      
      test("recovers from a maximal RPC (includes options parameter)", async () => {
        const packet = MAX_VALID_RPC_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain(CHAIN_ID)},
          types: eip712.EIP712_REQUEST_TYPES,
          primaryType: "BubbleDataRequest",
          message: {
            purpose: "Off-Chain Bubble Data Request",
            method: packet.method,
            ...packet.params,
            options: JSON.stringify(packet.params.options ?? {})
          }
        };
        const sig = await account.signTypedData(typedData);    
        const result = await uut.recoverSignatory(packet, { type: "eip712", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });
      
      test("handles a signature without the leading 0x", async () => {
        const packet = MAX_VALID_RPC_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain(CHAIN_ID)},
          types: eip712.EIP712_REQUEST_TYPES,
          primaryType: "BubbleDataRequest",
          message: {
            purpose: "Off-Chain Bubble Data Request",
            method: packet.method,
            ...packet.params,
            options: JSON.stringify(packet.params.options ?? {})
          }
        };
        const sig = (await account.signTypedData(typedData)).slice(2);    
        const result = await uut.recoverSignatory(packet, { type: "eip712", signature: sig }, "rpc");
        expect(result).toBe(account.address);
      });
      
      test("recovers from a minimal delegate", async () => {
        const packet = MIN_VALID_DELEGATE_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain()}, // no chain id in delegate domain
          types: eip712.EIP712_DELEGATE_TYPES,
          primaryType: "BubbleDelegate",
          message: {
            purpose: "Authorize Delegate Account to Access Off-Chain Content",
            ...packet,
            permissions: packet.permissions.map(p => ({ ...p, provider: p.provider ?? '' }))
          }
        };
        typedData.message.permissions[0].provider = '';
        const sig = await account.signTypedData(typedData);    
        const result = await uut.recoverSignatory(packet, { type: "eip712", signature: sig }, "delegate");
        expect(result).toBe(account.address);
      });
      
      test("recovers from a maximal delegate", async () => {
        const packet = MAX_VALID_DELEGATE_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain()}, // no chain id in delegate domain
          types: eip712.EIP712_DELEGATE_TYPES,
          primaryType: "BubbleDelegate",
          message: {
            purpose: "Authorize Delegate Account to Access Off-Chain Content",
            ...packet
          }
        };
        const sig = await account.signTypedData(typedData);    
        const result = await uut.recoverSignatory(packet, { type: "eip712", signature: sig }, "delegate");
        expect(result).toBe(account.address);
      });

      test("recovers the delegate signatory from an rpc with permitted delegate", async () => {
        const rpc = MAX_VALID_RPC_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain(CHAIN_ID)},
          types: eip712.EIP712_REQUEST_TYPES,
          primaryType: "BubbleDataRequest",
          message: {
            purpose: "Off-Chain Bubble Data Request",
            method: rpc.method,
            ...rpc.params,
            options: JSON.stringify(rpc.params.options ?? {})
          }
        };
        const sigObj = { 
          type: "eip712", 
          signature: await account.signTypedData(typedData),
          delegate: activeBubbleDelegate
        };
        const result = await uut.recoverSignatory(rpc, sigObj, "rpc");
        expect(result).not.toBe(account.address);
        expect(result).toBe(delegateAccount.address);
      });

      test("recovers the delegate signatory when the delegate is also signed with eip712", async () => {
        // delegate
        const delegate = {...activeBubbleDelegate};
        delete delegate.signature;
        const delegateTypedData = {
          domain: {...eip712.getEIP712Domain()}, // no chain id in delegate domain
          types: eip712.EIP712_DELEGATE_TYPES,
          primaryType: "BubbleDelegate",
          message: {
            purpose: "Authorize Delegate Account to Access Off-Chain Content",
            ...delegate
          }
        };
        const delegateSig = await delegateAccount.signTypedData(delegateTypedData);    
        delegate.signature = { type: "eip712", signature: delegateSig };
        // rpc
        const rpc = MAX_VALID_RPC_PACKET;
        const typedData = {
          domain: {...eip712.getEIP712Domain(CHAIN_ID)},
          types: eip712.EIP712_REQUEST_TYPES,
          primaryType: "BubbleDataRequest",
          message: {
            purpose: "Off-Chain Bubble Data Request",
            method: rpc.method,
            ...rpc.params,
            options: JSON.stringify(rpc.params.options ?? {})
          }
        };
        const sigObj = { 
          type: "eip712", 
          signature: await account.signTypedData(typedData),
          delegate: delegate
        };
        const result = await uut.recoverSignatory(rpc, sigObj, "rpc");
        expect(result).not.toBe(account.address);
        expect(result).toBe(delegateAccount.address);
      });


    });  // eip712 signature


    describe("delegate", () => {

      async function constructDelegateRPC(delegateFields) {
        // delegate
        const delegate = {...delegateFields};
        delete delegate.signature;
        const delegateHash = keccak256(toBytes(JSON.stringify(delegate)));
        const delegateSig = serializeSignature(await sign({hash: delegateHash, privateKey: delegateKey}));
        delegate.signature = { type: "plain", signature: delegateSig };
        // rpc
        const rpc = MAX_VALID_RPC_PACKET;
        const hash = keccak256(toBytes(JSON.stringify(rpc)));
        const sigObj = { 
          type: "plain", 
          signature: serializeSignature(await sign({hash, privateKey})),
          delegate
        };
        return { rpc, signature: sigObj };
      }

      describe("succeeds when", () => {

        async function testValidDelegate(delegateFields) {
          const {rpc, signature} = await constructDelegateRPC(delegateFields);
          const result = await uut.recoverSignatory(rpc, signature, "rpc");
          expect(result).not.toBe(account.address);
          expect(result).toBe(delegateAccount.address);
        }
  
        test("recovers the delegate signatory from an rpc with permitted bubble delegate", async () => {
          const delegate = {
            version: 1,
            delegate: account.address,
            expires: Math.floor(Date.now() / 1000) + 10,
            permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: VALID_CONTRACT, provider: HOST_DOMAIN}
            ]
          }
          testValidDelegate(delegate);
        });

        test("permission type is 'contract'", async () => {
          const delegate = {
            version: 1,
            delegate: account.address,
            expires: Math.floor(Date.now() / 1000) + 10,
            permissions: [
              {type: 'contract', chain: CHAIN_ID, contract: VALID_CONTRACT}
            ]
          };
          return testValidDelegate(delegate);
        })
    
        test("permissions = 'all-permissions'", async () => {
          const delegate = {
            version: 1,
            delegate: account.address,
            expires: 2147483647,
            permissions: 'all-permissions'
          };
          return testValidDelegate(delegate);
        })
    
        test("expires = 'never'", async () => {
          const delegate = {
            version: 1,
            delegate: account.address,
            expires: 'never',
            permissions: 'all-permissions'
          };
          return testValidDelegate(delegate);
        })
    
        test("delegate address is uppercase", async () => {
          const delegate = {
            version: 1,
            delegate: '0x'+account.address.toUpperCase().slice(2),
            expires: 'never',
            permissions: 'all-permissions'
          };
          return testValidDelegate(delegate);
        })
    
        test("permission contract is uppercase", async () => {
          const delegate = {
            version: 1,
            delegate: account.address,
            expires: Math.floor(Date.now() / 1000) + 10,
            permissions: [
              {type: 'contract', chain: CHAIN_ID, contract: '0x'+VALID_CONTRACT.toUpperCase().slice(2)}
            ]
          };
          return testValidDelegate(delegate);
        })
    
      });  // succeeds when


      describe('fails with permission error when', () => {

        async function testPermissionDeniedDelegate(delegateFields) {
          const {rpc, signature} = await constructDelegateRPC(delegateFields);
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, "delegate denied"));
        }

        test('permissions is an empty list', async () => {
          return testPermissionDeniedDelegate({...VALID_DELEGATE, permissions: []});
        })
    
        test('the delegate is for a different user', async () => {
          return testPermissionDeniedDelegate({...VALID_DELEGATE, delegate: delegateAccount.address});
        })
    
        test('the delegation has expired', async () => {
          return testPermissionDeniedDelegate({...VALID_DELEGATE, expires: (Date.now() / 1000) - 1});
        })
    
        test('the delegation has been revoked', async () => {
          const originalFn = uut.hasBeenRevoked;
          uut.hasBeenRevoked = jest.fn().mockResolvedValue(true);
          uut.hasBeenRevoked.mockReturnValue(true);
          await testPermissionDeniedDelegate({...VALID_DELEGATE});
          uut.hasBeenRevoked = originalFn;
        })
    

        describe("the type is 'bubble' and", () => {

          test('the permission is for a different chain', async () => {
            return testPermissionDeniedDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID+1, contract: VALID_CONTRACT, provider: HOST_DOMAIN}
            ]});
          })
      
          test('the permission is for a different contract', async () => {
            return testPermissionDeniedDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: "0x00", provider: HOST_DOMAIN}
            ]});
          })
      
          test('the permission is for a different provider', async () => {
            return testPermissionDeniedDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: VALID_CONTRACT, provider: HOST_DOMAIN+'v3'}
            ]});
          })
        
        })


        describe("the type is 'contract' and", () => {

          test('the permission is for a different chain', async () => {
            return testPermissionDeniedDelegate({...VALID_DELEGATE, permissions: [
              {type: 'contract', chain: CHAIN_ID+1, contract: VALID_CONTRACT}
            ]});
          })
      
          test('the permission is for a different contract', async () => {
            return testPermissionDeniedDelegate({...VALID_DELEGATE, permissions: [
              {type: 'contract', chain: CHAIN_ID, contract: "0x00"}
            ]});
          })

        })

      }) // delegate fails with permission error
      

      describe('fails gracefully when', () => {

        async function testInvalidDelegate(delegateFields, cause) {
          const causeMessage = cause || "";
          const {rpc, signature} = await constructDelegateRPC(delegateFields);
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow(new Error(causeMessage));
        }

        test('[does not reject when delegate is valid]', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .resolves.not.toThrow();
        })
        
        test('its an empty object', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate = {};
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate");
        })
    
        test('the signature is missing', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          delete signature.delegate.signature;
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature is null");
        })
    
        test('the signature is not an object', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate.signature = 'string';
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature type. Expected Object");
        })
    
        test('the signature is an empty object', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate.signature = {};
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature type is null");
        })
    
        test('the signature type is missing', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          delete signature.delegate.signature.type;
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature type is null");
        })
    
        test('the signature type is invalid', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate.signature.type = 'invalid';
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature type not supported");
        })
    
        test('the signature hex is missing', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          delete signature.delegate.signature.signature;
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature hex is missing or empty");
        })
    
        test('the signature hex is not a string', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate.signature.signature = 1234;
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature hex type. Expected hex string");
        })
    
        test('the signature hex is not hex', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate.signature.signature = "0x1234g";
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature hex type. Expected hex string");
        })
    
        test('the signature hex is not a valid signature', async () => {
          const {rpc, signature} = await constructDelegateRPC(VALID_DELEGATE);
          signature.delegate.signature.signature += '1234';
          return expect(uut.recoverSignatory(rpc, signature, "rpc"))
          .rejects.toThrow("cannot decode delegate - invalid signature");
        })
    
        test('the delegate field is an incorrect type', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, delegate: 45}, "cannot decode delegate - delegate type. Expected hex string");
        })
    
        test('the delegate field is an empty string', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, delegate: ''}, "cannot decode delegate - delegate is missing or empty");
        })
    
        test('the delegate field is not a hex string', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, delegate: 'string'}, "cannot decode delegate - delegate type. Expected hex string");
        })
    
        test('the expires field is missing', async () => {
          const delegate = {...VALID_DELEGATE};
          delete delegate.expires;
          return testInvalidDelegate(delegate, "cannot decode delegate - expires is null");
        })
    
        test('the expires field is an incorrect type', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, expires: ''}, "cannot decode delegate - expires type. Expected number");
        })

        test('the permissions field is missing', async () => {
          const delegate = {...VALID_DELEGATE};
          delete delegate.permissions;
          return testInvalidDelegate(delegate, "cannot decode delegate - permissions is null");
        })
    
        test('the permissions field is an incorrect type', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, permissions: 123}, "cannot decode delegate - permissions type. Expected Array");
        })

        test('the permissions field is a string but not all-permissions', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, permissions: 'al-permissions'}, "cannot decode delegate - permissions type. Expected Array");
        })

        test('the permissions array contains an incorrect type', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, permissions: ['']}, "cannot decode delegate - permission type. Expected Object");
        })

        test('the permissions type is missing', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, permissions: [
            {chain: CHAIN_ID, contract: VALID_CONTRACT, provider: HOST_DOMAIN}
          ]}, "cannot decode delegate - permission type is null");
        })

        test('the permissions type is an incorrect type', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, permissions: [
            {type: 42, chain: CHAIN_ID, contract: VALID_CONTRACT, provider: HOST_DOMAIN}
          ]}, "cannot decode delegate - permission type type. Expected string");
        })

        test('the permissions type is not a recognised value', async () => {
          return testInvalidDelegate({...VALID_DELEGATE, permissions: [
            {type: 'name', chain: CHAIN_ID, contract: VALID_CONTRACT, provider: HOST_DOMAIN}
          ]}, "cannot decode delegate - invalid permission type 'name'");
        })

  
        describe("permission is 'bubble' type and", () => {

          test('the permissions chain is missing', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', contract: VALID_CONTRACT, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission chain is null");
          })

          test('the permissions chain is an incorrect type', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: '1', contract: VALID_CONTRACT, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission chain type. Expected number");
          })

          test('the permissions contract is missing', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission contract is missing or empty");
          })

          test('the permissions contract is an incorrect type', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: {}, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission contract type. Expected hex string");
          })

          test('the permissions provider is missing', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: VALID_CONTRACT, }
            ]}, "cannot decode delegate - permission provider is null");
          })

          test('the permissions provider is an incorrect type', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: VALID_CONTRACT, provider: {}}
            ]}, "cannot decode delegate - permission provider type. Expected string");
          })

        })


        describe("permission is 'contract' type and", () => {

          test('the permissions chain is missing', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', contract: VALID_CONTRACT, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission chain is null");
          })

          test('the permissions chain is an incorrect type', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: '1', contract: VALID_CONTRACT, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission chain type. Expected number");
          })

          test('the permissions contract is missing', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission contract is missing or empty");
          })

          test('the permissions contract is an incorrect type', async () => {
            return testInvalidDelegate({...VALID_DELEGATE, permissions: [
              {type: 'bubble', chain: CHAIN_ID, contract: {}, provider: HOST_DOMAIN}
            ]}, "cannot decode delegate - permission contract type. Expected hex string");
          })

        })

      }) // delegate fails gracefully when

    });  // delegate signature


    describe("legacy signatures", () => {

      const LEGACY_VALID_RPC_PACKET = {
        method: 'create',
        params: {
          ...COMMON_RPC_PARAMS
        }
      }
      delete LEGACY_VALID_RPC_PACKET.params.version; // v0 had no version field

      describe('succeeds when', () => {

        test('signature is valid', async () => {
          const hash = keccak256(toBytes(JSON.stringify(LEGACY_VALID_RPC_PACKET)));
          const sig = serializeSignature(await sign({hash, privateKey}));
          const result = await uut.recoverSignatory(LEGACY_VALID_RPC_PACKET, sig, "rpc");
          expect(result).toBe(account.address);
        })

        test('signature and delegate signature are valid', async () => {
          const packet = {
            method: LEGACY_VALID_RPC_PACKET.method,
            params: {
              ...LEGACY_VALID_RPC_PACKET.params,
              delegate: VALID_DELEGATE
            }
          }
          const hash = keccak256(toBytes(JSON.stringify(LEGACY_VALID_RPC_PACKET)));
          const sig = serializeSignature(await sign({hash, privateKey}));
          const delegateHash = keccak256(toBytes(JSON.stringify(VALID_DELEGATE)));
          const delegateSig = serializeSignature(await sign({hash: delegateHash, privateKey: delegateKey}));
          packet.params.delegate.signature = delegateSig;
          const result = await uut.recoverSignatory(packet, sig, "rpc");
          expect(result).toBe(delegateAccount.address);
        })

        test("'public' signature is given", async () => {
          const result = await uut.recoverSignatory(LEGACY_VALID_RPC_PACKET, 'public', "rpc");
          expect(result).toBe("0x99e2c875341d1cbb70432e35f5350f29bf20aa52");
        })
    
        test('when signaturePrefix is present', async () => {
          const packet = {
            method: LEGACY_VALID_RPC_PACKET.method,
            params: {...LEGACY_VALID_RPC_PACKET.params}
          }
          const prefix = "\x19Ethereum Signed Message:\n64";   // message length is included in the prefix in v0
          const sig = await account.signMessage({ message: JSON.stringify(packet) });
          packet.params.signaturePrefix = prefix;
          const result = await uut.recoverSignatory(packet, sig, "rpc");
          expect(result).toBe(account.address);
        })

      })  // succeeds when


      describe("fails gracefully when", () => {

        test('signature is not a hex string', async () => {
          return expect(uut.recoverSignatory(LEGACY_VALID_RPC_PACKET, '0x0123g', "rpc"))
          .rejects.toThrow("signature type");
        })
    
        test('signature prefix is not a string', async () => {
          const packet = {
            method: LEGACY_VALID_RPC_PACKET.method,
            params: {...LEGACY_VALID_RPC_PACKET.params}
          }
          const sig = await account.signMessage({ message: JSON.stringify(packet) });
          packet.params.signaturePrefix = 1234;
          return expect(uut.recoverSignatory(packet, sig, "rpc"))
          .rejects.toThrow("legacy v0 signature prefix type. Expected string");
        })
    
        test('delegate is not an object', async () => {
          const packet = {
            method: LEGACY_VALID_RPC_PACKET.method,
            params: {...LEGACY_VALID_RPC_PACKET.params}
          }
          const sig = await account.signMessage({ message: JSON.stringify(packet) });
          packet.params.delegate = 'a delegate';
          return expect(uut.recoverSignatory(packet, sig, "rpc"))
          .rejects.toThrow("legacy v0 signature delegate type. Expected Object");
        })
    
        test('delegate signature is not hex', async () => {
          const packet = {
            method: LEGACY_VALID_RPC_PACKET.method,
            params: {...LEGACY_VALID_RPC_PACKET.params}
          }
          const sig = await account.signMessage({ message: JSON.stringify(packet) });
          packet.params.delegate = {...VALID_DELEGATE, signature: 1234};
          return expect(uut.recoverSignatory(packet, sig, "rpc"))
          .rejects.toThrow("cannot decode delegate - signature hex type. Expected hex string");
        })

      });  // fails gracefully  

    });  // legacy signatures

  });  // recoverSignatory

});
