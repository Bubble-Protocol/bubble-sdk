import { ROOT_PATH } from '../packages';
import {BubbleError, ErrorCodes} from '../packages/core/src/errors';
import {DataServer} from '../packages/server/src/DataServer';


export class RamBasedDataServer extends DataServer {

  constructor() {
    super();
    this.bubbles = {};
  }

  //
  // Requirements:
  //
  //   [req-ds-cr-1] When called, the data server shall create the bubble uniquely identified by the contract address.
  //
  //   [req-ds-cr-2] The data server shall resolve if the creation was successful.
  //
  //   [req-ds-cr-3] The data server shall reject with a `BUBBLE_ALREADY_EXISTS` error if the 
  //                 bubble already exists and the silent option is NOT given.
  //
  //   [req-ds-cr-4] The data server shall resolve if the bubble already exists but the silent option is given.
  //
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
    if (file.length > 66) {
      const dir = file.slice(0,66);
      if (this.bubbles[contract][dir] === undefined) this.bubbles[contract][dir] = {type: 'dir', created: time, modified: time};
      else if (!fileExists) this.bubbles[contract][dir].modified = time;
    }
    else {
      if (!fileExists) this.bubbles[contract][ROOT_PATH].modified = time;
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

    const isDir = this.bubbles[contract][file].type === 'dir';
    
    delete this.bubbles[contract][file];

    if (isDir) {
      for (let f in this.bubbles[contract]) {
        if (f.length > 66 && f.slice(0,67) === file+"/") delete this.bubbles[contract][f];
      }
    }

    const time = Date.now();
    if (file.length > 66) {
      const dir = file.slice(0,66);
      this.bubbles[contract][dir].modified = time;
    }
    else {
      this.bubbles[contract][ROOT_PATH].modified = time;
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

    let countFilesIn = (dir) => {
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
    countFilesIn = countFilesIn.bind(this);

    
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
      if (options.long || options.length) result.length = meta.type === 'dir' ? countFilesIn(f) : meta.data ? meta.data.length : 0;
      if (options.long || options.created) result.created = meta.created;
      if (options.long || options.modified) result.modified = meta.modified;
      results.push(result);
    })
    
    return Promise.resolve(results);
  }

  terminate(contract, options={}) {
    if (this.bubbles[contract] === undefined && !options.silent) 
      return Promise.reject(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_BUBBLE_DOES_NOT_EXIST, "bubble does not exist"));
    delete this.bubbles[contract];
    return Promise.resolve();
  }

  _reset() {
    this.bubbles = {};
  }

  _resetBubble(contract) {
    if (!this.bubbles[contract]) return;
    this.terminate(contract);
    this.create(contract);
  }

  _createBubble(contract) {
    if (this.bubbles[contract]) this._resetBubble(contract);
    else this.create(contract);
  }

}
