import { ContentId } from "../src"
import './BubbleErrorMatcher';

const VALID_CHAIN = 1;
const VALID_ADDRESS = '0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929';
const VALID_URL = 'https://bubblevault.com:8131/eth/v2';
const VALID_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world>>???a.txt';
const VALID_BASE64URL_ENCODED_ID = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIn0';
const VALID_BASE64URL_ENCODED_ID_WITH_FILE = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIiwiZmlsZSI6IjB4MjQ4MDJlZGMxZWJhMGY1NzhkY2ZmZDZhZGEzYzViOTU0YThlNzZlNTViYTgzMGNmMTlhMzA4M2Q0ODlhNjA2My9oZWxsby13b3JsZD4-Pz8_YS50eHQifQ';
const VALID_BASE64_ENCODED_ID = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIn0=';
const VALID_BASE64_ENCODED_ID_WITH_FILE = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIiwiZmlsZSI6IjB4MjQ4MDJlZGMxZWJhMGY1NzhkY2ZmZDZhZGEzYzViOTU0YThlNzZlNTViYTgzMGNmMTlhMzA4M2Q0ODlhNjA2My9oZWxsby13b3JsZD4+Pz8/YS50eHQifQ==';
const INVALID_MIXED_BASE64_ENCODED_ID = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIiwiZmlsZSI6IjB4MjQ4MDJlZGMxZWJhMGY1NzhkY2ZmZDZhZGEzYzViOTU0YThlNzZlNTViYTgzMGNmMTlhMzA4M2Q0ODlhNjA2My9oZWxsby13b3JsZD4+Pz8_YS50eHQifQ==';
const INVALID_BASE64_ENCODED_ID_MISSING_CHAIN = 'eyJjb250cmFjdCI6IjB4YzE2YTQwOWEzOUVEZTNGMzhFMjEyOTAwZjhkM2FmZTZhYTZBODkyOSIsInByb3ZpZGVyIjoiaHR0cHM6Ly9idWJibGV2YXVsdC5jb206ODEzMS9ldGgvdjIifQ';
const INVALID_BASE64_ENCODED_ID_INVALID_CHAIN = 'eyJjaGFpbiI6IjEiLCJjb250cmFjdCI6IjB4YzE2YTQwOWEzOUVEZTNGMzhFMjEyOTAwZjhkM2FmZTZhYTZBODkyOSIsInByb3ZpZGVyIjoiaHR0cHM6Ly9idWJibGV2YXVsdC5jb206ODEzMS9ldGgvdjIifQ';

const BUBBLE_ERROR_INVALID_CONTENT_ID = -32006;


describe('ContentId', () => {

  describe('throws on construction', () => {

    test('when passed nothing', () => {
      expect(() => {new ContentId()}).toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id"});
    })

    test('when passed an empty string', () => {
      expect(() => {new ContentId('')}).toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id"});
    })

    test('when passed an empty object', () => {
      expect(() => {new ContentId({})}).toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id"});
    })

    test('when passed an invalid base64url string', () => {
      expect(() => {new ContentId('eyJjaG*FpbiI6M')}).toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id"});
    })

    test('when passed a mixed base64/base64url string', () => {
      expect(() => {new ContentId(INVALID_MIXED_BASE64_ENCODED_ID)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id"});
    })

    test('when passed invalid JSON encoded as base64url string', () => {
      expect(() => {new ContentId('eyJjaGFpbiI6M')})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: 'Unexpected end of JSON input'});
    })

    test('when passed an object missing the chain field', () => {
      const cid = {
        contract: VALID_ADDRESS,
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed an object with an invalid chain field', () => {
      const cid = {
        chain: '1',
        contract: VALID_ADDRESS,
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed an object missing the contract field', () => {
      const cid = {
        chain: VALID_CHAIN,
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed an object with an invalid contract field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: '0x010203xyz',
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed an object missing the provider field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed an object with an invalid provider field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: 1
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed an object with an invalid file field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: 1
      };
      expect(() => {new ContentId(cid)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed a base64url encoded id missing the chain field', () => {
      expect(() => {new ContentId(INVALID_BASE64_ENCODED_ID_MISSING_CHAIN)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed a base64url encoded id with an invalid chain field', () => {
      expect(() => {new ContentId(INVALID_BASE64_ENCODED_ID_INVALID_CHAIN)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "invalid object field(s)"});
    })

    test('when passed a did with the wrong method', () => {
      expect(() => {new ContentId('did:notbub:'+VALID_BASE64URL_ENCODED_ID)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id", cause: "not a Bubble DID"});
    })

    test('when passed a malformed did', () => {
      expect(() => {new ContentId('dod:bubble:'+VALID_BASE64URL_ENCODED_ID)})
        .toThrowBubbleError({code: BUBBLE_ERROR_INVALID_CONTENT_ID, message: "Invalid content id"});
    })

  });


  describe('can be constructed', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

    test('with a base64url encoded id (without file)', () => {
      const cid = new ContentId(VALID_BASE64URL_ENCODED_ID);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a base64url encoded id (with file)', () => {
      const cid = new ContentId(VALID_BASE64URL_ENCODED_ID_WITH_FILE);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

    test('with a base64 encoded id (without file)', () => {
      const cid = new ContentId(VALID_BASE64_ENCODED_ID);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a base64 encoded id (with file)', () => {
      const cid = new ContentId(VALID_BASE64_ENCODED_ID_WITH_FILE);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

    test('with a base64 encoded DID (without file)', () => {
      const cid = new ContentId('did:bubble:'+VALID_BASE64_ENCODED_ID);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a base64 encoded DID (with file)', () => {
      const cid = new ContentId('did:bubble:'+VALID_BASE64_ENCODED_ID_WITH_FILE);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

  })


  describe('.toString() generates the correct Base64URL format', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.toString()).toBe(VALID_BASE64URL_ENCODED_ID);
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.toString()).toBe(VALID_BASE64URL_ENCODED_ID_WITH_FILE);
    })

  })


  describe('.toDID() generates the correct did', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.toDID()).toBe('did:bubble:'+VALID_BASE64URL_ENCODED_ID);
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.toDID()).toBe('did:bubble:'+VALID_BASE64URL_ENCODED_ID_WITH_FILE);
    })

  })


  describe('.toObject() generates the correct plain object', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(JSON.stringify(cid.toObject())).toBe('{"chain":1,"contract":"0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929","provider":"https://bubblevault.com:8131/eth/v2"}');
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(JSON.stringify(cid.toObject())).toBe('{"chain":1,"contract":"0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929","provider":"https://bubblevault.com:8131/eth/v2","file":"0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world>>???a.txt"}');
    })

  })

})