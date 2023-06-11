// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { EncryptionPolicy } from "../EncryptionPolicy.js";

/**
 * Default encryption policy that does not encrypt
 */
export class NullEncryptionPolicy extends EncryptionPolicy {

  isEncrypted(_) { return false }

  serialize() { return Promise.resolve('NullEncryptionPolicy') }

  deserialize(data) { 
    if (data !== 'NullEncryptionPolicy') return Promise.reject('invalid NullEncryptionPolicy deserialization data')
    return Promise.resolve() 
  }

}
