# Bubble SDK

The Bubble SDK contains the core, client and server side libraries for developers building with Bubble Protocol on EVM-based blockchains.  

## What is Bubble Protocol?

Bubble Protocol lets blockchains control and govern private off-chain data.  It is a blockchain-agnostic standard for access-controlled web3 storage systems, whether deployed on private servers or decentralised storage networks.  It can be used as the data layer for data tokenisation, cross-device DApp storage, web3 privacy compliance solutions, paywalled content, NFT content, and much more.

Access to off-chain content is controlled by a smart contract and enforced by the storage system.  Any smart contract can be designed to control off-chain content.  The smart contract identifies content by its `Content ID` and controls access through POSIX-like permissions, with read, write, append, execute and directory bits currently available.  

To use the Bubble Protocol a smart contract just needs to implement the following interface, returning the access permissions as a bit field:

```solidity
interface AccessControlledStorage {

  function getAccessPermissions( address user, uint256 contentId ) external view returns (uint256);

}
```

Once a contract has been deployed, content can be written to any storage system compatible with that blockchain.  The set of content controlled by a single smart contract instance is known as a **bubble**, with the bubble's unique ID deriving from the contract address and chain id.  See [Bubbles](#bubbles) below.

# SDK Overview
### Client Example

The client library allows decentralised applications to read and write content to any bubble-compatible storage system.  E.g.:

```javascript
import { ContentManager } from 'bubble-sdk';

const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
function signFunction(hash) {
  ...
}

const data = await ContentManager.read(contentId, signFunction);
```

See also [Bubbles](#bubbles) below.

### Server Example

The server-side library is used to deploy new Bubble storage services or integrate Bubble Protocol into existing storage servers.  E.g.:

```javascript
import { Guardian, DataServer } from 'bubble-sdk';
import Web3 from 'web3';
import http from 'http';


// User defined data server, e.g. file-based server or an interface to an existing database.
// See the packages/server/src/DataServer class for more information.

class MyDataServer extends DataServer {
  ... 
}


// Example HTTP server (no error handling)

class BubbleServer {

  constructor(port, guardian) {
    this.port = port;
    this.guardian = guardian;
    this.server = http.createServer(this._handleRequest.bind(this));
  }

  _handleRequest(req, res) {
      
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const request = JSON.parse(body);
        this.guardian.post(request.method, request.params)
          .then(result => {
            this._sendResponse(req, res, {result: result});
          })
          .catch(error => {
            this._sendResponse(req, res, {error: error});
          })
      });

  }

  _sendResponse(req, res, result) {
    const response = {
      jsonrpc: '2.0',
      ...result,
      id: req.id
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Server is listening on port ${this.port}`);
    });
  }

  close(callback) {
    this.server.close(callback);
  }

}


// Setup blockchain api

const CHAIN_ID = 1;
const BLOCKCHAIN_API = 'https://ethereum.infura.io/v3/YOUR_PROJECT_ID';
const blockchainProvider = new Web3Provider(CHAIN_ID, new Web3(BLOCKCHAIN_API), '0.0.2')


// Construct the Bubble Guardian and launch the server

const dataServer = new MyDataServer();
const guardian = new Guardian(dataServer, blockchainProvider);
const bubbleServer = new BubbleServer(8131, guardian);

bubbleServer.start();
```

## Bubbles

A *bubble* is the name given to the set of content controlled by a smart contract implementing the AccessControlledStorage interface above.

Each Bubble has a unique ID derived from the smart contract (contract address and chain ID) and the storage location of the bubble (normally the URL of the storage system's API).  The bubble ID forms part of the content id of each file the bubble controls.  See [Content IDs](#content-ids) below.

A bubble extends the concept of individual content to that of a container holding files and directories.  A bubble has a life cycle that follows it's smart contract, allowing it to be *created* and, more importantly, *terminated*. When a bubble's smart contract indicates it has been terminated (by setting the Bubble Terminated bit in all calls to it's `getAccessPermissions` method), the storage system is required to *pop* the bubble, deleting all bubble data. 

Files within a directory inherit their access permissions from their parent directory. Directories and files in a bubble can be listed (if the user has read permissions) to obtain such properties as length and modify time. These features can be useful to decentralised applications, enabling such features as device synchronisation and data backup.

Where supported by the storage system, clients can subscribe to files and directories to receive near real-time notifications when they are updated.  This allows bubbles to be used as basic back end servers for certain types of decentralised applications, such as messaging dapps and social media dapps.

The client library provides a `Bubble` class that encapsulates a bubble hosted on a remote storage system.  In addition to providing methods to read, write, append and delete content, it allows directories to be listed and the bubble to be managed.

```javascript
import { Bubble, bubbleProviders } from 'bubble-sdk';


// Identify the bubble (this example assumes the smart contract has already been deployed)

const bubbleId = new ContentID({
  chain: 1,
  contract: '0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30',
  provider: 'http://127.0.0.1:8131'
};

const filenames = {
  publicDir: '0x0000000000000000000000000000000000000000000000000000000000000001',
  welcome: '0x0000000000000000000000000000000000000000000000000000000000000001/welcome'
}


// Define a function for signing transactions

function signFunction(hash) {
  ...
}


// Construct a BubbleProvider for the remote storage system
const storageProvider = new bubbleProviders.HTTPBubbleProvider(new URL(bubbleId.provider));


// Construct the client interface to your bubble
const bubble = new Bubble(bubbleId, storageProvider, signFunction);


// Construct the bubble on the remote storage system
await bubble.create();


// Write some data to a file in your bubble
await bubble.write(filenames.welcome, 'Hello World!');


// List a directory, querying only for files modified in the last hour. Request long format, which includes create times, modify times and file length.
const listing = await bubble.list(filenames.publicDir, {long: true, since: Date.now()-3600000})

...

// Terminate the bubble.  Forces the storage provider to delete all bubble content if the contract indicates the bubble has been terminated.
await bubble.terminate();
```


## Content IDs

Bubble Protocol Content IDs are identifiers that uniquely identify content across storage systems and blockchains.  A Content ID can represent either a file or a bubble.  They are base64-URL encoded strings containing the JSON for a `ContentID` object, i.e.:

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

### Constructing Content IDs

Content IDs are easily constructed with the `ContentID` object, as follows:

```javascript
const contentId = new ContentID({
  chain: 1,
  contract: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30",
  provider: "http://127.0.0.1:8131",
  file: "0x0000000000000000000000000000000000000000000000000000000000000001"
});
```

An alternative way of obtaining a `ContentID` object is from a bubble's write, append and mkdir commands:

```javascript
const contentId = await bubble.write(ContentManager.toFileId(1), 'Hello World');
```

Or from a bubble's `getContentId` method:

```javascript
const contentId = bubble.getContentId(ContentManager.toFileId(1));
```


Once constructed, the content's shareable content id can be obtained with the `toString` method.
```
console.log(contentId.toString());
// eyJj...EifQ
```

Or as a decentralised identifier:

```
console.log(contentId.toDID());
// did:bubble:eyJj...EifQ
```
