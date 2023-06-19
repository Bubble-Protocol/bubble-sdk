// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

// TODO Make sure all requirements on the implementator are given for each method.

/**
 * Interface for a Bubble server.
 * 
 * Implement this class and pass to a Guardian.  Client requests will only be passed to this 
 * DataServer if they are valid and the user has the appropriate permissions.
 */
 // 
 // General Requirements:
 //
 //   [req-ds-gen-1] The data server shall reject any method call with an `INVALID_OPTION` error if it
 //                  detects the user has passed an invalid option.
 //
 // Notes:
 //
 //   1) A DataServer is protected by a Guardian.  The guardian enforces all access permissions and will only
 //      call the DataServer methods if the user has the appropriate permissions.  Therefore, the implementor
 //      must unconditionally service each method call and only reject if the requirements explicitly state it
 //      or the call could not be serviced due to an internal problem with the DataServer.
 //
 //   2) Where these requirements refer to rejecting with an error, this should be interpreted as a BubbleError.
 //      The error code given in these requirements is found in `@bubble-protocol/core/ErrorCodes` with a prefix
 //      of `BUBBLE_SERVER_ERROR_`.
 //
 //   3) For user-defined errors, please use the BubbleError class and either the BUBBLE_SERVER_INTERNAL_ERROR
 //      code or your own codes in the range reserved for user-defined data server errors (see 
 //      `@bubble-protocol/core/errors.js`).
 //
 //   4) Each method's `options` parameter is passed unfiltered from the client.  Implementors are free to add
 //      any additional options that suit the data storage service being provided.
 //
export class DataServer {

