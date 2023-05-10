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

The test entry point takes two parameters: the [DataServer.js](../../src/DataServer.js) under test and your test point implementation.  The test suite uses your test point to setup and tear down each test case.  Your test point must implement the [TestPoint](TestPoint.js) interface to provide the features described in that file.


```javascript
import { testDataServerRequirements } from '@bubble-protocol/server/test/DataServerTestSuite/requirementsTests.js';

testDataServerRequirements(myDataServer, myTestPoint);
```
