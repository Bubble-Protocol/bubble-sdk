import { describe, expect, jest } from '@jest/globals';
import { BubbleError, ErrorCodes, BubbleFilename } from '@bubble-protocol/core';
import { NotificationManager } from '../../src/NotificationManager.js';
import '@bubble-protocol/core/test/BubbleErrorMatcher.js';


describe('NotificationManager', () => {

  const CONTRACT = '0x0000000000000000000000000000000000000001';
  const DIRECTORY = '0x0000000000000000000000000000000000000000000000000000000000000002';
  const EXACT_FILE = new BubbleFilename(`${DIRECTORY}/hello.txt`);
  const CHILD_FILE = new BubbleFilename(`${DIRECTORY}/child.txt`);
  const RESERVED_FILE = new BubbleFilename('0xb9f67f2a5b929a7c1f97864c755308c84d01d3764ba7d8061f6de8de52e0eec8');
  const PROVIDER_URL = 'https://provider.example';
  const SIGNATORY = '0x0000000000000000000000000000000000000009';

  let dataServer;
  let notifier;
  let manager;

  beforeEach(() => {
    dataServer = {
      read: jest.fn()
    };
    notifier = jest.fn();
    manager = new NotificationManager(dataServer, PROVIDER_URL, notifier);
  });

  function buildParams(data) {
    return {
      data,
      chainId: 1,
      contract: CONTRACT,
      nonce: 'nonce-1',
      timestamp: 12345
    };
  }

  function validConfig(overrides = {}) {
    return {
      version: 1,
      enabled: true,
      targets: [
        {
          id: 'exact-target',
          enabled: true,
          transport: {
            type: 'webhook',
            url: 'https://notify.example/exact'
          },
          paths: [
            {
              path: EXACT_FILE.fullFilename,
              match: 'exact',
              operations: ['write']
            },
            {
              path: DIRECTORY,
              match: 'children',
              operations: ['write', 'append']
            }
          ]
        },
        {
          id: 'children-target',
          enabled: true,
          transport: {
            type: 'webhook',
            url: 'https://notify.example/children'
          },
          paths: [
            {
              path: DIRECTORY,
              match: 'children',
              operations: ['write']
            }
          ]
        }
      ],
      ...overrides
    };
  }

  describe('validateRequest', () => {

    test('accepts a valid notification config written to the reserved file', async () => {
      await expect(
        manager.validateRequest({
          method: 'write',
          params: buildParams(JSON.stringify(validConfig())),
          file: RESERVED_FILE
        })
      ).resolves.toBeUndefined();
    });

    test('rejects append requests to the reserved file', async () => {
      await expect(
        manager.validateRequest({
          method: 'append',
          params: buildParams('ignored'),
          file: RESERVED_FILE
        })
      ).rejects.toBeBubbleError(
        new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED, 'append not supported for notification config')
      );
    });

    test('rejects invalid JSON written to the reserved file', async () => {
      await expect(
        manager.validateRequest({
          method: 'write',
          params: buildParams('{invalid'),
          file: RESERVED_FILE
        })
      ).rejects.toBeBubbleError({
        code: ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED,
        message: 'invalid notification config'
      });
    });

    test('ignores non-reserved files', async () => {
      await expect(
        manager.validateRequest({
          method: 'write',
          params: buildParams('{invalid'),
          file: EXACT_FILE
        })
      ).resolves.toBeUndefined();
    });

  });


  describe('notify', () => {

    test('sends notifications to targets with matching exact and children path rules', () => {
      dataServer.read.mockReturnValue(validConfig());

      manager.notify('write', buildParams('write data'), EXACT_FILE, SIGNATORY);

      expect(dataServer.read).toHaveBeenCalledWith(CONTRACT, RESERVED_FILE, { silent: true });
      expect(notifier).toHaveBeenCalledTimes(2);
      expect(notifier).toHaveBeenNthCalledWith(
        1,
        {
          id: 'exact-target',
          transport: {
            type: 'webhook',
            url: 'https://notify.example/exact'
          }
        },
        expect.objectContaining({
          contentId: {
            chain: 1,
            contract: CONTRACT,
            provider: PROVIDER_URL,
            file: EXACT_FILE.fullFilename
          },
          operation: 'write',
          signer: SIGNATORY,
          requestNonce: 'nonce-1',
          requestTimestamp: 12345,
          timestamp: expect.any(Number)
        })
      );
      expect(notifier).toHaveBeenNthCalledWith(
        2,
        {
          id: 'children-target',
          transport: {
            type: 'webhook',
            url: 'https://notify.example/children'
          }
        },
        expect.objectContaining({
          contentId: expect.objectContaining({
            file: EXACT_FILE.fullFilename
          }),
          operation: 'write'
        })
      );
    });

    test('sends notification when the second operation matches', () => {
      dataServer.read.mockReturnValue(validConfig());

      manager.notify('append', buildParams('append data'), EXACT_FILE, SIGNATORY);

      expect(dataServer.read).toHaveBeenCalledWith(CONTRACT, RESERVED_FILE, { silent: true });
      expect(notifier).toHaveBeenCalledTimes(1);
      expect(notifier).toHaveBeenNthCalledWith(
        1,
        {
          id: 'exact-target',
          transport: {
            type: 'webhook',
            url: 'https://notify.example/exact'
          }
        },
        expect.objectContaining({
          contentId: {
            chain: 1,
            contract: CONTRACT,
            provider: PROVIDER_URL,
            file: EXACT_FILE.fullFilename
          },
          operation: 'append',
          signer: SIGNATORY,
          requestNonce: 'nonce-1',
          requestTimestamp: 12345,
          timestamp: expect.any(Number)
        })
      );
    });

    test('does not notify when the config is disabled or missing', () => {
      dataServer.read.mockReturnValueOnce({ version: 1, enabled: false, targets: [] });
      manager.notify('write', buildParams('write'), CHILD_FILE, SIGNATORY);

      dataServer.read.mockReturnValueOnce(undefined);
      manager.notify('write', buildParams('write'), CHILD_FILE, SIGNATORY);

      expect(notifier).not.toHaveBeenCalled();
    });

  });

});
