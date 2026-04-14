import { assert, BubbleError, ErrorCodes, BubbleFilename, ROOT_PATH } from '@bubble-protocol/core';


export const NOTIFICATION_CONFIG_FILE = new BubbleFilename('0xb9f67f2a5b929a7c1f97864c755308c84d01d3764ba7d8061f6de8de52e0eec8');
export const NOTIFICATION_OPERATIONS = ['write', 'append', 'delete', 'mkdir'];
export const NOTIFICATION_MATCH_TYPES = ['exact', 'children', 'descendents'];


/**
 * Manages notifications for a bubble provider.  The notification manager is responsible for 
 * validating a bubble's notification configuration file and sending notifications to the notifier
 * function when relevant bubble operations occur.
 * 
 * If the server supports notifications then each bubble may optionally include a notification 
 * configuration file. The notification configuration file is stored as a reserved file in the 
 * bubble and can be updated by any client authorised by the bubble contract.
 * 
 * The notification configuration file specifies a list of targets to notify when mutating operations
 * occur on specific paths in the bubble.  Each target includes a transport configuration that 
 * specifies how to send the notification to the target and a list of path rules that specify
 * which paths and operations to notify the target about.  When a mutating operation occurs on the 
 * bubble, the notification manager checks the notification configuration and sends notifications to
 * the notifier function for any targets with matching path rules.
 */
export class NotificationManager {

  dataServer;
  providerUrl;
  notifier;

  /**
   * @param {*} _dataServer the data server to retrieve notification config from
   * @param {*} _providerUrl the URL of this provider to specifify the content ID in notifications
   * @param {*} _notifier the notifier function to send notifications with signature `(target as {id: string, transport: Object}, notification as Object) => void`
   */
  constructor(_dataServer, _providerUrl, _notifier) {
    this.dataServer = _dataServer;
    this.providerUrl = _providerUrl;
    this.notifier = _notifier;
    this.validateRequest = this.validateRequest.bind(this);
  }


  /**
   * Returns true if the file is the reserved notification config file.
   * 
   * @param {string|BubbleFilename} file the file to check
   * @returns {boolean} true if the file is the reserved notification config file
   */
  isReservedFile(file) {
    return NOTIFICATION_CONFIG_FILE.equals(file);
  }


