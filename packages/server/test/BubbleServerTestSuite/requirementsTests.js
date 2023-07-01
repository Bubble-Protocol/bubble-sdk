
// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { testDataServerRequirements } from '../DataServerTestSuite/requirementsTests.js';
import { BubbleTestPoint } from './BubbleTestPoint.js';
import { BubbleServerApi } from './BubbleServerApi.js';
import { TestContract } from './TestContract.js';
import allPermissionsContractSrc from './contracts/AllPermissionsContract.json';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';

/**
 * Bubble Server functional tests.  Running these tests against a remote Bubble server
 * will confirm it meets the minimal set of requirements for a bubble server, 
 * including the data server requirements in @bubble-protocol/server/DataServer.js.
 * 
 * @param {Web3} web3 Web3 instance used to deploy the contract and sign transactions
 * @param {number} chainId the chain id of the blockchain used by the server under test
 * @param {string} bubbleServerURL the url of the server under test
 * @param {BubbleProvider} bubbleProvider the client bubble provider used to send requests
 * to the server under test
 * @param {TestPoint} testPoint optional test point to override the default.  By default
 *   the BubbleTestPoint class will be used, which requires minimal read, write, list and 
 *   delete functions to be working on the server.
 */
export function testBubbleServerRequirements(web3, chainId, bubbleServerURL, bubbleProvider, testPoint, options={}) {

  /**
   * Bubble Server Requirements Tests
   */
  describe("Bubble Server Requirements Tests", () => {

    testPoint = testPoint || new BubbleTestPoint(web3, chainId, bubbleServerURL, bubbleProvider);
    const serverApi = new BubbleServerApi();
    const serverOptions = {...options};


    beforeAll( async () => {

      // Deploy the test contract using the provided web3

      const testContract = new TestContract(web3, allPermissionsContractSrc);

      await testContract.deploy()
        .then(() => {

          // Initialise the server API and test point

          const bubble = testContract.getBubble(chainId, bubbleServerURL, bubbleProvider);

          serverApi.initialise(bubble);
          if (testPoint.initialise) testPoint.initialise(bubble);
          serverOptions.contractAddress = testContract.getAddress();
          serverOptions.terminateContract = testContract.setTerminated;

          return testContract.testContractIsAvailable();
         });

    }, 5000);


    testDataServerRequirements(serverApi, testPoint, serverOptions);

  });

}


