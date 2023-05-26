// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * Delegations allow a wallet to permit a different private key to act on it's behalf when 
 * accessing a bubble.
 * 
 * Delegation format with example permissions:
 *
 * {
 *   delegate: '<address>',
 *   expires: '<expiry_unix_time>',
 *   permissions: [
 *     {type: 'contract', chain: 1, contract: '<contract-address>'}
 *     {type: 'bubble', chain: 1, contract: '<contract-address>', provider: 'provider'}
 *   ],
 *   signaturePrefix: '...',
 *   signature: '...'
 * }
 * 
 */


import * as assert from './assertions.js';


//
// Permissions
//

class Permission {

  constructor(type, fields={}) {
    assert.isString(type, 'type');
    assert.isObject(fields, 'fields');
    this.type = type;
    Object.assign(this, fields);
  }

  isPermitted() {
    throw new Error('Permission.isPermitted is a virtual function and has not been implemented');
  }
  
}


class BubblePermission extends Permission {

  constructor(bubbleId) {
    assert.isObject(bubbleId, 'bubbleId');
    assert.isNumber(bubbleId.chain, 'chain');
    assert.isHexString(bubbleId.contract, 'contract');
    assert.isString(bubbleId.provider, 'provider');
    super('bubble', bubbleId);
  }
  
  isPermitted(contentId) {
    return this.chain === contentId.chain && this.contract.toLowerCase() === contentId.contract.toLowerCase() && this.provider === contentId.provider
  }

}


class ContractPermission extends Permission {

  constructor(bubbleId) {
    assert.isNumber(bubbleId.chain, 'chain');
    assert.isHexString(bubbleId.contract, 'contract');
    super('contract', {chain: bubbleId.chain, contract: bubbleId.contract});
  }

  isPermitted(contentId) {
    return this.chain === contentId.chain && this.contract.toLowerCase() === contentId.contract.toLowerCase();
  }
  
}


class PermissionFactory {

  parse(obj) {
    assert.isObject(obj, 'obj');
    assert.isString(obj.type, 'type');
    switch (obj.type) {
      case 'contract': return new ContractPermission(obj);
      case 'bubble': return new BubblePermission(obj);
      default: throw new Error(`invalid permission type '${obj.type}'`);
    }
  }

}


//
// Delegation class
//

export class Delegation {

  static PermissionFactory = new PermissionFactory();
  static ContractPermission = ContractPermission;
  static BubblePermission = BubblePermission;

  /**
   * The address to delegate to
   */
  delegate;

  /**
   * The expiry time (seconds since 1-Jan-1970)
   */
  expires;

  /**
   * List of permissions for which this delegate is permitted to act as the signer
   */
  permissions;


  /**
   * 
   * @param {Address} delegate the address to delegate to
   * @param {Number|String} expires the UNIX expiry time (in seconds) or the string 'never'
   * @param {Array|String} permissions list of Permission objects or the string 'all-permissions'
   */
  constructor(delegate, expires, permissions) {
    assert.isHexString(delegate, 'delegate');
    if (expires !== 'never') assert.isNumber(expires, 'expires');
    if (permissions === undefined) permissions = [];
    if (permissions !== 'all-permissions') {
      assert.isArray(permissions, 'permissions');
      if (!permissions.every(p => assert.isInstanceOf(p, Permission))) throw new Error('invalid permission');
    }
    this.delegate = delegate;
    this.expires = expires;
    this.permissions = permissions;
  }

}

