// Copyright (c) 2025 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

import { BubbleError, ErrorCodes, assert } from '@bubble-protocol/core';
import { IBlockchainProvider } from '../IBlockchainProvider.js';
import { Delegation } from '../../Delegation.js';
import { eip712 } from './eip712.js';
import { ethers, getBytes } from 'ethers';
import { ABIs } from './abi.js';

/**
 * Signatory used to get permissions if the request is a public request.
 * (Account address of a private key generated from the hash of '<Bubble Protocol Public Signatory>')
 */

const PUBLIC_SIGNATORY = "0x99e2c875341d1cbb70432e35f5350f29bf20aa52";


/**
 * Provider for EVM based blockchains
 */
export class EVMProvider extends IBlockchainProvider{

  protocolVersion;
  chainId;
  provider;
  hostDomain;

  constructor(protocolVersion, chainId, provider, hostDomain) {
    super();
    this.protocolVersion = protocolVersion;
    this.chainId = chainId;
    this.provider = provider;
    this.abi = ABIs[protocolVersion];
    this.hostDomain = hostDomain;
    if (!this.abi) throw new Error(`EVMProvider error: abi version ${protocolVersion} does not exist`);
  }

  async getPermissions(contract, account, file) {
    const contractObj = new ethers.Contract(contract, this.abi, this.provider);
    const permissions = await contractObj.getAccessPermissions(account, file);
    return BigInt(permissions);
  }

  async hasBeenRevoked() {
    return false;  // revocation service not yet available
  }

  getChainId() {
    return this.chainId;
  }

  async recoverSignatory(message, signature, context) {

    if (isLegacyRPC(message, signature, context)) {
      const {legacyPacket, signatureObj} = parseLegacyPacket(message, signature);
      return this.recoverSignatory(legacyPacket, signatureObj, 'rpc');  
    }

    assert.isNotNull(message, 'message');
    assert.isNotNull(context, 'context');
    assert.isObject(signature, 'signature');
    assert.isString(signature.type, 'signature type');
    if (signature.type !== 'public') assert.isHexString(signature.signature, 'signature hex');

    function getDigest(context, message) {
      switch (context) {
        case 'rpc':
        case 'delegate':
          assert.isObject(message, 'message');
          return JSON.stringify(message);
        case 'message':
          assert.isString(message, 'message');
          return message;
        case 'digest':
          assert.isHexString(message, 'digest');
          return getBytes(message);
        default:
          throw new Error('context not supported', {cause: "'"+context+"'"});
      }
    }

    const digest = getDigest(context, message);
    const signatureHex = signature.signature;
    const delegate = signature.delegate;
    let signatory;

    try {
      switch (signature.type) {
      case 'public':
        return PUBLIC_SIGNATORY;
      case 'plain':
        signatory = this._recoverPlainSignature(digest, signatureHex, context);
        break;
      case 'eip191':
        signatory = this._recoverEIP191Signature(digest, signatureHex);
        break;
      case 'eip712':
        signatory = this._recoverEIP712Signature(message, signatureHex, context);
        break;
      default:
        signatory = 'not supported';
        throw new Error(`signature type not supported: '${signature.type}'`);
      }
    } catch (error) {
      if (signatory === 'not supported') throw error;
      throw new Error('invalid signature', { cause: error });
    }

    if (!assert.isHexString(signatory)) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_INTERNAL_ERROR, 'Blockchain provider signature is invalid');
    }

    if (context === 'rpc' && delegate) {
      if (!assert.isObject(message.params) || !assert.isNotNull(message.params.contract)) throw new Error('contract missing in rpc message');
      signatory = await this._recoverDelegateSignatory(delegate, signatory, message.params.contract);
    }

    return signatory;
  }

  _recoverPlainSignature(digest, signature, context) {
    const hash = (context === 'digest') ? digest : ethers.keccak256(Buffer.from(digest));
    return ethers.recoverAddress(hash, signature);
  }

  _recoverEIP191Signature(digest, signature) {
    const hash = ethers.hashMessage(digest);
    return ethers.recoverAddress(hash, signature);
  }

  _recoverEIP712Signature(message, signature, context) {
    if (context !== 'rpc' && context !== 'delegate') throw new Error('signature type eip712 only supported for rpc or delegate contexts');
    const domain = eip712.getEIP712Domain(context === 'rpc' ? this.chainId : undefined);
    const types = context === 'rpc' ? eip712.EIP712_REQUEST_TYPES : eip712.EIP712_DELEGATE_TYPES;
    const typedMessage = context === 'rpc' ? eip712.rpcToEIP712Message(message) : eip712.delegateToEIP712Message(message);
    return ethers.verifyTypedData(domain, types, typedMessage, signature);
  }

  async _recoverDelegateSignatory(delegate, signatory, contract) {
    assert.isObject(delegate, 'signature delegate');
    const delegatePacket = {...delegate};
    delete delegatePacket.signature;
    let delegateSignatory;
    try {
      delegateSignatory = await this.recoverSignatory(delegatePacket, delegate.signature, 'delegate');
    }
    catch(error) {
      throw new Error(`cannot decode delegate - ${error.message || error}`);
    }
    const delegation = new Delegation(delegatePacket, ethers.keccak256(Buffer.from(JSON.stringify(delegate.signature))), delegateSignatory);
    if (!delegation.isValid()) throw new Error(`cannot decode delegate - ${delegation.error.message || delegation.error}`)
    const revoked = await this.hasBeenRevoked(delegation.hash);
    const expired = delegation.hasExpired();
    const contentId = {chain: this.chainId, contract, provider: this.hostDomain};
    if (revoked || expired || !delegation.canAccessContent(signatory, contentId)) 
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'delegate denied');
    return delegation.signatory;
  }

  validateContract(contract) {
    return VALID_EVM_CONTRACT_ADDRESS_REGEX.test(contract);
  }

}


