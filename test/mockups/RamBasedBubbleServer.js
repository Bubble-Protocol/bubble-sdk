import express from 'express';
import jayson from 'jayson';
import jsonParser from 'body-parser';
import {RamBasedDataServer} from './RamBasedDataServer.js';
import {Guardian} from '../../packages/server';


export class RamBasedBubbleServer {

  constructor(host, port, blockchainProvider) {
    this.port = port;
    this.dataServer = new RamBasedDataServer();
    this.guardian = new Guardian(this.dataServer, blockchainProvider, host+':'+port);
    const guardian = this.guardian;

    function makeMethod(method) {
      return function (params, callback) {
        guardian.post(method, params)
          .then(response => {
            callback(null, response);
          })
          .catch(error => {
            if (!error.code) console.log(error);
            callback({code: error.code, message: error.message, cause: error.cause});
          });
      };
    }
    
    this.methods = {
      ping: (_, callback) => { callback(null, 'pong') },
      create: makeMethod('create'),
      write: makeMethod('write'),
      append: makeMethod('append'),
      read: makeMethod('read'),
      delete: makeMethod('delete'),
      mkdir: makeMethod('mkdir'),
      list: makeMethod('list'),
      getPermissions: makeMethod('getPermissions'),
      terminate: makeMethod('terminate'),
    };

    const rpcServer = new jayson.Server(this.methods);

    this.httpServer = express();
    this.httpServer.use(jsonParser.json());
    this.httpServer.use(rpcServer.middleware());

  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = this.httpServer.listen(this.port, error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  close(callback) {
    this.server.close(callback);
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


