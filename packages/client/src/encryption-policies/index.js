// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { AESGCMEncryptionPolicy } from './AESGCMEncryptionPolicy.js';
import { ECIESEncryptionPolicy } from './ECIESEncryptionPolicy.js';
import { MultiEncryptionPolicy } from './MultiEncryptionPolicy.js';
import { NullEncryptionPolicy } from './NullEncryptionPolicy.js';

export const encryptionPolicies = {
  AESGCMEncryptionPolicy: AESGCMEncryptionPolicy,
  ECIESEncryptionPolicy: ECIESEncryptionPolicy,
  MultiEncryptionPolicy: MultiEncryptionPolicy,
  NullEncryptionPolicy: NullEncryptionPolicy
}