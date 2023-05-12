# Bubble Protocol Server Library

Server-side library for implementing [Bubble](https://bubbleprotocol.com) servers.  Part of the [Bubble Protocol SDK](https://github.com/Bubble-Protocol/bubble-sdk).

The server-side library is used to deploy new off-chain storage services or integrate Bubble Protocol into existing infrastructure.

## Components

The primary software components provided by this library are the `Guardian` and the `DataServer`.

### Guardian

The [`Guardian`](src/Guardian.js) class is responsible for validating an incoming bubble request, checking it's syntax, structure and user permissions.  It interacts with the bubble's smart contract to confirm the sender has the appropriate access permissions for the specific request, and that the bubble has not been terminated.  Malformed or denied requests are rejected while permitted requests are forwarded on to the Data Server, which provides the underlying storage capability.

### Data Server

The Data Server is responsible for serving the bubble content and processing valid, permitted requests.  It is user-defined, allowing content to be served from a source of your choosing, such as a file system, database, CMS, decentralised storage network or other infrastructure.  

* A file system based implementation can be found in the [Trivial Bubble Server](https://github.com/Bubble-Protocol/trivial-bubble-server).

* A RAM based implementation can be found in the [bubble-sdk](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/test/mockups/RamBasedDataServer.js), which may be useful for testing purposes.

A Data Server is an implementation of the [`DataServer`](src/DataServer.js) interface.  Requirements for the interface can be found in that file.  A Data Server must pass the acceptance tests found in the [Data Server Test Suite](./test/DataServerTestSuite/).  See [Testing Your Server](#testing-your-server) for more details.


## Example Server

Example of a JSONRPC 2.0 web server.

```javascript
import { Guardian, DataServer } from '@bubble-protocol/server';
import { blockchainProviders } from '@bubble-protocol/core';
import Web3 from 'web3';
import http from 'http';


// User defined data server, e.g. file-based server or an interface to an existing database.
// See the src/DataServer.js for more information.

class MyDataServer extends DataServer {
  ... 
}


// Example HTTP server (needs error handling!)

class BubbleServer {

  constructor(port, guardian) {
    this.port = port;
    this.guardian = guardian;
    this.server = http.createServer(this._handleRequest.bind(this));
  }

  _handleRequest(req, res) {
      
      let body = '';

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
            this._sendResponse(req, res, error.toObject());
          })
      });

  }

  _sendResponse(req, res, result) {
    const response = {
      ...result,
      jsonrpc: '2.0',
      id: req.id
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
  }

  start(callback) {
    this.server.listen(this.port, callback);
  }

  close(callback) {
    this.server.close(callback);
  }

}

// Config

const SERVER_PORT = 8131;
const CHAIN_ID = 1;
const BLOCKCHAIN_API = 'https://ethereum.infura.io/v3/YOUR_PROJECT_ID';


// Setup blockchain api
const blockchainProvider = new blockchainProviders.Web3Provider(CHAIN_ID, new Web3(BLOCKCHAIN_API), '0.0.2')


// Construct the Bubble Guardian
const dataServer = new MyDataServer();
const guardian = new Guardian(dataServer, blockchainProvider);
const bubbleServer = new BubbleServer(SERVER_PORT, guardian);

// Launch the server
bubbleServer.start(() => console.log('server started'));
```

## Testing Your Server

The [Data Server Test Suite](./test/BubbleServerTestSuite/) is a unit test suite for a `DataServer` implementation.  It contains acceptance tests for all the requirements specified in [`DataServer.js`](src/DataServer.js).

The [Bubble Server Test Suite](./test/BubbleServerTestSuite/) is an integration test suite for a deployed bubble server.  It executes the same tests as the Data Server Test Suite but it does so via a client `Bubble` over HTTP (configurable).

See the READMEs in those suites for instructions.

## Dependencies

[`@bubble-protocol/core`](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/packages/core)