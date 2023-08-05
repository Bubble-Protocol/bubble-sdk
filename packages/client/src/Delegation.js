// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { Delegation as CoreDelegation, assert } from '@bubble-protocol/core';
import Web3 from 'web3';

export class Delegation extends CoreDelegation {

  /**
   * Permit a delegated key to access a bubble on behalf of a signer.
   * 
   * @param {Address} delegate the address to delegate to
   * @param {Number|String} expires the UNIX expiry time (in seconds) or the string 'never'
   */
  constructor(delegate, expires) {
    super(delegate, expires);
  }

  /**
   * Permits this delegate to access the given off-chain bubble. If the provider is not given
   * as part of the id, permission will be granted regardless of where the bubble is hosted.
   * If present, it will only be granted if hosted by that specific provider.
   * 
   * @param {ContentId|Object} bubbleId the bubble's content id or an object containing at least
   * chain and contract.
   */
  permitAccessToBubble(bubbleId) {
    assert.isObject(bubbleId, 'bubbleId');
    if (bubbleId.provider) this._addPermission(new CoreDelegation.BubblePermission(bubbleId));
    else this._addPermission(new CoreDelegation.ContractPermission(bubbleId));
  }


  /**
   * Permits the delegate to access all bubbles accessible by the signer.
   * 
   * WARNING: The delegate key will have the same access rights as the signing key.  This includes
   * all existing bubbles anywhere, and any bubbles created in the future.  Ensure the delegate 
   * private key is as secure as the signing key.
   */
  permitAccessToAllBubbles() {
    this.permissions = 'all-permissions';
  }


  /**
   * Signs this delegation object.
   * 
   * @param {Function} signFunction function that signs the delegation packet. Signing this
   * delegation will permit the delegator to act as the signer under the permissions set. 
   * 
   * Takes the form:
   * 
   *   (Buffer: hash) => { return Promise to resolve the signature of the hash as a Buffer }
   * 
   * The type and format of the signature must be appropriate to the blockchain platform.
   *
   * @returns this object
   */
  async sign(signFunction) {
    const packet = JSON.parse(JSON.stringify({ // JSON removes undefined properties
      delegate: this.delegate,
      expires: this.expires,
      permissions: this.permissions
    }));
    const signature = await signFunction(Web3.utils.keccak256(JSON.stringify(packet)).slice(2))
    if (typeof signature === 'object') {
      if (signature.prefix) this.signaturePrefix = signature.prefix;
      this.signature = signature.signature;
    }
    else this.signature = signature;
    if (!assert.isHexString(this.signature)) throw new Error('signFunction returned an invalid signature when signing delegation', {cause: this.signature});
    return this;
  }
    

  /**
   * Adds a permission to the list of permissions to grant to this delegate.
   * 
   * @param {Permission} permission the permission to add to the list of permissions
   */
  _addPermission(permission) {
    if (!assert.isArray(this.permissions)) this.permissions = [];
    this.permissions.push(permission);
  }

}

