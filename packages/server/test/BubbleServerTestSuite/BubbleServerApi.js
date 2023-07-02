import { DataServer } from '../../src/DataServer.js';

export class BubbleServerApi extends DataServer {

  initialise(bubble) {
    this.bubble = bubble;
  }

  _validateContract(contract) {
    if (contract !== this.bubble.contentId.contract) throw new Error("BubbleServerApi: contract param must match this bubble's content id")
  }

  create(contract, options) {
    this._validateContract(contract);
    return this.bubble.create(options);
  }
  
  write(contract, file, data, options) {
    this._validateContract(contract);
    return this.bubble.write(file, data, options);
  }

  append(contract, file, data, options) {
    this._validateContract(contract);
    return this.bubble.append(file, data, options);
  }

  read(contract, file, options) {
    this._validateContract(contract);
    return this.bubble.read(file, options);
  }

  delete(contract, file, options) {
    this._validateContract(contract);
    return this.bubble.delete(file, options);
  }

  mkdir(contract, file, options) {
    this._validateContract(contract);
    return this.bubble.mkdir(file, options);
  }

  list(contract, file, options) {
    this._validateContract(contract);
    return this.bubble.list(file, options);
  }

  subscribe(contract, file, listener, options) {
    this._validateContract(contract);
    return this.bubble.subscribe(file, listener, options);
  }

  unsubscribe(subscriptionId, options) {
    return this.bubble.unsubscribe(subscriptionId, options);
  }

  terminate(contract, options) {
    this._validateContract(contract);
    return this.bubble.terminate(options);
  }

}