# Bubble Protocol Client Library

Client javascript library for accessing off-chain Web3 storage via [Bubble Protocol](https://bubbleprotocol.com).  

Part of the [Bubble Protocol SDK](https://github.com/Bubble-Protocol/bubble-sdk).

This client library allows decentralised applications to read and write content to any bubble-compatible storage system.

## Installation

```shell
npm i @bubble-protocol/client
npm i @bubble-protocol/crypto  # if you need to access private or encrypted content
```

## Overview

There are two ways to interact with content in a bubble:

* the [Content Manager](#content-manager) is a quick and easy way to access individual files via their [content id](#content-id) in bubbles that already exist.

* the [Bubble](#bubble-class) class is a more convenient way to interact with files and directories in a specific [bubble](#bubble), or to manage the bubble itself (create or delete it).



## Quick Start - Content Manager

Assumes a bubble has already been created on an off-chain storage service.

### Read A Public File
```javascript
import { PublicContentManager } from '@bubble-protocol/client';

PublicContentManager.read('<content-id>').then(console.log);
```

### Read A Private File
```javascript
import { ContentManager } from '@bubble-protocol/client';
import { ecdsa } from '@bubble-protocol/crypto';

ContentManager.read('<content-id>', ecdsa.getSignFunction('<private-key>')).then(console.log);
```

### Read A Private File Using Metamask
```javascript
const accounts = await window.ethereum.getAccounts();

const signFunction = (hash) => {
  return ethereum.request({
    method: 'personal_sign',
    params: [hash, accounts[0], 'Bubble content request'],
  })
  .then(toEthereumSignature);
}

ContentManager.read('<content-id>', signFunction).then(console.log);
```

### Read, Write, Append and List Encrypted Private Files
```javascript
import { BubbleContentManager, encryptionPolicies } from '@bubble-protocol/client';
import { ecdsa } from '@bubble-protocol/crypto';

const encryptionKey = new ecdsa.Key();

const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy(encryptionKey.privateKey);

const manager = new BubbleContentManager(
  ecdsa.getSignFunction('<private-key>'),
  encryptionPolicy
);

await manager.write('<content-id>', 'Hello');

await manager.append('<content-id>', ' World!');

manager.read('<content-id>').then(console.log);

manager.list('<content-id>').then(console.log);
```

## Quick Start - Bubble Class

Assumes a smart contract implementing the `AccessControlledStorage` interface has already been deployed to a blockchain.  See [Access Control Contracts](#access-control-contracts).

### Create A New Bubble
```javascript
import { Bubble, toFileId, bubbleProviders } from '@bubble-protocol/client';
import { ecdsa } from '@bubble-protocol/crypto';

const bubbleId = new ContentID({
  chain: <chain_id>,
  contract: '<contract_address>',
  provider: '<storage_service_url>'
});

const bubble = new Bubble(
  bubbleId,
  new bubbleProviders.HTTPBubbleProvider('<storage-provider-url>'),
  ecdsa.getSignFunction('<private-key>')
);

await bubble.create();

await bubble.write('<file_id>', 'Hello World!');
```

## Access Control Contracts

Any smart contract that implements the following interface can control off-chain content.  The `getAccessPermissions` method returns the given user's `tdlrwax--` access permissions for the given content identified by its content id.

```solidity
interface AccessControlledStorage {

  function getAccessPermissions( address user, uint256 contentId ) external view returns (uint256);

}
```

A smart contract that implements this interface is known generally as an *Access Control Contract*.

For implementation details see [AccessControlledStorage.sol](./contracts/AccessControlledStorage.sol).  

For examples, including tokenising data with an NFT, see [example contracts](./contracts/examples) or the [Creating A Bubble Example](#1-design-an-access-control-contract) section below.



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

The `file` field is a 32-byte id that uniquely identifies the file within the bubble.  It is set by the developer at design time so that it's access permissions can be encoded in the smart contract.  Hence, unlike a decentralised storage network like IPFS, a file's id does not change through the life cycle of the file, even if the contents are updated.

The `file` field may optionally include a path extension separated by the `/` character.  For example:

```
0x0000000000000000000000000000000000000000000000000000000000000001/hello-world.txt
```

This indicates it is a file within a directory in the bubble and will derive its access permissions from those of the directory.  A path extension can have any POSIX-compatible name but only one path extension is permitted in the `file` field.

### Constructing Content IDs

Content IDs are easily constructed with the `ContentID` object, as follows:

```javascript
// from it's bubble and file info
const contentId1 = new ContentID({
  chain: 1,
  contract: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30",
  provider: "http://127.0.0.1:8131",
  file: "0x0000000000000000000000000000000000000000000000000000000000000001"
});

// or from a shareable id or DID
const contentId2 = new ContentID('ef3...87c');
```

An alternative way of obtaining a `ContentID` object is from a bubble's `write`, `append` and `mkdir` commands:

```javascript
const contentId = await bubble.write(ContentManager.toFileId(1), 'Hello World');
```

Or from a bubble's `getContentId` method:

```javascript
const contentId = bubble.getContentId(ContentManager.toFileId(1));
```


Once constructed, the content's shareable content id can be obtained with the `toString` method.
```javascript
console.log(contentId.toString());
// eyJj...EifQ
```

Or as a decentralised identifier:

```javascript
console.log(contentId.toDID());
// did:bubble:eyJj...EifQ
```


## Content Manager

The Content Manager has methods to interact with content (`read`, `write`, `append` and `delete`), query content and directory metadata (`list`), make directories (`mkdir`) and query the user's access permissions (`getPermissions`) for individual files, directories and bubbles.  

Each method takes a content id and a sign function.

Example of writing and reading a file using the `ContentManager` (assumes you have a web3 provider, a content id and have rw access to the content):

```javascript
import { ContentManager } from '@bubble-protocol/client';
import { ecdsa } from '@bubble-protocol/crypto';

// Construct a sign function
const signFunction = ecdsa.getSignFunction('<private-key>')

// Identify the content, in this case from its base64 shareable content id
const contentId = 'eyJja...MDEifQ';

// write to the file (assumes you have permission)
await ContentManager.write(contentId, 'Hello World!', signFunction);

// read the content back
const data = await ContentManager.read(contentId, signFunction);
```

To avoid having to pass the sign function to every method call, construct your own content manager:

```javascript
import { BubbleContentManager } from '@bubble-protocol/client';

const manager = new BubbleContentManager(signFunction);

await manager.write(contentId, 'hello world');
```

## Bubble Class

The [`Bubble`](./src/Bubble.js) class encapsulates a bubble hosted on a remote storage system.  Once constructed, content within the bubble can be accessed through the methods of the `Bubble` class using just the content's file id.

Example of using the `Bubble` class to create a bubble, write a file, list a directory and terminate the bubble.  Assumes the bubble's smart contract is already deployed to the blockchain and that you have access permissions.

```javascript
import { Bubble, bubbleProviders } from '@bubble-protocol/client';
import { ContentId } from '@bubble-protocol/core';


// Identify the bubble (this example assumes the smart contract has already been deployed)

const bubbleId = new ContentID({
  chain: 1,                                                // Ethereum main chain
  contract: '0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30',  // Smart contract address
  provider: 'https://vault.bubbleprotocol.com/v2'          // Off-chain storage provider url
});

const filenames = {
  publicDir: ContentManager.toFileId(1),          // '0x0000000000000000000000000000000000000000000000000000000000000001'
  welcome: ContentManager.toFileId(1, 'welcome')  // '0x0000000000000000000000000000000000000000000000000000000000000001/welcome'
}


// Define a function for signing transactions

function signFunction(hash) {
  ...
}


// Construct a BubbleProvider for the remote storage system
const storageProvider = new bubbleProviders.HTTPBubbleProvider(bubbleId.provider);


// Construct the client interface to your bubble
const bubble = new Bubble(bubbleId, storageProvider, signFunction);


// Construct the bubble on the remote storage system.  Do not reject if it already exists.
await bubble.create({silent: true});


// Write some data to a file in your bubble
await bubble.write(filenames.welcome, 'Hello World!');


// List a directory, querying only for files modified in the last hour. Request long format, which includes create times, modify times and file length.
const listing = await bubble.list(filenames.publicDir, {long: true, since: Date.now()-3600000})

...

// terminate the smart contract on the blockchain

...

// Terminate the bubble.  Forces the storage provider to delete all bubble content if the contract indicates the bubble has been terminated.
await bubble.terminate();
```

## Encryption

By default neither the `ContentManager` nor the `Bubble` class encrypt data.  However, encrypting data in your bubble is easy with an [`EncryptionPolicy`](src/EncryptionPolicy.js).

An `EncryptionPolicy` provides the encryption functions and determines which content to encrypt/decrypt.  Content managers and `Bubble` instances call their policy's `isEncrypted()` function when reading from or writing to a file.  If that call returns true then the policy's  `encrypt()` or `decrypt()` function will be called as appropriate.

An encryption policy can be used on its own or can be passed to the `ContentManager` or `Bubble`, either in the constructor or via the `setEncryptionPolicy` method.

```javascript
import { BubbleFilename } from "@bubble-protocol/core";
import { encryptionPolicies, ContentManager } from '@bubble-protocol/client';

const filenames = {
  publicDir: ContentManager.toFileId(1),          // '0x0000000000000000000000000000000000000000000000000000000000000001'
  welcome: ContentManager.toFileId(1, 'welcome'), // '0x0000000000000000000000000000000000000000000000000000000000000001/welcome'
  privateDir: ContentManager.toFileId(2)          // '0x0000000000000000000000000000000000000000000000000000000000000002'
}

class MyEncryptionPolicy extends encryptionPolicies.AESGCMEncryptionPolicy {

  isEncrypted(contentId) {
    // Return false if the content is public, otherwise true;
    const filename = new BubbleFilename(contentId.file);
    return (filename.getPermissionedPart() !== filenames.publicDir );
  }

}

// construct the policy passing it an encryption key
const encryptionKey = '0xc65..9a7';
const encryptionPolicy = new MyEncryptionPolicy(encryptionKey);

// example 1: encrypt and decrypt some data directly
const encryptedData = await encryptionPolicy.encrypt('hello world');
const decryptedDataBuf = await encryptionPolicy.decrypt(encryptedData);
console.log(Buffer.from(decryptedDataBuf).toString());

// example 2: configure the ContentManager to use the policy (a Bubble is configured in the same way)
ContentManager.setEncryptionPolicy(encryptionPolicy);
```

## Creating a Bubble (Example)

Creating a bubble is a 3-step process:

1. **Design** an Access Control Contract suitable for your application (or use one of the [example contracts](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/contracts/examples)).
2. **Deploy** the contract to a blockchain of your choice.
3. **Create** the off-chain bubble on your chosen storage service using the `Bubble` class.

### 1) Design an Access Control Contract

Example contract that defines a public directory accessible to everyone, and a private directory accessible only to the contract owner and friends.

`AccessControlledStorage.sol` and `AccessControlBits.sol` are found in the [bubble-sdk](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/contracts).

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControlledStorage.sol";
import "./AccessControlBits.sol";


contract ExampleBubble is AccessControlledStorage {

    address owner = msg.sender;
    mapping(address => bool) friends;
    bool terminated = false;


    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        // If the bubble has been terminated, the off-chain storage service will delete the bubble and its contents
        if (terminated) return BUBBLE_TERMINATED_BIT;

        // File 0 is a special file that represents the root of the bubble. Only users with write permission 
        // to file 0 can construct the bubble on an off-chain storage service.
        else if (contentId == 0 && user == owner) return READ_BIT | WRITE_BIT | APPEND_BIT;

        // Owner has rwa access to both directories
        else if ((contentId == 1 || contentId == 2) && user == owner) return DIRECTORY_BIT | READ_BIT | WRITE_BIT | APPEND_BIT;

        // Friends have read access to the public directory
        else if (contentId == 1 && friends[user]) return DIRECTORY_BIT | READ_BIT;

        // Otherwise permission is denied
        else return NO_PERMISSIONS;
    }


    // Owner can set who their friends are
    function setFriend(address friend, bool permitted) external {
      require(msg.sender == owner, "permission denied");
      friends[friend] = permitted;
    }


    // Owner can terminate the bubble forcing the off-chain storage service to delete the bubble and its contents
    function terminate() external {
        require(msg.sender == owner, "permission denied");
        terminated = true;
    }

}
```

### 2) Deploy The Contract
Use one of the following options to deploy the contract to your blockchain of choice.

a) Use an online service like [remix](https://remix.ethereum.org).

... or: 

b) use `solc` and [Bubble Tools](https://github.com/Bubble-Protocol/bubble-tools)

```shell
solc ExampleBubble.sol --combined-json abi,bin | jq -r '.contracts["ExampleBubble.sol:ExampleBubble"]' > ExampleBubble.json

bubble contract deploy -f ExampleBubble.json
```

... or: 

c) use `solc` and deploy using `web3js` via your blockchain provider, e.g.:

```bash
solc ExampleBubble.sol --bin --abi
```


```javascript
import Web3 from 'web3';


async deploy(from, abi, bytecode, constructorParams=[]) {

  const contract = new web3.eth.Contract(abi);

  await contract.deploy({
      data: bytecode,
      arguments: constructorParams
    })
    .send({
      from: from,
      gas: 1500000,
      gasPrice: '30000000000000'
    })
    .on('receipt', receipt => {
      contract.options.address = receipt.contractAddress;
    })

  return contract;
}


const contractSrc = {
  bytecode: "6080604052336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600260006101000a81548160ff02191690831515021790555034801561006b57600080fd5b506106fc8061007b6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80630c08bf88146100465780636cb03b1f14610050578063c48dbf6a1461006c575b600080fd5b61004e61009c565b005b61006a60048036038101906100659190610526565b610147565b005b61008660048036038101906100819190610562565b610230565b604051610093919061060d565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461012a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610121906105ed565b60405180910390fd5b6001600260006101000a81548160ff021916908315150217905550565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146101d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101cc906105ed565b60405180910390fd5b80600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055505050565b6000600260009054906101000a900460ff161561026f577f800000000000000000000000000000000000000000000000000000000000000090506104e1565b6000821480156102ca575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b1561033b577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f2000000000000000000000000000000000000000000000000000000000000000171790506104e1565b600182148061034a5750600282145b80156103a1575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b15610434577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000007f400000000000000000000000000000000000000000000000000000000000000017171790506104e1565b60018214801561048d5750600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b156104dc577f20000000000000000000000000000000000000000000000000000000000000007f40000000000000000000000000000000000000000000000000000000000000001790506104e1565b600090505b92915050565b6000813590506104f681610681565b92915050565b60008135905061050b81610698565b92915050565b600081359050610520816106af565b92915050565b6000806040838503121561053957600080fd5b6000610547858286016104e7565b9250506020610558858286016104fc565b9150509250929050565b6000806040838503121561057557600080fd5b6000610583858286016104e7565b925050602061059485828601610511565b9150509250929050565b60006105ab601183610628565b91507f7065726d697373696f6e2064656e6965640000000000000000000000000000006000830152602082019050919050565b6105e781610677565b82525050565b600060208201905081810360008301526106068161059e565b9050919050565b600060208201905061062260008301846105de565b92915050565b600082825260208201905092915050565b600061064482610657565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b61068a81610639565b811461069557600080fd5b50565b6106a18161064b565b81146106ac57600080fd5b50565b6106b881610677565b81146106c357600080fd5b5056fea26469706673582212209c7f47dce43e4716c16fb9e52aaf67b00af408103c0f616307fcf42476799db664736f6c63430008000033",
  abi: [{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"contentId","type":"uint256"}],"name":"getAccessPermissions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"friend","type":"address"},{"internalType":"bool","name":"permitted","type":"bool"}],"name":"setFriend","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"terminate","outputs":[],"stateMutability":"nonpayable","type":"function"}]
}


const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url

const accounts = await web3.eth.getAccounts();

const contract = await deploy(accounts[0], contractSrc.abi, contractSrc.bytecode);
```

### 3) Create The Off-Chain Bubble

Use the `Bubble` class to create the off-chain bubble.

```javascript
import { Bubble, bubbleProviders } from '@bubble-protocol/client';
import { ContentId } from '@bubble-protocol/core';
import { Web3 } from web3;


// Define a function for signing transactions
const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url
const accounts = await web3.eth.getAccounts();
const signFunction = (hash) => web3.eth.sign(hash, accounts[0]);


// Setup your bubble
const bubbleId = new ContentId({
  chain: 1,
  contract: "0xa84..3b6",                           // replace with your contract address
  provider: 'https://vault.bubbleprotocol.com/v2'   // configure for your off-chain storage service
});


// Construct a `BubbleProvider` for the remote storage system.  Use a suitable provider
// type for your provider's protocol or create your own, e.g. to interface with your 
// local company infrastructure.
const storageProvider = new bubbleProviders.HTTPBubbleProvider(bubbleId.provider);


// Construct the `Bubble` class
const bubble = new Bubble(bubbleId, storageProvider, signFunction);


// Create the bubble on the off-chain storage service.
await bubble.create();
```

## Glossary

#### Access Control Contract

A smart contract that controls the access permissions for a bubble or content.  Implements the [AccessControlledStorage interface](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol). See [Access Control Contracts](#access-control-contracts) for more information.

#### Content ID

Globally unique identifier for a file, directory or bubble.  See [Content IDs](#content-ids) for more information.

#### Bubble

A bubble is an off-chain container for files and directories controlled by a smart contract (an *Access Control Contract*), and where Bubble Protocol got it's name.  Every piece of content is held in a bubble on an off-chain storage service, protected by the access permissions defined in its smart contract.  See the [bubble-sdk README](https://github.com/Bubble-Protocol/bubble-sdk#bubbles) for more information about bubbles, or the [Bubble Class](#bubble-class) above for how to interact with them.

#### Bubble Provider

A class used by a Content Manager or `Bubble` to post requests to a remote storage service using the service's communications protocol.  Most services use JSON-RPC 2.0 over HTTP or HTTPS and so the provided [`HTTPBubbleProvider`](src/bubble-providers/HTTPBubbleProvider.js) is used by default.

If your bubble server uses a different protocol then you can create your own provider to implement the [`BubbleProvider`](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/packages/core/src/BubbleProvider.js) interface.  This can be passed to a `Bubble` on construction.

#### Encryption Policy

A user-defined policy given to a Content Manager or `Bubble` that describes which content should be encrypted and provides the encryption algorithm.  See [Encryption](#encryption).

#### Sign Function

The sign function is passed to the `ContentManager` or a `Bubble` instance to sign each content request before submitting it to an off-chain storage service.  The signature identifies the user to the off-chain storage service.  It is a user-defined function and depends on the platform (e.g. browser, Node.js) and on your application's identity strategy (whether you use Metamask, WalletConnect, a local blockchain node, a local private key, etc).

Example using the Crypto Library `Key` class:

```javascript
const key = new ecdsa.Key('<private_key>');
const signFunction = key.promiseToSign;
```

Example using the Crypto Library `sign` function:

```javascript
const signFunction = (hash) => Promise.resolve(ecdsa.sign(hash, '<private_key>'));
```

Example of a web3.js sign function:

```javascript
const accounts = await web3.eth.getAccounts();
const signFunction = (hash) => web3.eth.sign(hash, accounts[0]).then(toEthereumSignature);
```
**NB**: observe the `.then(toEthereumSignature)` extension in the example above.  Since Ethereum wallets prefix signed messages with the string `"\x19Ethereum Signed Message:\n"+message.length`, any sign function that uses an Ethereum-type wallet must pass its output to the `toEthereumSignature` function defined in the Crypto Library.  This prepares the signature so that the storage server's Guardian software will recognise it as having a prefix and handle it accordingly.

## Dependencies

[`@bubble-protocol/core`](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/packages/core)

[`@bubble-protocol/crypto`](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/packages/crypto)