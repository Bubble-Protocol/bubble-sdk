import Web3 from 'web3';
import jayson from 'jayson';
import WebSocket from 'ws';

import { blockchainProviders } from '../../packages/core';
import { RamBasedBubbleServer } from './RamBasedBubbleServer.js';
import { GanacheServer } from "./GanacheServer.js";
import { RamBasedBubbleServerWebSocket } from './RamBasedBubbleServerWs';


//
// General
//

export const CHAIN_ID = 1;
export const BLOCKCHAIN_SERVER_URL = 'http://127.0.0.1:8545';
export const BUBBLE_SERVER_URL = 'http://127.0.0.1:8131';
export const BUBBLE_WS_SERVER_URL = 'ws://127.0.0.1:8131';


//
// Servers
//

export var blockchainProvider, bubbleProvider;
var ganacheServer, bubbleServer, dataServer;

const stats = {
  startStop: 0
}

export async function startServers(options={}) {

  if (stats.startStop > 0) throw new Error("cannot start a server when it hasn't been stopped");
  stats.startStop++;

  const CONTRACT_ABI_VERSION = '0.0.2';
  const GANACHE_MNEMONIC = 'foil message analyst universe oval sport super eye spot easily veteran oblige';

  // Setup a test blockchain and a basic bubble server
  ganacheServer = new GanacheServer(8545, {mnemonic: GANACHE_MNEMONIC});
  const web3ProviderOpts = {
    ethereumSignatures: options.ethereumSignatures
  }
  blockchainProvider = new blockchainProviders.Web3Provider(CHAIN_ID, new Web3(BLOCKCHAIN_SERVER_URL), CONTRACT_ABI_VERSION, web3ProviderOpts);
  if(!options.noBubbleServer) {
    bubbleServer = 
      options.protocol === 'ws:'
      ? new RamBasedBubbleServerWebSocket('ws://127.0.0.1', 8131, blockchainProvider)
      : new RamBasedBubbleServer('http://127.0.0.1', 8131, blockchainProvider);
    dataServer = bubbleServer.dataServer;
    await bubbleServer.start();
  }
  await ganacheServer.start();

}


export function stopServers() {

  if (stats.startStop <= 0) throw new Error("cannot stop a server when it hasn't been started");

  return Promise.all([
    new Promise(resolve => { if (bubbleServer) bubbleServer.close(resolve) }),
    new Promise(resolve => ganacheServer.close(resolve))
  ])
  .then(() => {
    stats.startStop--;
  })
}


export function setDataServer(server) {
  dataServer = server;
}


export const MockBubbleServer = {
  createBubble: (address) => dataServer._createBubble(address),
  clearBubble: (address) => dataServer._resetBubble(address),
  deleteAllBubbles: () => dataServer._reset()
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


export function pingWebsocketServerTest() {

  test('ping bubble server', async () => {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(BUBBLE_WS_SERVER_URL);
      ws.on('message', (msg) => {
        try {
          resolve(JSON.parse(msg))
        }
        catch(error) {
          reject(error);
        }
        ws.close();
      });
      ws.on('error', reject);
      ws.on('open', () => {
        ws.send(JSON.stringify({id: 'ping-test', method: 'ping'}));
      });
    })
    .then(result => expect(result).toStrictEqual({id: 'ping-test', result: 'pong'}))
  }, 5000)

}