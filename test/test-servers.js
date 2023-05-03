import Web3 from 'web3';
import jayson from 'jayson';

import { blockchainProviders } from '../packages/index';
import { RamBasedBubbleServer } from './RamBasedBubbleServer';
import { GanacheServer } from "./GanacheServer";


//
// General
//

export const CHAIN_ID = 1;
export const BLOCKCHAIN_SERVER_URL = 'http://127.0.0.1:8545';
export const BUBBLE_SERVER_URL = 'http://127.0.0.1:8131';


//
// Servers
//

export var blockchainProvider, bubbleProvider;
var ganacheServer, bubbleServer;


export async function startServers() {

  const CONTRACT_ABI_VERSION = '0.0.2';
  const GANACHE_MNEMONIC = 'foil message analyst universe oval sport super eye spot easily veteran oblige';

  // Setup a test blockchain and a basic bubble server
  ganacheServer = new GanacheServer(8545, {mnemonic: GANACHE_MNEMONIC});
  blockchainProvider = new blockchainProviders.Web3Provider(CHAIN_ID, new Web3(BLOCKCHAIN_SERVER_URL), CONTRACT_ABI_VERSION);
  bubbleServer = new RamBasedBubbleServer(8131, blockchainProvider);
  ganacheServer.start();
  bubbleServer.start();

}


export async function stopServers() {
  await Promise.all([
    new Promise(resolve => bubbleServer.close(resolve)),
    new Promise(resolve => ganacheServer.close(resolve))
  ])
}


export const MockBubbleServer = {
  createBubble: (address) => bubbleServer.dataServer.create(address),
  clearBubble: (address) => bubbleServer._resetBubble(address),
  deleteAllBubbles: () => bubbleServer._reset()
}


export function pingServerTest() {

  test('ping bubble server', async () => {
    const client = jayson.Client.http('http://localhost:8131');
    await new Promise((resolve, reject) => {
      client.request('ping', [], function(err, response) {
        if(err) reject(err);
        else resolve(response.result || response);
      });
    })
    .then(result => expect(result).toBe('pong'))
  }, 20000)

}