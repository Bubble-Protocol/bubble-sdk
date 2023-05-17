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
   * @returns Promise to return a BigInt containing the 256-bit uint returned by the contract
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

  /**
   * Returns true if the given contract id (address) is valid for this blockchain.
   * 
   * EVM blockchains use a 20-byte address.  Override this function if your blockchain uses a 
   * different format.
   * 
   * @param {string} contract the contract id to validate
   * @returns `true` if valid, `false` otherwise
   */
  validateContract(contract) {
    return VALID_EVM_CONTRACT_ADDRESS_REGEX.test(contract);
  }

}


const VALID_EVM_CONTRACT_ADDRESS_REGEX = /^(0x)?[0-9a-fA-F]{40}$/;
