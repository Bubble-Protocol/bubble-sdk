# Bubble Protocol Client Library

Client javascript library for accessing off-chain Web3 storage via [Bubble Protocol](https://bubbleprotocol.com).  

Part of the [Bubble Protocol SDK](https://github.com/Bubble-Protocol/bubble-sdk).

This client library allows decentralised applications to read and write content to any bubble-compatible storage system.

See also the [Bubble Tools](https://github.com/Bubble-Protocol/bubble-tools) command line utility for developers.

The Bubble Private Cloud is a cloud-based bubble provider available to developers for development and experimental purposes.  It supports common blockchains. See its [homepage](https://vault.bubbleprotocol.com) for a list of available endpoints.

## Installation

```shell
npm i @bubble-protocol/client
npm i @bubble-protocol/crypto  # if you need to access private or encrypted content
```

## Overview

There are two ways to interact with content in a bubble:

* the [Content Manager](#content-manager) is a quick and easy way to access individual files via their [content id](#content-id) in bubbles that already exist.

* the [Bubble](#bubble-class) class is a more powerful way to interact with files and directories in a specific [bubble](#bubble), or to manage the bubble itself (create or delete it). The [BubbleFactory](#bubblefactory) provides an easy way to construct common Bubble patterns, like those with encryption and multiple users.

Data encryption is achieved via [Encryption Policies](#encryption), optionally passed to the Content Manager or Bubble class.

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
  return window.ethereum.request({
    method: 'personal_sign',
    params: [hash, accounts[0], 'Bubble content request'],
  })
  .then(toEthereumSignature);
}

ContentManager.read('<content-id>', signFunction).then(console.log);
```

### Read, Write and List Encrypted Private Files
```javascript
import { BubbleContentManager, encryptionPolicies } from '@bubble-protocol/client';
import { ecdsa } from '@bubble-protocol/crypto';

const encryptionKey = new ecdsa.Key();

const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy(encryptionKey.privateKey);

const manager = new BubbleContentManager(
  ecdsa.getSignFunction('<private-key>'),
  encryptionPolicy
);

await manager.write('<content-id>', 'Hello World!');

manager.read('<content-id>').then(console.log);

manager.list('<content-id>').then(console.log);
```

## Quick Start - Bubble Class

Assumes a smart contract implementing the `AccessControlledStorage` interface has already been deployed to a blockchain.  See [Access Control Contracts](#access-control-contracts).

### Create A New Bubble
```javascript
import { Bubble, bubbleProviders } from '@bubble-protocol/client';
import { ContentID } from '@bubble-protocol/core';
import { ecdsa } from '@bubble-protocol/crypto';

const bubbleId = new ContentID({
  chain: <chain_id>,
  contract: '<contract_address>',
  provider: '<storage_service_url>'
});

const bubble = new Bubble(
  bubbleId,
  new bubbleProviders.HTTPBubbleProvider(bubbleId.provider),
  ecdsa.getSignFunction('<private-key>')
);

await bubble.create();

await bubble.write('<file_id>', 'Hello World!');
```

## Quick Start - BubbleFactory

Examples of creating Bubbles using the `BubbleFactory`.

### Create an Encrypted Bubble

```javascript
const bubbleId = new ContentID({
  chain: <chain_id>,
  contract: '<contract_address>',
  provider: '<storage_service_url>'
});

const bubbleFactory = new BubbleFactory(ecdsa.getSignFunction('<private-key>'));

const bubble = bubbleFactory.createAESGCMEncryptedBubble(bubbleId);

await bubble.create();

await bubble.write('<file-id>', 'Hello World!');
```

### Create a Multi-User Encrypted Bubble

A multi-user bubble is an encrypted bubble with a metadata file for each user. Each metadata file contains the bubble's encryption key plus any custom metadata, and is ECIES encrypted with the user's public key.  This prevents the need to pre-share encryption keys with users.

Assumes a smart contract implementing the `AccessControlledStorage` interface has already been deployed to a blockchain giving all users access to at least their metadata file.  See [Access Control Contracts](#access-control-contracts).

```javascript
const key = new Key('<private-key>');

const bubbleId = new ContentID({
  chain: <chain_id>,
  contract: '<contract_address>',
  provider: '<storage_service_url>'
});

const bubbleFactory = new BubbleFactory(ecdsa.getSignFunction(key.privateKey), key);

const bubble = bubbleFactory.createAESGCMEncryptedMultiUserBubble(bubbleId);

await bubble.create();

await bubble.addUser('<user-address>', '<user-public-key>', {<optional-metadata>});
```

### Use any User-Encrypted Bubble

A user encrypted bubble holds a metadata file for the user containing the bubble's encryption key, ECIES encrypted with the user's public key.  This prevents the need to store the encryption key locally.

Assumes a smart contract implementing the `AccessControlledStorage` interface has already been deployed to a blockchain and the user has access to at least their metadata file.  See [Access Control Contracts](#access-control-contracts).

```javascript
const key = new Key('<user-private-key>');

const bubbleId = new ContentID({
  chain: <chain_id>,
  contract: '<contract_address>',
  provider: '<storage_service_url>'
});

const bubbleFactory = new BubbleFactory(ecdsa.getSignFunction(key.privateKey), key);

const bubble = bubbleFactory.createAESGCMEncryptedUserBubble(bubbleId);

await bubble.initialise();

await bubble.write('<file-id>', 'Hello World!');
```

## Access Control Contracts

Any smart contract that implements the following interface can control off-chain content.  The `getAccessPermissions` method returns the given user's `tdrwax--` access permissions for the given content identified by its content id.

```solidity
interface AccessControlledStorage {

  function getAccessPermissions( address user, uint256 contentId ) external view returns (uint256);

}
```

A smart contract that implements this interface is known generally as an *Access Control Contract*.

For implementation details see [AccessControlledStorage.sol](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol).  

For examples, including tokenising data with an NFT, see [example contracts](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/examples) or the [Creating A Bubble Example](#creating-a-bubble-example) section below.



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

This indicates it is a file within a directory in the bubble and will derive its access permissions from those of the directory.  A path extension can have any POSIX-compatible name but only one path extension is permitted per `file` field.

File zero is reserved and means the root of the bubble itself.  Only users with write permissions to file `0` can create the bubble on an off-chain storage service.  Listing file `0` will return a list of all files and directories in the bubble.
```javascript
import { ROOT_PATH } from '@bubble-protocol/core';

bubble.list(ROOT_PATH).then(console.log);
``` 

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
const contentId = await bubble.write(bubble.toFileId(1), 'Hello World');
```

Or from a bubble's `getContentId` method:

```javascript
const contentId = bubble.getContentId(bubble.toFileId(1));
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

The [`Bubble`](./src/Bubble.js) class encapsulates a bubble hosted on a remote storage system. Once constructed, content within the bubble can be accessed through the methods of the `Bubble` class using just the content's file id.  

The Bubble class is designed to be extended to meet your use case.  This SDK includes some off-the-shelf bubble implementations in the [bubbles](./src/bubbles/) directory.  See [`BubbleFactory`](#bubblefactory)

Example of using the `Bubble` class to create a bubble, write a file, list a directory and terminate the bubble.  Assumes the bubble's smart contract is already deployed to the blockchain and that you have access permissions.

```javascript
import { Bubble, bubbleProviders, toFileId } from '@bubble-protocol/client';
import { ContentId } from '@bubble-protocol/core';


// Identify the bubble (this example assumes the smart contract has already been deployed)

const bubbleId = new ContentID({
  chain: 1,                                                 // Ethereum main chain
  contract: '0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30',   // Smart contract address
  provider: 'https://vault.bubbleprotocol.com/v2/ethereum'  // Off-chain storage provider url
});

const filenames = {
  publicDir: toFileId(1),          // '0x0000000000000000000000000000000000000000000000000000000000000001'
  welcome: toFileId(1, 'welcome')  // '0x0000000000000000000000000000000000000000000000000000000000000001/welcome'
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

## BubbleFactory

The `BubbleFactory` can be used to construct common instances of the `Bubble` class with features such as encryption or multiple users.

See [`BubbleFactory.js`](./src/bubbles/BubbleFactory.js) for the complete list of construction patterns.

## Encryption

By default neither the `ContentManager` nor the `Bubble` class encrypt data.  However, encrypting data in your bubble is easy with an [`EncryptionPolicy`](src/EncryptionPolicy.js).

An `EncryptionPolicy` provides the encryption functions and determines which content to encrypt/decrypt.  Content managers and `Bubble` instances call their policy's `isEncrypted()` function when reading from or writing to a file.  If that call returns true then the policy's  `encrypt()` or `decrypt()` function will be called as appropriate.

Multiple policies can be merged into a single policy using the [`MultiEncryptionPolicy`](./src/encryption-policies/MultiEncryptionPolicy.js) class.

An encryption policy can be used on its own or can be passed to the `ContentManager` or `Bubble`, either in the constructor or via the `setEncryptionPolicy` method.  The `BubbleFactory` uses encryption policies to provide common patterns for encrypted bubbles, which can be overridden via the options parameter.

```javascript
import { BubbleFilename } from "@bubble-protocol/core";
import { encryptionPolicies, ContentManager, toFileId } from '@bubble-protocol/client';

const filenames = {
  publicDir: toFileId(1),           // '0x0000000000000000000000000000000000000000000000000000000000000001'
  welcome: toFileId(1, 'welcome'),  // '0x0000000000000000000000000000000000000000000000000000000000000001/welcome'
  privateDir: toFileId(2)           // '0x0000000000000000000000000000000000000000000000000000000000000002'
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

## User Management

A `UserManager` adds user management capabilities to a `Bubble`.  It allows bubbles to be accessed by multiple users or devices without needing to pre-share the bubble's encryption key(s).  Users can be added to a bubble by simply passing their public key to the manager.  They will of course need the appropriate permissions set in the bubble's smart contract.

The manager maintains a separate file in the bubble for each user containing the bubble's encryption policy (including encryption keys) and any custom metadata you provide. Each file is ECIES encrypted with the user's public key so that only they can read it and recover the bubble's encryption keys.

There are currently two user managers available in the SDK:

- `SingleUserManager` - allows the local user to load the bubble's encryption keys on initialisation.
- `MultiUserManager` - extends `SingleUserManager` to allow other users to be added to the bubble.

Extend the `UserManager` base class to implement your own custom user manager.

In the following example, Alice and Bob create a shared bubble that only they can access and decrypt.  Bob passes his public key to Alice who creates the bubble (assumes the contract has already been deployed).  Alice passes the bubble's content ID back to Bob who can then initialise his bubble.

```javascript
// On Alice's device

const aliceKey = new ecdsa.Key('0x...');

const bobPublicKey = '0x...'; // given by Bob

const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy();

const userManager = new MultiUserManager(aliceKey, undefined, [bobPublicKey]);

const bubble = new Bubble(bubbleId, provider, aliceKey.signFunction, encryptionPolicy, userManager);

await bubble.create();

await bubble.write(toFileId(1), 'Hi Bob!')

...

// On Bob's device

const bobKey = new ecdsa.Key('0x...');

const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy();

const userManager = new MultiUserManager(bobKey);

const bubble = new Bubble(bubbleId, provider, bobKey.signFunction, encryptionPolicy, userManager);

await bubble.initialise();

await bubble.read(toFileId(1)).then(console.log);
```
During the create process the user manager writes both Alice and Bob's user metadata files to the bubble.  By default the files are named after each user's public address. The files are encrypted so only Alice can read her file and only Bob can read his. Each file contains the serialised encryption policy, including the encryption key.  

During the initialisation process, the user manager reads Bob's user metadata file, decrypts it with his key and deserialises the encryption policy, setting the encryption key.  Both Bob and Alice now have the encryption key and can share files within the bubble.

Note, the `BubbleFactory` can be used instead to construct the bubble instance:

```javascript
const bubbleFactory = new BubbleFactory(aliceKey.signFunction, aliceKey);

const bubble = bubbleFactory.createAESGCMEncryptedMultiUserBubble(bubbleId, {otherUsers: [bobPublicKey]});
```

## Delegation

Bubble Protocol supports key delegation, which allows a different private key to be used to access a bubble on behalf of the delegation signer.  This is designed primarily to allow applications to access bubble content without requesting a signature from the user's wallet each time.

By default, delegations have an expiry time and are restricted to a specific bubble.  Multiple permissions can be given to a delegate.

### Constructing Delegations

A Delegation is created using the `Delegation` class and is signed by the private key that is delegating the permission:

```javascript
const signFunction = ...

const delegation = new Delegation('<delegate-address>', <expiry-time>);

delegation.permitAccessToBubble(<bubble-id>);

await delegation.sign(signFunction);
```

The sign function has the same form as the sign function passed to the `ContentManager`.

### Using Delegations

To use a signed delegation, it must be returned by the sign function passed to the `ContentManager` or `Bubble`, since it forms part of a request's signature, not part of the request itself.

```javascript
const signFunction = toDelegateSignFunction(ecdsa.getSignFunction('<private-key>'), delegation);
```

Or, if using Metamask or another third party wallet:

```javascript
const accounts = await window.ethereum.getAccounts();

const signFunction = (hash) => {
  return window.ethereum.request({
    method: 'personal_sign',
    params: [hash, accounts[0], 'Bubble content request'],
  })
  .then(sig => toEthereumSignature(sig, delegation));
}
```

### Revoking Delegations

Support for revoking delegations on-chain is in development.

## Subscriptions

Subscriptions give you real-time notifications of updates to files and directories within your bubble.  

- Subscribing to a file will notify your listener function whenever the file is written, appended or deleted.  

- Subscribing to a directory will notify your listener function whenever the directory is created or deleted, or whenever a file within the directory is written, appended or deleted.

Subscriptions are only available over a WebSocket connection.

*Note, it is optional for off-chain storage services to support subscriptions, so check with your service provider.*


```javascript
function listener(notification, error) {
  if (error) console.warn(error);
  else {
    console.log(notification);
  }
}

// Construct a WebSocket provider for the remote storage system
const storageProvider = new bubbleProviders.WebsocketBubbleProvider(bubbleId.provider);

// Construct the client interface to your bubble
const bubble = new Bubble(bubbleId, storageProvider, signFunction);

// Subscribe to a file
const subscription = await bubble.subscribe('<fileId>', listener, {...options});

...

// Unsubscribe when no longer needed
await bubble.unsubscribe(subscription.subscriptionId);

```

### File Subscriptions

Subscribe Options:

- `list: <boolean>` set to `true` to exclude the `data` field from all notifications.
- `read: <boolean>` set to `true` to include the file contents as a `data` field in the subscription response.

File notifications are objects with the following structure:
```javascript
{
  subscriptionId: <any>,  // subscription id matching that returned by the subscribe method
  event: <'write'|'append'|'delete'>,
  file: {
    name: <string>,      // the file id
    type: 'file',
    length: <number>,    // length of the file in bytes
    created: <number>,   // created time (UNIX time in ms)
    modified: <number>   // last modified time (UNIX time in ms)
  },
  data: <string>         // contents of the written file or the appended data
}
```

### Directory Subscriptions

Subscribe Options:

- `list: <boolean>` set to `true` to include the full directory listing as a `data` field in the subscription response.
- `since: <time>` include a directory listing, as a `data` field in the subscription response, containing all files created or updated since (but not on) the given time.

Directory notifications are objects with the following structure:
```javascript
{
  subscriptionId: <any>,  // subscription id matching that returned by the subscribe method
  event: <'mkdir'|'delete'|'update'>,
  file: {
    name: <string>,      // the directory's file id
    type: 'file',
    length: <number>,    // number of files within the directory
    created: <number>,   // created time (UNIX time in ms)
    modified: <number>   // last time a file was added or deleted (UNIX time in ms)
  },
  data: <array>          // list of updated files that triggered the notification (only applies to update notifications)
}
```

Each entry in the `data` array contains the long-form listing of the file plus an `event` field indicating `write`, `append` or `delete`.

## Creating a Bubble (Example)

For this example we'll create a private, encrypted file storage bubble.  It will contain a private area for backing up personal files, and a shared area for sharing files with authorised friends and family. 

Creating a bubble is a 3-step process:

1. **Design** an Access Control Contract suitable for your application (or use one of the [example contracts](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/contracts/examples)).
2. **Deploy** the contract to a blockchain of your choice.
3. **Create** the off-chain bubble on your chosen storage service using the `Bubble` class.

### 1) Design an Access Control Contract

To achieve our goals we'll define a contract that contains two private directories:
1. Shared Directory - read/writable by the contract owner and readable by authorised friends and family.
2. Private Directory - read/writable by the contract owner only.

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

        // Owner has read/write access to all other files
        else if (user == owner) return READ_BIT | WRITE_BIT | APPEND_BIT;

        // Friends have read access to the public directory
        else if (contentId == 1 && friends[user]) return DIRECTORY_BIT | READ_BIT;

        // Friends have read access to their own user metadata file (see User Managers)
        else if (contentId == uint256(uint160(user)) && friends[user]) return READ_BIT;

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

Use one of the following options to deploy the contract to your blockchain of choice:

a) use an online service like [remix](https://remix.ethereum.org)

... or

b) use `solc` and [Bubble Tools](https://github.com/Bubble-Protocol/bubble-tools)

```shell
solc ExampleBubble.sol --combined-json abi,bin | jq -r '.contracts["ExampleBubble.sol:ExampleBubble"]' > ExampleBubble.json

bubble contract deploy -f ExampleBubble.json --save example-bubble
```

... or

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
      gasPrice: '10000000000'
    })
    .on('receipt', receipt => {
      contract.options.address = receipt.contractAddress;
    })

  return contract;
}


const contractSrc = {
  bytecode: "6080604052336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600260006101000a81548160ff02191690831515021790555034801561006b57600080fd5b506108578061007b6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80630c08bf88146100465780636cb03b1f14610050578063c48dbf6a1461006c575b600080fd5b61004e61009c565b005b61006a60048036038101906100659190610681565b610147565b005b610086600480360381019061008191906106bd565b610230565b6040516100939190610768565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461012a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161012190610748565b60405180910390fd5b6001600260006101000a81548160ff021916908315150217905550565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146101d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101cc90610748565b60405180910390fd5b80600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055505050565b6000600260009054906101000a900460ff161561026f577f8000000000000000000000000000000000000000000000000000000000000000905061063c565b6000821480156102ca575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b1561033b577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000001717905061063c565b600182148061034a5750600282145b80156103a1575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b15610434577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000007f4000000000000000000000000000000000000000000000000000000000000000171717905061063c565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156104f4577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000001717905061063c565b60018214801561054d5750600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b1561059c577f20000000000000000000000000000000000000000000000000000000000000007f400000000000000000000000000000000000000000000000000000000000000017905061063c565b8273ffffffffffffffffffffffffffffffffffffffff168214801561060a5750600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b15610637577f2000000000000000000000000000000000000000000000000000000000000000905061063c565b600090505b92915050565b600081359050610651816107dc565b92915050565b600081359050610666816107f3565b92915050565b60008135905061067b8161080a565b92915050565b6000806040838503121561069457600080fd5b60006106a285828601610642565b92505060206106b385828601610657565b9150509250929050565b600080604083850312156106d057600080fd5b60006106de85828601610642565b92505060206106ef8582860161066c565b9150509250929050565b6000610706601183610783565b91507f7065726d697373696f6e2064656e6965640000000000000000000000000000006000830152602082019050919050565b610742816107d2565b82525050565b60006020820190508181036000830152610761816106f9565b9050919050565b600060208201905061077d6000830184610739565b92915050565b600082825260208201905092915050565b600061079f826107b2565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b6107e581610794565b81146107f057600080fd5b50565b6107fc816107a6565b811461080757600080fd5b50565b610813816107d2565b811461081e57600080fd5b5056fea264697066735822122079800c328f4ff596d6fb573b3dbcaa9b24ad8e13456bcb5c236ae87eee43cc7b64736f6c63430008000033",
  abi: [{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"contentId","type":"uint256"}],"name":"getAccessPermissions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"friend","type":"address"},{"internalType":"bool","name":"permitted","type":"bool"}],"name":"setFriend","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"terminate","outputs":[],"stateMutability":"nonpayable","type":"function"}]
}


const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url

const accounts = await web3.eth.getAccounts();

const contract = await deploy(accounts[0], contractSrc.abi, contractSrc.bytecode);
```

### 3) Create The Off-Chain Bubble

Use the `Bubble` class to create the off-chain bubble.

In this case, our bubble will have the following features:
- **Key Delegation**: our wallet will delegate temporary access to a local device key so that it doesn't need to be consulted every time the bubble is accessed from our dApp.
- **Encryption Policy**: AESGCM encrypted throughout
- **User Management**: Multi-user (encryption key will be shared with authorised friends and family)

```javascript
import Web3 from 'web3';
import { Bubble, bubbleProviders, Delegation, encryptionPolicies, userManagers, toEthereumSignature, toDelegateSignFunction } from '@bubble-protocol/client';
import { ContentId } from '@bubble-protocol/core';
import { ecdsa } from '@bubble-protocol/crypto';


// Identify your bubble
const bubbleId = new ContentId({
  chain: 1,
  contract: "0xa84..3b6",                                   // replace with your contract address
  provider: 'https://vault.bubbleprotocol.com/v2/ethereum'  // configure for your off-chain storage service
});

// Create a new private key for this device (store it in your app or, if browser based, in local storage)
const deviceKey = new ecdsa.Key();

// Delegate the device key to act as your wallet account when accessing just this bubble for 1 year
const delegation = new Delegation(deviceKey.address, Date.now()/1000+60*60*24*365);
delegation.permitAccessToBubble(bubbleId);

// Sign the delegation using your wallet key
const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url or use a different signing strategy
const accounts = await web3.eth.getAccounts();
await delegation.sign((hash) => {
  return web3.eth.sign(hash, accounts[0])
  .then(toEthereumSignature)
})

// Construct a `BubbleProvider` appropriate to the API of the remote storage system.
const storageProvider = new bubbleProviders.HTTPBubbleProvider(bubbleId.provider);

// Define the encryption policy for the bubble
const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy();

// Define a user manager so that friends and family can retrieve the encryption key
const userManager = new userManagers.MultiUserManager(deviceKey);

// Construct the `Bubble` class
const bubble = new Bubble(
  bubbleId, 
  storageProvider, 
  toDelegateSignFunction(deviceKey.signFunction, delegation), 
  encryptionPolicy, 
  userManager
);

// Create the bubble on the off-chain storage service.
await bubble.create();
```

#### Add a Friend

To add a friend to the bubble, use their public key:

```javascript
const friendPublicKey = '0x123...def';  // configure to your friend's public key

// First add your friend to the smart contract
const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url or use a different signing strategy
const accounts = await web3.eth.getAccounts();
const contract = new web3.eth.Contract(contractSrc.abi, bubble.contentId.contract);

await contract.methods.setFriend(ecdsa.publicKeyToAddress(friendPublicKey), true).send({
    from: accounts[0],
    gas: 1500000,
    gasPrice: '10000000000'
  })

// Next construct their user metadata file containing the bubble encryption key
await bubble.userManager.addUser(friendPublicKey);
```


## Glossary

#### Access Control Contract

A smart contract that controls the access permissions for a bubble or content.  Implements the [AccessControlledStorage interface](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol). See [Access Control Contracts](#access-control-contracts) for more information.

#### Content ID

Globally unique identifier for a file, directory or bubble.  See [Content IDs](#content-ids) for more information.

#### Bubble

A bubble is an off-chain container for files and directories controlled by a smart contract (an *Access Control Contract*), and where Bubble Protocol got it's name.  Every piece of content is held in a bubble on an off-chain storage service, protected by the access permissions defined in its smart contract.  See the [bubble-sdk README](https://github.com/Bubble-Protocol/bubble-sdk#bubbles) for more information about bubbles, or the [Bubble Class](#bubble-class) above for how to interact with them.

#### Bubble Manager

A class used by a [`ManagedBubble`](#managedbubble) to automatically manage content within a bubble. A bubble manager handles the construction of content at create time, the reading of content at initialisation time, and automatically re-subscribes to content when the server reconnects after a connection failure.

#### Bubble Provider

A class used by a Content Manager or `Bubble` to post requests to a remote storage service using the service's communications protocol.  Most services use JSON-RPC 2.0 over HTTP or HTTPS and so the provided [`HTTPBubbleProvider`](src/bubble-providers/HTTPBubbleProvider.js) is used by default.

If your bubble server uses a different protocol then you can create your own provider to implement the [`BubbleProvider`](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/packages/core/src/BubbleProvider.js) interface.  This can be passed to a `Bubble` on construction.

#### Delegation

A [`Delegation`](#delegation) lets a private key construct a signed permission for a different key to temporarily access a bubble.  Delegations are designed to allow multiple applications on multiple devices to act as one, but they can be used for other use cases too.

#### Encryption Policy

A user-defined policy given to a Content Manager or `Bubble` that describes which content should be encrypted and provides the encryption algorithm(s).  See [Encryption](#encryption).

#### Sign Function

The sign function is passed to the `ContentManager` or a `Bubble` instance to sign each content request before submitting it to an off-chain storage service.  The signature identifies the user to the off-chain storage service.  It is a user-defined function and depends on the platform (e.g. browser, Node.js) and on your application's identity strategy (whether you use Metamask, WalletConnect, a local blockchain node, a local private key, etc).

Example using the Crypto Library `Key` class:

```javascript
const key = new ecdsa.Key('<private_key>');
const signFunction = key.promiseToSign;
```

Example using the Crypto Library `sign` function:

```javascript
const signFunction1 = ecdsa.getSignFunction('<private_key>');

// is equivalent to

const signFunction2 = (hash) => Promise.resolve(ecdsa.sign(hash, '<private_key>'));
```

Example of a web3.js sign function:

```javascript
const accounts = await web3.eth.getAccounts();

const signFunction = (hash) => web3.eth.sign(hash, accounts[0]).then(toEthereumSignature);
```
**NB**: observe the `.then(toEthereumSignature)` chain in the example above.  Since Ethereum wallets prefix signed messages with the string `"\x19Ethereum Signed Message:\n"+message.length`, any sign function that uses an Ethereum-type wallet must pass its output to the `toEthereumSignature` function defined in the Crypto Library.  This prepares the signature so that the storage server's Guardian software will recognise it as having a prefix and handle it accordingly.

#### Subscription

[Subscriptions](#subscriptions) provide the client of a `Bubble` with near real-time notifications of updates to content.  Subscribing to a file will instruct the host bubble server to notify the client whenever the file is created, updated or deleted.  Subscribing to a directory will result in a notification whenever the directory is created or deleted, or when a file within it is created, updated or deleted.  Subscriptions only work over a WebSocket connection and are subject to the user having read permission for the subscribed content.

## Dependencies

[`@bubble-protocol/core`](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/packages/core)

[`@bubble-protocol/crypto`](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/packages/crypto)
