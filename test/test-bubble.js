import Web3 from 'web3';

import { BLOCKCHAIN_SERVER_URL, BUBBLE_SERVER_URL, CHAIN_ID, MockBubbleServer, blockchainProvider } from './test-servers';
import { Bubble, BubblePermissions, ContentId, bubbleProviders } from '../packages/index';
import contractSrc from './contracts/TestContract.json';


//
// General
//

export const web3 = new Web3(BLOCKCHAIN_SERVER_URL);


//
// Owner and Requester
//

export const owner = {
  privateKey: "24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063",
  address: "0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929"
};

export const requester = {
  privateKey: "e68e40257cfee330038c49637fcffff82fae04b9c563f4ea071c20f2eb55063c",
  address: "0x41A60F71063CD7c9e5247d3E7d551f91f94b5C3b"
};

export function ownerSign(hash) {
  return web3.eth.sign(hash, owner.address);
}

export function requesterSign(hash) {
  return web3.eth.sign(hash, requester.address);
}


//
// Contract & Bubbles
//

export var ownerBubble, requesterBubble, contract;


export async function constructTestBubble() {

  contract = new web3.eth.Contract(contractSrc.abi);

  await contract.deploy({
      data: contractSrc.bytecode,
      arguments: [owner.address, requester.address]
    })
    .send({
      from: owner.address,
      gas: 1500000,
      gasPrice: '30000000000000'
    })
    .on('receipt', receipt => {
      contract.options.address = receipt.contractAddress;
    })
    .catch(console.error);
  
  // Construct owner and requester bubbles now that we have the contract address
  const bubbleId = new ContentId({
    chain: CHAIN_ID,
    contract: contract.options.address,
    provider: BUBBLE_SERVER_URL
  });
  const bubbleProvider = new bubbleProviders.HTTPBubbleProvider(new URL(BUBBLE_SERVER_URL));
  ownerBubble = new Bubble(bubbleId, bubbleProvider, ownerSign);
  requesterBubble = new Bubble(bubbleId, bubbleProvider, requesterSign);

  // Mock a bubble created on the bubble server
  await MockBubbleServer.createBubble(contract.options.address);

}


export function clearTestBubble() {
  MockBubbleServer.clearBubble(contract.options.address);
}


export function bubbleAvailableTest() {

  test('confirm contract has deployed', async () => {
    const file0 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const permissionBits = await blockchainProvider.getPermissions(contract.options.address, owner.address, file0);
    const permissions = new BubblePermissions(BigInt(permissionBits));
    expect(permissions.bubbleTerminated()).toBe(false);
    expect(permissions.isDirectory()).toBe(false);
    expect(permissions.canRead()).toBe(true);
    expect(permissions.canWrite()).toBe(true);
    expect(permissions.canAppend()).toBe(true);
    expect(permissions.canExecute()).toBe(true);
  }, 20000)

}