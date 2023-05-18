
import { startServers, stopServers } from '../mockups/test-servers.js';

// Imports under test
import { Bubble, bubbleProviders } from '../../packages/client';
import { ContentId } from '../../packages/index.js';
import Web3 from 'web3';



describe('Client README Create Bubble section', () => {

  var testState = {};

  beforeAll(async () => {
    await startServers({ethereumSignatures: true});
  }, 20000)


  afterAll( async () => {
    await stopServers();
  }, 20000)


  test('deploy contract', async () => {

    async function codeUnderTest() {

      //
      // Code under test

      async function deploy(from, abi, bytecode, constructorParams=[]) {
    
        const contract = new web3.eth.Contract(abi);
      
        await contract.deploy({
            data: bytecode,
            arguments: constructorParams
          })
          .send({
            from: from,
            gas: 1500000,
            gasPrice: '30000000000000'
          })
          .on('receipt', receipt => {
            contract.options.address = receipt.contractAddress;
          })
      
        return contract;
      }
      
      
      const contractSrc = {
        bytecode: "6080604052336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600260006101000a81548160ff02191690831515021790555034801561006b57600080fd5b506106fc8061007b6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80630c08bf88146100465780636cb03b1f14610050578063c48dbf6a1461006c575b600080fd5b61004e61009c565b005b61006a60048036038101906100659190610526565b610147565b005b61008660048036038101906100819190610562565b610230565b604051610093919061060d565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461012a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610121906105ed565b60405180910390fd5b6001600260006101000a81548160ff021916908315150217905550565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146101d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101cc906105ed565b60405180910390fd5b80600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055505050565b6000600260009054906101000a900460ff161561026f577f800000000000000000000000000000000000000000000000000000000000000090506104e1565b6000821480156102ca575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b1561033b577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f2000000000000000000000000000000000000000000000000000000000000000171790506104e1565b600182148061034a5750600282145b80156103a1575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b15610434577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000007f400000000000000000000000000000000000000000000000000000000000000017171790506104e1565b60018214801561048d5750600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b156104dc577f20000000000000000000000000000000000000000000000000000000000000007f40000000000000000000000000000000000000000000000000000000000000001790506104e1565b600090505b92915050565b6000813590506104f681610681565b92915050565b60008135905061050b81610698565b92915050565b600081359050610520816106af565b92915050565b6000806040838503121561053957600080fd5b6000610547858286016104e7565b9250506020610558858286016104fc565b9150509250929050565b6000806040838503121561057557600080fd5b6000610583858286016104e7565b925050602061059485828601610511565b9150509250929050565b60006105ab601183610628565b91507f7065726d697373696f6e2064656e6965640000000000000000000000000000006000830152602082019050919050565b6105e781610677565b82525050565b600060208201905081810360008301526106068161059e565b9050919050565b600060208201905061062260008301846105de565b92915050565b600082825260208201905092915050565b600061064482610657565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b61068a81610639565b811461069557600080fd5b50565b6106a18161064b565b81146106ac57600080fd5b50565b6106b881610677565b81146106c357600080fd5b5056fea26469706673582212209c7f47dce43e4716c16fb9e52aaf67b00af408103c0f616307fcf42476799db664736f6c63430008000033",
        abi: [{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"contentId","type":"uint256"}],"name":"getAccessPermissions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"friend","type":"address"},{"internalType":"bool","name":"permitted","type":"bool"}],"name":"setFriend","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"terminate","outputs":[],"stateMutability":"nonpayable","type":"function"}]
      }
      
      // Construct a web3 instance using a provider of your choice
      const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url
      
      // Get a list of the active accounts
      const accounts = await web3.eth.getAccounts();
      
      // Deploy the contract
      const contract = await deploy(accounts[0], contractSrc.abi, contractSrc.bytecode);  

      // End code under test
      //

      testState = {
        contract: contract
      }

    }

    await expect(codeUnderTest()).resolves.not.toThrow();

    expect(testState.contract.options.address).toMatch(/^(0x)?[0-9a-fA-F]+$/);

  })

  
  test("create bubble", async () => {

    async function codeUnderTest() {

      //
      // Code under test
      
      // Define a function for signing transactions
      const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url or use a different signing strategy
      const accounts = await web3.eth.getAccounts();
      const signFunction = (hash) => web3.eth.sign(hash, accounts[0]);

      // Setup your bubble
      const bubbleId = new ContentId({
        chain: 1,
        contract: testState.contract.options.address, // "0xa84..3b6",
        provider: 'http://127.0.0.1:8131'   // configure for your off-chain storage service
      });
      
      // Construct a BubbleProvider for the remote storage system
      const storageProvider = new bubbleProviders.HTTPBubbleProvider(bubbleId.provider);
      
      // Construct the Bubble class
      const bubble = new Bubble(bubbleId, storageProvider, signFunction);
      
      // Create the bubble on the off-chain storage service.
      await bubble.create();
      
      // End code under test
      //

      testState.bubble = bubble;

    }

    await expect(codeUnderTest()).resolves.not.toThrow();

  })

})

