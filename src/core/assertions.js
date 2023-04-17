// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * bubble-sdk assertions.  Used to encourage strong typing of parameters during runtime.
 */

const VALID_BLOCKCHAIN_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const VALID_HEX_STRING_REGEX = /^(0x)?[0-9a-fA-F]+$/;
const VALID_HASH_REGEX = /^(0x)?[0-9a-fA-F]{64}$/;
const VALID_POSIX_FILENAME_REGEX = /^[^\0\/]+$/;  // POSIX files can be any string but must not contain null or '/'


export function isNotEmpty(value, name) {
  const result = (value !== undefined) && !/^\s*$/.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " is missing or empty");
  else return result;
}

export function equals(value, expected, name) {
  const result = (value === expected);
  if (name !== undefined && !result) throw new TypeError(name + " '" + value + "' to equal '" + expected + "'");
  else return result;
};

export function notEquals(value, expected, name) {
  const result = (value !== expected);
  if (name !== undefined && !result) throw new TypeError(name + " '" + value + "' to not equal '" + expected + "'");
  else return result;
};

export function isNotNull(value, name) {
  const result = (value !== undefined);
  if (name !== undefined && !result) throw new TypeError(name + " is null");
  else return result;
};

export function isArray(value, name) {
  const result = isNotNull(value, name) && Array.isArray(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected Array");
  else return result;
};

export function isBoolean(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object Boolean]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected Boolean");
  else return result;
};

export function isBuffer(value, name) {
  const result = isNotEmpty(value, name) && Buffer.isBuffer(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected Buffer");
  else return result;
};

export function isFunction(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object Function]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected function");
  else return result;
};

export function isNumber(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object Number]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected number");
  else return result;
};

export function isString(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object String]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected string");
  else return result;
};

export function isObject(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object Object]');
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected Object");
  else return result;
};

export function isHexString(value, name) {
  const result = isNotEmpty(value, name) && (toString.call(value) === '[object String]') && VALID_HEX_STRING_REGEX.test(value) && value.length % 2 === 0;
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string");
  else return result;
};

export function isHash(value, name) {
  const result = isNotEmpty(value, name) && VALID_HASH_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 64");
  else return result;
};

export function isPrivateKey(value, name) {
  const result = isNotEmpty(value, name) && VALID_HASH_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected hex string of length 64");
  else return result;
};

export function isAddress(value, name) {
  const result = isNotEmpty(value, name) && VALID_BLOCKCHAIN_ADDRESS_REGEX.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected address");
  else return result;
};

export function isInstanceOf(value, type, name) {
  const result = isNotEmpty(value, name) && (value instanceof type);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected " + type.name);
  else return result;
};

export function matches(value, regex, name) {
  isString(value, name);
  const result = regex.test(value);
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected to match '"+regex+"'");
  else return result;
};

export function isPOSIXFilename(value, name) {
  isString(value, name);
  const result = (
    VALID_POSIX_FILENAME_REGEX.test(value) &&          
    value !== "." &&                             // must not be a special file
    value !== "..");
  if (name !== undefined && !result) throw new TypeError(name + " type. Expected POSIX filename");
  else return result;
}