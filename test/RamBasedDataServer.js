import {BubbleError, ErrorCodes} from '../packages/core/src/errors';
import {DataServer} from '../packages/server/src/DataServer';


export class RamBasedDataServer extends DataServer {

  constructor() {
    super();
    this.bubbles = {};
  }

  create(contract) {
    if (this.bubbles[contract] !== undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_ALREADY_EXISTS, "bubble already exists"));
    }
    const time = Date.now();
    this.bubbles[contract] = {created: time};
    return Promise.resolve();
  }
  
  write(contract, file, data) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    const time = Date.now();
    if (file.length > 66) {
      const dir = file.slice(0,66);
      if (this.bubbles[contract][dir] === undefined) this.bubbles[contract][dir] = {type: 'dir', created: time, modified: time};
    }
    this.bubbles[contract][file] = {type: 'file', created: time, modified: time, data: data};
    return Promise.resolve();
  }

  append(contract, file, data) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    const time = Date.now();
    if (file.length > 66) {
      const dir = file.slice(0,66);
      if (this.bubbles[contract][dir] === undefined) this.bubbles[contract][dir] = {type: 'dir', created: time, modified: time};
    }
    if (this.bubbles[contract][file] === undefined) this.bubbles[contract][file] = {type: 'file', created: time, modified: time, data: data};
    else {
      this.bubbles[contract][file].data += data;
      this.bubbles[contract][file].modified = time;
    }
    return Promise.resolve();
  }

  read(contract, file, options={}) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    if (this.bubbles[contract][file] === undefined) {
      if (options.silent) return Promise.resolve();
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
    if (!options.force && this.bubbles[contract][file].type === 'dir' && !isEmpty(file)) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_DIR_NOT_EMPTY, "directory is not empty"));
    }
    this.bubbles[contract][file] = undefined;
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
    return Promise.resolve();
  }

  list(contract, file, options={}) {
    if (this.bubbles[contract] === undefined) {
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    }
    if (this.bubbles[contract][file] === undefined) {
      if (options.silent) return Promise.resolve([])
      else return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST, "file does not exist"));
    }

    const isDir = this.bubbles[contract][file].type === 'dir';
    const files = [];
    if (!isDir) files.push(file);
    else {
      for (let f in this.bubbles[contract]) {
        if (f.slice(0,67) === file+"/") files.push(f);
      }
    }

    let countFilesIn = (dir) => {
      let count = 0;
      for (let f in this.bubbles[contract]) {
        if (f.slice(0,67) === dir+"/") count++;
      }
      return count;
    }
    countFilesIn = countFilesIn.bind(this);

    const results = [];
    files.forEach(f => {
      const meta = this.bubbles[contract][f];
      if (options.before !== undefined && meta.modified >= options.before) return;
      if (options.after !== undefined && meta.modified <= options.after) return;
      if (options.createdBefore !== undefined && meta.created >= options.createdBefore) return;
      if (options.createdAfter !== undefined && meta.created <= options.createdAfter) return;
      const result = {name: isDir && f.length > 67 ? f.slice(67) : f, directory: meta.type === 'dir'};
      if (options.long || options.length) result.length = meta.type === 'dir' ? countFilesIn(f) : meta.data ? meta.data.length : 0;
      if (options.long || options.created) result.created = meta.created;
      if (options.long || options.modified) result.modified = meta.modified;
      results.push(result);
    })
    
    return Promise.resolve(results);
  }

  terminate(contract) {
    delete this.bubbles[contract];
    return Promise.resolve();
  }

  _reset() {
    this.bubbles = {};
  }

  _resetBubble(contract) {
    this.bubbles[contract] = {created: Date.now()};
  }

}