  /**
   * Validates a request to modify the notification config file.
   * 
   * @param {String} method the HTTP method of the request
   * @param {BubbleFilename} file the file being modified
   * @param {*} data the data being written to the file
   * @returns {void}
   */
  async validateRequest({method, params, file}) {
    if (!this.isReservedFile(file)) return;
    if (method === 'append' || method === 'mkdir') {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, `${method} not supported for notification config`);
    }
    if (method === 'write') {
      this._validateNotificationConfig(params.data);
    }    
  }


  /**
   * Sends a notification if the file matches any path rules in the notification config. Can send
   * multiple notifications if multiple path rules match.
   * 
   * @param {String} method the request method that triggered the notification candidate
   * @param {Object} params the validated parameters of the request
   * @param {BubbleFilename} file the file being modified
   * @param {Address} signatory the address of the signer
   */
  async notify(method, params, file, signatory) {
    try {
      const configJSON = await this.dataServer.read(params.contract, NOTIFICATION_CONFIG_FILE.fullFilename, {silent: true});
      if (configJSON) {
        try {
          const config = JSON.parse(configJSON);
          if (config && config.enabled) {
            const targets = config.version === 1 ? v1Config.getNotificationTargets(config, method, file) : [];
            if (targets.length > 0) {
              const notification = this._buildNotification(method, params, file, signatory);
              targets.forEach((t) => this.notifier(t, notification));
            }
          }
        }
        catch(error) {
          console.warn('invalid notification config JSON in contract', params.contract, 'skipping notifications');
          return;
        }
      }
    }
    catch(error) {
      console.error('error checking notification config for contract', params.contract, 'skipping notifications', error);
      return;
    }
  }


  // --- Internal functions ---

  // Builds a generic notification object for sending to the notifier.
  _buildNotification(method, params, file, signatory) {
    return {
      contentId: {
        chain: params.chainId,
        contract: params.contract,
        provider: this.providerUrl,
        file: file.fullFilename
      },
      operation: method,
      timestamp: Date.now(),
      signer: signatory,
      requestNonce: params.nonce,
      requestTimestamp: params.timestamp
    };
  }


  // Validates the notification config data and throws if invalid.  Does not return anything if valid.
  _validateNotificationConfig(data) {
    let config;
    try {
      config = JSON.parse(data);
    }
    catch(error) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: 'invalid json'});
    }

    if (!assert.isObject(config)) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: 'config must be an object'});
    }

    if (config.version !== 1) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: 'unsupported version'});
    }

    if (config.enabled !== undefined && !assert.isBoolean(config.enabled)) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: 'enabled must be boolean'});
    }

    if (config.targets !== undefined && !Array.isArray(config.targets)) {
      throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: 'targets must be an array'});
    }

    (config.targets || []).forEach((target, targetIndex) => {
      if (!assert.isObject(target)) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${targetIndex} must be an object`});
      }
      if (!assert.isString(target.id) || !assert.isNotEmpty(target.id)) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${targetIndex} id is invalid`});
      }
      if (target.enabled !== undefined && !assert.isBoolean(target.enabled)) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} enabled must be boolean`});
      }
      if (!assert.isObject(target.transport)) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} transport is invalid`});
      }
      if (!assert.isString(target.transport.type) || !assert.isNotEmpty(target.transport.type)) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} transport type is invalid`});
      }
      ['serviceRef', 'url', 'authRef'].forEach((field) => {
        if (target.transport[field] !== undefined && !assert.isString(target.transport[field])) {
          throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} transport ${field} is invalid`});
        }
      });
      if (!Array.isArray(target.paths)) {
        throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} paths must be an array`});
      }
      target.paths.forEach((pathRule, pathIndex) => {
        if (!assert.isObject(pathRule)) {
          throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} path rule ${pathIndex} must be an object`});
        }
        const pathFile = new BubbleFilename(pathRule.path);
        if (!pathFile.isValid()) {
          throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} path rule ${pathIndex} path is invalid`});
        }
        if (pathRule.match !== undefined && !NOTIFICATION_MATCH_TYPES.includes(pathRule.match)) {
          throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} path rule ${pathIndex} match is invalid`});
        }
        if ((pathRule.match || 'exact') === 'children' && pathFile.hasDirectory()) {
          throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} path rule ${pathIndex} children match requires a directory path`});
        }
        if (!Array.isArray(pathRule.operations) || pathRule.operations.length === 0) {
          throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} path rule ${pathIndex} operations are invalid`});
        }
        pathRule.operations.forEach((operation) => {
          if (!NOTIFICATION_OPERATIONS.includes(operation)) {
            throw new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'invalid notification config', {cause: `target ${target.id} path rule ${pathIndex} operation is invalid`});
          }
        });
      });
    });
  }

}


const v1Config = {

  // Example v1 notification config file content:
  //
  // {
  //   "version": 1,
  //   "enabled": true,
  //   "targets": [
  //     {
  //       "id": "appInbox",
  //       "enabled": true,
  //       "transport": {
  //         "type": "webhook",
  //         "url": "https://notify.example.com/bubble-events?token=abc123",
  //       },
  //       "paths": [
  //         {
  //           "path": "0x0000000000000000000000000000000000000000000000000000000000000001",
  //           "match": "exact",
  //           "operations": ["write", "delete"]
  //         },
  //         {
  //           "path": "0x0000000000000000000000000000000000000000000000000000000000000002",
  //           "match": "children",
  //           "operations": ["write", "append", "delete", "mkdir"]
  //         }
  //       ]
  //     }
  //   ]
  // }
  //

  getNotificationTargets: (config, method, file) => {
    const targets = [];
    (config.targets || []).forEach((target) => {
      if (target.enabled) {
        const notify = (target.paths || []).some((pathRule) => {
          let isMatch = false;
          if (pathRule.match === 'exact') isMatch = file.equals(pathRule.path);
          else if (pathRule.match === 'children') {
            isMatch = pathRule.path === ROOT_PATH ? !file.hasDirectory() : file.isChildOf(pathRule.path);
          }
          else if (pathRule.match === 'descendents') {
            isMatch = pathRule.path === ROOT_PATH ? true : file.isChildOf(pathRule.path);
          }
          return isMatch && pathRule.operations.includes(method);
        });
        if (notify) targets.push({ id: target.id,transport: target.transport });
      }
    });
    return targets;
  }

}
