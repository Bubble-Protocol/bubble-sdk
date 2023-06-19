
// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { jest } from '@jest/globals';
import { ErrorCodes, ROOT_PATH } from '@bubble-protocol/core';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';

/**
 * DataServer functional requirements tests.  Running these tests against a DataServer
 * will confirm it meets the requirements in @bubble-protocol/server/DataServer.js.
 * 
 * Each test lists the requirements being tested.
 * 
 * @param {DataServer} dataServer the server under test
 * @param {TestPoint} testPoint the TestPoint implementation that bypasses the dataServer api
 * @param {Object} options with the following:
 *   {string} contractAddress: smart contract address to override the default.
 *   {boolean} noSubscriptions: do not run the subscribe and unsubscribe tests
 */
export function testDataServerRequirements(dataServer, testPoint, options={}) {

  //
  // Files used in the tests.
  //
  const defaultContractAddress = "0x1234000000000000000000000000000000000000000000000000000000005678";
  const root = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const file1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const file2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
  const dir3 = "0x0000000000000000000000000000000000000000000000000000000000000003";
  const fileInDir3 = dir3+'/test1';


  /**
   * Data Server Requirements Tests
   */
  describe("DataServer Requirements Tests", () => {

    let contractAddress;

    async function clearBubble() {
      await Promise.all([
        testPoint.deleteFile(contractAddress, file1),
        testPoint.deleteFile(contractAddress, file2),
        testPoint.deleteFile(contractAddress, dir3),
      ])
    }

    beforeAll(() => {
      contractAddress = options.contractAddress || defaultContractAddress;
    })

    if (testPoint.runTests) testPoint.runTests();

    describe("Before the bubble has been created on the data server", () => {

      test( "[req-ds-wr-4] write fails with BUBBLE_DOES_NOT_EXIST error", async () => {
        await expect(dataServer.write(contractAddress, file1, "hello world"))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-ap-4] append fails with BUBBLE_DOES_NOT_EXIST error", async () => {
        await expect(dataServer.append(contractAddress, file1, "hello world"))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-rd-4] read fails with BUBBLE_DOES_NOT_EXIST error", async () => {
        await expect(dataServer.read(contractAddress, file1))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-dl-6] delete fails with BUBBLE_DOES_NOT_EXIST error", async () => {
        await expect(dataServer.delete(contractAddress, file1))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-mk-5] mkdir fails with BUBBLE_DOES_NOT_EXIST error", async () => {
        await expect(dataServer.mkdir(contractAddress, dir3))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-ls-4] list fails with BUBBLE_DOES_NOT_EXIST error", async () => {
        await expect(dataServer.list(contractAddress, root))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-wr-4] write fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.write(contractAddress, file1, "hello world", {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-ap-4] append fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.append(contractAddress, file1, "hello world", {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-rd-4] read fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.read(contractAddress, file1, {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-dl-6] delete fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.delete(contractAddress, file1, {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-mk-5] mkdir fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.mkdir(contractAddress, dir3, {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-ls-4] list fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.list(contractAddress, root, {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

      test( "[req-ds-sub-4] subscribe fails with BUBBLE_DOES_NOT_EXIST error even if silent option is given", async () => {
        await expect(dataServer.subscribe(contractAddress, root, {silent: true}))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
      });

    })


    describe("create", () => {

      test( "[req-ds-cr-1] [req-ds-cr-2] succeeds when bubble does not already exist", async () => {
        await expect(dataServer.create(contractAddress)).resolves.not.toThrow();
      });

      test( "[req-ds-cr-3] fails with BUBBLE_ALREADY_EXISTS error if bubble already exists", async () => {
        await expect(dataServer.create(contractAddress))
          .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS});
      });

      test( "[req-ds-cr-4] does not fail when bubble already exists but silent option is given", async () => {
        await expect(dataServer.create(contractAddress, {silent: true})).resolves.not.toThrow();
      });

    })


    
    describe("When the bubble exists", () => {


      beforeAll(async () => {
        await testPoint.createBubble(contractAddress);
        await clearBubble();
      })


      test("test clearBubble", async () => {
        await testPoint.writeFile(contractAddress, file1, 'hello world');
        await testPoint.writeFile(contractAddress, file2, 'hello world');
        await testPoint.writeFile(contractAddress, dir3+'/a.txt', 'hello world');
        await testPoint.writeFile(contractAddress, dir3+'/b.txt', 'hello world');
        await testPoint.writeFile(contractAddress, dir3+'/c.txt', 'hello world');
        await testPoint.assertExists(contractAddress, file1);
        await testPoint.assertExists(contractAddress, file2);
        await testPoint.assertExists(contractAddress, dir3);
        await testPoint.assertExists(contractAddress, dir3+'/a.txt');
        await testPoint.assertExists(contractAddress, dir3+'/b.txt');
        await testPoint.assertExists(contractAddress, dir3+'/c.txt');
        await clearBubble();
        await testPoint.assertNotExists(contractAddress, file1);
        await testPoint.assertNotExists(contractAddress, file2);
        await testPoint.assertNotExists(contractAddress, dir3);
        await testPoint.assertNotExists(contractAddress, dir3+'/a.txt');
        await testPoint.assertNotExists(contractAddress, dir3+'/b.txt');
        await testPoint.assertNotExists(contractAddress, dir3+'/c.txt');
      }, 20000)
  
      describe("but before a file exists", () => {

        test( "[req-ds-rd-2] read fails with FILE_DOES_NOT_EXIST error", async () => {
          await expect(dataServer.read(contractAddress, file1))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
        });

        test( "[req-ds-rd-3] read resolves with the empty string when silent option is given", async () => {
          await expect(dataServer.read(contractAddress, file1, {silent: true}))
            .resolves.toBe('');
        });

        test( "[req-ds-ls-2] list fails with FILE_DOES_NOT_EXIST error", async () => {
          await expect(dataServer.list(contractAddress, file1))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
        });

        test( "[req-ds-ls-3] list resolves with an empty array when silent option is given", async () => {
          await expect(dataServer.list(contractAddress, file1, {silent: true}))
            .resolves.toStrictEqual([]);
        });

        test( "[req-ds-dl-4] delete fails with FILE_DOES_NOT_EXIST error", async () => {
          await expect(dataServer.delete(contractAddress, file1))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
        });

        test( "[req-ds-dl-5] delete resolves when silent option is given", async () => {
          await expect(dataServer.delete(contractAddress, file1, {silent: true}))
            .resolves.not.toThrow();
        });

        test( "[req-ds-sub-3] subscribe fails with FILE_DOES_NOT_EXIST error", async () => {
          await expect(dataServer.subscribe(contractAddress, file1))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
        });

      })

      
      describe("write", () => {

        beforeAll(async () => {
          await clearBubble();
        })
        
        test( "[req-ds-wr-1] [req-ds-wr-2] to a new file succeeds", async () => {
          await expect(dataServer.write(contractAddress, file1, "hi")).resolves.not.toThrow()
          await expect(testPoint.readFile(contractAddress, file1)).resolves.toBe("hi");
          await testPoint.deleteFile(contractAddress, file1);
        });

        test( "[req-ds-wr-1] [req-ds-wr-2] to a existing file overwrites it", async () => {
          await expect(dataServer.write(contractAddress, file1, "hi")).resolves.not.toThrow();
          await expect(dataServer.write(contractAddress, file1, "hello")).resolves.not.toThrow();
          await expect(testPoint.readFile(contractAddress, file1)).resolves.toBe("hello");
          await testPoint.deleteFile(contractAddress, file1);
        });

        test( "[req-ds-wr-1] [req-ds-wr-3] to a file in a non-existent directory creates the directory and writes the file", async () => {
          await expect(dataServer.write(contractAddress, fileInDir3, "hello dir")).resolves.not.toThrow();
          await expect(dataServer.list(contractAddress, dir3)).resolves.not.toThrow();
          await testPoint.assertExists(contractAddress, dir3);
          await expect(testPoint.readFile(contractAddress, fileInDir3)).resolves.toBe("hello dir");
          await testPoint.deleteFile(contractAddress, dir3);
        });

      })


      describe("append", () => {

        beforeAll(async () => {
          await clearBubble();
        })
        
        test( "[req-ds-ap-1] [req-ds-ap-2] to an existing file appends the data", async () => {
          await testPoint.writeFile(contractAddress, file1, "hello");
          await expect(dataServer.append(contractAddress, file1, " world")).resolves.not.toThrow()
          await expect(testPoint.readFile(contractAddress, file1)).resolves.toBe("hello world");
          await testPoint.deleteFile(contractAddress, file1);
        });

        test( "[req-ds-ap-1] to a new file creates the file and writes the data", async () => {
          await expect(dataServer.append(contractAddress, file1, "hi")).resolves.not.toThrow();
          await expect(testPoint.readFile(contractAddress, file1)).resolves.toBe("hi");
          await testPoint.deleteFile(contractAddress, file1);
        });

        test( "[req-ds-ap-1] to an existing file in a directory appends the data", async () => {
          await testPoint.writeFile(contractAddress, fileInDir3, "dir hello");
          await expect(dataServer.append(contractAddress, fileInDir3, " world")).resolves.not.toThrow();
          await expect(testPoint.readFile(contractAddress, fileInDir3)).resolves.toBe("dir hello world");
          await testPoint.deleteFile(contractAddress, dir3);
        });

        test( "[req-ds-ap-1] [req-ds-ap-3] to an existing file in a directory creates the directory and writes the file", async () => {
          await expect(dataServer.append(contractAddress, fileInDir3, "hello dir")).resolves.not.toThrow();
          await testPoint.assertExists(contractAddress, dir3);
          await expect(testPoint.readFile(contractAddress, fileInDir3)).resolves.toBe("hello dir");
          await testPoint.deleteFile(contractAddress, dir3);
        });

      });


      describe("read", () => {

        beforeAll(async () => {
          await clearBubble();
        })
        
        test( "[req-ds-rd-1] can read a file and return the contents", async () => {
          await testPoint.writeFile(contractAddress, file1, "hello world");
          await expect(dataServer.read(contractAddress, file1)).resolves.toBe("hello world");
          await testPoint.deleteFile(contractAddress, file1);
        });

        test( "[req-ds-rd-1] can read a file in a directory and return the contents", async () => {
          await testPoint.writeFile(contractAddress, fileInDir3, "hello world");
          await expect(dataServer.read(contractAddress, fileInDir3)).resolves.toBe("hello world");
          await testPoint.deleteFile(contractAddress, dir3);
        });

      })


      describe("delete", () => {

        beforeAll(async () => {
          await clearBubble();
        })
        
        test( "[req-ds-dl-1] can delete a file", async () => {
          await testPoint.writeFile(contractAddress, file1, "hello world");
          await expect(dataServer.delete(contractAddress, file1)).resolves.not.toThrow();
          await testPoint.assertNotExists(contractAddress, file1);
          await testPoint.deleteFile(contractAddress, file1);
        });

        test( "[req-ds-dl-1] can delete a file in a directory and does not delete the directory", async () => {
          await testPoint.writeFile(contractAddress, fileInDir3, "hello world");
          await expect(dataServer.delete(contractAddress, fileInDir3)).resolves.not.toThrow();
          await testPoint.assertNotExists(contractAddress, fileInDir3);
          await testPoint.assertExists(contractAddress, dir3);
          await testPoint.deleteFile(contractAddress, dir3);
        });

        test( "[req-ds-dl-1] can delete an empty directory", async () => {
          await testPoint.mkdir(contractAddress, dir3);
          await expect(dataServer.delete(contractAddress, dir3)).resolves.not.toThrow();
          await testPoint.assertNotExists(contractAddress, dir3);
          await testPoint.deleteFile(contractAddress, dir3);
        });

        test( "[req-ds-dl-1] can delete a non-empty directory including it's contents", async () => {
          await testPoint.writeFile(contractAddress, fileInDir3, "hello world");
          await expect(dataServer.delete(contractAddress, dir3)).resolves.not.toThrow();
          await testPoint.assertNotExists(contractAddress, fileInDir3);
          await testPoint.assertNotExists(contractAddress, dir3);
          await testPoint.deleteFile(contractAddress, dir3);
        });

      })


      describe("mkdir", () => {

        beforeAll(async () => {
          await clearBubble();
        })
        
        test( "[req-ds-mk-1] [req-ds-mk-2] creates the directory, resolves", async () => {
          // Note the Guardian returns the content id
          await testPoint.assertNotExists(contractAddress, dir3);
          await expect(dataServer.mkdir(contractAddress, dir3)).resolves.not.toThrow();
          await testPoint.assertExists(contractAddress, dir3);
          await testPoint.deleteFile(contractAddress, dir3);
        });

        test( "[req-ds-mk-3] making a directory fails if directory already exists", async () => {
          await expect(dataServer.mkdir(contractAddress, dir3)).resolves.not.toThrow();
          await expect(dataServer.mkdir(contractAddress, dir3))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS});
          await testPoint.deleteFile(contractAddress, dir3);
        });

        test( "[req-ds-mk-4] making a directory does not fail if directory already exists and silent option is given", async () => {
          await expect(dataServer.mkdir(contractAddress, dir3)).resolves.not.toThrow();
          await expect(dataServer.mkdir(contractAddress, dir3, {silent: true})).resolves.not.toThrow();
          await testPoint.deleteFile(contractAddress, dir3);
        });

      })

      
      describe("list", () => {

        const fileAinDir5 = dir3+'/fileA.txt';
        const fileBinDir5 = dir3+'/fileB.mp4';

        async function setupBubble() {
          await clearBubble();
          await testPoint.writeFile(contractAddress, file1, "this is file 1");
          await testPoint.writeFile(contractAddress, fileAinDir5, "this is file A");
          await testPoint.writeFile(contractAddress, fileBinDir5, "this isn't file A");
        }

        beforeAll(async () => {
          await setupBubble();
        })

        afterAll(async () => {
          await clearBubble();
        })

        test( "[req-ds-ls-1] [req-ds-ls-5] [req-ds-ls-6] [req-ds-ls-7] listing a file resolves with a single item in an array with just name and type fields", async () => {
          await expect(dataServer.list(contractAddress, file1))
            .resolves.toStrictEqual(
              [
                {               // [req-ds-ls-5]
                  name: file1,  // [req-ds-ls-6] (file, no path extension)
                  type: 'file'  // [req-ds-ls-7] (file type)
                }
              ]
            ); 
        });

        test( "[req-ds-ls-1] [req-ds-ls-6] listing a file within a directory resolves with the listing of the file", async () => {
          await expect(dataServer.list(contractAddress, fileAinDir5))  // [req-ds-ls-1]  (named file within directory)
            .resolves.toStrictEqual(
              [
                {
                  name: fileAinDir5,  // [req-ds-ls-1]  (named file within directory), [req-ds-ls-6] (with path extension)
                  type: 'file'
                }
              ]
            );  
        });

        test( "[req-ds-ls-1] [req-ds-ls-6] [req-ds-ls-7] listing a directory resolves with the listing of it's contents", async () => {
          await expect(dataServer.list(contractAddress, dir3))  // [req-ds-ls-1]  (directory contents)
            .resolves.toStrictEqual(
              [
                {name: fileAinDir5, type: 'file'},  // [req-ds-ls-6] (file within named directory)
                {name: fileBinDir5, type: 'file'}   // [req-ds-ls-7] (file type within named directory)
              ]
            );
        });

        test( "[req-ds-ls-1] listing an empty directory resolves with an empty array", async () => {
          await testPoint.deleteFile(contractAddress, dir3);
          await testPoint.mkdir(contractAddress, dir3);
          await expect(dataServer.list(contractAddress, dir3))
            .resolves.toStrictEqual([]);  // [req-ds-ls-1]  (empty directory)
          await setupBubble();
        }, 10000);

        test( "[req-ds-ls-13] [req-ds-ls-6] [req-ds-ls-7] listing a directory with the `directoryOnly` flag resolves with the listing of the directory and shows the correct number of files", async () => {
          await expect(dataServer.list(contractAddress, dir3, {directoryOnly: true}))  // [req-ds-ls-13] (for directory)
            .resolves.toStrictEqual(
              [
                {
                  name: dir3,  // [req-ds-ls-6] (named directory)
                  type: 'dir'   // [req-ds-ls-7] (dir type)
                }
              ]
            );  
        });

        test( "[req-ds-ls-1] [req-ds-ls-5] [req-ds-ls-8] [req-ds-ls-14] listing the root path resolves with all files and directories and each has the correct length", async () => {
          const result = await dataServer.list(contractAddress, ROOT_PATH, {length: true});
          result.sort((a,b) => a.name.localeCompare(b.name));
          expect(result).toStrictEqual([
            {name: file1, type: 'file', length: 14},  // [req-ds-ls-8] (file length)
            {name: dir3, type: 'dir', length: 2}     // [req-ds-ls-8] (dir length)
          ])
        });

        test( "[req-ds-ls-14] [req-ds-ls-13] [req-ds-ls-6] [req-ds-ls-7] [req-ds-ls-8] listing the root path with the directoryOnly flag resolves with the bubble details only", async () => {
          await expect(dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, length: true}))
            .resolves.toStrictEqual([
              {
                name: ROOT_PATH,  // [req-ds-ls-6] (root dir), [req-ds-ls-14] (name is set to root dir)
                type: 'dir',      // [req-ds-ls-7] (dir type), [req-ds-ls-14] (type is set dir)
                length: 2         // [req-ds-ls-8] (dir length), [req-ds-ls-14] (length is count of contents)
              }
            ])
        });


        describe("long options", () => {

          test( "[req-ds-ls-1] [req-ds-ls-8..10] listing a file with the long option resolves with a single item in an array with at least name, type, length, created and modified fields", async () => {
            const result = await dataServer.list(contractAddress, file1, {long: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0]).toBe('object');
            expect(result[0].name).toBe(file1);   
            expect(result[0].type).toBe('file');  
            expect(result[0].length).toBe(14);                 // [req-ds-ls-8] (long option)
            expect(typeof result[0].created).toBe('number');   // [req-ds-ls-9] (long option)
            expect(typeof result[0].modified).toBe('number');  // [req-ds-ls-10] (long option)
            expect(Math.abs(result[0].created-result[0].modified)).toBeLessThan(100);  // within 100ms
          });

          test( "[req-ds-ls-8..10] listing a file with the length option resolves with a single item in an array with just name, type and length fields", async () => {
            const result = await dataServer.list(contractAddress, file1, {length: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0]).toBe('object');
            expect(result[0].name).toBe(file1);
            expect(result[0].type).toBe('file');
            expect(result[0].length).toBe(14);           // [req-ds-ls-8]  (length option)
            expect(result[0].created).toBeUndefined();   // [req-ds-ls-9]  (negative test - no long or created option)
            expect(result[0].modified).toBeUndefined();  // [req-ds-ls-10] (negative test - no long or modified option)
          });

          test( "[req-ds-ls-8..10] listing a file with the created option resolves with a single item in an array with just name, type and created fields", async () => {
            const result = await dataServer.list(contractAddress, file1, {created: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0]).toBe('object');
            expect(result[0].name).toBe(file1);
            expect(result[0].type).toBe('file');
            expect(result[0].length).toBeUndefined();         // [req-ds-ls-8]  (negative test - no long or length option)
            expect(typeof result[0].created).toBe('number');  // [req-ds-ls-9]  (created option)
            expect(result[0].modified).toBeUndefined();       // [req-ds-ls-10] (negative test - no long or modified option)
          });

          test( "[req-ds-ls-8..10] listing a file with the modified option resolves with a single item in an array with just name, type and modified fields", async () => {
            const result = await dataServer.list(contractAddress, file1, {modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0]).toBe('object');
            expect(result[0].name).toBe(file1);
            expect(result[0].type).toBe('file');
            expect(result[0].length).toBeUndefined();          // [req-ds-ls-8]  (negative test - no long or length option)
            expect(result[0].created).toBeUndefined();         // [req-ds-ls-9]  (negative test - no long or created option)
            expect(typeof result[0].modified).toBe('number');  // [req-ds-ls-10] (modified option)
          });

          test( "[req-ds-ls-1] [req-ds-ls-8..10] listing a directory with the long option resolves with the correct directory contents", async () => {
            const result = await dataServer.list(contractAddress, dir3, {long: true});
            result.sort((a,b) => a.name.localeCompare(b.name));
            expect(result).toHaveLength(2);
            expect(typeof result[0]).toBe('object');
            expect(result[0].name).toBe(fileAinDir5);
            expect(result[0].type).toBe('file');
            expect(result[0].length).toBe(14);                 // [req-ds-ls-8]  (for file within a directory) 
            expect(typeof result[0].created).toBe('number');   // [req-ds-ls-9]  (for file within a directory)
            expect(typeof result[0].modified).toBe('number');  // [req-ds-ls-10] (for file within a directory)
            expect(Math.abs(result[0].created-result[0].modified)).toBeLessThan(100);  // within 100ms
            expect(typeof result[1]).toBe('object');
            expect(result[1].name).toBe(fileBinDir5);
            expect(result[1].type).toBe('file');
            expect(result[1].length).toBe(17);                 // [req-ds-ls-8]  (for file within a directory) 
            expect(typeof result[1].created).toBe('number');   // [req-ds-ls-9]  (for file within a directory)
            expect(typeof result[1].modified).toBe('number');  // [req-ds-ls-10] (for file within a directory)
            expect(Math.abs(result[1].created-result[1].modified)).toBeLessThan(100);  // within 100ms
          });

        });


        describe("modified files", () => {

          test( "[req-ds-ls-10] [req-ds-ls-11] listing a modified file within the directory shows the length has been updated and the modified time has advanced", async () => {
            const preModList = await dataServer.list(contractAddress, fileAinDir5, {long: true});
            await dataServer.append(contractAddress, fileAinDir5, " with append");
            const postModList = await dataServer.list(contractAddress, fileAinDir5, {long: true});
            expect(preModList[0].name).toBe(fileAinDir5);
            expect(postModList[0].name).toBe(fileAinDir5);
            expect(postModList[0].modified).toBeGreaterThan(preModList[0].modified);  // [req-ds-ls-10] (modification time of file within directory is updated when contents are updated)
          });

          test("[req-ds-ls-12] modifying a file within a directory does not change the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.append(contractAddress, fileAinDir5, " and again");
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBe(originalModified);
          })

          test("[req-ds-ls-12] overwriting a file within a directory does not change the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.write(contractAddress, fileAinDir5, "hello world");
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBe(originalModified);
          })

          test("[req-ds-ls-12] adding a file to a directory changes the directory's modified time", async () => {
            await dataServer.delete(contractAddress, dir3+'/newFile', {silent: true});
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.write(contractAddress, dir3+'/newFile', "testing");
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

          test("[req-ds-ls-12] deleting a file from a directory changes the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.delete(contractAddress, dir3+'/newFile');
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

          test("[req-ds-ls-12] appending to a file within the root directory does not change the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.append(contractAddress, file1, " world");
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBe(originalModified);
          })

          test("[req-ds-ls-12] overwriting a file within the root directory does not change the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.write(contractAddress, file1, "hello world");
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBe(originalModified);
          })

          test("[req-ds-ls-12] adding a file to the root directory changes the directory's modified time", async () => {
            await dataServer.delete(contractAddress, file2, {silent: true});
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.write(contractAddress, file2, "testing");
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

          test("[req-ds-ls-12] adding a directory to the root directory changes the directory's modified time", async () => {
            await dataServer.delete(contractAddress, dir3, {silent: true});
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.mkdir(contractAddress, dir3);
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

          test("[req-ds-ls-12] deleting a file from the root directory changes the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await sleep(2);
            await dataServer.delete(contractAddress, file2);
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

        });


        describe("matches", () => {

          test("[req-ds-ls-19] [req-ds-gen-1] rejects with an INVALID_OPTION bubble error if regex is invalid", async () => {
            await expect(dataServer.list(contractAddress, dir3, {matches: '*.*'}))
              .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION});
          })

          test("[req-ds-ls-19] filters files in a directory based on given regex", async () => {
            await testPoint.writeFile(contractAddress, dir3+'/a.txt', "hello world");
            await testPoint.writeFile(contractAddress, dir3+'/bb.txt', "hello world");
            await testPoint.writeFile(contractAddress, dir3+'/ccc.txt', "hello world");
            await expect(dataServer.list(contractAddress, dir3, {matches: '^.*/[ab]*.txt$'}))
              .resolves.toStrictEqual([
                {name: dir3+'/a.txt', type: 'file'},
                {name: dir3+'/bb.txt', type: 'file'}
              ])
          })

          test("[req-ds-ls-19] filters the root based on given regex", async () => {
            await testPoint.writeFile(contractAddress, file1, "hello world");
            await testPoint.writeFile(contractAddress, file2, "hello world");
            await testPoint.mkdir(contractAddress, dir3, "hello world");
            await expect(dataServer.list(contractAddress, ROOT_PATH, {matches: '.*[13]$'}))
              .resolves.toStrictEqual([
                {name: file1, type: 'file'},
                {name: dir3, type: 'dir'}
              ])
          })

        })


        describe("time filters", () => {

          var fileA, fileB;

          beforeAll(async () => {
            await clearBubble();
            await testPoint.writeFile(contractAddress, dir3+'/a.txt', "hello");
            await sleep(2); // ensure create and modified times are different
            await dataServer.append(contractAddress, dir3+'/a.txt', " world");
            await sleep(2);
            await testPoint.writeFile(contractAddress, dir3+'/b.txt', "hello");
            await sleep(2);
            await dataServer.append(contractAddress, dir3+'/b.txt', " world");
            await sleep(2);
            await testPoint.writeFile(contractAddress, dir3+'/c.txt', "hello");
            await sleep(2);
            await dataServer.append(contractAddress, dir3+'/c.txt', " world");
            fileA = (await dataServer.list(contractAddress, dir3+'/a.txt', {long: true}))[0];
            fileB = (await dataServer.list(contractAddress, dir3+'/b.txt', {long: true}))[0];
          })
              
          test("[req-ds-ls-15] [req-ds-gen-1] rejects with an INVALID_OPTION bubble error if after option is invalid", async () => {
            await expect(dataServer.list(contractAddress, dir3, {after: 'abc'}))
              .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION});
          })

          test("[req-ds-ls-16] [req-ds-gen-1] rejects with an INVALID_OPTION bubble error if before option is invalid", async () => {
            await expect(dataServer.list(contractAddress, dir3, {before: 'abc'}))
              .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION});
          })

          test("[req-ds-ls-17] [req-ds-gen-1] rejects with an INVALID_OPTION bubble error if createdAfter option is invalid", async () => {
            await expect(dataServer.list(contractAddress, dir3, {createdAfter: 'abc'}))
              .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION});
          })

          test("[req-ds-ls-18] [req-ds-gen-1] rejects with an INVALID_OPTION bubble error if createdBefore option is invalid", async () => {
            await expect(dataServer.list(contractAddress, dir3, {createdBefore: 'abc'}))
              .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION});
          })

          describe("filters files modified after the given time", () => {

            test("[req-ds-ls-15] boundary condition: excludes when modified=after", async () => {
             await expect(dataServer.list(contractAddress, dir3, {after: fileA.modified}))
                .resolves.toStrictEqual([
                  {name: dir3+'/b.txt', type: 'file'},
                  {name: dir3+'/c.txt', type: 'file'}
                ])
            })
  
            test("[req-ds-ls-15] boundary condition: includes when modified=after+1", async () => {
              await expect(dataServer.list(contractAddress, dir3, {after: fileA.modified-1}))
                .resolves.toStrictEqual([
                  {name: dir3+'/a.txt', type: 'file'},
                  {name: dir3+'/b.txt', type: 'file'},
                  {name: dir3+'/c.txt', type: 'file'}
                ])
            })
  
          })

          describe("filters files modified before the given time", () => {

            test("[req-ds-ls-16] boundary condition: excludes when modified=before", async () => {
              await expect(dataServer.list(contractAddress, dir3, {before: fileB.modified}))
                .resolves.toStrictEqual([
                  {name: dir3+'/a.txt', type: 'file'}
                ])
            })
  
            test("[req-ds-ls-16] boundary condition: includes when modified=before-1", async () => {
              await expect(dataServer.list(contractAddress, dir3, {before: fileB.modified+1}))
                .resolves.toStrictEqual([
                  {name: dir3+'/a.txt', type: 'file'},
                  {name: dir3+'/b.txt', type: 'file'}
                ])
            })
  
          })

          describe("filters files created after the given time", () => {

            test("[req-ds-ls-17] boundary condition: excludes when created=createdAfter", async () => {
              await expect(dataServer.list(contractAddress, dir3, {createdAfter: fileA.created}))
                .resolves.toStrictEqual([
                  {name: dir3+'/b.txt', type: 'file'},
                  {name: dir3+'/c.txt', type: 'file'}
                ])
            })
  
            test("[req-ds-ls-17] boundary condition: includes when created=createdAfter+1", async () => {
              await expect(dataServer.list(contractAddress, dir3, {createdAfter: fileA.created-1}))
                .resolves.toStrictEqual([
                  {name: dir3+'/a.txt', type: 'file'},
                  {name: dir3+'/b.txt', type: 'file'},
                  {name: dir3+'/c.txt', type: 'file'}
                ])
            })
  
          })

          describe("filters files created before the given time", () => {

            test("[req-ds-ls-18] boundary condition: excludes when created=createdBefore", async () => {
              await expect(dataServer.list(contractAddress, dir3, {createdBefore: fileB.created}))
                .resolves.toStrictEqual([
                  {name: dir3+'/a.txt', type: 'file'}
                ])
            })
  
            test("[req-ds-ls-18] boundary condition: includes when created=createdBefore-1", async () => {
              await expect(dataServer.list(contractAddress, dir3, {createdBefore: fileB.created+1}))
                .resolves.toStrictEqual([
                  {name: dir3+'/a.txt', type: 'file'},
                  {name: dir3+'/b.txt', type: 'file'}
                ])
            })
  
          })

          test("[req-ds-ls-20] multiple filters are applied", async () => {
            await testPoint.writeFile(contractAddress, dir3+'/d.txt', "hello");
            await sleep(2);
            await dataServer.append(contractAddress, dir3+'/d.txt', " world");
            await sleep(2);
            await testPoint.writeFile(contractAddress, dir3+'/e.txt', "hello");
            await sleep(2);
            await dataServer.append(contractAddress, dir3+'/e.txt', " world");
            const fileE = (await dataServer.list(contractAddress, dir3+'/e.txt', {long: true}))[0];
            await expect(dataServer.list(contractAddress, dir3, {createdAfter: fileA.created, before: fileE.modified, matches: '[abde].txt'}))
              .resolves.toStrictEqual([
                {name: dir3+'/b.txt', type: 'file'},
                {name: dir3+'/d.txt', type: 'file'}
              ])
          })
  
        })


      });


      if (options.noSubscriptions !== true) {

        describe("subscribe", () => {

          function checkLongFormListEntry(received, expected) {
            expect(typeof received).toBe('object');
            if (expected.event) expect(received.event).toBe(expected.event);
            expect(received.name).toBe(expected.name);
            expect(received.type).toBe(expected.type);
            // notifications of delete event type don't have any file metadata
            if (expected.event !== 'delete') {
              expect(received.length).toBe(expected.length);  
              expect(typeof received.created).toBe('number');   
              expect(typeof received.modified).toBe('number');
            }
          }

          function checkLongFormList(received, expected) {
            expect(received).toHaveLength(expected.length);
            received.forEach((entry, i) => {
              checkLongFormListEntry(entry, expected[i])
            })
          }

          function checkSubscriptionResponse(subscription, expectedFile) {  // [req-ds-sub-2]
            expect(typeof subscription).toBe('object');  // [req-ds-sub-2] plain object
            expect(subscription.subscriptionId).not.toBeUndefined();  // [req-ds-sub-2] subscriptionId
            checkLongFormListEntry(subscription.file, expectedFile);  // [req-ds-sub-2] file
            expect(subscription.list).toBeUndefined(); // [req-ds-sub-5] [req-ds-sub-7] (negative test - field not included when option not given - file)
            expect(subscription.data).toBeUndefined(); // [req-ds-sub-8] (negative test - field not included when option not given - file)
          }

          describe('basic subscribe functions', () => {

            beforeEach(async () => {
              await clearBubble();
            })
            
            test( "[req-ds-sub-1] [req-ds-sub-2] can subscribe to a file when the file exists", async () => {
              await testPoint.writeFile(contractAddress, file1, "hello world");
              const subscription = await dataServer.subscribe(contractAddress, file1, () => {});
              checkSubscriptionResponse(subscription, {name: file1, type: 'file', length: 11})
            });

            test( "[req-ds-sub-1] [req-ds-sub-2] can subscribe to a directory when it exists", async () => {
              await testPoint.mkdir(contractAddress, dir3);
              const subscription = await dataServer.subscribe(contractAddress, dir3, () => {});
              checkSubscriptionResponse(subscription, {name: dir3, type: 'dir', length: 0})
              expect(subscription.list).toBeUndefined(); // [req-ds-sub-5] [req-ds-sub-7] (negative test - field not included when option not given - directory)
              expect(subscription.data).toBeUndefined(); // [req-ds-sub-8] (negative test - field not included when option not given - directory)
            });

            test( "[req-ds-sub-1] [req-ds-sub-2] can subscribe to the root directory", async () => {
              const subscription = await dataServer.subscribe(contractAddress, ROOT_PATH, () => {});
              checkSubscriptionResponse(subscription, {name: ROOT_PATH, type: 'dir', length: 0})
              expect(subscription.list).toBeUndefined(); // [req-ds-sub-5] [req-ds-sub-7] (negative test - field not included when option not given - root)
              expect(subscription.data).toBeUndefined(); // [req-ds-sub-8] (negative test - field not included when option not given - root)
            });

            test( "[req-ds-sub-5] includes the directory listing if the `list` option is given", async () => {
              await testPoint.mkdir(contractAddress, dir3);
              await testPoint.writeFile(contractAddress, dir3+'/a.txt', "hello a");
              await testPoint.writeFile(contractAddress, dir3+'/b.pdf', "hello b");
              const subscription = await dataServer.subscribe(contractAddress, dir3, () => {}, {list: true});
              expect(typeof subscription).toBe('object');
              expect(subscription.subscriptionId).not.toBeUndefined();
              checkLongFormList(subscription.list, [  // [req-ds-sub-5]
                {name: dir3+'/a.txt', type: 'file', length: 7},
                {name: dir3+'/b.pdf', type: 'file', length: 7}
              ])
            });

          })


          describe("includes the directory listing if the `since` option is given", () => {

            let fileA;

            beforeEach(() => {})

            beforeAll(async () => {
              await testPoint.writeFile(contractAddress, dir3+'/a.txt', "hello");
              await sleep(2); // ensure create and modified times are different
              await dataServer.append(contractAddress, dir3+'/a.txt', " world");
              await sleep(2);
              await testPoint.writeFile(contractAddress, dir3+'/b.txt', "hello");
              fileA = (await dataServer.list(contractAddress, dir3+'/a.txt', {long: true}))[0];
            })
                
            test( "[req-ds-sub-7] boundary condition: includes when created=since but modified=since+1", async () => {
              const subscription = await dataServer.subscribe(contractAddress, dir3, () => {}, {since: fileA.created});
              expect(typeof subscription).toBe('object');
              expect(subscription.subscriptionId).not.toBeUndefined();
              checkLongFormList(subscription.list, [
                {name: dir3+'/a.txt', type: 'file', length: 11},
                {name: dir3+'/b.txt', type: 'file', length: 5}
              ])
            });
        
            test( "[req-ds-sub-7] boundary condition: includes when modified=since+1", async () => {
              const subscription = await dataServer.subscribe(contractAddress, dir3, () => {}, {since: fileA.modified-1});
              expect(typeof subscription).toBe('object');
              expect(subscription.subscriptionId).not.toBeUndefined();
              checkLongFormList(subscription.list, [
                {name: dir3+'/a.txt', type: 'file', length: 11},
                {name: dir3+'/b.txt', type: 'file', length: 5}
              ])
            });
        
            test( "[req-ds-sub-7] boundary condition: excludes when modified=since", async () => {
              const subscription = await dataServer.subscribe(contractAddress, dir3, () => {}, {since: fileA.modified});
              expect(typeof subscription).toBe('object');
              expect(subscription.subscriptionId).not.toBeUndefined();
              checkLongFormList(subscription.list, [
                {name: dir3+'/b.txt', type: 'file', length: 5}
              ])
            });
        
          })

          test( "[req-ds-sub-8] includes file contents when the `read` option is given", async () => {
            await testPoint.writeFile(contractAddress, file1, "hello world");
            const subscription = await dataServer.subscribe(contractAddress, file1, () => {}, {read: true});
            expect(typeof subscription).toBe('object');
            expect(subscription.subscriptionId).not.toBeUndefined();
            expect(subscription.data).toBe('hello world');
          });

          describe('[req-ds-sub-9] notifications', () => {

            function checkNotification(received, expected) {
              expect(typeof received).toBe('object');  // [req-ds-sub-17]
              expect(received.subscriptionId).toBe(expected.subscriptionId);  // [req-ds-sub-18]
              expect(received.event).toBe(expected.event);  // [req-ds-sub-19]
              if (expected.event === 'delete') expect(JSON.stringify(received.file)).toBe(JSON.stringify(expected.file));  // [req-ds-sub-21]
              else checkLongFormListEntry(received.file, expected.file);  // [req-ds-sub-20]
              if (Array.isArray(expected.data)) checkLongFormList(received.data, expected.data);  // [req-ds-sub-23]
              else expect(received.data).toBe(expected.data);   // [req-ds-sub-22]
            }
        
            beforeEach(async () => {
              await clearBubble();
            })
            
            test( "[req-ds-sub-10] the client is notified of a file write", async () => {
              await testPoint.writeFile(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, file1, listener);
              await dataServer.write(contractAddress, file1, "hello world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'write', 
                  file: {name: file1, type: 'file', length: 11}, 
                  data: 'hello world'
                })
            });

            test( "[req-ds-sub-6] the data field is omitted from a write event if the list option is given", async () => {
              await testPoint.writeFile(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, file1, listener, {list: true});
              await dataServer.write(contractAddress, file1, "hello world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'write', 
                  file: {name: file1, type: 'file', length: 11}, 
                  data: undefined
                })
            });

            test( "[req-ds-sub-11] the client is notified of a file append", async () => {
              await testPoint.writeFile(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, file1, listener);
              await dataServer.append(contractAddress, file1, " world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'append', 
                  file: {name: file1, type: 'file', length: 11}, 
                  data: ' world'
                })
            });

            test( "[req-ds-sub-6] the data field is omitted from an append event if the list option is given", async () => {
              await testPoint.writeFile(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, file1, listener, {list: true});
              await dataServer.append(contractAddress, file1, " world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'append', 
                  file: {name: file1, type: 'file', length: 11}, 
                  data: undefined
                })
            });

            test( "[req-ds-sub-12] the client is notified of a file delete", async () => {
              await testPoint.writeFile(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, file1, listener);
              await dataServer.delete(contractAddress, file1);
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'delete', 
                  file: {name: file1, type: 'file'}, 
                  data: undefined
                })
              });

            test( "[req-ds-sub-13] the client is notified of an update to a subscribed root due to an mkdir", async () => {
              await dataServer.write(contractAddress, file1, "extra");  // pre-add extra file to ensure it is not included in notification
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, ROOT_PATH, listener);
              await dataServer.mkdir(contractAddress, dir3);
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: ROOT_PATH, type: 'dir', length: 2}, 
                  data: [{event: 'mkdir', name: dir3, type: 'dir', length: 0}]  // [req-ds-sub-13]
                })
            });

            test( "[req-ds-sub-14] the client is notified of an update to the ROOT_PATH due to a file write", async () => {
              await dataServer.write(contractAddress, file1, "extra");  // pre-add extra file to ensure it is not included in notification
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, ROOT_PATH, listener);
              await dataServer.write(contractAddress, file1, 'Hello World');
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: ROOT_PATH, type: 'dir', length: 1}, 
                  data: [{event: 'write', name: file1, type: 'file', length: 11}]  // [req-ds-sub-14] ROOT_PATH
                })
            });

            test( "[req-ds-sub-14] the client is notified of an update to a subscribed directory due to a file write", async () => {
              await dataServer.mkdir(contractAddress, dir3);
              await dataServer.write(contractAddress, dir3+'/extra-file', "extra");  // pre-add extra file to ensure it is not included in notification
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, dir3, listener);
              await dataServer.write(contractAddress, fileInDir3, "hello world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: dir3, type: 'dir', length: 2}, 
                  data: [{event: 'write', name: fileInDir3, type: 'file', length: 11}]  // [req-ds-sub-14] Directory
                })
            });

            test( "[req-ds-sub-15] the client is notified of an update to the ROOT_PATH due to a file append", async () => {
              await dataServer.write(contractAddress, file2, "extra");  // pre-add extra file to ensure it is not included in notification
              await dataServer.write(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, ROOT_PATH, listener);
              await dataServer.append(contractAddress, file1, " world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: ROOT_PATH, type: 'dir', length: 2}, 
                  data: [{event: 'append', name: file1, type: 'file', length: 11}]  // [req-ds-sub-15] ROOT_PATH
                })
            });

            test( "[req-ds-sub-15] the client is notified of an update to a subscribed directory due to a file append", async () => {
              await dataServer.mkdir(contractAddress, dir3);
              await dataServer.write(contractAddress, dir3+'/extra-file', "extra");  // pre-add extra file to ensure it is not included in notification
              await dataServer.write(contractAddress, fileInDir3, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, dir3, listener);
              await dataServer.append(contractAddress, fileInDir3, " world");
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: dir3, type: 'dir', length: 2}, 
                  data: [{event: 'append', name: fileInDir3, type: 'file', length: 11}]  // [req-ds-sub-15] Directory
                })
            });

            test( "[req-ds-sub-16] the client is notified of an update to the ROOT_PATH due to a file delete", async () => {
              await dataServer.write(contractAddress, file2, "extra");  // pre-add extra file to ensure it is not included in notification
              await dataServer.write(contractAddress, file1, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, ROOT_PATH, listener);
              await dataServer.delete(contractAddress, file1);
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: ROOT_PATH, type: 'dir', length: 1}, 
                  data: [{event: 'delete', name: file1, type: 'file'}]  // [req-ds-sub-16] ROOT_PATH
                })
            });

            test( "[req-ds-sub-16] the client is notified of an update to a subscribed directory due to a file delete", async () => {
              await dataServer.mkdir(contractAddress, dir3);
              await dataServer.write(contractAddress, dir3+'/extra-file', "extra");  // pre-add extra file to ensure it is not included in notification
              await dataServer.write(contractAddress, fileInDir3, "hello");
              const listener = jest.fn();
              const subscription = await dataServer.subscribe(contractAddress, dir3, listener);
              await dataServer.delete(contractAddress, fileInDir3);
              expect(listener.mock.calls).toHaveLength(1);
              checkNotification(listener.mock.calls[0][0], 
                {
                  subscriptionId: subscription.subscriptionId, 
                  event: 'update', 
                  file: {name: dir3, type: 'dir', length: 1}, 
                  data: [{event: 'delete', name: fileInDir3, type: 'file'}]  // [req-ds-sub-16] Directory
                })
            });

            test( "[req-ds-sub-9] basic negative test: check notifications are not sent when not expected", async () => {
              await dataServer.write(contractAddress, file1, "hello world");
              await dataServer.mkdir(contractAddress, dir3);
              const listener = jest.fn();
              await dataServer.subscribe(contractAddress, file1, listener);
              await dataServer.subscribe(contractAddress, dir3, listener);
              await dataServer.write(contractAddress, file2, "hello world");
              expect(listener.mock.calls).toHaveLength(0);
            });

          })

        })


  //
  // Requirements:
  //
  //   [req-ds-sub-1] When called, the data server shall unsubscribe the given subscription id.
  //              
  //   [req-ds-sub-2] The data server shall resolve if the unsubscribe was successful.
  //
  //   [req-ds-sub-3] The data server shall resolve even if the subscription does not exist.
  //
      describe('unsubscribe', () => {

        beforeEach(async () => {
          await clearBubble();
        })
        
        test( "[req-ds-unsub-1] [req-ds-unsub-2] unsubscribe resolves when the subscription is open and stops notifying the listener", async () => {
          const listener = jest.fn();
          await dataServer.write(contractAddress, file1, "hello");
          const subscription = await dataServer.subscribe(contractAddress, file1, listener);
          expect(listener.mock.calls).toHaveLength(0);
          await dataServer.write(contractAddress, file1, "hello world");
          expect(listener.mock.calls).toHaveLength(1);
          expect(dataServer.unsubscribe(subscription.subscriptionId)).resolves.not.toThrow();
          await dataServer.write(contractAddress, file1, "hello world again");
          expect(listener.mock.calls).toHaveLength(1);
        });

        test( "[req-ds-unsub-3] resolves even if subscription does not exist", async () => {
          expect(dataServer.unsubscribe('non-existent subscription')).resolves.not.toThrow();
        });

      })

      }


      describe("terminate", () => {

        beforeAll( async () => {
          if (options.terminateContract) await options.terminateContract();
        })
  
        test( "[req-ds-tm-1] [req-ds-tm-2] succeeds when bubble exists", async () => {
          await expect(dataServer.terminate(contractAddress)).resolves.not.toThrow();
        });
  
        test( "[req-ds-tm-3] fails with BUBBLE_DOES_NOT_EXIST error if bubble does not exist", async () => {
          await expect(dataServer.terminate(contractAddress))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST});
        });
  
        test( "[req-ds-tm-4] does not fail when bubble does not exist but the silent option is given", async () => {
          await expect(dataServer.terminate(contractAddress, {silent: true})).resolves.not.toThrow();
        });
  
      })
  
    }) // when bubble exists

  })

}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

