import Web3 from 'web3';

import { BLOCKCHAIN_SERVER_URL, BUBBLE_SERVER_URL, BUBBLE_WS_SERVER_URL, CHAIN_ID, MockBubbleServer, blockchainProvider } from './test-servers.js';
import { Bubble, bubbleProviders } from '../../packages/client';
import { BubblePermissions, ContentId } from '../../packages/core';
import defaultContractSrc from '../contracts/TestContract.json';
import { Key } from '../../packages/crypto/src/ecdsa/Key.js';
import { ecdsa } from '../../packages/crypto/src/index.js';


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
owner.key = new Key(owner.privateKey);

export const requester = {
  privateKey: "e68e40257cfee330038c49637fcffff82fae04b9c563f4ea071c20f2eb55063c",
  address: "0x41A60F71063CD7c9e5247d3E7d551f91f94b5C3b"
};
requester.key = new Key(requester.privateKey);

export const ownerSign = owner.key.signFunction;

export const requesterSign = requester.key.signFunction;


//
// Contract & Bubbles
//

export var ownerBubble, requesterBubble, contract;


export async function constructTestBubble(options={}) {

  if (options.mockBubbleServer) MockBubbleServer = options.mockBubbleServer;
  
  const contractSrc = options.contractSrc || defaultContractSrc;

  contract = new web3.eth.Contract(contractSrc.abi);

  await contract.deploy({
      data: contractSrc.bytecode || contractSrc.bin,
      arguments: options.args || [owner.address, requester.address]
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
    provider: options.protocol === 'ws:' ? BUBBLE_WS_SERVER_URL : BUBBLE_SERVER_URL
  });
  let bubbleProvider;
  if (options.protocol === 'ws:') {
    bubbleProvider = new bubbleProviders.WebsocketBubbleProvider(new URL(BUBBLE_WS_SERVER_URL));
    await bubbleProvider.connect();
  }
  else {
    bubbleProvider = new bubbleProviders.HTTPBubbleProvider(new URL(BUBBLE_SERVER_URL));
  }
  ownerBubble = new Bubble(bubbleId, bubbleProvider, ownerSign);
  requesterBubble = new Bubble(bubbleId, bubbleProvider, requesterSign);

  // Mock a bubble created on the bubble server
  if (!options.noBubble) await MockBubbleServer.createBubble(contract.options.address.toLowerCase());

  return bubbleId;
}


export function clearTestBubble() {
  MockBubbleServer.clearBubble(contract.options.address.toLowerCase());
}

export function deleteAllBubbles() {
  MockBubbleServer.deleteAllBubbles();
}


export function bubbleAvailableTest() {

  test('confirm contract has deployed', async () => {
    const file0 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(typeof contract).toBe('object');
    expect(typeof contract.options.address).toBe('string');
    const permissionBits = await blockchainProvider.getPermissions(contract.options.address, owner.address, file0);
    const permissions = new BubblePermissions(BigInt(permissionBits));
    expect(permissions.bubbleTerminated()).toBe(false);
    expect(permissions.canRead()).toBe(true);
    expect(permissions.canWrite()).toBe(true);
  }, 20000)

}


export async function testSignFunction(signFunction, accountAddress) {
  expect(['Function', 'AsyncFunction', 'Promise']).toContain(signFunction.constructor.name);
  const message = 'hello world!';
  const hash = ecdsa.hash(message);
  let recoveryHash = hash;
  let sig = await signFunction(hash);
  expect(['string', 'object']).toContain(typeof sig);
  if (typeof sig === 'object') {
    expect(sig.signature).not.toBeUndefined();
    expect(sig.prefix).not.toBeUndefined();
    expect(typeof sig.signature).toBe('string');
    expect(typeof sig.prefix).toBe('string');
    recoveryHash = ecdsa.hash(sig.prefix+hash);
    sig = sig.signature;
  }
  const recoveredAddress = ecdsa.recover(recoveryHash, sig);
  expect(recoveredAddress.toLowerCase()).toBe(accountAddress.toLowerCase());
}