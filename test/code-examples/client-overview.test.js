
import { pingServerTest, startServers, stopServers } from '../mockups/test-servers';
import { bubbleAvailableTest, clearTestBubble, constructTestBubble, ownerBubble, ownerSign } from '../mockups/test-bubble';

import { ContentManager } from '../../packages';


describe('Client README code examples', () => {

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

  test('Client README overview compiles and runs', async () => {

    // Setup test
    await ownerBubble.write('0x0000000000000000000000000000000000000000000000000000000000000001', 'Hello World!');

    let result;

    {

      const contentId = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweEVlMzc4MjMyMEFGMmViNTRiNGIwRDZmMmI0NUI4QTAzMjZlMkU0MDkiLCJwcm92aWRlciI6Imh0dHA6Ly8xMjcuMC4wLjE6ODEzMSIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ';
    
      function signFunction(hash) {
        return ownerSign(hash);
      }
      
      const data = await ContentManager.read(contentId, signFunction);
      
      result = data;

    }

    // Check results
    expect(result).toBe('Hello World!');

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
