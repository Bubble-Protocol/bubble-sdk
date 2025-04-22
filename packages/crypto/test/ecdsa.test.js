import { Key, sign, verify, recover, hash, publicKeyToAddress } from '../src/ecdsa';
import { uint8ArrayToHex, hexToUint8Array } from '../src/utils.js';

describe("ECDSA", function() {

  const randomHash = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"; // random hash

  const account = {
    privateKey: "feb2414510bdb65401e0027467b9147e76fdbda2c3c50ae07881b34ee611a9cc",
    uPublicKey: "045a9182fb85c44bacacb89480ff9b03a64e268e119f27f1056ead4198963fadac330661a4842b2c45e90d7f2e5fa01f3ab70f44950558df1f10680bd55a68fa70",
    cPublicKey: "025a9182fb85c44bacacb89480ff9b03a64e268e119f27f1056ead4198963fadac",
    address: "0xa7095fe06226685c213318a63a1a191abc84d247",
    addressWithErrorBits: "0xa7095Fe06226685C213318a63A1a191ABC84D247",
    signatures: {
      random: {
        text: undefined,
        hash: randomHash,
        sig: "b2c54866d784967152baa250b5486befce3ae8fedf3100e4fc940b36a111489c4736fa0c74998059c1809ce210327af97e4eaa1693a284493bc15c498169446701"
      },
      helloWorld: {
        text: 'Hello World!',
        hash: "3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0",
        sig: "418621b553561ef1dcec565dd918f18a2b85e96a0aaf92cb103ed8afee09f5c05eeb943cc70abf1790129da2ef9acbdf15c8fb2b521d12e82aa9b068782c8cb600"
      }
    }
  };


  describe("sign function", function() {

    describe("called with", function() {

      test("no argument results in an error", function() {
        expect(function() {
          sign()
        }).toThrow("hash is missing or empty");
      });

      test("an empty data argument results in an error", function() {
        expect(function() {
          sign("", account.privateKey)
        }).toThrow("hash is missing or empty");
      });

      test("no key argument results in an error", function() {
        expect(function() {
          sign(randomHash)
        }).toThrow("privateKey is missing or empty");
      });

      test("an empty key argument results in an error", function() {
        expect(function() {
          sign(randomHash, "")
        }).toThrow("privateKey is missing or empty");
      });

      test("an invalid private key results in an error", function() {
        expect(function() {
          sign(randomHash, "my_invalid_private_key")
        }).toThrow("privateKey type. Expected hex string of length 64");
      });

    });

    test("returns a hex signature string for a valid hash and key", function() {
      var signature = sign(randomHash, account.privateKey);
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });

    test("returns a hex signature string for hash with a leading '0x'", function() {
      var signature = sign('0x'+randomHash, account.privateKey);
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });

  });


  describe("hash function", function() {

    test("calculates the correct hash for a simple string", function() {
      expect(hash("Hello World!")).toBe("3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0");
    });

    test("calculates the correct hash for a long string", function() {
      const text = `
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras blandit nisi diam, eget ornare ligula volutpat quis. Fusce non dapibus dui. Aliquam ac ex justo. Ut tristique quis elit quis interdum. Mauris ullamcorper leo orci, id vehicula nisl egestas quis. Vivamus quis velit dapibus, congue erat id, porta eros. Aliquam ut imperdiet nisl. Aliquam egestas augue vitae magna vehicula, in luctus lorem consectetur. Etiam a imperdiet odio, nec venenatis urna. Suspendisse iaculis id mauris eu aliquam. Phasellus finibus tristique mi, et euismod sem rutrum at. Maecenas aliquam consequat tellus, vel auctor massa gravida non. Donec ornare quam justo, quis blandit ante ultricies venenatis.

                Phasellus lacinia purus in mauris hendrerit, bibendum blandit lectus pharetra. Suspendisse eleifend diam non orci consectetur porta. Ut consequat elit enim, sit amet viverra massa tristique in. Fusce velit nibh, consequat ac purus ac, placerat vehicula nisl. Etiam eleifend, lacus nec cursus tincidunt, libero felis egestas lectus, vitae tincidunt neque odio vel leo. Aenean in eros sed lectus placerat venenatis eget in ipsum. Donec justo sapien, hendrerit vitae tellus in, lobortis congue tellus. Maecenas viverra tempus suscipit. Phasellus eu augue ut felis lobortis tempor.

                Nam cursus odio sapien. Ut aliquet, odio at porttitor facilisis, elit dolor scelerisque lectus, sit amet scelerisque nibh lacus nec nisl. Quisque in ligula eu ex aliquet mattis a non turpis. Duis mauris magna, pharetra in diam vulputate, rhoncus porttitor turpis. Pellentesque diam justo, aliquet ut ultrices ut, ornare vitae lacus. Suspendisse ac ante eu sem lobortis accumsan vitae non ex. Sed feugiat ipsum erat, ac rutrum nulla scelerisque ut. Pellentesque quis luctus lacus. Nunc consectetur tortor libero, sit amet luctus nisl bibendum vel. Duis sem massa, pulvinar eget est ac, rhoncus scelerisque eros. Suspendisse rutrum sapien orci, vitae faucibus mi aliquet et. Nam id vestibulum dolor, ac dictum nisi.

                Quisque ut imperdiet dolor. Vivamus lobortis, nibh at sagittis hendrerit, urna neque molestie lorem, non ultrices neque sem in risus. Donec sed rhoncus nisl. Aliquam eget magna non nisl aliquet suscipit quis non ipsum. Nulla sit amet velit quam. Proin vitae mattis mi, vitae fermentum dolor. Donec at enim ultricies, feugiat turpis et, sollicitudin erat. Nulla dictum, odio ut tincidunt egestas, neque libero vehicula velit, vel ultricies dui enim placerat lacus. Duis quis imperdiet mauris. Cras blandit sapien eget sapien sodales, eget feugiat dui varius. Nulla facilisi. Aliquam ultricies, leo sed lobortis imperdiet, turpis sapien convallis elit, ut pulvinar lacus ligula ac elit. Aenean venenatis eu justo ut vulputate. Fusce pulvinar enim at viverra facilisis. Phasellus non blandit purus. Aliquam id arcu vitae enim condimentum pharetra.

                Integer posuere massa eu elit porta iaculis. Donec bibendum, diam rhoncus cursus feugiat, ligula ligula tempor est, eget ornare mauris nulla non est. Phasellus tempor efficitur erat, eget gravida nulla pretium id. Phasellus bibendum quis diam in imperdiet. Vivamus pellentesque risus libero, non imperdiet lacus scelerisque quis. Vivamus condimentum pretium lorem, et mollis diam consectetur et. Curabitur cursus, odio eu blandit porttitor, tortor sapien aliquet nibh, non porta elit libero quis ligula. Etiam vitae mauris tortor. Ut pretium quam eget ex lacinia rhoncus. Proin quis quam sit amet risus pellentesque porta ut sit amet urna. Mauris posuere eleifend sapien, ac suscipit magna sodales a. Sed gravida erat et diam suscipit iaculis. Sed lobortis est ac dui egestas, ornare malesuada odio facilisis. Etiam ullamcorper porttitor nisi in euismod. Donec ac sagittis tellus, quis dapibus ligula.
			      `;
      expect(hash(text)).toBe("20a39c5a3c8b006065fbb57eff6e6ee6b63c425d8f121c7fd2de83199a2a16a8");
    });

  });


  describe("recover function", function() {

    describe("called with", function() {

      test("no argument results in an error", function() {
        expect(function() {
          recover()
        }).toThrow("hash is missing or empty");
      });

      test("an empty hash argument results in an error", function() {
        expect(function() {
          recover("", account.signatures.helloWorld.sig)
        }).toThrow("hash is missing or empty");
      });

      test("no signature argument results in an error", function() {
        expect(function() {
          recover(randomHash)
        }).toThrow("signature is missing or empty");
      });

      test("an empty signature argument results in an error", function() {
        expect(function() {
          recover(randomHash, "")
        }).toThrow("signature is missing or empty");
      });

      test("an invalid signature argument results in an error", function() {
        expect(function() {
          recover(randomHash, account.signatures.helloWorld.sig + "#&%")
        }).toThrow("signature type. Expected hex string");
      });

      test("an invalid length hash results in an error", function() {
        expect(function() {
          recover(randomHash + "ab", account.signatures.helloWorld.sig)
        }).toThrow("hash type. Expected hex string of length 64");
      });

      test("a hash with invalid characters results in an error", function() {
        var invalidHash = "g" + randomHash.slice(1);
        expect(function() {
          recover(invalidHash, account.signatures.helloWorld.sig)
        }).toThrow("hash type. Expected hex string of length 64");
      });

    });

    test("returns the correct signer's address", function() {
      expect(
        recover(randomHash, account.signatures.random.sig)
      ).toBe(account.address);
    });

    test("returns the correct signer's public key", function() {
      expect(
        recover(randomHash, account.signatures.random.sig, true)
      ).toBe(account.uPublicKey);
    });

    test("returns the correct signer's address when hash has leading '0x'", function() {
      expect(
        recover('0x'+randomHash, account.signatures.random.sig)
      ).toBe(account.address);
    });

    test("returns the correct signer's address when signature has leading '0x'", function() {
      expect(
        recover(randomHash, '0x'+account.signatures.random.sig)
      ).toBe(account.address);
    });

  });


  describe("verify function", function() {

    var signature;

    beforeAll( () => {
      signature = sign(randomHash, account.privateKey);
    })

    describe("called with", function() {

      test("no argument results in an error", function() {
        expect(function() {
          verify()
        }).toThrow("address is missing or empty");
      });

      test("an empty hash argument results in an error", function() {
        expect(function() {
          verify("", signature, account.address)
        }).toThrow("hash is missing or empty");
      });

      test("no signature argument results in an error", function() {
        expect(function() {
          verify(randomHash)
        }).toThrow("address is missing or empty");
      });

      test("an empty signature argument results in an error", function() {
        expect(function() {
          verify(randomHash, "", account.address)
        }).toThrow("signature is missing or empty");
      });

      test("an invalid signature argument results in an error", function() {
        expect(function() {
          verify(randomHash, signature + "#&%", account.address)
        }).toThrow("signature type. Expected hex string");
      });

      test("no address argument results in an error", function() {
        expect(function() {
          verify(randomHash, signature)
        }).toThrow("address is missing or empty");
      });

      test("an empty address argument results in an error", function() {
        expect(function() {
          verify(randomHash, signature, "")
        }).toThrow("address is missing or empty");
      });

      test("an invalid length hash results in an error", function() {
        expect(function() {
          verify(hash + "ab", signature, account.address)
        }).toThrow("hash type. Expected hex string of length 64");
      });

      test("a hash with invalid characters results in an error", function() {
        var invalidHash = "g" + randomHash.slice(1);
        expect(function() {
          verify(invalidHash, signature, account.address)
        }).toThrow("hash type. Expected hex string of length 64");
      });

    });

    test("returns true for the correct signer's address", function() {
      expect(verify(randomHash, signature, account.address)).toBe(true);
    });

    test("returns false for an incorrect signer's address", function() {
      expect(verify(randomHash, signature, "0xfb3e6dd29d01c1b5b99e46db3fe26df1138b73d2")).toBe(false);
    });

  });


  describe("PublicKeyToAddress function", () => {

    // TODO negative cases

    test("no argument results in an error", function() {
      expect(() => publicKeyToAddress())
        .toThrow("publicKey is missing or empty");
    });

    test("empty argument results in an error", function() {
      expect(() => publicKeyToAddress(""))
        .toThrow("publicKey is missing or empty");
    });

    test("invalid type of argument results in an error", function() {
      expect(() => publicKeyToAddress(['a','b']))
        .toThrow("publicKey type");
    });

    test("invalid string type of argument results in an error", function() {
      expect(() => publicKeyToAddress("hello"))
        .toThrow("publicKey type");
    });

    test("invalid uncompressed key results in an error", function() {
      expect(() => publicKeyToAddress('02'+account.uPublicKey.slice(2)))
        .toThrow("publicKey type. Expected hex string of length 66");
    });

    test("too long uncompressed key results in an error", function() {
      expect(() => publicKeyToAddress(account.uPublicKey+'01'))
        .toThrow("publicKey type. Expected hex string of length 130");
    });

    test("too short uncompressed key results in an error", function() {
      expect(() => publicKeyToAddress(account.uPublicKey.slice(0,-2)))
        .toThrow("publicKey type. Expected hex string of length 130");
    });

    test("invalid compressed key results in an error", function() {
      expect(() => publicKeyToAddress('04'+account.cPublicKey.slice(2)))
        .toThrow("publicKey type. Expected hex string of length 130");
    });

    test("too long compressed key results in an error", function() {
      expect(() => publicKeyToAddress(account.cPublicKey+'01'))
        .toThrow("publicKey type. Expected hex string of length 66");
    });

    test("too short compressed key results in an error", function() {
      expect(() => publicKeyToAddress(account.cPublicKey.slice(0,-2)))
        .toThrow("publicKey type. Expected hex string of length 66");
    });

    test("successfully converts an uncompressed key", () => {
      expect(publicKeyToAddress(account.uPublicKey)).toBe(account.address);
    })

    test("successfully converts a compressed key", () => {
      expect(publicKeyToAddress(account.cPublicKey)).toBe(account.address);
    })

    test("successfully converts a key with leading '0x'", () => {
      expect(publicKeyToAddress('0x'+account.cPublicKey)).toBe(account.address);
    })

  })


  describe("Key class", function() {

    describe("constructor", function () {

      function validateFields(key) {
        expect(key.privateKey).toMatch(/^[0-9a-fA-F]{64}$/);
        expect(key.privateKeyBuf).toStrictEqual(Uint8Array.from(Buffer.from(key.privateKey, 'hex')));
        expect(key.uPublicKey).toMatch(/^[0-9a-fA-F]{130}$/);
        expect(key.cPublicKey).toMatch(/^[0-9a-fA-F]{66}$/);
        expect(key.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      }
  
      test("when called with no argument generates a new random key", function () {
        const key = new Key();
        validateFields(key);
      });

      test("when called multiple times with no argument generates different random keys", function () {
        const key1 = new Key();
        const key2 = new Key()
        validateFields(key1);
        validateFields(key2);
        expect(key2.privateKey).not.toBe(key1.privateKey);
        expect(key2.privateKeyBuf).not.toStrictEqual(key1.privateKeyBuf);
        expect(key2.uPublicKey).not.toBe(key1.uPublicKey);
        expect(key2.cPublicKey).not.toBe(key1.cPublicKey);
        expect(key2.address).not.toBe(key1.address);
      });

      test("when called with an invalid private key results in an error", function () {
        expect(function () {
          new Key("my_invalid_private_key")
        }).toThrow("privateKey type. Expected hex string of length 64");
      });

      test("calculates the correct private key and address when called with a valid privateKey", function () {
        const key = new Key(account.privateKey);
        expect(key.privateKey).toBe(account.privateKey);
        expect(key.privateKeyBuf).toStrictEqual(hexToUint8Array(account.privateKey));
        expect(key.uPublicKey).toBe(account.uPublicKey);
        expect(key.cPublicKey).toBe(account.cPublicKey);
        expect(key.address).toBe(account.address);
      });

    });

    describe("sign function", function () {

      let key;

      beforeAll(() => {
        key = new Key(account.privateKey);
      })

      describe("called with", function () {

        test("no argument results in an error", function () {
          expect(function () {
            key.sign()
          }).toThrow("hash is missing or empty");
        });

        test("an empty data argument results in an error", function () {
          expect(function () {
            key.sign("")
          }).toThrow("hash is missing or empty");
        });

        test("an invalid hash results in an error", function () {
          expect(function () {
            key.sign("my_invalid_hash")
          }).toThrow("hash type. Expected hex string of length 64");
        });

      });

      test("returns a hex signature string for a valid hash and key", function () {
        var signature = key.sign(randomHash);
        expect(signature).toMatch(/^[0-9a-f]+$/);
      });

    });


    describe("signFunction", function () {

      let key;

      beforeAll(() => {
        key = new Key(account.privateKey);
      })

      describe("called with", function () {

        test("no argument results in an error", async function () {
          await expect(key.signFunction()).rejects.toThrow("packet is missing or empty");
        });

        test("an invalid argument type results in an error", async function () {
          await expect(key.signFunction("hash")).rejects.toThrow("packet type. Expected Object");
        });

      });

      test("returns a plain signature object for a valid hash and key", async function () {
        const packet = { method: 'test', params: { version: 1, timestamp: 1234567890, nonce: 'nonce' } };
        var signature = await key.signFunction(packet);
        expect(signature).toMatchObject({
          type: 'plain',
          signature: expect.stringMatching(/^[0-9a-fA-F]{130}$/)
        });
      });

    });

  });


  describe("hex conversion functions", function () {

    describe("called with", function () {

      test("uint8ArrayToHex with no argument results in an error", function () {
        expect(function () {
          uint8ArrayToHex();
        }).toThrow("buffer type. Expected Uint8Array");
      });

      test("uint8ArrayToHex with an invalid parameter results in an error", function () {
        expect(function () {
          uint8ArrayToHex(account.address);
        }).toThrow("buffer type. Expected Uint8Array");
      });

      test("hexToUint8Array with no argument results in an error", function () {
        expect(function () {
          hexToUint8Array();
        }).toThrow("hexString type. Expected hex string");
      });

      test("hexToUint8Array with an invalid parameter results in an error", function () {
        expect(function () {
          hexToUint8Array([1,2,3]);
        }).toThrow("hexString type. Expected hex string");
      });

    });

    test("hexToUint8Array generates the correct result", function () {
      expect(hexToUint8Array("0001fF")).toStrictEqual(new Uint8Array([0,1,255]));
    });

    test("uint8ArrayToHex generates the correct result", function () {
      expect(uint8ArrayToHex(new Uint8Array([0,1,255]))).toBe("0001ff");
    });

    test("functions are the inverse of each other", function () {
      const hexString = account.address.slice(2);
      const arr = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      expect(hexToUint8Array(uint8ArrayToHex(arr))).toStrictEqual(arr);
      expect(uint8ArrayToHex(hexToUint8Array(hexString))).toBe(hexString);
    });

  });


  describe("end-to-end", () => {

    test("recover verifies sign", () => {
      const signature = sign(randomHash, account.privateKey);
      expect(recover(randomHash, signature)).toBe(account.address);
    })

    test("verify verifies sign", () => {
      const signature = sign(randomHash, account.privateKey);
      expect(verify(randomHash, signature, account.address)).toBe(true);
    })

    test("recover verifies Key.sign", () => {
      const key = new Key(account.privateKey);
      const signature = key.sign(randomHash);
      expect(recover(randomHash, signature)).toBe(account.address);
    })

    test("recover verifies Key.signFunction", async () => {
      const key = new Key(account.privateKey);
      const packet = { method: 'test', params: { version: 1, timestamp: 1234567890, nonce: 'nonce' } };
      const signature = await key.signFunction(packet);
      expect(recover(hash(JSON.stringify(packet)), signature.signature)).toBe(account.address);
    })

    test("Key.sign can be used in a different class scope", () => {
      class OtherScope {
        constructor(signFunction) {
          this.signFunction = signFunction;
        }
      }
      const key = new Key(account.privateKey);
      const scope = new OtherScope(key.sign);
      const signature = scope.signFunction(randomHash);
      expect(recover(randomHash, signature)).toBe(account.address);
    })

    test("Key.signFunction can be used in a different class scope", async () => {
      class OtherScope {
        constructor(signFunction) {
          this.signFunction = signFunction;
        }
      }
      const key = new Key(account.privateKey);
      const scope = new OtherScope(key.signFunction);
      const packet = { method: 'test', params: { version: 1, timestamp: 1234567890, nonce: 'nonce' } };
      const signature = await scope.signFunction(packet);
      expect(recover(hash(JSON.stringify(packet)), signature.signature)).toBe(account.address);
    })

  })

});