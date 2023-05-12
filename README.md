# Bubble SDK

The Bubble SDK contains the core, client and server side javascript libraries for developers building with Bubble Protocol on EVM-based blockchains.

* [What Is Bubble Protocol?](#what-is-bubble-protocol)  
* [SDK Overview](#sdk-overview)  
* [Concepts & Definitions](#concepts--definitions)

## What Is Bubble Protocol?

Bubble Protocol allows blockchains to govern private data, serving as a versatile protocol for managing access-controlled off-chain storage for Web3 applications. It adds access-controlled Web3 capabilities to any storage system, whether a public relay server, decentralized storage network, home server, or private company infrastructure.

Bubble Protocol is blockchain agnostic and is designed to be highly adaptable, providing Web3 developers with an easy to use general purpose global data layer for data tokenisation, cross-device DApp storage, decentralised identity solutions, web3 privacy compliance solutions, paywalled content, NFT content, and much more.

https://bubbleprotocol.com

## Who Is This SDK For?


* Developers of decentralised applications.
* Developers of bubble-compatible off-chain storage services.
* Companies looking to move into Web3.

## How Does It Work?

Bubble Protocol adds an access control layer to off-chain storage. Application developers can custom design smart contracts to govern access to content for specific users, specifying fine-grained permissions to access content akin to POSIX-style permission bits. Enforcement of these permissions is carried out by the off-chain storage service, which is chosen by the user or developer.  

Custom smart contracts are simple to develop and need only implement a single method (see [Smart Contract](#contracts) below). Once a contract is deployed, the off-chain content can be saved on any bubble-compatible storage system that supports the user's preferred blockchain.

Each piece of off-chain content is uniquely identified by a [content id](#content-ids).

The set of off-chain content controlled by a smart contract, combined with the on-chain logic of the contract itself, is known as a **bubble**, and is where Bubble Protocol gets it's name. For more details, see [Bubbles](#bubbles) below.

### Off-Chain Storage Services

Off-chain storage services can be public or private, centralised or decentralised.

The protocol allows each storage service to essentially function as a generic host for any bubble, allowing a single service to provide off-chain storage for any type of Web3 application.  Service providers can choose whether to provide an open, public service or a private service restricted to specific users, like customers or employees of a company.

### Decentralisation

With all application logic on-chain, public off-chain storage services have few requirements beyond the quality of storage service they provide.  This partitioning, alongside cross-chain functionality and the ability of users to choose which service they trust for each application they use, cultivates a separation of concerns that helps to drive decentralization.

# SDK Overview

* [Contracts](#contracts) - the smart contract interface and example contracts.
* [Core Library](#core-library) - core classes, types, constants and utilities.
* [Client Library](#client-library) - client libraries for application developers.
* [Server Library](#server-library) - server-side libraries for developers of storage services.

## Contracts

Any smart contract that implements the following interface can control off-chain content.  The `getAccessPermissions` method returns the given user's `tdlrwax--` access permissions for the given content identified by its [content id](#content-ids).

```solidity
interface AccessControlledStorage {

  function getAccessPermissions( address user, uint256 contentId ) external view returns (uint256);

}
```

A smart contract that implements this interface is known generally as an *Access Control Contract*.

For implementation details see [AccessControlledStorage.sol](./contracts/AccessControlledStorage.sol).  

For examples, including tokenising data with an NFT, see [example contracts](./contracts/examples) or the example in the [Client Library](./packages/client#1-design-an-access-control-contract).

For a definition of the bit field returned by this interface, see [AccessControlBits.sol](./contracts/AccessControlBits.sol).

## Core Library

The [`core`](packages/core) library provides classes, types, constants and utilities common to the client and server libraries.

## Client Library

The client library allows decentralised applications to read and write content to any bubble-compatible off-chain storage service.

There are two ways to interact with content: the `ContentManager` and the `Bubble` class.  See the [Client Library](packages/client) for usage instructions.

Example of reading a file using the `ContentManager`:

```javascript
import { ContentManager } from 'bubble-sdk';

const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
function signFunction(hash) {
  ...
}

const data = await ContentManager.read(contentId, signFunction);
```

See the [Client Library](packages/client) for usage instructions and examples.

See [Content IDs](#content-ids) for information on how files and bubbles are identified.
## Server Library

The server-side library is used to deploy new off-chain storage services or integrate Bubble Protocol into existing storage servers.

See the [Server Library](packages/server) for deployment instructions and examples.

See [Trivial Bubble Server](https://github.com/Bubble-Protocol/trivial-bubble-server) for an example implementation.

# Concepts & Definitions
## Bubbles

A **bubble** is the name given to a set of content controlled by a smart contract implementing the `AccessControlledStorage` interface above.

Each Bubble has a unique ID derived from the smart contract (contract address and chain ID) and the storage location of the bubble (normally the URL of the storage system's API).  The bubble ID forms part of the content id of each file the bubble controls.  See [Content IDs](#content-ids) below.

A bubble extends the concept of individual content to that of a container holding files and directories.  A bubble has a life cycle that follows it's smart contract, allowing it to be *created* and, more importantly, *terminated*. When a bubble's smart contract indicates it has been terminated (by setting the Bubble Terminated bit in all calls to it's `getAccessPermissions` method), the storage system is required to *pop* the bubble, deleting all bubble data. 

Files within a directory inherit their access permissions from their parent directory. Directories and files in a bubble can be listed (if the user has read permissions) to obtain such properties as length and modify time. These features can be useful to decentralised applications, enabling such features as device synchronisation and data backup.

Where supported by the storage system, clients can subscribe to files and directories to receive near real-time notifications when they are updated.  This allows bubbles to be used as basic back end servers for certain types of decentralised applications, such as messaging dapps and social media dapps.

The client library provides a `Bubble` class that encapsulates a bubble hosted on a remote storage system.  In addition to providing methods to read, write, append and delete content, it allows directories to be listed and the bubble to be managed.

See the [Client Library](packages/client) for details on accessing bubbles using the `ContentManager` or  `Bubble` class.

## Content IDs

Bubble Protocol Content IDs are identifiers that uniquely identify content across storage systems and blockchains.  A Content ID can represent either a file, a directory or a bubble.  They are base64-URL encoded strings containing the JSON for a `ContentID` object, i.e.:

```javascript
const contentId = Base64url.encode(JSON.stringify({
  chain: 1,
  contract: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30",
  provider: "http://127.0.0.1:8131",
  file: "0x0000000000000000000000000000000000000000000000000000000000000001"
}))
```
If the Content ID does not contain a `file` field then it refers to a bubble.

The `file` field is a 32-byte id that uniquely identifies the file within the bubble.  It is set by the user at design time so that it's access permissions can be encoded in the smart contract.  Hence, unlike a decentralised storage network like IPFS, a file's id does not change through the life cycle of the file, even if the contents are updated.

The `file` field may optionally include a path extension separated by the `/` character.  For example:

```
0x0000000000000000000000000000000000000000000000000000000000000001/hello-world.txt
```

This indicates it is a file within a directory in the bubble and will derive its access permissions from those of the directory.  A path extension can have any POSIX-compatible name but only one path extension is permitted in the `file` field.

See the [Client Library](packages/client/#content-ids) for details on how to construct content ids.