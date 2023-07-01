import {RamBasedDataServer} from './RamBasedDataServer.js';
import {Guardian} from '../../packages/server';
import WebSocketServer from 'ws';


export class RamBasedBubbleServerWebSocket {

  constructor(host, port, blockchainProvider) {
    this.port = port;
    this.dataServer = new RamBasedDataServer();
    this.guardian = new Guardian(this.dataServer, blockchainProvider, host+':'+port);

    this.wsServer = new WebSocketServer.Server({ port: this.port });

    this.uid = 0;

    this.wsServer.on('connection', ws => {

      ws.bubbleServer_subscriptions = [];

      ws.on('message', msg => { 
        this.handleRequest(ws, msg)
          .then(response => {
            ws.send(JSON.stringify(response));
          })
          .catch(error => {
            ws.send(JSON.stringify({id: undefined, error: {code: error.code, message: error.message, cause: error.cause}}));
          })
      });

      ws.on('close', () => {
        if (ws.bubbleServer_subscriptions.length > 0)
          this.dataServer.unsubscribeClient(ws.bubbleServer_subscriptions)
      });
      
    });

  }

  handleRequest(ws, msg) {
    try {
      const { id, method, params } = JSON.parse(msg);
      return this.serviceValidRequest(ws, method, params)
        .then(result => {
          return {id: id, result: result}
        })
        .catch(error => {
          return {id: id, error: {code: error.code, message: error.message, cause: error.cause}}
        })
    }
    catch(error) {
      return Promise.reject({
        code: error.code || -32700,
        message: "Parse error",
        cause: error.message
      });
    }
  }

  serviceValidRequest(ws, method, params) {
    switch(method) {
      case 'ping': return Promise.resolve('pong');
      case 'subscribe': return this.subscribe(ws, params);
      default: return this.guardian.post(method, params);
    }
  }

  subscribe(ws, params) {
    return this.guardian.post('subscribe', params, (msg) => this.notifySubscriber(ws, msg))
      .then(subscription => {
        ws.bubbleServer_subscriptions.push(subscription.subscriptionId);
        return subscription;
      })
  }

  notifySubscriber(ws, params) {
    const alive = ws.readyState === WebSocketServer.OPEN;
    if (alive) {
      ws.send(JSON.stringify({ method: "subscription", params: params }));
    }
    return alive;
  }  

  start() {
    return Promise.resolve();
  }

  close(callback) {
    this.wsServer.close(callback);
  }

  _reset() {
    this.dataServer._reset();
  }

  _resetBubble(contract) {
    this.dataServer._resetBubble(contract);
  }

  _createBubble(contract) {
    this.dataServer._createBubble(contract);
  }

}

