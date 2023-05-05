// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Standard public directory for user discovery purposes.  Directory must contain the file `metadata`
 * to be discoverable.  The directory can hold any public files, such as images, videos, html, that are
 * referenced in the metadata.
 * 
 * (Content id is the keccak256 hash of the string `>>Bubble Standard Public Discovery Directory<<`)
 */
uint constant PUBLIC_DISCOVERY_DIRECTORY = 0x2f472e7e86c65cd883cfacd8b568266b7a971b0d46620e0c6849ccfd50af1148;

