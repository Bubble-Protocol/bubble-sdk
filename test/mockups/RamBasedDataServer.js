import { ROOT_PATH } from '../../packages/core';
import {BubbleError, ErrorCodes} from '../../packages/core/src/errors.js';
import {DataServer} from '../../packages/server/src/DataServer.js';

/**
 * RAM based implementation of a `DataServer`.  Can be used for testing purposes.
 */
export class RamBasedDataServer extends DataServer {

  constructor() {
    super();
    this.bubbles = {};
    this.subscriptions = [];
  }

  create(contract, options={}) {
    if (this.bubbles[contract] !== undefined && !options.silent) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS, "bubble already exists"));
    }
    const time = Date.now();
    this.bubbles[contract] = {created: time};
    this.bubbles[contract][ROOT_PATH] = {type: 'dir', created: time, modified: time};
    return Promise.resolve();
  }
  
  write(contract, file, data) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    const time = Date.now();
    const fileExists = this.bubbles[contract][file] !== undefined;
    let dir;
    if (file.length > 66) {
      dir = file.slice(0,66);
      if (this.bubbles[contract][dir] === undefined) this.bubbles[contract][dir] = {type: 'dir', created: time, modified: time};
      else if (!fileExists) this.bubbles[contract][dir].modified = time;
    }
    else {
      if (!fileExists) this.bubbles[contract][ROOT_PATH].modified = time;
    }
    this.bubbles[contract][file] = {type: 'file', created: time, modified: time, data: data};
    this._notifySubscribers(contract, file, 'write', data);
    if (dir) this._notifySubscribers(contract, dir, 'update', [{event: 'write', name: file, type: 'file', length: data.length, created: this.bubbles[contract][file].created, modified: time}]);
    else this._notifySubscribers(contract, ROOT_PATH, 'update', [{event: 'write', name: file, type: 'file', length: data.length, created: this.bubbles[contract][file].created, modified: time}]);
    return Promise.resolve();
  }

  append(contract, file, data) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    const time = Date.now();
    let dir;
    if (file.length > 66) {
      dir = file.slice(0,66);
      if (this.bubbles[contract][dir] === undefined) this.bubbles[contract][dir] = {type: 'dir', created: time, modified: time};
    }
    if (this.bubbles[contract][file] === undefined) this.bubbles[contract][file] = {type: 'file', created: time, modified: time, data: data};
    else {
      this.bubbles[contract][file].data += data;
      this.bubbles[contract][file].modified = time;
    }
    this._notifySubscribers(contract, file, 'append', data);
    if (dir) this._notifySubscribers(contract, dir, 'update', [{event: 'append', name: file, type: 'file', length: this.bubbles[contract][file].data.length, created: this.bubbles[contract][file].created, modified: time}]);
    else this._notifySubscribers(contract, ROOT_PATH, 'update', [{event: 'append', name: file, type: 'file', length: this.bubbles[contract][file].data.length, created: this.bubbles[contract][file].created, modified: time}]);
    return Promise.resolve();
  }

  read(contract, file, options={}) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    if (this.bubbles[contract][file] === undefined) {
      if (options.silent) return Promise.resolve('');
      else return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST, "file does not exist"));
    }
    return Promise.resolve(this.bubbles[contract][file].data);
  }


  delete(contract, file, options={}) {

    let isEmpty = (dir) => {
      for (let f in this.bubbles[contract]) {
        if (f.length > 66 && f.slice(0,67) === dir+"/") return false;
      }
      return true;
    }
    isEmpty = isEmpty.bind(this);

    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    if (this.bubbles[contract][file] === undefined) {
      if (options.silent) return Promise.resolve();
      else return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST, "file does not exist"));
    }

    const type = this.bubbles[contract][file].type;
    const isDir = type === 'dir';
    
    delete this.bubbles[contract][file];

    if (isDir) {
      for (let f in this.bubbles[contract]) {
        if (f.length > 66 && f.slice(0,67) === file+"/") delete this.bubbles[contract][f];
      }
    }

    this._notifySubscribers(contract, file, 'delete', undefined, type);

    const time = Date.now();
    if (file.length > 66) {
      const dir = file.slice(0,66);
      this.bubbles[contract][dir].modified = time;
      this._notifySubscribers(contract, dir, 'update', [{event: 'delete', name: file, type: 'file'}]);
    }
    else {
      this.bubbles[contract][ROOT_PATH].modified = time;
      this._notifySubscribers(contract, ROOT_PATH, 'update', [{event: 'delete', name: file, type: 'file'}]);
    }

    return Promise.resolve();
  }


  mkdir(contract, file, options={}) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    if (this.bubbles[contract][file] !== undefined) {
      if (options.silent) return Promise.resolve();
      else return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS, "directory already exists"));
    }
    const time = Date.now();
    this.bubbles[contract][file] = {type: 'dir', created: time, modified: time};
    this.bubbles[contract][ROOT_PATH].modified = time;
    this._notifySubscribers(contract, file, 'mkdir');
    this._notifySubscribers(contract, ROOT_PATH, 'update', [{event: 'mkdir', name: file, type: 'dir', length: 0, created: time, modified: time}]);
    return Promise.resolve();
  }

  list(contract, file, options={}) {
    const isRoot = file === ROOT_PATH;
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    if (this.bubbles[contract][file] === undefined && !isRoot) {
      if (options.silent) return Promise.resolve([])
      else return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST, "file does not exist"));
    }

    const isDir = isRoot || this.bubbles[contract][file].type === 'dir';
    const files = [];
    if (!isDir || options.directoryOnly) files.push(file);
    else {
      for (let f in this.bubbles[contract]) {
        if (f.length === 66) {
          if (isRoot && f !== ROOT_PATH) files.push(f); 
        }
        else if (f.slice(0,67) === file+"/") files.push(f);
      }
    }
    
    // Prepare matches option

    var matchesRegex;
    if (options.matches) {
      try {
        matchesRegex = new RegExp(options.matches)
      }
      catch(error) {
        return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION, "invalid matches option"));
      }
    }

    // Prepare time options

    if (options.before !== undefined && typeof options.before !== 'number') 
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION, "invalid before option"));
    if (options.after !== undefined && typeof options.after !== 'number') 
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION, "invalid after option"));
    if (options.createdBefore !== undefined && typeof options.createdBefore !== 'number') 
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION, "invalid createdBefore option"));
    if (options.createdAfter !== undefined && typeof options.createdAfter !== 'number') 
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_INVALID_OPTION, "invalid createdAfter option"));

    
    // Filter files

    const results = [];
    files.forEach(f => {
      const meta = this.bubbles[contract][f];
      if (meta === undefined) return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_INTERNAL_ERROR, "meta is undefined for file "+f))
      if (options.before !== undefined && meta.modified >= options.before) return;
      if (options.after !== undefined && meta.modified <= options.after) return;
      if (options.createdBefore !== undefined && meta.created >= options.createdBefore) return;
      if (options.createdAfter !== undefined && meta.created <= options.createdAfter) return;
      if (options.matches && !matchesRegex.test(f)) return;
      const result = {name: f, type: meta.type};
      if (options.long || options.length) result.length = meta.type === 'dir' ? this._countFilesIn(contract, f) : meta.data ? meta.data.length : 0;
      if (options.long || options.created) result.created = meta.created;
      if (options.long || options.modified) result.modified = meta.modified;
      results.push(result);
    })
    
    return Promise.resolve(results);
  }

  subscribe(contract, file, listener, options={}) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    this.subscriptions.push({contract, file, listener, options});
    // construct response
    const id = this.subscriptions.length-1;
    const meta = {name: file, ...this.bubbles[contract][file]};
    if (meta.type) {
      meta.length = meta.type === 'dir' ? this._countFilesIn(contract, file) : meta.data ? meta.data.length : 0;
      if (options.list === true) return this.list(contract, file, {long: true}).then(list => { return {subscriptionId: id, file: meta, data: list} });
      if (options.since) return this.list(contract, file, {long: true, after: options.since}).then(list => { return {subscriptionId: id, file: meta, data: list} });
      if (options.read) return this.read(contract, file).then(data => { return {subscriptionId: id, file: meta, data: data} });
    }
    return Promise.resolve({subscriptionId: id, file: meta});
  }

  unsubscribe(subscriptionId) {
    if (typeof subscriptionId === 'number' && subscriptionId >= 0 && subscriptionId < this.subscriptions.length) this.subscriptions[subscriptionId] = {};
    return Promise.resolve();
  }

  terminate(contract, options={}) {
    if (this.bubbles[contract] === undefined && !options.silent) 
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    delete this.bubbles[contract];
    return Promise.resolve();
  }

  unsubscribeClient() {
    // TODO
  }

  _notifySubscribers(contract, file, event, data, type) {
    let meta;
    if (event === 'delete') meta = {name: file, type: type};
    else {
      meta = {name: file, ...this.bubbles[contract][file]};
      meta.length = meta.type === 'dir' ? this._countFilesIn(contract, file) : meta.data ? meta.data.length : 0;
      delete meta.data;
    }
    this.subscriptions.forEach((sub, i) => {
      if (sub.contract === contract && sub.file === file) {
        sub.listener({
          subscriptionId: i,
          event: event,
          file: meta,
          data: event === 'delete' || sub.options.list ? undefined : data
        })
      }
    })
  }

  _countFilesIn(contract, dir) {
    const dirIsRoot = dir === ROOT_PATH;
    let count = 0;
    for (let f in this.bubbles[contract]) {
      if (dirIsRoot) {
        if (f.length === 66 && f !== ROOT_PATH) count++;
      }
      else if (f.slice(0,67) === dir+"/") count++;
    }
    return count;
  }

  _reset() {
    this.bubbles = {};
    this.subscriptions = [];
  }

  _resetBubble(contract) {
    this.subscriptions = this.subscriptions.filter(sub => sub.contract !== contract);
    if (!this.bubbles[contract]) return;
    this.terminate(contract);
    this.create(contract);
  }

  _createBubble(contract) {
    if (this.bubbles[contract]) this._resetBubble(contract);
    else this.create(contract);
  }

}
