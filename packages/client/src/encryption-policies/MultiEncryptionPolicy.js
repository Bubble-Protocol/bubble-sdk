// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { EncryptionPolicy } from '../EncryptionPolicy.js';
import { assert } from '@bubble-protocol/core';

/**
 * Single encryption policy that holds an ordered list of policies, each taking priority over those
 * that come after.
 */

export class MultiEncryptionPolicy extends EncryptionPolicy {

  /**
   * @dev ordered list of encryption policies
   */
  policies;

  constructor(...policies) {
    assert.isArray(policies, 'policies');
    super();
    this.policies = policies;
  }

  isEncrypted(contentId) {
    return this.policies.reduce((result, policy) => result || policy.isEncrypted(contentId), false );
  }

  encrypt(data, contentId) {
    return this.getRelevantPolicy(contentId).encrypt(data, contentId);
  }

  decrypt(data, contentId) {
    return this.getRelevantPolicy(contentId).decrypt(data, contentId);
  }

  getRelevantPolicy(contentId) {
    for (let i=0; i<this.policies.length; i++) {
      if (this.policies[i].isEncrypted(contentId)) return this.policies[i];
    }
    return this.policies[this.policies.length-1];
  }

  serialize() {
    return Promise.all(this.policies.map(policy => policy.serialize()))
    .then(data => {
      return {
        type: 'MultiEncryptionPolicy',
        policies: data
      }
    })
  }

  deserialize(data) {
    if (!assert.isObject(data)) return Promise.reject('cannot deserialize MultiEncryptionPolicy: policy data is invalid - expected object');
    if (data.type !== 'MultiEncryptionPolicy') return Promise.reject('cannot deserialize policy: not a MultiEncryptionPolicy');
    if (!assert.isArray(data.policies)) return Promise.reject('cannot deserialize MultiEncryptionPolicy: policies field is missing or invalid');
    if (data.policies.length !== this.policies.length) return Promise.reject('cannot deserialize MultiEncryptionPolicy: not enough or too many policies');
    return Promise.all(this.policies.map((policy, index) => policy.deserialize(data.policies[index])));
  }

}

