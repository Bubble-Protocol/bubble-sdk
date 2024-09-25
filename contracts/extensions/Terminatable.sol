// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * Provides a public isTerminated function and method to terminate the contract.
 * Once terminated the contract cannot be un-terminated.
 */
abstract contract Terminatable {

    // Terminated flag
    bool private terminated = false;

    /**
     * @dev Returns true if the contract has been terminated.
     *
     * Use this function to set the terminated bit within getAccessPermissions.
     *
     * e.g. if (isTerminated()) return BUBBLE_TERMINATED_BIT;
     *
     * See AccessControlledStorage.sol and AccessControlBits.sol
     */
    function isTerminated() public view returns (bool) {
        return terminated;
    }

    /**
     * @dev Call this function from the inheriting contract to terminate the bubble.
     */
    function _terminate() internal {
        terminated = true;
    }

}