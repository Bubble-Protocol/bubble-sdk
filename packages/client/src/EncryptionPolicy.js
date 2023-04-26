// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * An encryption policy informs a Bubble whether a file is encrypted or not.  If encrypted, the
 * Bubble will call the encrypt function when writing or appending data, and will call the
 * decrypt function when reading data from the bubble. 
 */
export class EncryptionPolicy {

  isEncrypted(path) {
    throw new Error('EncryptionPolicy.isEncrypted is a virtual function and must be implemented');
  }

  encrypt(path, data) {
    throw new Error('EncryptionPolicy.encrypt is a virtual function and must be implemented');
  }

  decrypt(path, data) {
    throw new Error('EncryptionPolicy.decrypt is a virtual function and must be implemented');
  }

}


export class NullEncryptionPolicy extends EncryptionPolicy {

  isEncrypted(path) { return false }

}
