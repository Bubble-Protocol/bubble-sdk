import { BubblePermissions, ContentId, ErrorCodes } from '../packages/client/node_modules/@bubble-protocol/core';
import { BubbleContentManager, ContentManager, encryptionPolicies, toDelegateSignFunction, toFileId } from '../packages/client';
import { BUBBLE_SERVER_URL, CHAIN_ID, MockBubbleServer, pingServerTest, startServers, stopServers } from './mockups/test-servers.js';
import { bubbleAvailableTest, clearTestBubble, contract, owner, ownerBubble, ownerSign, requester, requesterBubble, requesterSign } from './mockups/test-bubble.js';
import { DataServerTestPoint } from '../packages/server/test/DataServerTestSuite/DataServerTestPoint.js';
import { testDataServerRequirements } from '../packages/server/test/DataServerTestSuite/requirementsTests.js';
import { RamBasedDataServer } from './mockups/RamBasedDataServer.js';
import { constructTestBubble } from './mockups/test-bubble.js';
import '../packages/core/test/BubbleErrorMatcher.js';
import { Delegation } from '../packages/client/src/Delegation';


const JSON_RPC_ERROR_INVALID_METHOD_PARAMS = -32602;


// Permissions are set to support a variety of tests:
//   - Vault Root: owner:rwa, requester:r
//   - cid 1: owner:rwa, requester:r
//   - cid 2: owner:r, requester:w
//   - cid 3: owner:r, requester:a
//   - cid 4: owner:da, requester:dr
//   - cid 5: owner:dr, requester:dwa
//   - cid 6: owner:rwa, requester:-
const file0 = "0x0000000000000000000000000000000000000000000000000000000000000000";
const file1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
const file2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
const file4 = "0x0000000000000000000000000000000000000000000000000000000000000004";
const file5 = "0x0000000000000000000000000000000000000000000000000000000000000005";
const file6 = "0x0000000000000000000000000000000000000000000000000000000000000006";


describe('validate end-to-end test suite', () => {

  const dataServer = new RamBasedDataServer();
  const testPoint = new DataServerTestPoint(dataServer);
  
  testPoint.runTests();

  testDataServerRequirements(dataServer, testPoint);

})


