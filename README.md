# Bubble SDK

The Bubble SDK contains javascript libraries for developers building with Bubble Protocol on EVM-based blockchains.

## Libraries

* [Core](./packages/core) - core classes, types, constants and utilities.
* [Client](./packages/client) - client libraries for application developers.
* [Server](./packages/server) - server-side libraries for developers of off-chain storage services.
* [Crypto](./packages/crypto) - cryptographic functions and classes for different blockchains.
* [Contracts](./contracts/) - the smart contract required interface and example contracts.

## Who Is This SDK For?


* Developers of decentralised applications.
* Developers of bubble-compatible off-chain storage services.
* Companies looking to move into Web3.

## What Is Bubble Protocol?

Bubble Protocol provides access-controlled off-chain storage for Web3 applications and allows blockchains to govern private data.  It adds Web3 capabilities to any storage system, whether a public relay server, decentralized storage network, home server, or private company infrastructure.

Bubble Protocol is blockchain agnostic and is designed to be highly adaptable, providing Web3 developers with an easy to use general purpose global data layer for data tokenisation, cross-device DApp storage, decentralised identity solutions, web3 privacy compliance solutions, paywalled content, NFT content, and much more.

https://bubbleprotocol.com

## How Does Bubble Protocol Work?

Bubble Protocol adds an access control layer to off-chain storage. Application developers can custom design smart contracts to govern access to content for specific users, specifying fine-grained permissions akin to POSIX-style permission bits. Enforcement of these permissions is carried out by the off-chain storage service, which is chosen by the user or developer.  

Custom smart contracts are simple to develop and need only implement a single method. Once a contract is deployed, the off-chain content can be saved on any bubble-compatible storage system that supports the user's preferred blockchain.  See [Access Control Contracts](./packages/client#access-control-contracts) in the Client Library for more information.

Each piece of off-chain content is uniquely identified globally by a *Content ID*.  See [Content IDs](./packages/client#content-ids) in the Client Library for more information.

The set of off-chain content controlled by a smart contract, combined with the on-chain logic of the contract itself, is known as a **bubble**, and is where Bubble Protocol gets it's name. For more details, see [Bubbles](#bubbles) below.

See the [whitepaper](https://bubbleprotocol.com/docs/whitepaper) for more details.
### Off-Chain Storage Services

Off-chain storage services can be public or private, centralised or decentralised.

The protocol allows each storage service to essentially function as a generic host for any bubble, allowing a single service to provide off-chain storage for any type of Web3 application.  Service providers can choose whether to provide an open, public service or a private service restricted to specific users, like customers or employees of a company.

Off-chain storage services can be implemented easily using the [Server Library](./packages/server/).

### Decentralisation

With all application logic on-chain, public off-chain storage services have few requirements beyond the quality of storage service they provide.  This partitioning, alongside cross-chain functionality and the ability of users to choose which service they trust for each application they use, cultivates a separation of concerns that helps to drive decentralization.

## Bubbles

A **bubble** is the name given to a set of content controlled by a smart contract implementing the `AccessControlledStorage` interface above.  It is where Bubble Protocol got it's name.

Each Bubble has a unique ID derived from the smart contract (contract address and chain ID) and the storage location of the bubble (normally the URL of the storage system's API).  The bubble ID forms part of the content id of each file the bubble controls.

A bubble extends the concept of individual content to that of a container holding files and directories.  A bubble has a life cycle that follows it's smart contract, allowing it to be *created* and, more importantly, *terminated*. When a bubble's smart contract indicates it has been terminated (by setting the Bubble Terminated bit in all calls to it's `getAccessPermissions` method), the storage system is required to *pop* the bubble, deleting all bubble data. 

Files within a directory inherit their access permissions from their parent directory. Directories and files in a bubble can be listed (if the user has read permissions) to obtain such properties as length and modify time. These features can be useful to decentralised applications, enabling such features as device synchronisation and data backup.

Where supported by the storage system, clients can subscribe to files and directories to receive near real-time notifications when they are updated.  This allows bubbles to be used as basic back end servers for certain types of decentralised applications, such as messaging dapps and social media dapps.

The client library provides a `Bubble` class that encapsulates a bubble hosted on a remote storage system.  In addition to providing methods to read, write, append and delete content, it allows directories to be listed and the bubble to be managed.

Bubbles can be managed and content can be accessed easily using the `ContentManager` and `Bubble` classes in the [Client Library](packages/client).