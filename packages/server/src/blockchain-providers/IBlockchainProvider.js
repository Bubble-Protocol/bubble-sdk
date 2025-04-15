// Copyright (c) 2025 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

/**
 * BlockchainProvider Interface
 * 
 * Chain agnostic interface to the blockchain
 */
export class IBlockchainProvider {

  /**
   * Calls the getPermissions function of the given contract and returns the permission bits.
   * 
   * @param {hex string} contract address of the contract
   * @param {hex string} account address to pass to the contract's getPermissions function
   * @param {hex string} file bytes32 (as hex string) to pass to the contract's 
   * getPermissions function
   * @returns Promise to return a BigInt containing the 256-bit uint returned by the contract
   */
  async getPermissions(contract, account, file) {
    throw new Error('BlockchainProvider.getPermissions is a virtual function and must be implemented');
  }

  /**
   * Calls the blockchain's delegate revocation contract to check if the given hash has been 
   * revoked.
   * 
   * @param {32-byte hex string} delegateHash the hash to check if revoked
   */
  async hasBeenRevoked(delegateHash) {
    throw new Error('BlockchainProvider.hasBeenRevoked is a virtual function and must be implemented');
  }

  /**
   * @returns the blockchain's chain id
   */
  getChainId() {
    throw new Error('BlockchainProvider.getChainId is a virtual function and must be implemented');
  }

  /**
   * Recovers the signatory of the given message from the given signature.
   * 
   * @param {Any} message the packet or message that was originally signed
   * @param {Any} signature the signature
   * @param {"rpc"|"delegate"|"message"|"digest"} context the context in which the signature was created. If
   * "rpc" or "delegate" the message is a packet object, if "message" it is a string, and if "digest" it is a
   * hex string of the digest.
   * @returns Promise to return the signatory in the format appropriate to this blockchain (usually account address)
   */
  async recoverSignatory(message, signature, context) {
    throw new Error('BlockchainProvider.recoverSignature is a virtual function and must be implemented');
  }

  /**
   * Returns true if the given contract id (address) is valid for this blockchain.
   * 
   * Bubble for EVM blockchains uses a 20-byte lowercase address starting with '0x'.  
   * Override this function if your blockchain uses a different format.
   * 
   * @param {string} contract the contract id to validate
   * @returns `true` if valid, `false` otherwise
   */
  validateContract(contract) {
    throw new Error('BlockchainProvider.validateContract is a virtual function and must be implemented');
  }

}

