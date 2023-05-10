
// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

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
            await dataServer.append(contractAddress, fileAinDir5, " and again");
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
            await dataServer.delete(contractAddress, dir3+'/newFile');
            var result = await dataServer.list(contractAddress, dir3, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

          test("[req-ds-ls-12] modifying a file within the root directory does not change the directory's modified time", async () => {
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            const originalModified = result[0].modified;
            expect(typeof originalModified).toBe('number');
            await dataServer.append(contractAddress, file1, " world");
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
            await dataServer.write(contractAddress, file2, "testing");
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
            await dataServer.delete(contractAddress, file2);
            var result = await dataServer.list(contractAddress, ROOT_PATH, {directoryOnly: true, modified: true});
            expect(result).toHaveLength(1);
            expect(typeof result[0].modified).toBe('number');
            expect(result[0].modified).toBeGreaterThan(originalModified);
          })

        });

          // TODO list matches filter on directory
          // TODO list before, after tests
          // TODO terminate
          // TODO attacks?  (send empty request)


      });

    });



  });

}