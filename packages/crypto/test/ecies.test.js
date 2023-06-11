import { encrypt, decrypt } from '../src/ecies';

describe("ECIES", function() {

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


  describe("encrypt function", function() {

    describe("called with", function() {

      test("no argument results in an error", function() {
        expect(function() {
          encrypt()
        }).toThrow("publicKey is missing or empty");
      });

      test("an empty publicKey argument results in an error", function() {
        expect(function() {
          encrypt("", "hello world")
        }).toThrow("publicKey is missing or empty");
      });

      test("a public key with the wrong type results in an error", function() {
        expect(function() {
          encrypt({key: 'key'}, "hello world")
        }).toThrow("publicKey type. Expected hex string of length 66");
      });

      test("an invalid public key results in an error", function() {
        expect(function() {
          encrypt(account.cPublicKey + '00', "hello world")
        }).toThrow("publicKey type. Expected hex string of length 66");
      });

      test("no data argument results in an error", function() {
        expect(function() {
          encrypt(account.cPublicKey)
        }).toThrow("data is missing or empty");
      });

      test("invalid data type results in an error", function() {
        expect(function() {
          encrypt(account.cPublicKey, 123)
        }).toThrow("data type. Expected string");
      });

    });

    test("returns a hex signature string for a valid public key and data", async () => {
      var encrypted = await encrypt(account.cPublicKey, "hello world");
      expect(encrypted).toMatch(/^(0x)?[0-9a-f]+$/);
    });

  });


  describe("decrypt function", function() {

    describe("called with", function() {

      test("no argument results in an error", function() {
        expect(function() {
          decrypt()
        }).toThrow("privateKey is missing or empty");
      });

      test("an empty privateKey argument results in an error", function() {
        expect(function() {
          decrypt("", "hello world")
        }).toThrow("privateKey is missing or empty");
      });

      test("a private key with the wrong type results in an error", function() {
        expect(function() {
          decrypt({key: 'key'}, "hello world")
        }).toThrow("privateKey type. Expected hex string of length 64");
      });

      test("an invalid private key results in an error", function() {
        expect(function() {
          decrypt(account.privateKey + '00', "hello world")
        }).toThrow("privateKey type. Expected hex string of length 64");
      });

      test("no data argument results in an error", function() {
        expect(function() {
          decrypt(account.privateKey)
        }).toThrow("data is missing or empty");
      });

      test("invalid data type results in an error", function() {
        expect(function() {
          decrypt(account.privateKey, 123)
        }).toThrow("data type. Expected string");
      });

    });

  });


  test("encrypting a message can be decrypted", async () => {
    const msg = "hello world";
    var encrypted = await encrypt(account.cPublicKey, msg);
    var decrypted = await decrypt(account.privateKey, encrypted);
    expect(decrypted).toEqual(msg);
  });


  test("decrypting a message with the wrong private key fails gracefully", async () => {
    const randomKey = '954eb287f69fb8a266f63b97d68e9e050f3fba741c406042e23e1d8aaa4c9e10';
    const msg = "hello world";
    var encrypted = await encrypt(account.cPublicKey, msg);
    expect(decrypt(randomKey, encrypted)).rejects.toThrow();
  });

});