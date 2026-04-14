
import { pingServerTest, startServers, stopServers } from '../mockups/test-servers.js';
import { bubbleAvailableTest, clearTestBubble, constructTestBubble, owner, ownerBubble, requester } from '../mockups/test-bubble.js';
import { ContentManager, getSignFunction, BubbleContentManager, encryptionPolicies, eip191 } from '../../packages/client';
import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'crypto';
import Web3 from 'web3';

describe('Client README overview code examples', () => {

  beforeAll(async () => {
    await startServers();
    await constructTestBubble();
  }, 20000)

  beforeEach(() => {
    clearTestBubble()
  })

  afterAll( async () => {
    await stopServers();
  }, 20000)


  pingServerTest();
  bubbleAvailableTest();

  test('Read A Private File', async () => {

    // Setup test
    await ownerBubble.write('0x0000000000000000000000000000000000000000000000000000000000000001', 'Hello World!');

    const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
    let result;

    {

      const signFunction = getSignFunction(owner.privateKey);
      
      const data = await ContentManager.read(contentId, signFunction);
      
      result = data;

    }

    // Check results
    expect(result).toBe('Hello World!');

  })

  test('Read A Private File With Local `ethers` Wallet', async () => {

    // Setup test
    await ownerBubble.write('0x0000000000000000000000000000000000000000000000000000000000000001', 'Hello World!');

    const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
    let result;

    {

      const wallet = new ethers.Wallet(owner.privateKey);

      const signFunction = getSignFunction((digest) => wallet.signingKey.sign(digest).serialized);
      
      const data = await ContentManager.read(contentId, signFunction);
      
      result = data;

    }

    // Check results
    expect(result).toBe('Hello World!');

  })

  test('Read A Private File With Local `viem` Account', async () => {

    // Setup test
    await ownerBubble.write('0x0000000000000000000000000000000000000000000000000000000000000001', 'Hello World!');

    const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
    let result;

    {

      const account = privateKeyToAccount('0x' + owner.privateKey);

      const signFunction = eip191.getEIP191SignFunction((message) => account.signMessage({ message }) );
      
      const data = await ContentManager.read(contentId, signFunction);
      
      result = data;

    }

    // Check results
    expect(result).toBe('Hello World!');

  })

  test('Read A Private File With Local `web3js` Wallet', async () => {

    // Setup test
    await ownerBubble.write('0x0000000000000000000000000000000000000000000000000000000000000001', 'Hello World!');

    const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
    let result;

    {

      const web3 = new Web3();

      const signFunction = eip191.getEIP191SignFunction((digest) => web3.eth.accounts.sign(digest, owner.privateKey).signature);
      
      const data = await ContentManager.read(contentId, signFunction);
      
      result = data;

    }

    // Check results
    expect(result).toBe('Hello World!');

  })

  test('Read, Write and List Encrypted Private Files', async () => {

    // Setup test
    const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
    let readResult, listResult;

    {

      const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy();

      const signFunction = getSignFunction(owner.privateKey); // ...; // see Read A Private File examples above

      const manager = new BubbleContentManager(signFunction, encryptionPolicy);

      await manager.write(contentId, 'Hello World!');

      readResult = await manager.read(contentId);

      listResult = await manager.list(contentId);

    }

    // Check results
    expect(readResult).toBe('Hello World!');
    expect(listResult).toEqual([{name: '0x0000000000000000000000000000000000000000000000000000000000000001', type: 'file'}]);

  })

})


// Uncomment and edit to obtain a content ID string:
//
// const contentIdObj = new ContentId({
//   chain: CHAIN_ID,
//   contract: contract.options.address,
//   provider: 'http://127.0.0.1:8131',
//   file: '0x0000000000000000000000000000000000000000000000000000000000000001'
// })
// console.log(contentIdObj.toString());
