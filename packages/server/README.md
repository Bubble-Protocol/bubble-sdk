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

#### Optional Features

Not all features of a Data Server are mandated.  Implementation of the following features is optional:

*Subscriptions*

Subscriptions via a websocket connection allow clients to subscribe to mutation changes of specific files and directories within a bubble. Support of this feature is optional for a provider. Implementation the `subscribe` and `unsubscribe` methods within the `DataServer` to support subscriptions.

*Notifications*

Notifications are more powerful version of subscriptions. Mutation changes of specific files and directories notify one or more external notification services based on configuration within a reserved file within a bubble. To support notifications create an instance of [`NotificationManager`](src/NotificationManager.js) and pass it's `validateRequest` method to the Guardian on construction. Then  See the example server below.

## Example Server

Example of a JSONRPC 2.0 web server.

```javascript
import { Guardian, DataServer, blockchainProviders, NotificationManager, NOTIFICATION_OPERATIONS } from '@bubble-protocol/server';
import Web3 from 'web3';
import http from 'http';


// User defined data server, e.g. file-based server or an interface to an existing database.
// See the src/DataServer.js for more information.

class MyDataServer extends DataServer {
  ... 
}


// Example HTTP server (needs error handling!)

class BubbleServer {

  constructor(port, guardian, notificationMgr) {
    this.port = port;
    this.guardian = guardian;
    this.notificationMgr = notificationMgr;
    this.server = http.createServer(this._handleRequest.bind(this));
  }

  _handleRequest(req, res) {
      
      const postNotify = async (method, params) => {
        this.guardian.postWithMetadata(request.method, request.params)
          .then(response => {
            this._sendResponse(req, res, {result: response.response});
          })
          .catch(error => {
            this._sendResponse(req, res, {error: error.toObject()});
          })
      }

      const post = async (method, params) => {
        this.guardian.post(request.method, request.params)
          .then(result => {
            this._sendResponse(req, res, {result});
          })
          .catch(error => {
            this._sendResponse(req, res, {error: error.toObject()});
          })
      }

      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const request = JSON.parse(body);
        this.guardian.postWithMetadata(request.method, request.params)
          .then(response => {
            this._sendResponse(req, res, {result: response.response});
            if (this.notificationMgr && NOTIFICATION_OPERATIONS.includes(request.method)) {
              notificationManager.notify(method, params, response.file, response.signatory);
            }
          })
          .catch(error => {
            this._sendResponse(req, res, {error: error.toObject()});
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
const SERVER_URL = 'https://my-bubble-server.io';


// Setup blockchain api
const blockchainProvider = new blockchainProviders.Web3Provider(CHAIN_ID, new Web3(BLOCKCHAIN_API), '0.0.2')


// Construct the Bubble Guardian
const dataServer = new MyDataServer();
const guardian = new Guardian(dataServer, blockchainProvider);
const bubbleServer = new BubbleServer(SERVER_PORT, guardian);

// Launch the server
bubbleServer.start(() => console.log('server started'));

```

### Supporting Notifications

Example server but with notifications supported.

```javascript
...
// Construct the Bubble Guardian
const dataServer = new MyDataServer();
const notificationMgr = new NotificationManager(dataServer, SERVER_URL, postNotification)
const notificationValidators = [notificationMgr.validateRequest];
const guardian = new Guardian(dataServer, blockchainProvider, notificationValidators);
const bubbleServer = new BubbleServer(SERVER_PORT, guardian, notificationMgr);

// Launch the server
bubbleServer.start(() => console.log('server started'));

// Handler for optional notifcation support. Posts notifications to remote apis.
function postNotification(target, notification) {

  const postJson = (url, body) => {
    ...
    // typical RESTful api POST
  }
  
  if (target.transport?.type !== 'webhook' || !target.transport?.url) {
    console.log('notification target not supported:', target.id, target.transport?.type);
    return;
  }
  postJson(target.transport.url, JSON.stringify(notification))
    .catch((error) => {
      console.log('notification delivery failed:', target.id, error.message || error);
    });
}
```

## Testing Your Server

The [Data Server Test Suite](./test/BubbleServerTestSuite/) is a unit test suite for a `DataServer` implementation.  It contains acceptance tests for all the requirements specified in [`DataServer.js`](src/DataServer.js).

The [Bubble Server Test Suite](./test/BubbleServerTestSuite/) is an integration test suite for a deployed bubble server.  It executes the same tests as the Data Server Test Suite but it does so via a client `Bubble` over HTTP (configurable).

See the READMEs in those suites for instructions.

## Dependencies

[`@bubble-protocol/core`](https://github.com/Bubble-Protocol/bubble-sdk/tree/main/packages/core)