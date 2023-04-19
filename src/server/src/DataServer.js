// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * Interface for a Bubble server.
 * 
 * Implement this class and pass to a Guardian.  Client requests will only be passed to this 
 * DataServer if they are valid and the user has the appropriate permissions.
 */
export class DataServer {

  /**
   * Unconditionally create a bubble.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply (@see core/errors.js for error codes)
   */
  create(contract, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }
  
  /**
   * Unconditionally write the given data to the given file, overwriting if it exists.
   * Create the directory if it doesn't exist.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file path to write
   * @param {String} data the data to write
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply (@see core/errors.js for error codes)
   */
  write(contract, file, data, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

  /**
   * Unconditionally append the given data to the given file, creating it if it doesn't exist.
   * Create the directory if it doesn't exist.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file path to append
   * @param {String} data the data to append
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply (@see core/errors.js for error codes)
   */
  append(contract, file, data, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

  /**
   * Read the given file or directory and return it's content.  If a directory then this is the
   * same as `list`.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file path to read
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to return the file contents as a string or the directory listing.
   * @throws Rejects with a BubbleError if unable to comply or the file does not exist 
   *   (@see core/errors.js for error codes)
   */
  read(contract, file, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

  /**
   * Unconditionally delete a file or directory.  By default a directory can only be deleted if
   * it is empty.  Implement a `{force: true}` option to delete a non-empty directory.
   * 
   * Note, delete of the root directory is not permitted and will be rejected by the guardian.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file or directory to delete
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply or the file does not exist 
   *   (@see core/errors.js for error codes)
   */
  delete(contract, file, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

  /**
   * Unconditionally create a directory.
   * 
   * Note, mkdir of the root directory is not permitted and will be rejected by the guardian.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the directory to create
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply or the directory already exists 
   *   (@see core/errors.js for error codes)
   */
  mkdir(contract, file, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

  /**
   * List a file or directory.  Equivalent to the POSIX `ls` command.
   * 
   * Note, list of the root directory must be supported.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file or directory to list
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request and return an array object with each element
   *   being an Object representing a file.  See below for the Object fields.
   * @throws Rejects with a BubbleError if unable to comply or the directory already exists 
   *   (@see core/errors.js for error codes)
   * 
   * Mandatory fields:
   *   name: {string} filename (excluding directory prefix)
   *   directory: {boolean} false if a file, true if a directory
   * 
   * Optional fields (@see Options below):
   *   length: {Number} length of the file in bytes or the number of files within if a directory
   *   created: {Number} UNIX timestamp of when the file or directory was created
   *   modified: {Number} UNIX timestamp of when the file or directory was last modified
   * 
   * Options:
   *   long: {boolean} long format - include all fields
   *   <field>: {boolean} include the optional field `<field>`
   *   after: {Number} include only files and directories with a modification time later than this 
   *   before: {Number} include only files and directories with a modification time earlier than this 
   *   created-after: {Number} include only files and directories with a creation time later than this 
   *   created-before: {Number} include only files and directories with a creation time earlier than this 
   */
  list(contract, file, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

  /**
   * Unconditionally delete a bubble and all it's files.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply (@see core/errors.js for error codes)
   */
  terminate(contract, options) {
    return Promise.reject("DataServer is a virtual function and must be implemented")
  }

}
