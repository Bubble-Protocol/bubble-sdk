
import { startServers, stopServers } from '../mockups/test-servers.js';
import { testSignFunction } from '../mockups/test-bubble.js';

// Imports under test
import Web3 from 'web3';
import { Bubble, Delegation, bubbleProviders, encryptionPolicies, toDelegateSignFunction, toEthereumSignature, userManagers } from '../../packages/client';
import { ContentId } from '../../packages/core';
import { ecdsa } from '../../packages/crypto/src/index.js';



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
        bytecode: "6080604052336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600260006101000a81548160ff02191690831515021790555034801561006b57600080fd5b506108578061007b6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80630c08bf88146100465780636cb03b1f14610050578063c48dbf6a1461006c575b600080fd5b61004e61009c565b005b61006a60048036038101906100659190610681565b610147565b005b610086600480360381019061008191906106bd565b610230565b6040516100939190610768565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461012a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161012190610748565b60405180910390fd5b6001600260006101000a81548160ff021916908315150217905550565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146101d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101cc90610748565b60405180910390fd5b80600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055505050565b6000600260009054906101000a900460ff161561026f577f8000000000000000000000000000000000000000000000000000000000000000905061063c565b6000821480156102ca575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b1561033b577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000001717905061063c565b600182148061034a5750600282145b80156103a1575060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b15610434577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000007f4000000000000000000000000000000000000000000000000000000000000000171717905061063c565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156104f4577f08000000000000000000000000000000000000000000000000000000000000007f10000000000000000000000000000000000000000000000000000000000000007f20000000000000000000000000000000000000000000000000000000000000001717905061063c565b60018214801561054d5750600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b1561059c577f20000000000000000000000000000000000000000000000000000000000000007f400000000000000000000000000000000000000000000000000000000000000017905061063c565b8273ffffffffffffffffffffffffffffffffffffffff168214801561060a5750600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b15610637577f2000000000000000000000000000000000000000000000000000000000000000905061063c565b600090505b92915050565b600081359050610651816107dc565b92915050565b600081359050610666816107f3565b92915050565b60008135905061067b8161080a565b92915050565b6000806040838503121561069457600080fd5b60006106a285828601610642565b92505060206106b385828601610657565b9150509250929050565b600080604083850312156106d057600080fd5b60006106de85828601610642565b92505060206106ef8582860161066c565b9150509250929050565b6000610706601183610783565b91507f7065726d697373696f6e2064656e6965640000000000000000000000000000006000830152602082019050919050565b610742816107d2565b82525050565b60006020820190508181036000830152610761816106f9565b9050919050565b600060208201905061077d6000830184610739565b92915050565b600082825260208201905092915050565b600061079f826107b2565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b6107e581610794565b81146107f057600080fd5b50565b6107fc816107a6565b811461080757600080fd5b50565b610813816107d2565b811461081e57600080fd5b5056fea264697066735822122079800c328f4ff596d6fb573b3dbcaa9b24ad8e13456bcb5c236ae87eee43cc7b64736f6c63430008000033",
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
        contract: contract,
        contractSrc: contractSrc
      }

    }

    await expect(codeUnderTest()).resolves.not.toThrow();

    expect(testState.contract.options.address).toMatch(/^(0x)?[0-9a-fA-F]+$/);

  })


  test('sign function', async () => {
    const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url or use a different signing strategy
    const accounts = await web3.eth.getAccounts();
    const signFunction = (hash) => web3.eth.sign(hash, accounts[0]).then(toEthereumSignature);
    await testSignFunction(signFunction, accounts[0]);
  })
  

  test("create bubble", async () => {

    async function codeUnderTest() {

      //
      // Code under test

      // Identify your bubble
      const bubbleId = new ContentId({
        chain: 1,
        contract: testState.contract.options.address, // "0xa84..3b6",                                   // replace with your contract address
        provider: 'http://127.0.0.1:8131' // 'https://vault.bubbleprotocol.com/v2/ethereum'  // configure for your off-chain storage service
      });
      
      // Create a new private key for this device (store it in your app or, if browser based, in local storage)
      const deviceKey = new ecdsa.Key();

      // Delegate the device key to act as your wallet account when accessing just this bubble for 1 year
      const delegation = new Delegation(deviceKey.address, Date.now()/1000+60*60*24*365);
      delegation.permitAccessToBubble(bubbleId);

      // Sign the delegation using your wallet key
      const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url or use a different signing strategy
      const accounts = await web3.eth.getAccounts();
      await delegation.sign((hash) => {
        return web3.eth.sign(hash, accounts[0])
        .then(toEthereumSignature)
      })

      // Construct a `BubbleProvider` appropriate to the API of the remote storage system.
      const storageProvider = new bubbleProviders.HTTPBubbleProvider(bubbleId.provider);

      // Define the encryption policy for the bubble
      const encryptionPolicy = new encryptionPolicies.AESGCMEncryptionPolicy();

      // Define a user manager so that friends and family can retrieve the encryption key
      const userManager = new userManagers.MultiUserManager(deviceKey);
      
      // Construct the `Bubble` class
      const bubble = new Bubble(
        bubbleId, 
        storageProvider, 
        toDelegateSignFunction(deviceKey.signFunction, delegation), 
        encryptionPolicy, 
        userManager
      );
      
      // Create the bubble on the off-chain storage service.
      await bubble.create();
      
      // End code under test
      //

      testState.bubble = bubble;

    }

    await expect(codeUnderTest()).resolves.not.toThrow();

  })


  test('Add friend', async () => {

    const contractSrc = testState.contractSrc;
    const bubble = testState.bubble;
    const pubKey = new ecdsa.Key().cPublicKey;

    //
    // Code under test

    const friendPublicKey = pubKey; //'0x123...def';  // configure to your friend's public key

    // First add your friend to the smart contract
    const web3 = new Web3('http://127.0.0.1:8545');  // configure to your provider's url or use a different signing strategy
    const accounts = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(contractSrc.abi, bubble.contentId.contract);
    
    await contract.methods.setFriend(ecdsa.publicKeyToAddress(friendPublicKey), true).send({
        from: accounts[0],
        gas: 1500000,
        gasPrice: '10000000000'
      })
    
    // Next construct their user metadata file containing the bubble encryption key
    await bubble.userManager.addUser(friendPublicKey);
    
    // End code under test
    //
  })

})

