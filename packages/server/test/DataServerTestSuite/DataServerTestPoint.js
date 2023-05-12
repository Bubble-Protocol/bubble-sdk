// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { TestPoint } from './TestPoint.js';
import { ErrorCodes } from '@bubble-protocol/core';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';

/**
 * Implements `TestPoint` using the DataServer itself to provide the test point capabilities.
 * Requires minimal features to be implemented in the DataServer.  See README.md
 */
export class DataServerTestPoint extends TestPoint {

  constructor(dataServer) {
    super();
    this.dataServer = dataServer;
  }

  async createBubble(contract) {
    // Return a `Promise` to create a bubble with the given id
    // DO NOT reject if the bubble already exists
    return this.dataServer.create(contract)
      .catch(err => {
        if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS) return;
        else throw err;
      })
  }

  async deleteFile(contract, file) {
    // Return a `Promise` to delete the given file or directory, including any contents of the directory 
    // DO NOT reject if the file or directory does not exist
    // The `file` parameter is the `file` field from the file's `ContentId` - a string.
    return this.dataServer.delete(contract, file)
      .catch(err => {
        if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) return;
        else throw err;
      })
  }

  async writeFile(contract, file, data) {
    // Return a `Promise` to write the given data string to the given file 
    // If the file is in a directory then create the directory if it doesn't already exist
    return this.dataServer.write(contract, file, data);
  }

  async readFile(contract, file) {
    // Return a `Promise` to resolve (as a string) the contents of the given file
    // Reject with a BubbleError with code BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST (see core/ErrorCodes) 
    // if the file does not exist.
    return this.dataServer.read(contract, file);
  }

  async mkdir(contract, file) {
    // Return a `Promise` to make the given directory 
    // DO NOT reject if the directory already exists
    return this.dataServer.mkdir(contract, file)
      .catch(err => {
        if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS) return;
        else throw err;
      })
  }

  async assertExists(contract, file) {
    // Return a `Promise` to resolve if the file or directory exists or reject if it doesn't.
    return new Promise((resolve, reject) => {
      this.dataServer.list(contract, file)
        .then(() => resolve())
        .catch(err => {
          if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) reject();
          else reject(err);
        })
    })
  }

  async assertNotExists(contract, file) {
    // Return a `Promise` to resolve if the file or directory does not exist or reject if it does.
    return new Promise((resolve, reject) => {
      this.dataServer.list(contract, file)
        .then(() => reject())
        .catch(err => {
          if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) resolve();
          else reject(err);
        })
    })
  }

}