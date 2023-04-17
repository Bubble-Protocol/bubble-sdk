import Web3 from 'web3';

const web3 = new Web3();

/**
 * Hashes the given data
 * 
 * @param data data to hash
 * @returns 32-byte hash as a hex string
 */
export function hash(data) {
  return web3.utils.keccak256(data);
}