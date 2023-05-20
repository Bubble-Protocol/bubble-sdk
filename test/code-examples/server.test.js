
import { startBlockchain, stopBlockchain } from '../mockups/test-blockchain.js';
import { RamBasedDataServer } from '../mockups/RamBasedDataServer.js';
import { ContentManager, bubbleProviders } from '../../packages/index.js';
import contractSrc from '../contracts/TestContract.json';

// Imports under test
import { Guardian, DataServer } from '../../packages/server';
import { blockchainProviders } from '../../packages/core';
import Web3 from 'web3';
import http from 'http';
import { TestContract } from '../mockups/TestContract.js';


describe('Server README code examples', () => {

  // makes the bubble server visible to the tests
  var bubbleServerPtr, testContract, ownerBubble;


  beforeAll(async () => {

    try {

      //
      // Code under test

      // User defined data server, e.g. file-based server or an interface to an existing database.
      // See the src/DataServer.js for more information.
      
      class MyDataServer extends RamBasedDataServer {};
      
      // Example HTTP server (no error handling)
      
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
      const BLOCKCHAIN_API = 'http://127.0.0.1:8545';   //'https://ethereum.infura.io/v3/YOUR_PROJECT_ID';


      // Setup blockchain api
      const blockchainProvider = new blockchainProviders.Web3Provider(CHAIN_ID, new Web3(BLOCKCHAIN_API), '0.0.2')


      // Construct the Bubble Guardian and launch the server
      const dataServer = new MyDataServer();
      const guardian = new Guardian(dataServer, blockchainProvider);
      const bubbleServer = new BubbleServer(SERVER_PORT, guardian);

      // Launch the server
      // bubbleServer.start(() => console.log('server started'));  --> moved to test 1

      // End code under test
      //
    

      bubbleServerPtr = bubbleServer;

      // Start blockchain and construct bubbles
      await startBlockchain(8545);

      // Deploy bubble smart contract
      testContract = new TestContract(new Web3(BLOCKCHAIN_API), contractSrc);
      await testContract.initialiseAccounts();
      const accounts = testContract.getAccounts();
      await testContract.deploy([accounts[0], accounts[1]]);
      await testContract.testContractIsAvailable();

      // Construct client bubbles for owner and requester
      const BUBBLE_SERVER_URL = 'http://127.0.0.1:'+SERVER_PORT;
      const bubbleProvider = new bubbleProviders.HTTPBubbleProvider(BUBBLE_SERVER_URL);
      ownerBubble = testContract.getBubble(CHAIN_ID, BUBBLE_SERVER_URL, bubbleProvider, 0);

      // create the bubble on the data server
      dataServer._createBubble(testContract.address.toLowerCase());

    }
    catch(err) {
      throw new Error('beforeAll failed: '+err.message, {cause: err});
    }
  }, 20000)


  afterAll( async () => {
    await stopBlockchain();
  }, 20000)


  test('server launches without error', async () => {
    await expect(
      new Promise((resolve) => {
        bubbleServerPtr.start(resolve);
      })
    ).resolves.not.toThrow();
  })

  test('server can receive a post', async () => {
    await expect(ownerBubble.write(ContentManager.toFileId(1), 'hello server test'))
      .resolves.not.toThrow();
  })

  test('server will resolve with bubble data', async () => {
    await expect(ownerBubble.read(ContentManager.toFileId(1)))
      .resolves.toBe('hello server test');
  })

  test('server shuts down without error', async () => {
    await expect(
      new Promise((resolve) => {
        bubbleServerPtr.close(resolve);
      })
    ).resolves.not.toThrow();
  })

  
})

