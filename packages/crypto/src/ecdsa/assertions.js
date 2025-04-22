// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * ecdsa crypto assertions.  Used to encourage strong typing of parameters during runtime.
 */

const VALID_BLOCKCHAIN_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const VALID_HASH_REGEX = /^(0x)?[0-9a-fA-F]{64}$/;
const VALID_U_PUBLIC_KEY_REGEX = /^(0x)?04[0-9a-fA-F]{128}$/;
const VALID_C_PUBLIC_KEY_REGEX = /^(0x)?(02|03)[0-9a-fA-F]{64}$/;
const VALID_SIGNATURE_REGEX = /^(0x)?[0-9a-fA-F]{130}$/;


function isNotEmpty(value, name) {
  const result = (value !== undefined) && !/^\s*$/.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " is missing or empty");
  else return result;
}

export function isString(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object String]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected string");
  else return result;
};

export function isPrivateKey(value, name) {
  const result = isNotEmpty(value, name) && VALID_HASH_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 64");
  else return result;
};

export function isUncompressedPublicKey(value, name) {
  const result = isNotEmpty(value, name) && VALID_U_PUBLIC_KEY_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 130");
  else return result;
};

export function isCompressedPublicKey(value, name) {
  const result = isNotEmpty(value, name) && VALID_C_PUBLIC_KEY_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 66");
  else return result;
};

export function isSignature(value, name) {
  const result = isNotEmpty(value, name) && VALID_SIGNATURE_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 130 as {r,s,v}");
  else return result;
};

export function isAddress(value, name) {
  const result = isNotEmpty(value, name) && VALID_BLOCKCHAIN_ADDRESS_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected address");
  else return result;
};

export function isHash(value, name) {
  const result = isNotEmpty(value, name) && VALID_HASH_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 64");
  else return result;
};

export function isObject(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object Object]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected Object");
  else return result;
};


