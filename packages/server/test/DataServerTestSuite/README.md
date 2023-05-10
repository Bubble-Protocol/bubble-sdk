# Data Server Test Suite

The Data Server Test Suite is an acceptance test suite for Bubble server developers.  Written in [Jest](https://github.com/jestjs/jest), it confirms that a `DataServer` implementation meets the functional requirements specified in [DataServer.js](../../src/DataServer.js).

Each test is labelled with the requirement or requirements being tested.

To instead test a Bubble server via it's http api, see the [BubbleServerTestSuite](../BubbleServerTestSuite/).

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

The test entry point takes two parameters: the [DataServer.js](../../src/DataServer.js) under test and your test point implementation.  


```javascript
import { testDataServerRequirements } from '@bubble-protocol/server/test/DataServerTestSuite/requirementsTests.js';

testDataServerRequirements(myDataServer, myTestPoint);
```

### Test Point

Your test point must implement the [TestPoint](TestPoint.js) interface to provide the features described in that file.  The test suite uses your test point to setup and tear down each test case.  Before running the requirements tests, the test suite will execute the `runTest()` method in your test point, if it exists, to confirm your test point has the necessary features.

The [`DataServerTestPoint`](DataServerTestPoint.js) class provides an implementation that uses your `DataServer` to test itself.
It requires your `DataServer` to have it's `create`, `write`, `read`, `list` and `delete` methods at least partially working.
It has built-in tests to verify this minimal set is operational, which the test suite runs by default before any requirements tests are executed. 

```javascript
import { testDataServerRequirements } from '@bubble-protocol/server/test/DataServerTestSuite/requirementsTests.js';
import { DataServerTestPoint } from '@bubble-protocol/server/test/DataServerTestSuite/DataServerTestPoint.js';

const myTestPoint = new DataServerTestPoint(myDataServer);

testDataServerRequirements(myDataServer, myTestPoint);
```

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

