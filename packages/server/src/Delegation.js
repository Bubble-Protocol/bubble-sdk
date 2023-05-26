import { Delegation as CoreDelegation, assert } from '@bubble-protocol/core';
import Web3 from 'web3';

/**
 * Server-side function to parse and validate a received signatory delegation object.
 * 
 * @param {Object} delegation signed delegation object to parse and validate
 * @param {BlockchainProvider} blockchainProvider provider to allow signature to be recovered
 * @returns ServerDelegation object that can be queried
 */
export async function parseDelegation(delegation, blockchainProvider) {
  const packet = {...delegation};
  delete packet.signature;
  delete packet.signaturePrefix;
  try {
    assert.isHexString(delegation.signature, 'signature');
    if (delegation.signaturePrefix) assert.isString(delegation.signaturePrefix, 'signaturePrefix');
    const hash = Web3.utils.keccak256(JSON.stringify(packet)).slice(2);
    if (delegation.signaturePrefix) hash = Web3.utils.keccak256(delegation.signaturePrefix+hash).slice(2);
    const signatory = await blockchainProvider.recoverSignatory(hash, delegation.signature);
    return new Delegation(delegation, hash, signatory);
  }
  catch(error) {
    return new Delegation(delegation, undefined, undefined, error);
  }
}


class Delegation extends CoreDelegation {

  /**
   * The unique hash of the delegation
   */
  hash;

  /**
   * The signer of this delegation
   */
  signatory;

  /**
   * 
   * @param {Object} delegation The original signed delegation object
   * @param {Hash} hash The hash of the delegation packet (the hash signed by the signatory)
   * @param {Address} signatory The signer's address
   * @param {Error} signError Optional error.  This delegation will be marked invalid if present
   */
  constructor(delegation, hash, signatory, signError) {
    try{
      assert.isObject(delegation, 'delegation');
      if (hash) assert.isHex32(hash, 'hash');
      if (signatory) assert.isHexString(signatory, 'signatory');
      assert.isNotNull(delegation.permissions, 'permissions');
      let permissions = delegation.permissions;
      if (assert.isArray(permissions)) {
        permissions = delegation.permissions.map(p => CoreDelegation.PermissionFactory.parse(p));
      }
      super(delegation.delegate, delegation.expires, permissions);
      this.hash = hash;
      this.signatory = signatory;
      this.error = signError;
      this.valid = signError === undefined;
    }
    catch(error) {
      super('0x00', 0, []);
      this.error = error;
      this.valid = false;
    }
  }

  /**
   * Tests if the given user has been delegated the permission to act access the given content.
   * 
   * @param {Address} user public address of user 
   * @param {ContentId} contentId id of the content being accessed
   * @returns true if the user has permission
   */
  canAccessContent(user, contentId) {
    return this.isRelevant() &&
      this.hasDelegate(user) &&
      ( this.permissions === 'all-permissions' ||
        this.permissions.some(r => r.isPermitted(contentId)) );
  }

  /**
   * A delegation is invalid if it is malformed or the signature is invalid.
   * 
   * @returns true if valid
   */
  isValid() {
    return this.valid;
  }

  /**
   * A delegation is relevant if it is valid and hasn't expired.
   * 
   * @returns true if valid and hasn't expired
   */
  isRelevant() {
    return this.valid && !this.hasExpired();
  }

  /**
   * A delegation has expired if now is beyond its `expires` time.  Always check the delegation
   * is valid before using this method.
   * 
   * @returns true if expired 
   */
  hasExpired() {
    return this.expires !== 'never' && this.expires < (Date.now() / 1000);
  }

  /**
   * Check if the given delegate is the subject of this delegation.
   * 
   * @param {Address} delegate public address of the delegate to check
   * @returns true if the delegation includes the given delegate
   */
  hasDelegate(delegate) {
    return delegate.toLowerCase() === this.delegate.toLowerCase()
  }


}


