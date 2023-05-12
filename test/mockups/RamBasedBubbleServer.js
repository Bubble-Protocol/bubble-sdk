import express from 'express';
import jayson from 'jayson';
import jsonParser from 'body-parser';
import {RamBasedDataServer} from './RamBasedDataServer';
import {Guardian} from '../../packages/server/src/Guardian';


export class RamBasedBubbleServer {

  constructor(port, blockchainProvider) {
    this.port = port;
    this.dataServer = new RamBasedDataServer();
    this.guardian = new Guardian(this.dataServer, blockchainProvider);
    const guardian = this.guardian;

    function post(method, params, callback) {
      guardian.post(method, params)
        .then(response => {
          callback(null, response);
        })
        .catch(error => {
          if (!error.code) console.log(error);
          callback({code: error.code, message: error.message, cause: error.cause});
        })
    }

    this.methods = {
      ping: (_, callback) => { callback(null, 'pong') },
      create: (params, callback) => { post('create', params, callback) },
      write:  (params, callback) => { post('write', params, callback) },
      append:  (params, callback) => { post('append', params, callback) },
      read:  (params, callback) => { post('read', params, callback) },
      delete:  (params, callback) => { post('delete', params, callback) },
      mkdir:  (params, callback) => { post('mkdir', params, callback) },
      list:  (params, callback) => { post('list', params, callback) },
      getPermissions:  (params, callback) => { post('getPermissions', params, callback) },
      terminate:  (params, callback) => { post('terminate', params, callback) },
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


