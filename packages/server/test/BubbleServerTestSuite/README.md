# Bubble Server Test Suite

The Bubble Server Test Suite is an acceptance test suite for Bubble server developers.  Written in [Jest](https://github.com/jestjs/jest), it confirms that a Bubble server meets the minimum set of functional requirements for a standard bubble server, including those specified in [DataServer.js](../../src/DataServer.js).

By default the test suite acts as a remote client, using the bubble-sdk's client `Bubble` class to interact with and test each server method via it's online api.  See [DataServerTestSuite](../DataServerTestSuite/) if you want to test your `DataServer` software directly.

By default, the test suite uses a built-in `BubbleTestPoint` class used to interact with the server under test to set up and tear down each test case.
The default test point uses the methods provided by the server's primary api and therefore requires the server to have at least some minimal functionality before the test suite can be run.
You can provide your own test point class if your server has it's own separate test point api.
See [Test Point](#test-point) for more details.

## Running The Tests

### Dependencies

```bash
npm install @bubble-protocol/server @bubble-protocol/client jest web3 --save-dev
```

Add Jest as the test method in your `package.json`.

```json
  "scripts": {
    "test": "node node_modules/jest/bin/jest.js"
  },
```

### Example Test Script

Example test script that runs the tests against a local or remote Bubble server over HTTP. 


Use a different `BubbleProvider` if you are testing your software directly or if your server uses a different internet protocol or non-RPC api.


```javascript
import { testBubbleServerRequirements } from '@bubble-protocol/server/test/BubbleServerTestSuite/requirementsTests.js';
import { bubbleProviders } from '@bubble-protocol/client';
import Web3 from 'web3';

describe("My Bubble Server", function() {

  const CHAIN_ID = 1;
  const BUBBLE_SERVER_URL = 'http://127.0.0.1:1234';
  const web3 = new Web3(BLOCKCHAIN_SERVER_URL);
  const bubbleProvider = new bubbleProviders.HTTPBubbleProvider(new URL(BUBBLE_SERVER_URL));


  beforeAll( async () => {
    // Launch your Bubble server
  });


  afterAll( async () => {
    // Stop your Bubble server
  });


  testBubbleServerRequirements(web3, CHAIN_ID, BUBBLE_SERVER_URL, bubbleProvider);

});
```

## Test Point

The test suite requires a minimal set of capabilities to be available on the server under test before its tests can be run.
These capabilities can be provided by the server's primary api or through a separate test point api.

If using a separate test point api, you will need to provide the suite with your own implementation of the [`TestPoint`](../DataServerTestSuite/TestPoint.js) class that interfaces with your api.

If using the server's primary api, you do not need to provide a test point class (the suite will use it's built-in test point) but you must implement the minimal capabilities in your server.

### Using Your Own Test Point

If your server has a test point api that can directly provide the minimum capabilities then provide your own implementation of the [`TestPoint`](../DataServerTestSuite/TestPoint.js) interface to the test suite by altering the [example test script](#example-test-script) above.

```javascript
// Pass in your test point object when running the test suite
testBubbleServerRequirements(web3, CHAIN_ID, BUBBLE_SERVER_URL, bubbleProvider, myTestPoint);
```

### Using The Server's Primary API

The test suite's built-in `BubbleTestPoint` class requires the server to have it's `create`, `write`, `read`, `list` and `delete` methods at least partially working.
It has built-in tests to verify this minimal set is operational, which the test suite runs by default before any requirements tests are executed. 

The minimal capabilities needed are:

* `create` 

   a) Create a bubble (**[req-ds-cr-1]**)

* `write`

  a) Write a file (**[req-ds-wr-1]**, **[req-ds-wr-2]**)  
  b) Write a file within a directory, creating the directory if it doesn't exist (**[req-ds-wr-3]**)

* `read`  

  a) Read a file resolving it's contents (**[req-ds-rd-1]**).  
  b) Reject with a `FILE_DOES_NOT_EXIST` `BubbleError` if the file being read does not exist **[req-ds-rd-2]**

* `list`   

  a) Resolve if a file or directory exists.  (Resolving with null is sufficient).  
  b) Reject with a `FILE_DOES_NOT_EXIST` `BubbleError` if it doesn't (**[req-ds-ls-1]** partial, **[req-ds-ls-2]**).

* `delete`  

  a) Delete a file or directory, including any contents of the directory (**[req-ds-dl-1]**, **[req-ds-dl-2]**, **[req-ds-dl-3]**).  
  b) Implement the `silent` option (**[req-ds-dl-5]**) (or just don't reject if the file or directory does not exist).

