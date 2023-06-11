// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ContentId } from "@bubble-protocol/core";

/**
 * An encryption policy informs a Bubble whether a file is encrypted or not.  If encrypted, the
 * Bubble will call the encrypt function when writing or appending data, and will call the
 * decrypt function when reading data from the bubble. 
 */
export class EncryptionPolicy {

  /**
   * Returns true if the given content should be encrypted
   * 
   * @param {ContentId} contentId 
   */
  isEncrypted(contentId) {
    throw new Error('EncryptionPolicy.isEncrypted is a virtual function and must be implemented');
  }

  /**
   * Encrypts the given data
   * 
   * @param {ArrayBuffer} data 
   * @param {ContentId} contentId the id of the content being encrypted (allows the policy to  
   * support encrypting different files with different encryption keys)
   * @returns Promise to resolve the encrypted data (hex string with `0x` prefix)
   */
  encrypt(data, contentId) {
    throw new Error('EncryptionPolicy.encrypt is a virtual function and must be implemented');
  }

  /**
   * Returns an ArrayBuffer with the decrypted data
   * 
   * @param {hex-string} data
   * @param {ContentId} contentId the path of the content being decrypted (allows the policy to
   * support encrypting different files with different encryption keys)
   * @returns Promise to resolve the decrypted data as an ArrayBuffer
   */
  decrypt(data, contentId) {
    throw new Error('EncryptionPolicy.decrypt is a virtual function and must be implemented');
  }

  /**
   * Creates a representation of this policy that can be passed to the deserialize method
   * 
   * @returns Promise to serialize this policy
   */
  serialize() {
    throw new Error('EncryptionPolicy.serialize is a virtual function and must be implemented');
  }

  /**
   * Reconstructs this policy from the given serialized data
   * 
   * @param {any} data data from which to reconstruct this policy
   * @returns Promise to reconstruct this policy
   */
  deserialize(data) {
    throw new Error('EncryptionPolicy.deserialize is a virtual function and must be implemented');
  }

}
