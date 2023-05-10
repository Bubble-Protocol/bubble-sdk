import { ErrorCodes } from "@bubble-protocol/core";
import { TestPoint } from "../DataServerTestSuite/TestPoint";
import { TestContract } from "./TestContract";
import contractSrc from './contracts/AllPermissionsContract.json';

/**
 * A test point object that uses the a minimal set of the server's features to test the rest.
 * Use this class or provide a direct test point object with the same functions (the  
 * `initialise` and `runTests` methods are optional) that interfaces directly with your
 * server.
 * 
 * If you use this TestPoint class, you will need to implement a minimal set of features 
 * in your server before you can run these tests.  The minimal set of features needed are 
 * basic `read`, `write`, `list` and `delete` methods that resolve if successful.  The `read`, 
 * `list` and `delete` methods must reject with a FILE_DOES_NOT_EXIST error if the file does 
 * not exist.  The delete method must implement the `silent` option.
 * 
 * This class contains a `runTests` method, which is automatically run as part of the
 * test script.  This will confirm that all the server provides all the necessary 
 * functionality to run the tests.
 * 
 * The minimal requirements that need to be implemented to use this test point are:
 * 
 *   create: [req-ds-cr-1]
 *   write:  [req-ds-wr-1] [req-ds-wr-2] [req-ds-wr-3]
 *   read:   [req-ds-rd-1] [req-ds-rd-2] 
 *   list:   [req-ds-ls-1] [req-ds-ls-2]
 *   delete: [req-ds-dl-1] [req-ds-dl-3] [req-ds-dl-4] [req-ds-dl-5]
 */
export class BubbleTestPoint extends TestPoint {

  constructor(web3, chainId, bubbleServerURL, bubbleProvider) {
    super();
    this.web3 = web3;
    this.chainId = chainId;
    this.bubbleServerURL = bubbleServerURL;
    this.bubbleProvider = bubbleProvider;
  }

  initialise(bubble) {
    if (!bubble) throw new Error("TestPoint: bubble param is missing");
    this.bubble = bubble;
  }

  _validateContract(contract) {
    if (contract !== this.bubble.contentId.contract) throw new Error("BubbleTestPoint: contract param must match this bubble's content id")
  }

  async createBubble(contract) {
    this._validateContract(contract);
    await this.bubble.create().catch(err => {
      if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS) return;
      else throw err;
    })
  }

  async deleteFile(contract, file) {
    this._validateContract(contract);
    try {
      await this.bubble.delete(file, {silent: true});
      await expect(this.bubble.read(file))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
    }
    catch(err) {
      throw new Error('testPoint failed to delete '+file+' ('+(err.message || err)+')');
    }
  }

  async writeFile(contract, file, data) {
    this._validateContract(contract);
    try{
      await expect(this.bubble.write(file, data)).resolves.not.toThrow();
      await expect(this.bubble.read(file)).resolves.not.toThrow();
    }
    catch(err) {
      throw new Error('testPoint failed to write '+file+' ('+(err.message || err)+')');
    }
  }

  async readFile(contract, file) {
    this._validateContract(contract);
    return await this.bubble.read(file)
  }

  async mkdir(contract, file) {
    this._validateContract(contract);
    try{
      await expect(this.bubble.write(file+'/BubbleTestPoint', 'hello')).resolves.not.toThrow();
      await this.bubble.delete(file+'/BubbleTestPoint', {silent: true});
      await expect(this.bubble.read(file+'/BubbleTestPoint'))
        .rejects.toBeBubbleError({code: ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST});
      await expect(this.bubble.read(file)).resolves.not.toThrow();
    }
    catch(err) {
      throw new Error('testPoint failed to mkdir '+file+' ('+(err.message || err)+')');
    }
  }

  async assertExists(contract, file) {
    this._validateContract(contract);
    return new Promise((resolve, reject) => {
      this.bubble.list(file)
        .then(resolve)
        .catch(err => {
          if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) reject();
          else reject(err);
        })
    })
  }

  async assertNotExists(contract, file) {
    this._validateContract(contract);
    return new Promise((resolve, reject) => {
      this.bubble.list(file)
        .then(reject)
        .catch(err => {
          if (err.code === ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST) resolve();
          else reject(err);
        })
    })
  }

  async runTests() {

    describe("BubbleTestPoint", () => {

      const options = {};
      let originalBubble;

      beforeAll(async () => {
        originalBubble = this.bubble;
        const testContract = new TestContract(this.web3, contractSrc);
        return testContract.deploy()
          .then(() => {
            this.bubble = testContract.getBubble(this.chainId, this.bubbleServerURL, this.bubbleProvider)
            options.contractAddress = testContract.getAddress();
            return testContract.testContractIsAvailable();
          });
      })

      afterAll(() => {
        this.bubble = originalBubble;
      })
      
      super.runTests(options);

    });

  }

}
