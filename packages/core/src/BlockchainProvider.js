// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

/**
 * BlockchainProvider Interface
 * 
 * Chain agnostic interface to the blockchain
 */
export class BlockchainProvider {

  /**
   * Calls the getPermissions function of the given contract and returns the permission bits.
   * 
   * @param {20-byte hex string} contract address of the contract
   * @param {20-byte hex string} account address to pass to the contract's getPermissions function
   * @param {32-byte hex string} file bytes32 (as hex string) to pass to the contract's 
   * getPermissions function
   * @returns Promise to return the 256-bit uint returned by the contract
   */
  getPermissions(contract, account, file) {
    throw new Error('BlockchainProvider.getPermissions is a virtual function and must be implemented');
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
   * @param {ArrayBuffer} message the message that was originally signed
   * @param {ArrayBuffer} signature the signature
   * @returns Promise to return the signatory in the format appropriate to this blockchain (usually account address)
   */
  recoverSignatory(message, signature) {
    throw new Error('BlockchainProvider.recoverSignature is a virtual function and must be implemented');
  }

}