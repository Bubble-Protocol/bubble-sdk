// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ErrorCodes } from '@bubble-protocol/core';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';

export class TestPoint {

  async createBubble(contract) {
    // Return a `Promise` to create a bubble with the given id
    // DO NOT reject if the bubble already exists
    return Promise.reject("TestPoint.createBubble is a virtual function and must be implemented")
  }

  async deleteFile(contract, file) {
    // Return a `Promise` to delete the given file or directory, including any contents of the directory 
    // DO NOT reject if the file or directory does not exist
    // The `file` parameter is the `file` field from the file's `ContentId` - a string.
    return Promise.reject("TestPoint.deleteFile is a virtual function and must be implemented")
  }

  async writeFile(contract, file, data) {
    // Return a `Promise` to write the given data string to the given file 
    // If the file is in a directory then create the directory if it doesn't already exist
    return Promise.reject("TestPoint.writeFile is a virtual function and must be implemented")
  }

  async readFile(contract, file) {
    // Return a `Promise` to resolve (as a string) the contents of the given file
    // Reject with a BubbleError with code BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST (see core/ErrorCodes) 
    // if the file does not exist.
    return Promise.reject("TestPoint.readFile is a virtual function and must be implemented")
  }

  async mkdir(contract, file) {
    // Return a `Promise` to make the given directory 
    // DO NOT reject if the directory already exists
    return Promise.reject("TestPoint.mkdir is a virtual function and must be implemented")
  }

  async assertExists(contract, file) {
    // Return a `Promise` to resolve if the file or directory exists or reject if it doesn't.
    return Promise.reject("TestPoint.assertExists is a virtual function and must be implemented")
  }

  async assertNotExists(contract, file) {
    // Return a `Promise` to resolve if the file or directory does not exist or reject if it does.
    return Promise.reject("TestPoint.assertNotExists is a virtual function and must be implemented")
  }

  async runTests(options={}) {

    describe("TestPoint tests", () => {

      var contractAddress;

      const file1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const file5 = "0x0000000000000000000000000000000000000000000000000000000000000005";
      const fileInDir5 = file5+'/test1';
          
      beforeAll(() => {
        contractAddress = options.contractAddress || "0x000000000000000000000000000000abcd000000000000000000000000000000";
      })

      test( "create is available", async () => {
        await expect(this.createBubble(contractAddress)).resolves.not.toThrow();
      });

      describe("for a simple file", () => {

        test( "write does not reject", async () => {
          await expect(this.writeFile(contractAddress, file1, "test")).resolves.not.toThrow();
        });

        test( "read resolves the written data", async () => {
          await expect(this.readFile(contractAddress, file1)).resolves.toBe("test");
        });

        test( "assertExists resolves for file that exists", async () => {
          await expect(this.assertExists(contractAddress, file1)).resolves.not.toThrow();
        });

        test( "assertExists rejects for file that does not exist", async () => {
          await expect(this.assertExists(contractAddress, file5)).rejects.not.toThrow();
        });

        test( "assertNotExists resolves for file that does not exist", async () => {
          await expect(this.assertNotExists(contractAddress, file5)).resolves.not.toThrow();
        });

        test( "assertNotExists rejects for file that does exist", async () => {
          await expect(this.assertNotExists(contractAddress, file1)).rejects.not.toThrow();
        });

        test( "delete deletes a file that exists and resolves", async () => {
          await expect(this.deleteFile(contractAddress, file1)).resolves.not.toThrow();
          await expect(this.assertNotExists(contractAddress, file1)).resolves.not.toThrow();
        });

        test( "delete does not reject if the file does not exist", async () => {
          await expect(this.deleteFile(contractAddress, file1)).resolves.not.toThrow();
        });

        test( "read rejects with a FILE_DOES_NOT_EXIST error if the file does not exist", async () => {
          await expect(this.readFile(contractAddress, file1))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
        });

      });


      describe("for a directory", () => {

        test( "mkdir creates a directory", async () => {
          await expect(this.assertNotExists(contractAddress, file5)).resolves.not.toThrow();
          await expect(this.mkdir(contractAddress, file5)).resolves.not.toThrow();
          await expect(this.assertExists(contractAddress, file5)).resolves.not.toThrow();
        });

        test( "delete can delete an empty directory", async () => {
          await expect(this.deleteFile(contractAddress, file5)).resolves.not.toThrow();
          await expect(this.assertNotExists(contractAddress, file5)).resolves.not.toThrow();
        });

      });


      describe("for a file in a directory", () => {

        test( "write does not reject", async () => {
          await expect(this.writeFile(contractAddress, fileInDir5, "test dir")).resolves.not.toThrow();
        });

        test( "read resolves the written data", async () => {
          await expect(this.readFile(contractAddress, fileInDir5)).resolves.toBe("test dir");
        });

        test( "assertExists resolves for file in a directory", async () => {
          await expect(this.assertExists(contractAddress, fileInDir5)).resolves.not.toThrow();
        });

        test( "assertExists rejects for file that does not exist", async () => {
          await expect(this.assertExists(contractAddress, file5+'/noFile')).rejects.not.toThrow();
        });

        test( "assertNotExists resolves for file that does not exist", async () => {
          await expect(this.assertNotExists(contractAddress, file5+'/noFile')).resolves.not.toThrow();
        });

        test( "assertNotExists rejects for file that does exist", async () => {
          await expect(this.assertNotExists(contractAddress, fileInDir5)).rejects.not.toThrow();
        });

        test( "delete deletes a file in a directory and does not delete the directory", async () => {
          await expect(this.deleteFile(contractAddress, fileInDir5)).resolves.not.toThrow();
          await expect(this.assertNotExists(contractAddress, fileInDir5)).resolves.not.toThrow();
          await expect(this.assertExists(contractAddress, file5)).resolves.not.toThrow();
        });

        test( "delete does not reject if the file does not exist", async () => {
          await expect(this.deleteFile(contractAddress, fileInDir5)).resolves.not.toThrow();
        });

        test( "read rejects with a FILE_DOES_NOT_EXIST error if the file does not exist", async () => {
          await expect(this.readFile(contractAddress, fileInDir5))
            .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
        });

        test( "delete deletes a directory and its contents", async () => {
          await expect(this.writeFile(contractAddress, fileInDir5, "test dir")).resolves.not.toThrow();
          await expect(this.deleteFile(contractAddress, file5)).resolves.not.toThrow();
          await expect(this.assertNotExists(contractAddress, fileInDir5)).resolves.not.toThrow();
          await expect(this.assertNotExists(contractAddress, file5)).resolves.not.toThrow();
        });

      });

    })
  }

}