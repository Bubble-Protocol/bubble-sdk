import { jest } from '@jest/globals';
import { pingWebsocketServerTest, startServers, stopServers } from './mockups/test-servers.js';
import { bubbleAvailableTest, clearTestBubble, ownerBubble, requesterBubble } from './mockups/test-bubble.js';
import { constructTestBubble } from './mockups/test-bubble.js';
import '../packages/core/test/BubbleErrorMatcher.js';
import contractSrc from './contracts/MultiUserContract.json';
import { ROOT_PATH } from '../packages/core/src/index.js';


const publicDir = "0x0000000000000000000000000000000000000000000000000000000000000001";
const privateDir = "0x0000000000000000000000000000000000000000000000000000000000000002";
const logFile = "0x0000000000000000000000000000000000000000000000000000000000000003";


describe('subscription tests', () => {

  beforeAll(async () => {
    await startServers({protocol: 'ws:'});
    await constructTestBubble({protocol: 'ws:', contractSrc: contractSrc});
  }, 20000)

  afterAll( async () => {
    await ownerBubble.provider.close();
    await stopServers();
  }, 20000)


  pingWebsocketServerTest();
  bubbleAvailableTest();


  describe('Subscribe to file', () => {

    beforeEach(() => {
      clearTestBubble();
    })

    test('subscriber is notified of a write event with file info and contents', async () => {
      const listener = jest.fn();
      await ownerBubble.write(logFile, 'hello');
      const subscription = await ownerBubble.subscribe(logFile, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.write(logFile, 'hi');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('write');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('file');
      expect(listener.mock.calls[0][0].file.name).toBe(logFile);
      expect(listener.mock.calls[0][0].file.length).toBe(2);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBe(listener.mock.calls[0][0].file.created);
      expect(listener.mock.calls[0][0].data).toBe('hi');
    })
      
    test('subscriber is notified of an append event with file info and appended string', async () => {
      const listener = jest.fn();
      await ownerBubble.write(logFile, 'hello');
      const subscription = await ownerBubble.subscribe(logFile, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.append(logFile, ' world');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('append');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('file');
      expect(listener.mock.calls[0][0].file.name).toBe(logFile);
      expect(listener.mock.calls[0][0].file.length).toBe(11);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBeGreaterThan(listener.mock.calls[0][0].file.created);
      expect(listener.mock.calls[0][0].data).toBe(' world');
    })
      
    test('subscriber is notified of a delete event with file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(logFile, 'hello');
      const subscription = await ownerBubble.subscribe(logFile, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.delete(logFile);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('delete');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('file');
      expect(listener.mock.calls[0][0].file.name).toBe(logFile);
      expect(listener.mock.calls[0][0].file.length).toBeUndefined();
      expect(listener.mock.calls[0][0].data).toBeUndefined();
    })
      
  })

  describe('Subscribe to the root', () => {

    beforeEach(() => {
      clearTestBubble();
    })

    test('subscriber is notified of an update event with written file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(logFile, 'hello');
      const subscription = await ownerBubble.subscribe(ROOT_PATH, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.write(logFile, 'hi');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('update');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('dir');
      expect(listener.mock.calls[0][0].file.name).toBe(ROOT_PATH);
      expect(listener.mock.calls[0][0].file.length).toBe(1);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBeGreaterThan(listener.mock.calls[0][0].file.created);
      expect(Array.isArray(listener.mock.calls[0][0].data)).toBe(true);
      expect(listener.mock.calls[0][0].data).toHaveLength(1);
      expect(typeof listener.mock.calls[0][0].data[0]).toBe('object');
      expect(listener.mock.calls[0][0].data[0].event).toBe('write');
      expect(listener.mock.calls[0][0].data[0].type).toBe('file');
      expect(listener.mock.calls[0][0].data[0].name).toBe(logFile);
      expect(listener.mock.calls[0][0].data[0].length).toBe(2);
      expect(typeof listener.mock.calls[0][0].data[0].created).toBe('number');
      expect(listener.mock.calls[0][0].data[0].modified).toBe(listener.mock.calls[0][0].data[0].created);
      expect(listener.mock.calls[0][0].data[0].data).toBeUndefined();
    })

    test('subscriber is notified of an update event with appended file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(logFile, 'hello');
      const subscription = await ownerBubble.subscribe(ROOT_PATH, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.append(logFile, ' world');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('update');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('dir');
      expect(listener.mock.calls[0][0].file.name).toBe(ROOT_PATH);
      expect(listener.mock.calls[0][0].file.length).toBe(1);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBeGreaterThan(listener.mock.calls[0][0].file.created);
      expect(Array.isArray(listener.mock.calls[0][0].data)).toBe(true);
      expect(listener.mock.calls[0][0].data).toHaveLength(1);
      expect(typeof listener.mock.calls[0][0].data[0]).toBe('object');
      expect(listener.mock.calls[0][0].data[0].event).toBe('append');
      expect(listener.mock.calls[0][0].data[0].type).toBe('file');
      expect(listener.mock.calls[0][0].data[0].name).toBe(logFile);
      expect(listener.mock.calls[0][0].data[0].length).toBe(11);
      expect(typeof listener.mock.calls[0][0].data[0].created).toBe('number');
      expect(listener.mock.calls[0][0].data[0].modified).toBeGreaterThan(listener.mock.calls[0][0].data[0].created);
      expect(listener.mock.calls[0][0].data[0].data).toBeUndefined();
    })

    test('subscriber is notified of an update event with deleted file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(logFile, 'hello');
      const subscription = await ownerBubble.subscribe(ROOT_PATH, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.delete(logFile);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('update');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('dir');
      expect(listener.mock.calls[0][0].file.name).toBe(ROOT_PATH);
      expect(listener.mock.calls[0][0].file.length).toBe(0);
      expect(Array.isArray(listener.mock.calls[0][0].data)).toBe(true);
      expect(listener.mock.calls[0][0].data).toHaveLength(1);
      expect(typeof listener.mock.calls[0][0].data[0]).toBe('object');
      expect(listener.mock.calls[0][0].data[0].event).toBe('delete');
      expect(listener.mock.calls[0][0].data[0].type).toBe('file');
      expect(listener.mock.calls[0][0].data[0].name).toBe(logFile);
      expect(listener.mock.calls[0][0].data[0].length).toBeUndefined();
    })
      
  })

  describe('Subscribe to a directory', () => {

    beforeEach(() => {
      clearTestBubble();
    })

    const fileInDir = publicDir + '/myFile.txt'

    test('subscriber is notified of an update event with written file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(fileInDir, 'hello');
      const subscription = await ownerBubble.subscribe(publicDir, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.write(fileInDir, 'hi');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('update');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('dir');
      expect(listener.mock.calls[0][0].file.name).toBe(publicDir);
      expect(listener.mock.calls[0][0].file.length).toBe(1);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBe(listener.mock.calls[0][0].file.created); // dir modify time not updated when file contents are updated
      expect(Array.isArray(listener.mock.calls[0][0].data)).toBe(true);
      expect(listener.mock.calls[0][0].data).toHaveLength(1);
      expect(typeof listener.mock.calls[0][0].data[0]).toBe('object');
      expect(listener.mock.calls[0][0].data[0].event).toBe('write');
      expect(listener.mock.calls[0][0].data[0].type).toBe('file');
      expect(listener.mock.calls[0][0].data[0].name).toBe(fileInDir);
      expect(listener.mock.calls[0][0].data[0].length).toBe(2);
      expect(typeof listener.mock.calls[0][0].data[0].created).toBe('number');
      expect(listener.mock.calls[0][0].data[0].modified).toBe(listener.mock.calls[0][0].data[0].created);
      expect(listener.mock.calls[0][0].data[0].data).toBeUndefined();
    })

    test('subscriber is notified of an update event with appended file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(fileInDir, 'hello');
      const subscription = await ownerBubble.subscribe(publicDir, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.append(fileInDir, ' world');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('update');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('dir');
      expect(listener.mock.calls[0][0].file.name).toBe(publicDir);
      expect(listener.mock.calls[0][0].file.length).toBe(1);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBe(listener.mock.calls[0][0].file.created); // dir modify time not updated when file contents are updated
      expect(Array.isArray(listener.mock.calls[0][0].data)).toBe(true);
      expect(listener.mock.calls[0][0].data).toHaveLength(1);
      expect(typeof listener.mock.calls[0][0].data[0]).toBe('object');
      expect(listener.mock.calls[0][0].data[0].event).toBe('append');
      expect(listener.mock.calls[0][0].data[0].type).toBe('file');
      expect(listener.mock.calls[0][0].data[0].name).toBe(fileInDir);
      expect(listener.mock.calls[0][0].data[0].length).toBe(11);
      expect(typeof listener.mock.calls[0][0].data[0].created).toBe('number');
      expect(listener.mock.calls[0][0].data[0].modified).toBeGreaterThan(listener.mock.calls[0][0].data[0].created);
      expect(listener.mock.calls[0][0].data[0].data).toBeUndefined();
    })

    test('subscriber is notified of an update event with deleted file info', async () => {
      const listener = jest.fn();
      await ownerBubble.write(fileInDir, 'hello');
      const subscription = await ownerBubble.subscribe(publicDir, listener);
      expect(subscription.subscriptionId).not.toBeNull();
      expect(listener.mock.calls).toHaveLength(0);
      await ownerBubble.delete(fileInDir);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(listener.mock.calls).toHaveLength(1);
      expect(listener.mock.calls[0][0].subscriptionId).toBe(subscription.subscriptionId);
      expect(listener.mock.calls[0][0].event).toBe('update');
      expect(typeof listener.mock.calls[0][0].file).toBe('object');
      expect(listener.mock.calls[0][0].file.type).toBe('dir');
      expect(listener.mock.calls[0][0].file.name).toBe(publicDir);
      expect(listener.mock.calls[0][0].file.length).toBe(0);
      expect(typeof listener.mock.calls[0][0].file.created).toBe('number');
      expect(listener.mock.calls[0][0].file.modified).toBeGreaterThan(listener.mock.calls[0][0].file.created); // dir modify time is updated when files are added or deleted
      expect(Array.isArray(listener.mock.calls[0][0].data)).toBe(true);
      expect(listener.mock.calls[0][0].data).toHaveLength(1);
      expect(typeof listener.mock.calls[0][0].data[0]).toBe('object');
      expect(listener.mock.calls[0][0].data[0].event).toBe('delete');
      expect(listener.mock.calls[0][0].data[0].type).toBe('file');
      expect(listener.mock.calls[0][0].data[0].name).toBe(fileInDir);
      expect(listener.mock.calls[0][0].data[0].length).toBeUndefined();
    })
      
  })

  describe('multiple subscriptions', () => {

    const numSubs = 10;

    const subscriptions = [];

    let subCalls = 0;

    beforeAll(async () => {
      for (let i=0; i<numSubs.length; i++) {
        const listener = jest.fn();
        const bubble = i % 2 === 0 ? ownerBubble : requesterBubble;
        const subscription = await bubble.subscribe(logFile, listener);
        subscriptions.push({
          id: subscription.subscriptionId,
          listener: listener
        })
        expect(subscription.subscriptionId).not.toBeNull();
        expect(listener.mock.calls).toHaveLength(0);
      }
    })

    test('all subscribers are notified of a file write', async () => {
      await ownerBubble.write(logFile, 'hello');
      await new Promise(resolve => setTimeout(resolve, 100));
      subscriptions.forEach(sub => {
        expect(sub.listener.mock.calls).toHaveLength(subCalls+1);
        expect(sub.listener.mock.calls[subCalls][0].subscriptionId).toBe(sub.id);
        expect(sub.listener.mock.calls[subCalls][0].event).toBe('write');
        expect(typeof sub.listener.mock.calls[subCalls][0].file).toBe('object');
        expect(sub.listener.mock.calls[subCalls][0].file.type).toBe('file');
        expect(sub.listener.mock.calls[subCalls][0].file.name).toBe(logFile);
      })
      subCalls++;
    })
      
    test('all subscribers are notified of a file append', async () => {
      await ownerBubble.write(logFile, 'hello');
      subCalls++;
      await ownerBubble.append(logFile, ' world');
      await new Promise(resolve => setTimeout(resolve, 100));
      subscriptions.forEach(sub => {
        expect(sub.listener.mock.calls).toHaveLength(subCalls+1);
        expect(sub.listener.mock.calls[subCalls][0].subscriptionId).toBe(sub.id);
        expect(sub.listener.mock.calls[subCalls][0].event).toBe('append');
        expect(typeof sub.listener.mock.calls[subCalls][0].file).toBe('object');
        expect(sub.listener.mock.calls[subCalls][0].file.type).toBe('file');
        expect(sub.listener.mock.calls[subCalls][0].file.name).toBe(logFile);
      })
      subCalls++;
    })
      
    test('all subscribers are notified of a file delete', async () => {
      await ownerBubble.write(logFile, 'hello');
      subCalls++;
      await ownerBubble.delete(logFile);
      await new Promise(resolve => setTimeout(resolve, 100));
      subscriptions.forEach(sub => {
        expect(sub.listener.mock.calls).toHaveLength(subCalls+1);
        expect(sub.listener.mock.calls[subCalls][0].subscriptionId).toBe(sub.id);
        expect(sub.listener.mock.calls[subCalls][0].event).toBe('append');
        expect(typeof sub.listener.mock.calls[subCalls][0].file).toBe('object');
        expect(sub.listener.mock.calls[subCalls][0].file.type).toBe('file');
        expect(sub.listener.mock.calls[subCalls][0].file.name).toBe(logFile);
      })
      subCalls++;
    })
      
    test('no subscribers are notified of an update to different file', async () => {
      await ownerBubble.write(publicDir+'/file.txt', "hello");
      await new Promise(resolve => setTimeout(resolve, 100));
      subscriptions.forEach(sub => {
        expect(sub.listener.mock.calls).toHaveLength(subCalls);
      })
    })
      
  })

})