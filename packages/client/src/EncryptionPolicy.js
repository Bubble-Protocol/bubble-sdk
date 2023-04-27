// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * An encryption policy informs a Bubble whether a file is encrypted or not.  If encrypted, the
 * Bubble will call the encrypt function when writing or appending data, and will call the
 * decrypt function when reading data from the bubble. 
 */
export class EncryptionPolicy {

  /**
   * Returns true if the given file should be encrypted
   * 
   * @param {string} path 
   */
  isEncrypted(path) {
    throw new Error('EncryptionPolicy.isEncrypted is a virtual function and must be implemented');
  }

  /**
   * Returns a hex string (with `0x` prefix) containing the encrypted data
   * 
   * @param {ArrayBuffer} data 
   * @param {string} path the path of the file in the bubble being encrypted (allows the policy
   * to support encrypting different files with different encryption keys)
   */
  encrypt(data, path) {
    throw new Error('EncryptionPolicy.encrypt is a virtual function and must be implemented');
  }

  /**
   * Returns an ArrayBuffer with the decrypted data
   * 
   * @param {hex-string} data
   * @param {string} path the path of the file in the bubble being encrypted (allows the policy
   * to support encrypting different files with different encryption keys)
   */
  decrypt(data, path) {
    throw new Error('EncryptionPolicy.decrypt is a virtual function and must be implemented');
  }

}


export class NullEncryptionPolicy extends EncryptionPolicy {

  isEncrypted(_) { return false }

}
