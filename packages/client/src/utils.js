// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.


/**
 * Takes a signature produced by an Ethereum wallet and prepares it for adding to a request.
 * 
 * Ethereum wallets always prefix signed messages to ensure a user can't be manipulated into
 * signing a transaction.  A storage server's Guardian needs to take this into account when 
 * recovering the signatory from a signed request.
 * 
 * @param {string} sig signature
 * @returns signature object
 */
export function toEthereumSignature(sig) {
  return {
    signaturePrefix: "\x19Ethereum Signed Message:\n64",
    signature: sig
  }
}


/**
 * Alternative method of preparing an Ethereum signature for adding to a request 
 * (@see `toEthereumSignature`).
 * 
 * @param {function} signFunction sign function whose signature must be converted
 * @returns the same signFunction
 */
export function toEthereumSignFunction(signFunction) {
  return signFunction.then(toEthereumSignature);
}