  /**
   * Unconditionally create a bubble.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply (@see core/errors.js for error codes)
   * 
   * Options:
   *   silent: {boolean} do not reject if the bubble already exists
   */
  //
  // Requirements:
  //
  //   [req-ds-cr-1] When called, the data server shall create the bubble uniquely identified by the contract address.
  //
  //   [req-ds-cr-2] The data server shall resolve if the creation was successful.
  //
  //   [req-ds-cr-3] The data server shall reject with a `BUBBLE_ALREADY_EXISTS` error if the 
  //                 bubble already exists and the silent option is NOT given.
  //
  //   [req-ds-cr-4] The data server shall resolve if the bubble already exists but the silent option is given.
  //
  create(contract, options) {
    return Promise.reject("DataServer.create is a virtual function and must be implemented")
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
  //
  // Requirements:
  //
  //   [req-ds-wr-1] When called, the data server shall unconditionally write the given data to the given file 
  //                 within the bubble, overwriting it if the file exists.
  //
  //   [req-ds-wr-2] The data server shall resolve if the write was successful.
  //
  //   [req-ds-wr-3] When the file has a path extension, the data server shall make the parent directory if it 
  //                 does not exist.
  //
  //   [req-ds-wr-4] The data server shall reject with a `BUBBLE_DOES_NOT_EXIST` error if the 
  //                 bubble does not exist on the server (regardless of any `silent` option).
  //
  write(contract, file, data, options) {
    return Promise.reject("DataServer.write is a virtual function and must be implemented")
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
  //
  // Requirements:
  //
  //   [req-ds-ap-1] When called, the data server shall unconditionally append the given data to the given file 
  //                 within the bubble, creating the file if it does not exist.
  //
  //   [req-ds-ap-2] The data server shall resolve if the append was successful.
  //
  //   [req-ds-ap-3] When the file has a path extension, the data server shall make the parent directory if it 
  //                 does not exist.
  //
  //   [req-ds-ap-4] The data server shall reject with a `BUBBLE_DOES_NOT_EXIST` error if the 
  //                 bubble does not exist on the server (regardless of any `silent` option).
  //
  append(contract, file, data, options) {
    return Promise.reject("DataServer.append is a virtual function and must be implemented")
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
   * 
   * Options:
   *   silent: {boolean} do not reject if the file does not exist (empty string returned)
   */
  //
  // Requirements:
  //
  //   [req-ds-rd-1] When called, the data server shall resolve with the contents of the given file.  (Note,
  //                 the Guardian will not call this method if the file is a directory, it will call `list` 
  //                 instead)
  //              
  //   [req-ds-rd-2] The data server shall reject with a FILE_DOES_NOT_EXIST error if the 
  //                 file does not exist and the silent option is NOT given.
  //
  //   [req-ds-rd-3] The data server shall resolve with the empty string if the file does not exist but the 
  //                 silent option is given.
  //
  //   [req-ds-rd-4] The data server shall reject with a BUBBLE_DOES_NOT_EXIST error if the 
  //                 bubble does not exist on the server (regardless of any `silent` option).
  //
  read(contract, file, options) {
    return Promise.reject("DataServer.read is a virtual function and must be implemented")
  }

  /**
   * Unconditionally delete a file or directory.
   * 
   * Note, delete of the root directory is not permitted and will be rejected by the guardian.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file or directory to delete
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply or the file does not exist 
   *   (@see core/errors.js for error codes)
   * 
   * Options:
   *   silent: {boolean} do not reject if the file does not exist
   */
  //
  // Requirements:
  //
  //   [req-ds-dl-1] When called, the data server shall unconditionally delete the given file or directory 
  //                 from the bubble.
  //
  //   [req-ds-dl-2] When deleting a directory, the data server shall, by default, also delete it's contents.
  //
  //   [req-ds-dl-3] The data server shall resolve if the deletion was successful.
  //
  //   [req-ds-dl-4] The data server shall reject with a FILE_DOES_NOT_EXIST error if the 
  //                 file or directory does not exist and the silent option is NOT given.
  //
  //   [req-ds-dl-5] The data server shall resolve if the file does not exist but the silent option is 
  //                 given.
  //
  //   [req-ds-dl-6] The data server shall reject with a `BUBBLE_DOES_NOT_EXIST` error if the 
  //                 bubble does not exist on the server (regardless of any `silent` option).
  //
  delete(contract, file, options) {
    return Promise.reject("DataServer.delete is a virtual function and must be implemented")
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
   * 
   * Options:
   *   silent: {boolean} do not reject if the directory already exists
   */
  //
  // Requirements:
  //
  //   [req-ds-mk-1] When called, the data server shall unconditionally make the given directory. 
  //                 (Note, since a data server may not use an underlying file system - it might
  //                 use a database, for example - making a directory here might simply mean
  //                 recording it's creation date for use with the `list` method).
  //
  //   [req-ds-mk-2] The data server shall resolve if the make was successful.
  //
  //   [req-ds-mk-3] The data server shall reject with a DIR_ALREADY_EXISTS error if the 
  //                 directory does not exist and the silent option is NOT given.
  //
  //   [req-ds-mk-4] The data server shall resolve if the directory exists but the silent option
  //                 is given.
  //
  //   [req-ds-mk-5] The data server shall reject with a `BUBBLE_DOES_NOT_EXIST` error if the 
  //                 bubble does not exist on the server (regardless of any `silent` option).
  //
  mkdir(contract, file, options) {
    return Promise.reject("DataServer.mkdir is a virtual function and must be implemented")
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
   *   type: {string} 'file' or 'dir'
   * 
   * Optional fields (@see Options below):
   *   length: {Number} length of the file in bytes or the number of files within if a directory
   *   created: {Number} UNIX timestamp of when the file or directory was created
   *   modified: {Number} UNIX timestamp of when the file or directory was last modified
   * 
   * Options:
   *   silent: {boolean} do not reject if the file does not exist
   *   matches {string} include only files whose name matches the given regular expression.
   *   long: {boolean} long format - include all fields
   *   <field>: {boolean} include the optional field `<field>`
   *   after: {Number} include only files and directories with a modification time later than this 
   *   before: {Number} include only files and directories with a modification time earlier than this 
   *   createdAfter: {Number} include only files and directories with a creation time later than this 
   *   createdBefore: {Number} include only files and directories with a creation time earlier than this
   *   directoryOnly: {boolean} if file is a directory, just list the directory itself not its contents (like `ls -d`)
   */
  //
  // Requirements:
  //
  //   [req-ds-ls-1] When called, the data server shall resolve with an array containing the listing of the given 
  //                 file or directory, with an entry for each sub-file if the given file is a directory (see
  //                 requirements [req-ds-ls-5] onwards)
  //              
  //   [req-ds-ls-2] The data server shall reject with a FILE_DOES_NOT_EXIST error if the file or directory
  //                 does not exist and the silent option is NOT given.
  //
  //   [req-ds-ls-3] The data server shall resolve with an empty array if the file does not exist but the silent 
  //                 option is given.
  //
  //   [req-ds-ls-4] The data server shall reject with a `BUBBLE_DOES_NOT_EXIST` error if the 
  //                 bubble does not exist on the server (regardless of any `silent` option).
  //
  // Listing Format:
  //
  //   Example bubble directory structure referred to in the requirements:
  //
  //   ```
  //   ROOT_PATH
  //    |- 0x0000..0001   (file)
  //    |- 0x0000..0002   (file)
  //    |- 0x0000..0003   (dir)
  //        |- fileA.txt
  //        |- fileB.mp4
  //   ```
  //
  //   [req-ds-ls-5] The type of each listing entry shall be a plain object.
  //
  //   [req-ds-ls-6] Each entry shall contain a `name` field (type `string`) with the name of the file or directory 
  //                 as it would be presented in the file's content id - i.e. <file-or-directory-id>[/path-extension].
  //                   Example: `name: '0x0000..0003/fileA.txt'`
  //
  //   [req-ds-ls-7] Each entry shall contain a `type` field (type `string`) indicating whether it is a file or 
  //                 directory - either 'file' or 'dir'.
  //                   Example: `type: 'file'`
  //
  //   [req-ds-ls-8] If the `long` and/or `length` option is given, each entry shall contain a `length` field (type 
  //                 `number`) with the length of the file in bytes, or, if the file is a directory, the number of 
  //                 files within the directory.
  //                   Example: `length: 72387467`
  //
  //   [req-ds-ls-9] If the `long` and/or `created` option is given, each entry shall contain a `created` field (type 
  //                 `number`) with the integer UNIX timestamp (in milliseconds) of the time the file or directory was 
  //                 first created on the server.
  //                   Example: `created: 1683455053023`
  //
  //   [req-ds-ls-10] If the `long` and/or `modified` option is given, each entry shall contain a `modified` field (type 
  //                  `number`) with the integer UNIX timestamp (in milliseconds) of the time the file or directory
  //                  contents was last modified on the server.
  //                   Example: `modified: 1683455053023`
  //
  //   [req-ds-ls-11] A file is considered `modified` if it's contents are changed.
  //
  //   [req-ds-ls-12] A directory (including the bubble's ROOT_PATH) is considered `modified` if any new files are added
  //                  or deleted (not when files are modified). 
  //
  //   [req-ds-ls-13] If the file is a directory and the `directoryOnly` option is given, the listing shall contain
  //                  only the entry for the directory itself, not it's contents.  (Note, i.e. this is equivalent to 
  //                  `ls -d` on a unix system).
  //                    Example: `[{ name: '0x0000..0003', type: 'dir', length: 2, ... }]`
  //
  //   [req-ds-ls-14] If the file is the bubble's root directory (as given by the special file id in
  //                  `@bubble-protocol/core/ROOT_PATH`), the data server shall interpret this as a request to list the 
  //                  bubble's root directory.  (I.e., unless [req-ds-ls-13] applies, list all files and directories in 
  //                  the root excluding any files within sub-directories).
  //                    Example: 
  //                      ```
  //                      [
  //                        { name: '0x0000..0001', type: 'file', length: 1024, ... },
  //                        { name: '0x0000..0002', type: 'file', length: 72387467, ... },
  //                        { name: '0x0000..0003', type: 'dir', length: 2, ... }
  //                      ]
  //                      ```
  //
  // Filtering:
  //
  //   [req-ds-ls-15] If the `after` option is given, the listing shall be filtered to contain only files and
  //                  directories MODIFIED after (but not on) the option's timestamp (integer UNIX timestamp in ms).
  //
  //   [req-ds-ls-16] If the `before` option is given, the listing shall be filtered to contain only files and
  //                  directories MODIFIED before (but not on) the option's timestamp (integer UNIX timestamp in ms).
  //
  //   [req-ds-ls-17] If the `createdAfter` option is given, the listing shall be filtered to contain only files and
  //                  directories CREATED after (but not on) the option's timestamp (integer UNIX timestamp in ms).
  //
  //   [req-ds-ls-18] If the `createdBefore` option is given, the listing shall be filtered to contain only files and
  //                  directories CREATED before (but not on) the option's timestamp (integer UNIX timestamp in ms).
  //
  //   [req-ds-ls-19] If the `matches` option is given, the listing shall be filtered to contain only files and
  //                  directories whose name (see [req-ds-ls-6]) matches the regular expression given by the option.
  //
  //   [req-ds-ls-20] If multiple filters (i.e. from requirements [req-ds-ls-15]..[req-ds-ls-19]) are given, the data 
  //                  server shall apply all those given to the listing.
  //
  list(contract, file, options) {
    return Promise.reject("DataServer.list is a virtual function and must be implemented")
  }

  /**
   * Subscribes the client to receive notification of updates to a file or directory.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {BubbleFile} file the file path to read
   * @param {Function} listener the client listener of the form (result, error) => {...}
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to return if the subscription is successful.
   * @throws Rejects with a BubbleError if unable to comply or the file does not exist 
   *   (@see core/errors.js for error codes)
   * 
   * Options:
   *   list: {boolean} return a list of directory contents (directory subscriptions only)
   *   since: {Number} return a list of directory contents created or updated since (but not on) the given 
   *                   timestamp (integer UNIX timestamp in ms, directory subscriptions only).
   *   read: {boolean} return the file contents (file subscriptions only)
   */
  //
  // Requirements:
  //
  //   [req-ds-sub-1] When called, the data server shall subscribe the client to receive future 
  //                  notifications of updates to the given file or directory (including the 
  //                  root directory).
  //              
  //   [req-ds-sub-2] If the subscription was successful, the data server shall resolve with a 
  //                  plain object containing a unique subscriptionId field (any type) and the
  //                  long form listing of the file/directory (not directory contents).
  //
  //   [req-ds-sub-3] The data server shall reject with a FILE_DOES_NOT_EXIST error if the 
  //                  file does not exist.
  //
  //   [req-ds-sub-4] The data server shall reject with a BUBBLE_DOES_NOT_EXIST error if the 
  //                  bubble does not exist on the server.
  //
  // Options:
  //
  //   [req-ds-sub-5] If the 'list' option is given and the subscription is for a directory, the 
  //                  data server shall include, in the resolved object, a `list` field containing 
  //                  the long form listing of the directory contents (see requirements req-ds-ls-5..10).
  //
  //   [req-ds-sub-6] If the 'list' option is given and the subscription is for a file, the 
  //                  data server shall omit the `data` field in all notifications.
  //
  //   [req-ds-sub-7] If the 'since' option is given and the subscription is for a directory, the 
  //                  data server shall include, in the resolved object, a `list` field containing 
  //                  the long form listing of the directory contents created or updated since (but not
  //                  on) the option's timestamp (integer UNIX timestamp in ms).  (See requirements 
  //                  req-ds-ls-5..10 for the long form listing format).
  //
  //   [req-ds-sub-8] If the 'read' option is given and the subscription is for a file, the 
  //                  data server shall include, in the resolved object, a `data` field containing 
  //                  the file contents.
  //
  // Notifications:
  //
  //   [req-ds-sub-9] The data server shall notify the client `listener` function whenever the file
  //                  or directory changes, subject to the subscription options.
  //
  //   [req-ds-sub-10] By default, when a subscribed file is written to using the `write` command, 
  //                  the data server shall notify the client with a `write` event and, unless the
  //                  'list' option was given (see req-ds-sub-6), the full contents of the file.
  //
  //   [req-ds-sub-11] By default, when a subscribed file is appended to using the `append` command, 
  //                   the data server shall notify the client with a `append` event and, unless the
  //                  'list' option was given (see req-ds-sub-6), the appended data.
  //
  //   [req-ds-sub-12] By default, when a subscribed file is deleted using the `delete` command, 
  //                   the data server shall notify the client with a `delete` event.
  //
  //   [req-ds-sub-13] By default, when a new directory is added to a subscribed root (via mkdir)
  //                   the data server shall notify the client of an `update` event and include a list
  //                   (array) of files that have changed.
  //
  //   [req-ds-sub-14] By default, when a file is written to a subscribed directory (including the 
  //                   ROOT_PATH), the data server shall notify the client of an `update` event and 
  //                   include the updated file in its data array in the following format:
  //                      {event: 'write', <...long format listing of the file>}
  //
  //   [req-ds-sub-15] By default, when a file is appended to in a subscribed directory (including the 
  //                   ROOT_PATH), the data server shall notify the client of an `update` event and 
  //                   include the updated file in its data array in the following format:
  //                      {event: 'append', <...long format listing of the file>}
  //
  //   [req-ds-sub-16] By default, when a file is deleted from a subscribed directory (including the 
  //                   ROOT_PATH), the data server shall notify the client of an `update` event and 
  //                   include the updated file in its data array in the following format:
  //                      {event: 'delete', file: <fileId>, type: 'file'}
  //
  // Notification Format:
  //
  //   [req-ds-sub-17] The type of each notification shall be a plain object.
  //
  //   [req-ds-sub-18] Each notification shall contain a `subscriptionId` field containing the id
  //                   of the subscription.
  //
  //   [req-ds-sub-19] Each notification shall contain an `event` field indicating the type of 
  //                   event that caused the notification: 'write', 'append', 'delete', or 'update'.
  //
  //   [req-ds-sub-20] Each update, write or append notification shall contain a `file` field 
  //                   containing the long form listing of the updated file or directory 
  //                   (see requirements req-ds-ls-5..10).
  //
  //   [req-ds-sub-21] Each file delete notification shall contain a `file` field containing the short
  //                   listing of the updated file, i.e. {file: <fileId>, type: 'file}.
  //
  //   [req-ds-sub-22] A file notification containing file contents shall include the contents as a 
  //                   `data` field.
  //
  //   [req-ds-sub-23] A directory notification shall contain a `list` field containing an array
  //                   of changed files in the long form listing format (see requirements req-ds-ls-5..10).
  //  
  subscribe(contract, file, listener, options) {
    return Promise.reject("DataServer.subscribe is a virtual function and must be implemented")
  }

  /**
   * Unsubscribes the client from a specific subscription.
   * 
   * @param {any} subscriptionId the subscription to unsubscribe to.
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to resolve if the unsubscribe is successful.
   */
  //
  // Requirements:
  //
  //   [req-ds-unsub-1] When called, the data server shall unsubscribe the given subscription id.
  //              
  //   [req-ds-unsub-2] The data server shall resolve if the unsubscribe was successful.
  //
  //   [req-ds-unsub-3] The data server shall resolve even if the subscription does not exist.
  //
  unsubscribe(subscriptionId, options) {
    return Promise.reject("DataServer.unsubscribe is a virtual function and must be implemented")
  }

  /**
   * Unconditionally delete a bubble and all it's files.
   * 
   * @param {Address} contract the bubble's ACC
   * @param {Object} options user defined (passed through transparently from client)
   * @returns Promise to service the request
   * @throws Rejects with a BubbleError if unable to comply (@see core/errors.js for error codes)
   */
  //
  // Requirements:
  //
  //   [req-ds-tm-1] When called, the data server shall unconditionally delete the bubble uniquely 
  //                 identified by the contract address, and all it's content.
  //
  //   [req-ds-tm-2] The data server shall resolve if the deletion was successful.
  //
  //   [req-ds-tm-3] The data server shall reject with a `BUBBLE_DOES_NOT_EXIST` error if the 
  //                 bubble doesn't exist and the silent option is NOT given (regardless of any 
  //                 `silent` option).
  //
  //   [req-ds-tm-4] The data server shall resolve if the bubble does not exist but the silent option is given.
  //
  terminate(contract, options) {
    return Promise.reject("DataServer.terminate is a virtual function and must be implemented")
  }

}