const VALID_EVM_CONTRACT_ADDRESS_REGEX = /^(0x)[0-9a-fA-F]{40}$/;
 
function isLegacyRPC(packet, signature, context) {
  return context === 'rpc' &&
    assert.isObject(packet) &&
    assert.isObject(packet.params) &&
    packet.params.version === undefined &&
    assert.isString(signature);
}

function parseLegacyPacket(packet, legacySignature) {
  if (legacySignature !== 'public') assert.isHexString(legacySignature, 'legacy v0 signature');
  if (packet.params.signaturePrefix) {
    assert.isString(packet.params.signaturePrefix, 'legacy v0 signature prefix');
    if (packet.params.signaturePrefix !== "\x19Ethereum Signed Message:\n64") throw new Error('legacy v0 signature prefix must meet eip-191');
  }
  if (packet.params.delegate) assert.isObject(packet.params.delegate, 'legacy v0 signature delegate');
  const legacyPacket = {
    method: packet.method,
    params: { ...packet.params }
  }
  const signatureObj = {
    type: legacySignature === 'public' ? 'public' : packet.params.signaturePrefix ? "eip191" : "plain",
    signature: legacySignature
  }
  delete legacyPacket.params.signaturePrefix;
  delete legacyPacket.params.delegate;
  let legacyDelegate;
  if (packet.params.delegate) {
    if (packet.params.delegate.signaturePrefix && packet.params.delegate.signaturePrefix !== "\x19Ethereum Signed Message:\n64") {
      throw new Error('legacy v0 signature prefix must meet eip-191');
    }
    legacyDelegate = {...packet.params.delegate};
    delete legacyDelegate.signature;
    delete legacyDelegate.signaturePrefix;
    legacyDelegate.signature = {
      type: packet.params.delegate.signaturePrefix ? "eip191" : "plain",
      signature: packet.params.delegate.signature
    }
    signatureObj.delegate = legacyDelegate;
  }
  return {legacyPacket, signatureObj};
}