describe('end-to-end bubble to server and blockchain tests', () => {

  beforeAll(async () => {
    await startServers();
    await constructTestBubble();
  }, 20000)

  beforeEach(() => {
    clearTestBubble();
  })

  afterAll( async () => {
    await stopServers();
  }, 20000)


  pingServerTest();
  bubbleAvailableTest();


  describe('Bubble basic functions', () => {


    describe('when the bubble does not exist', () => {

      beforeEach(() => {
        MockBubbleServer.deleteAllBubbles();
      })

      afterEach(() => {
        MockBubbleServer.createBubble(contract.options.address.toLowerCase());
      })

      test('write rejects with a Bubble Does Not Exist error', async () => {
        await expect(ownerBubble.write(file1, "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('append rejects with a Bubble Does Not Exist error', async () => {
        await expect(ownerBubble.append(file1, "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('read rejects with a Bubble Does Not Exist error', async () => {
        await expect(ownerBubble.read(file1)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('delete rejects with a Bubble Does Not Exist error', async () => {
        await expect(ownerBubble.delete(file1)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('mkdir rejects with a Bubble Does Not Exist error', async () => {
        await expect(requesterBubble.mkdir(file5)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('list rejects with a Bubble Does Not Exist error', async () => {
        await expect(ownerBubble.list(file1)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('create fails if permission is denied', async () => {
        await expect(requesterBubble.create()).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('create is successful if permitted and unsuccessful if bubble already exists', async () => {
        await expect(ownerBubble.create()).resolves.toStrictEqual(new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL
        }));
        await expect(ownerBubble.create()).rejects.toBeBubbleError();
      })

    })


    describe('bubble write', () => {

      test('fails if permission is denied', async () => {
        await expect(requesterBubble.write(file1, "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails if path is a directory', async () => {
        await expect(requesterBubble.write(file5, "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails to write to a file within a directory if directory permission is denied', async () => {
        await expect(ownerBubble.write(file5+'/test1', "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails to write to a file within a directory if only have append permissions', async () => {
        await expect(ownerBubble.append(file4+'/test1', "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.write(file4+'/test2', "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test(`writes ok if permitted and returns the file's ContentId`, async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toStrictEqual(new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL,
          file: file1
        }));
      })

      test(`can write to a file within a directory and returns the file's ContentId`, async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toStrictEqual(new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL,
          file: file5+'/test1'
        }));
      })

      test(`returns the target's ContentId`, async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toBeInstanceOf(ContentId);
      })

    })

    describe('bubble append', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.append(file1, " world")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails if path is a directory', async () => {
        await expect(requesterBubble.append(file5, "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails to append to a file within a directory if directory permission is denied', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file5+'/test1', "hello")).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test(`appends ok if permitted and returns the file's ContentId`, async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file1, " world")).resolves.toStrictEqual(new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL,
          file: file1
        }));
      })

      test('can append to a file within a directory', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.append(file5+'/test1', " world")).resolves.toBeInstanceOf(ContentId);
      })

    })

    describe('bubble read', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.read(file6)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails if the file does not exist', async () => {
        await expect(ownerBubble.read(file6)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
      })

      test('resolves with empty string if file does not exist but the silent option is given', async () => {
        await expect(ownerBubble.read(file6, {silent: true})).resolves.toBe('');
      })

      test('reads ok if permitted', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.read(file6)).resolves.toBe("hello");
      })

      test('can read an empty file', async () => {
        await expect(ownerBubble.write(file6, "")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.read(file6)).resolves.toBe('');
      })

      test('a read of a directory is equivalent to list', async () => {
        await expect(ownerBubble.append(file4+'/test1', "")).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.read(file4)).resolves.toStrictEqual([{type: "file", name: file4+"/test1"}]);
      })

    })

    describe('bubble delete', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.delete(file6)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails if file does not exist', async () => {
        await expect(ownerBubble.delete(file1)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
      })

      test('does not fail if file does not exist and silent option is given', async () => {
        await expect(ownerBubble.delete(file1, {silent: true})).resolves.toBe(null);
      })

      test('deletes file if permitted', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.delete(file6)).resolves.toBe(null);
      })

      test('deletes empty directory if permitted', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.delete(file5)).resolves.toBe(null);
      })

      test('deletes non-empty directory', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.delete(file5)).resolves.toBe(null);
      })

    })


    describe('bubble mkdir', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.mkdir(file5)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails if path is not a directory', async () => {
        await expect(ownerBubble.mkdir(file1)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test(`succeeds if permitted and returns the directory's ContentId`, async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toStrictEqual(new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL,
          file: file5
        }));
      })

      test('fails if directory already exists', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.mkdir(file5)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS});
      })

      test('does not fail if directory already exists but silent option is given', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBeInstanceOf(ContentId);
        await expect(requesterBubble.mkdir(file5, {silent: true})).resolves.toBeInstanceOf(ContentId);
      })

    })


    describe('bubble list', () => {

      test('fails if permission is denied', async () => {
        await expect(requesterBubble.list(file6)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('succeeds if permitted', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBeInstanceOf(ContentId);
        const listing = await ownerBubble.list(file6);
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].type).toBe('file');
        expect(listing[0].length).toBeUndefined();
        expect(listing[0].created).toBeUndefined();
        expect(listing[0].modified).toBeUndefined();
      })

      test('returns directory contents', async () => {
        await expect(ownerBubble.append(file4+'/f1', "hello world")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f2', "hello solar system")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f3', "hello universe")).resolves.toBeInstanceOf(ContentId);
        const listing = await requesterBubble.list(file4, {long: true});
        expect(listing).toHaveLength(3);
        function checkFile(meta, name, type, length) {
          expect(meta.name).toBe(name);
          expect(meta.type).toBe(type);
          expect(meta.length).toBe(length);
          expect(typeof meta.created).toBe('number');
          expect(typeof meta.modified).toBe('number');
        }
        checkFile(listing[0], file4+'/f1', 'file', 11);
        checkFile(listing[1], file4+'/f2', 'file', 18);
        checkFile(listing[2], file4+'/f3', 'file', 14);
      })

      test('returns root directory contents', async () => {
        await expect(ownerBubble.append(file4+'/f1', "hello world")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f2', "hello solar system")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f3', "hello universe")).resolves.toBeInstanceOf(ContentId);
        const listing = await requesterBubble.list(file0, {long: true});
        expect(listing).toHaveLength(1);
        function checkFile(meta, name, type, length) {
          expect(meta.name).toBe(name);
          expect(meta.type).toBe(type);
          expect(meta.length).toBe(length);
          expect(typeof meta.created).toBe('number');
          expect(typeof meta.modified).toBe('number');
        }
        checkFile(listing[0], file4, 'dir', 3);
      })

      test('fails if directory does not exist', async () => {
        await expect(ownerBubble.list(file5)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
      })

      test('does not fail if directory does not exist but silent option is given', async () => {
        await expect(ownerBubble.list(file5, {silent: true})).resolves.toStrictEqual([]);
      })

      test('returns length if the length option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBeInstanceOf(ContentId);
        const listing = await ownerBubble.list(file6, {length: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].type).toBe('file');
        expect(listing[0].length).toBe(11);
        expect(listing[0].created).toBeUndefined();
        expect(listing[0].modified).toBeUndefined();
      })

      test('returns created time if the create option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBeInstanceOf(ContentId);
        const listing = await ownerBubble.list(file6, {created: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].type).toBe('file');
        expect(listing[0].length).toBeUndefined();
        expect(typeof listing[0].created).toBe('number');
        expect(listing[0].modified).toBeUndefined();
      })

      test('returns length if the length option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBeInstanceOf(ContentId);
        const listing = await ownerBubble.list(file6, {modified: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].type).toBe('file');
        expect(listing[0].length).toBeUndefined();
        expect(listing[0].created).toBeUndefined();
        expect(typeof listing[0].modified).toBe('number');
      })

      test('returns length, created and modified fields if the long option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBeInstanceOf(ContentId);
        const listing = await ownerBubble.list(file6, {long: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].type).toBe('file');
        expect(listing[0].length).toBe(11);
        expect(typeof listing[0].created).toBe('number');
        expect(typeof listing[0].modified).toBe('number');
      })

      test('time filters', async () => {
        // create files
        await expect(ownerBubble.append(file4+'/f1', "hello world")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f2', "hello solar system")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f3', "hello universe")).resolves.toBeInstanceOf(ContentId);
        // modify in reverse order
        await expect(ownerBubble.append(file4+'/f3', " again")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f2', " again")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.append(file4+'/f1', " again")).resolves.toBeInstanceOf(ContentId);

        // list without filter and check modified times are different from created times
        const fullListing = await requesterBubble.list(file4, {long: true});
        expect(fullListing).toHaveLength(3);
        expect(fullListing[0].name).toBe(file4+'/f1');
        expect(fullListing[1].name).toBe(file4+'/f2');
        expect(fullListing[2].name).toBe(file4+'/f3');
        expect(fullListing[0].modified).not.toBe(fullListing[0].created);
        expect(fullListing[1].modified).not.toBe(fullListing[1].created);
        expect(fullListing[2].modified).not.toBe(fullListing[2].created);

        // list with filter: modified after f3
        let filteredListing = await requesterBubble.list(file4, {long: true, after: fullListing[2].modified});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe(file4+'/f1');
        expect(filteredListing[1].name).toBe(file4+'/f2');
        
        // list with filter: modified before f1
        filteredListing = await requesterBubble.list(file4, {long: true, before: fullListing[0].modified});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe(file4+'/f2');
        expect(filteredListing[1].name).toBe(file4+'/f3');

        // list with filter: created after f1
        filteredListing = await requesterBubble.list(file4, {long: true, createdAfter: fullListing[0].created});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe(file4+'/f2');
        expect(filteredListing[1].name).toBe(file4+'/f3');
        
        // list with filter: created before f3
        filteredListing = await requesterBubble.list(file4, {long: true, createdBefore: fullListing[2].created});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe(file4+'/f1');
        expect(filteredListing[1].name).toBe(file4+'/f2');

        //
        // Check boundary conditions
        //

        // list with filter: modified after (f3 - 1)
        filteredListing = await requesterBubble.list(file4, {long: true, after: fullListing[2].modified-1});
        expect(filteredListing).toHaveLength(3);
        
        // list with filter: modified before (f1 + 1)
        filteredListing = await requesterBubble.list(file4, {long: true, before: fullListing[0].modified+1});
        expect(filteredListing).toHaveLength(3);
        
        // list with filter: created after (f1 - 1)
        filteredListing = await requesterBubble.list(file4, {long: true, createdAfter: fullListing[0].created-1});
        expect(filteredListing).toHaveLength(3);
        
        // list with filter: created before (f3 + 1)
        filteredListing = await requesterBubble.list(file4, {long: true, createdBefore: fullListing[2].created+1});
        expect(filteredListing).toHaveLength(3);
        
      })

    })


    describe('bubble getPermissions', () => {

      test('for a file', async () => {
        // owner
        let permissions = await ownerBubble.getPermissions(file1);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(false);
        expect(permissions.canRead()).toBe(true);
        expect(permissions.canWrite()).toBe(true);
        expect(permissions.canAppend()).toBe(true);
        expect(permissions.canExecute()).toBe(false);
        // requester
        permissions = await requesterBubble.getPermissions(file1);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(false);
        expect(permissions.canRead()).toBe(true);
        expect(permissions.canWrite()).toBe(false);
        expect(permissions.canAppend()).toBe(false);
        expect(permissions.canExecute()).toBe(false);
      })

      test('for a directory', async () => {
        // owner
        let permissions = await ownerBubble.getPermissions(file5);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(true);
        expect(permissions.canRead()).toBe(true);
        expect(permissions.canWrite()).toBe(false);
        expect(permissions.canAppend()).toBe(false);
        expect(permissions.canExecute()).toBe(false);
        // requester
        permissions = await requesterBubble.getPermissions(file5);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(true);
        expect(permissions.canRead()).toBe(false);
        expect(permissions.canWrite()).toBe(true);
        expect(permissions.canAppend()).toBe(true);
        expect(permissions.canExecute()).toBe(false);
      })

    })


    describe('Encryption policy', () => {

      test('writes and reads encrypted data', async () => {
        class TestEncryptionPolicy extends encryptionPolicies.AESGCMEncryptionPolicy {
          isEncrypted(contentId) { return contentId.file === file1 } 
        }
        ownerBubble.setEncryptionPolicy(new TestEncryptionPolicy(owner.privateKey));
        await expect(ownerBubble.write(file1, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        await expect(requesterBubble.read(file1)).resolves.toMatch(/^0x[0-9a-fA-F]{17}[0-9a-fA-F]*$/);
      })
    
      test('appends and reads encrypted data', async () => {
        class TestEncryptionPolicy extends encryptionPolicies.AESGCMEncryptionPolicy {
          isEncrypted(contentId) { return contentId.file === file1 } 
        }
        ownerBubble.setEncryptionPolicy(new TestEncryptionPolicy(owner.privateKey));
        await expect(ownerBubble.append(file1, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        await expect(requesterBubble.read(file1)).resolves.toMatch(/^0x[0-9a-fA-F]{17}[0-9a-fA-F]*$/);
      })

      test('does not encrypt when policy returns false', async () => {
        class TestEncryptionPolicy extends encryptionPolicies.AESGCMEncryptionPolicy {
          isEncrypted(contentId) { return contentId.file === file2 } 
        }
        ownerBubble.setEncryptionPolicy(new TestEncryptionPolicy(owner.privateKey));
        await expect(ownerBubble.write(file1, "hello")).resolves.toBeInstanceOf(ContentId);
        await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        await expect(requesterBubble.read(file1)).resolves.toBe("hello");
      })
    
    })
  

    describe('ContentManager', () => {

      /**
       * ContentManager is a wrapper around a Bubble so no need to repeat the Bubble test
       */


      function getContentId(fileId) {
        return new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL,
          file: fileId
        })
      }

      describe('when the bubble does not exist', () => {

        beforeEach(() => {
          MockBubbleServer.deleteAllBubbles();
        })

        afterEach(() => {
          MockBubbleServer.createBubble(contract.options.address.toLowerCase());
        })

        test('write rejects with a Bubble Does Not Exist error', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        })
  
        test('append rejects with a Bubble Does Not Exist error', async () => {
          await expect(ContentManager.append(getContentId(file1), "hello", ownerSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        })
  
        test('read rejects with a Bubble Does Not Exist error', async () => {
          await expect(ContentManager.read(getContentId(file1), ownerSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        })
  
        test('delete rejects with a Bubble Does Not Exist error', async () => {
          await expect(ContentManager.delete(getContentId(file1), ownerSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        })
  
        test('mkdir rejects with a Bubble Does Not Exist error', async () => {
          await expect(ContentManager.mkdir(getContentId(file5), requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        })
  
        test('list rejects with a Bubble Does Not Exist error', async () => {
          await expect(ContentManager.list(getContentId(file1), ownerSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        })
  
      })

      describe('write', () => {

        test('fails if permission is denied', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })
  
        test('writes ok if permitted', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        })
  
        test('writes ok with base64url content id', async () => {
          await expect(ContentManager.write(getContentId(file1).toString(), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        })
  
        test('writes ok with plain object content id', async () => {
          await expect(ContentManager.write(getContentId(file1).toObject(), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        })
  
        test('writes ok with DID', async () => {
          await expect(ContentManager.write(getContentId(file1).toDID(), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        })
  
        test('writes ok with options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", {test: true}, ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello");
        })
  
        test('writes ok with undefined options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", undefined, ownerSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('writes ok using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(manager.write(getContentId(file1), "hello")).resolves.toBeInstanceOf(ContentId);
        })

        test('writes ok using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(manager.write(getContentId(file1), "hello", {test: true})).resolves.toBeInstanceOf(ContentId);
        })
  
        test('can write to a file within a directory', async () => {
          await expect(ContentManager.write(getContentId(file5+'/test1'), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
      })  


      describe('append', () => {

        test('fails if permission is denied', async () => {
          await expect(ContentManager.append(getContentId(file1), "hello", requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })
  
        test('appends ok if permitted', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.append(getContentId(file1), " world", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello world");
        })
  
        test('appends ok with base64url content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.append(getContentId(file1).toString(), " world", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello world");
        })
  
        test('appends ok with plain object content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.append(getContentId(file1).toObject(), " world", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello world");
        })
  
        test('appends ok with DID', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.append(getContentId(file1).toDID(), " world", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ownerBubble.read(file1)).resolves.toBe("hello world");
        })
  
        test('appends ok with options', async () => {
          await expect(ContentManager.append(getContentId(file1), "hello", {test: true}, ownerSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('appends ok with undefined options', async () => {
          await expect(ContentManager.append(getContentId(file1), "hello", undefined, ownerSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('appends ok using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(manager.append(getContentId(file1), "hello")).resolves.toBeInstanceOf(ContentId);
        })

        test('appends ok using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(manager.append(getContentId(file1), "hello", {test: true})).resolves.toBeInstanceOf(ContentId);
        })
  
        test('can append to a file within a directory', async () => {
          await expect(ContentManager.write(getContentId(file5+'/test1'), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.append(getContentId(file5+'/test1'), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
      })  


      describe('read', () => {

        test('fails if permission is denied', async () => {
          await expect(ContentManager.write(getContentId(file2), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file2), requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })
  
        test('reads ok if permitted', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file1), requesterSign)).resolves.toBe("hello");
        })
  
        test('reads ok with base64url content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file1).toString(), requesterSign)).resolves.toBe("hello");
        })
  
        test('reads ok with plain object content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file1).toObject(), requesterSign)).resolves.toBe("hello");
        })
  
        test('reads ok with DID', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file1).toDID(), requesterSign)).resolves.toBe("hello");
        })
  
        test('reads ok with options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file1), {test: true}, requesterSign)).resolves.toBe("hello");
        })
  
        test('reads ok with undefined options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file1), undefined, requesterSign)).resolves.toBe("hello");
        })
  
        test('reads ok using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(manager.read(getContentId(file1))).resolves.toBe("hello");
        })

        test('reads ok using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(manager.read(getContentId(file1), {test: true})).resolves.toBe("hello");
        })
  
        test('can read a file within a directory', async () => {
          await expect(ContentManager.write(getContentId(file5+'/test1'), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.read(getContentId(file5+'/test1'), ownerSign)).resolves.toBe("hello");
        })
  
      })  


      describe('delete', () => {

        test('fails if permission is denied', async () => {
          await expect(ContentManager.delete(getContentId(file1), requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })
  
        test('deletes ok if permitted', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file1), ownerSign)).resolves.toBe(null);
        })
  
        test('deletes ok with base64url content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file1).toString(), ownerSign)).resolves.toBe(null);
        })
  
        test('deletes ok with plain object content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file1).toObject(), ownerSign)).resolves.toBe(null);
        })
  
        test('deletes ok with DID', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file1).toDID(), ownerSign)).resolves.toBe(null);
        })
  
        test('deletes ok with options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", {test: true}, ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file1), {test: true}, ownerSign)).resolves.toBe(null);
        })
  
        test('deletes ok with undefined options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", {test: true}, ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file1), undefined, ownerSign)).resolves.toBe(null);
        })
  
        test('deletes ok using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(ContentManager.write(getContentId(file1), "hello", {test: true}, ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(manager.delete(getContentId(file1))).resolves.toBe(null);
        })

        test('deletes ok using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(ContentManager.write(getContentId(file1), "hello", {test: true}, ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(manager.delete(getContentId(file1), {test: true})).resolves.toBe(null);
        })
  
        test('can deletes a file within a directory', async () => {
          await expect(ContentManager.write(getContentId(file5+'/test1'), "hello", {test: true}, requesterSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.delete(getContentId(file5+'/test1'), {test: true}, requesterSign)).resolves.toBe(null);
        })
  
      })  


      describe('mkdir', () => {

        test('fails if permission is denied', async () => {
          await expect(ContentManager.mkdir(getContentId(file4), requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })
  
        test('is successful if permitted', async () => {
          await expect(ContentManager.mkdir(getContentId(file5), requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('is successful with base64url content id', async () => {
          await expect(ContentManager.mkdir(getContentId(file5).toString(), requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('is successful with plain object content id', async () => {
          await expect(ContentManager.mkdir(getContentId(file5).toObject(), requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('is successful with DID', async () => {
          await expect(ContentManager.mkdir(getContentId(file5).toDID(), requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('is successful with options', async () => {
          await expect(ContentManager.mkdir(getContentId(file5), {force: true}, requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('is successful with undefined options', async () => {
          await expect(ContentManager.mkdir(getContentId(file5), undefined, requesterSign)).resolves.toBeInstanceOf(ContentId);
        })
  
        test('is successful using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(requesterSign);
          await expect(manager.mkdir(getContentId(file5))).resolves.toBeInstanceOf(ContentId);
        })

        test('is successful using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(requesterSign);
          await expect(manager.mkdir(getContentId(file5), {force: true})).resolves.toBeInstanceOf(ContentId);
        })
  
      })  


      describe('list', () => {

        test('fails if permission is denied', async () => {
          await expect(ContentManager.write(getContentId(file2), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file2), requesterSign)).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
        })
  
        test('lists ok if permitted', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file1), requesterSign)).resolves.toHaveLength(1);
        })
  
        test('lists ok with base64url content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file1).toString(), requesterSign)).resolves.toHaveLength(1);
        })
  
        test('lists ok with plain object content id', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file1).toObject(), requesterSign)).resolves.toHaveLength(1);
        })
  
        test('lists ok with DID', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file1).toDID(), requesterSign)).resolves.toHaveLength(1);
        })
  
        test('lists ok with options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file1), {test: true}, requesterSign)).resolves.toHaveLength(1);
        })
  
        test('lists ok with undefined options', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file1), undefined, requesterSign)).resolves.toHaveLength(1);
        })
  
        test('lists ok using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(manager.list(getContentId(file1))).resolves.toHaveLength(1);
        })

        test('lists ok using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(manager.list(getContentId(file1), {test: true})).resolves.toHaveLength(1);
        })
  
        test('can list a file within a directory', async () => {
          await expect(ContentManager.write(getContentId(file5+'/test1'), "hello", requesterSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file5+'/test1'), ownerSign)).resolves.toHaveLength(1);
        })
  
        test('can list the root directory', async () => {
          await expect(ContentManager.write(getContentId(file1), "hello", ownerSign)).resolves.toBeInstanceOf(ContentId);
          await expect(ContentManager.list(getContentId(file0), ownerSign)).resolves.toHaveLength(1);
        })
  
      })  


      describe('getPermissions', () => {

        test('returns a BubblePermissions object', async () => {
          await expect(ContentManager.getPermissions(getContentId(file1), ownerSign)).resolves.toBeInstanceOf(BubblePermissions);
        })
  
        test('is successful with base64url content id', async () => {
          await expect(ContentManager.getPermissions(getContentId(file1).toString(), ownerSign)).resolves.toBeInstanceOf(BubblePermissions);
        })
  
        test('is successful with plain object content id', async () => {
          await expect(ContentManager.getPermissions(getContentId(file1).toObject(), ownerSign)).resolves.toBeInstanceOf(BubblePermissions);
        })
  
        test('is successful with DID', async () => {
          await expect(ContentManager.getPermissions(getContentId(file1).toDID(), ownerSign)).resolves.toBeInstanceOf(BubblePermissions);
        })
  
        test('is successful with options', async () => {
          await expect(ContentManager.getPermissions(getContentId(file1), {force: true}, ownerSign)).resolves.toBeInstanceOf(BubblePermissions);
        })
  
        test('is successful with undefined options', async () => {
          await expect(ContentManager.getPermissions(getContentId(file1), undefined, ownerSign)).resolves.toBeInstanceOf(BubblePermissions);
        })
  
        test('is successful using instantiated BubbleContentManager', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(manager.getPermissions(getContentId(file1))).resolves.toBeInstanceOf(BubblePermissions);
        })

        test('is successful using instantiated BubbleContentManager with options', async () => {
          const manager = new BubbleContentManager(ownerSign);
          await expect(manager.getPermissions(getContentId(file1), {test: true})).resolves.toBeInstanceOf(BubblePermissions);
        })
  
      })  


      describe('toFileId', () => {

        test('throws if the parameter is missing', () => {
          expect(() => ContentManager.toFileId()).toThrow(TypeError);
        })

        test('throws if the parameter is null', () => {
          expect(() => ContentManager.toFileId(null)).toThrow(TypeError);
        })

        test('throws if the parameter is empty', () => {
          expect(() => ContentManager.toFileId('')).toThrow(TypeError);
        })

        test('throws if the parameter is an invalid type', () => {
          expect(() => ContentManager.toFileId({})).toThrow(TypeError);
        })

        test('throws if the parameter is a negative number', () => {
          expect(() => ContentManager.toFileId(-1)).toThrow('parameter out of range');
        })

        test('throws if the parameter is a negative BigInt', () => {
          expect(() => ContentManager.toFileId(BigInt(-1))).toThrow('parameter out of range');
        })

        test('correctly converts a number', () => {
          expect(ContentManager.toFileId(1024)).toBe('0x0000000000000000000000000000000000000000000000000000000000000400');
        })

        test('correctly converts a BigInt', () => {
          expect(ContentManager.toFileId(1024n)).toBe('0x0000000000000000000000000000000000000000000000000000000000000400');
        })

        test('correctly converts a Buffer', () => {
          expect(ContentManager.toFileId(Buffer.from("0400", 'hex'))).toBe('0x0000000000000000000000000000000000000000000000000000000000000400');
        })

        test('correctly converts 2^256-1 as BigInt', () => {
          expect(ContentManager.toFileId(115792089237316195423570985008687907853269984665640564039457584007913129639935n))
            .toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        })

        test('correctly converts 2^256-1 as Buffer', () => {
          expect(ContentManager.toFileId(Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')))
            .toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        })

        test('throws if the parameter is a BigInt > 2^256-1', () => {
          expect(() => ContentManager.toFileId(115792089237316195423570985008687907853269984665640564039457584007913129639936n))
            .toThrow('parameter out of range');
        })

        test('throws if the parameter is a Buffer > 2^256-1', () => {
          expect(() => ContentManager.toFileId(Buffer.from('010000000000000000000000000000000000000000000000000000000000000000', 'hex')))
            .toThrow('parameter out of range');
        })

        test('correctly converts a hex string (without leading 0x)', () => {
          expect(ContentManager.toFileId("4AF")).toBe('0x00000000000000000000000000000000000000000000000000000000000004AF');
        })

        test('correctly converts a hex string (with leading 0x)', () => {
          expect(ContentManager.toFileId("0x4AF")).toBe('0x00000000000000000000000000000000000000000000000000000000000004AF');
        })

        test('correctly converts a long hex string', () => {
          expect(ContentManager.toFileId("0x1234567890fffffffffffffffffffffffffffffffffffffffffffffffffabcde")).
          toBe('0x1234567890fffffffffffffffffffffffffffffffffffffffffffffffffabcde');
        })

        test('correctly converts the largest hex string', () => {
          expect(ContentManager.toFileId("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")).
          toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        })

        test('throws if the parameter is a hex string more that 32 bytes long', () => {
          expect(() => ContentManager.toFileId("0x10000000000000000000000000000000000000000000000000000000000000000")).toThrow('parameter out of range');
        })

      })

    })

    describe('delegation', () => {

      function getContentId() {
        return new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL,
          file: toFileId(1)
        })
      }

      test('succeeds if delegate has admin permissions', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToAllBubbles();
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .resolves.not.toThrow();
      })

      test('succeeds if delegate has permission for this contract', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToBubble({
          chain: CHAIN_ID,
          contract: contract.options.address
        })
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .resolves.not.toThrow();
      })

      test('succeeds if delegate has permission for this contract and provider', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToBubble({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL
        })
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .resolves.not.toThrow();
      })

      test('fails with permission error if delegate has expired', async () => {
        const delegation = new Delegation(requester.address, Date.now()/1000 - 1);
        delegation.permitAccessToAllBubbles();
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails with permission error if delegate has no permissions', async () => {
        const delegation = new Delegation(requester.address, 'never');
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails with JSON 2.0 parameter error if delegation is not signed', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToAllBubbles();
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: JSON_RPC_ERROR_INVALID_METHOD_PARAMS});
      })

      test('fails with permission error if delegate is wrong', async () => {
        const delegation = new Delegation(owner.address, 'never');
        delegation.permitAccessToAllBubbles();
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails with permission error if permission is for a different chain', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToBubble({
          chain: CHAIN_ID + 1,
          contract: contract.options.address
        })
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails with permission error if permission is for a different contract', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToBubble({
          chain: CHAIN_ID,
          contract: owner.address
        })
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('fails with permission error if permission is for a different provider', async () => {
        const delegation = new Delegation(requester.address, 'never');
        delegation.permitAccessToBubble(new ContentId({
          chain: CHAIN_ID,
          contract: contract.options.address,
          provider: BUBBLE_SERVER_URL+'/'
        }))
        await delegation.sign(ownerSign);
        const signFunction = toDelegateSignFunction(requesterSign, delegation);
        await expect(ContentManager.write(getContentId(), 'hello', signFunction))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

    })


    describe('bubble terminate and isTerminated', () => {

      test('fails if contract is not terminated', async () => {
        await expect(ownerBubble.isTerminated()).resolves.toBe(false);
        await expect(ownerBubble.terminate()).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED});
      })

      test('succeeds if contract is terminated', async () => {
        await expect(ownerBubble.isTerminated()).resolves.toBe(false);
        await contract.methods.terminate().send({
          from: owner.address,
          gas: 1500000,
          gasPrice: '30000000000000'
        });
        await expect(requesterBubble.terminate()).resolves.toBeNull(); // anyone can terminate even if no permissions
        await expect(ownerBubble.terminate()).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('fails if bubble does not exist', async () => {
        MockBubbleServer.deleteAllBubbles();
        await expect(ownerBubble.terminate()).rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      })

      test('succeeds if bubble does not exist but silent option is given', async () => {
        MockBubbleServer.deleteAllBubbles();
        await expect(requesterBubble.terminate({silent: true})).resolves.toBeNull();
      })

    })

  })

})

