// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * Contract to define a provider policy. A provider policy is a set of rules that define what
 * providers are permitted to host bubbles for a given application.
 */
interface IProviderPolicy {

  /**
    * @dev Returns true if the provider is permitted.
    */
  function isPermittedProvider(bytes32 provider) external view returns (bool);

}

