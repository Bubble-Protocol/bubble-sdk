// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * Interface for a list of permitted providers. Implement to enforce a list of permitted providers.
 */
interface IProviderList {

  function contains(bytes32 provider) external view returns (bool);

}

