import { Bubble, BubbleFactory } from '../packages/client/src';
import { pingServerTest, startServers, stopServers, BUBBLE_SERVER_URL } from './mockups/test-servers.js';
import { bubbleAvailableTest, owner, ownerBubble as bubble, ownerSign, requester, requesterSign, deleteAllBubbles } from './mockups/test-bubble.js';
import { constructTestBubble } from './mockups/test-bubble.js';
import '../packages/core/test/BubbleErrorMatcher.js';
import { ecies } from '../packages/crypto/src';
import multiUserContractSrc from './contracts/MultiUserContract.json';


const logFile = "0x0000000000000000000000000000000000000000000000000000000000000003";


describe('BubbleFactory', () => {

  beforeAll(async () => {
    await startServers();
    await constructTestBubble();
  }, 20000)

  afterAll( async () => {
    await stopServers();
  }, 20000)


  pingServerTest();
  bubbleAvailableTest();


  describe('AESGCM Encrypted User & Multi-User Bubble', () => {

    const TEST_METADATA = {
      a: 'this is a string',
      b: 3,
      c: {
        c1: 'c1',
        c2: 'c2'
      }
    }

    const OWNER_METADATA = {
      type: 'owner',
      ...TEST_METADATA
    }

    const REQUESTER_METADATA = {
      type: 'requester',
      ...TEST_METADATA
    }

   let ownerBubble, requesterBubble;

    beforeAll(async () => {
      // owner uses AESGCMEncryptedMultiUserBubble
      await constructTestBubble({contractSrc: multiUserContractSrc, noBubble: true});
      const ownerBubbleFactory = new BubbleFactory(ownerSign, owner.key);
      ownerBubble = ownerBubbleFactory.createAESGCMEncryptedMultiUserBubble(bubble.contentId);
      // requester uses AESGCMEncryptedUserBubble
      const requesterDecryptFunction = (data) => Promise.resolve(ecies.decrypt(requester.privateKey, data));
      const requesterUser = {address: requester.address, cPublicKey: requester.key.cPublicKey, decryptFunction: requesterDecryptFunction};
      const requesterBubbleFactory = new BubbleFactory(requesterSign, requesterUser);
      requesterBubble = requesterBubbleFactory.createAESGCMEncryptedUserBubble(bubble.contentId, {provider: bubble.provider});
    }, 20000)

    test('owner can create the bubble with metadata', async () => {
      await expect(ownerBubble.create({userMetadata: OWNER_METADATA})).resolves.toMatchObject(ownerBubble.contentId);
      expect(ownerBubble.userMetadata).toStrictEqual(OWNER_METADATA);
    })

    describe('initialise bubble', () => {

      beforeAll(async () => {
        await expect(ownerBubble.create({userMetadata: OWNER_METADATA, silent: true})).resolves.not.toThrow();
      })
      
      test('owner can add requester metadata', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
      })

      test('requester can initialise', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        await expect(requesterBubble.initialise()).resolves.toStrictEqual(REQUESTER_METADATA);
        expect(requesterBubble.userMetadata).toStrictEqual(REQUESTER_METADATA);
      })

      test('owner can initialise', async () => {
        const ownerBubbleFactory = new BubbleFactory(ownerSign, owner.key);
        const newBubble = ownerBubbleFactory.createAESGCMEncryptedMultiUserBubble(bubble.contentId);
        await expect(newBubble.initialise()).resolves.toStrictEqual(OWNER_METADATA);
        expect(newBubble.userMetadata).toStrictEqual(OWNER_METADATA);
      })

      test('AESGCMEncryptedUserBubble can initialise with optional provider', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        const bubbleFactory = new BubbleFactory(requesterSign, requester.key);
        const newBubble = bubbleFactory.createAESGCMEncryptedUserBubble(bubble.contentId, {provider: bubble.provider});
        await expect(newBubble.initialise()).resolves.not.toThrow();
      })

      test('AESGCMEncryptedUserBubble can initialise with optional provider as string', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        const bubbleFactory = new BubbleFactory(requesterSign, requester.key);
        const newBubble = bubbleFactory.createAESGCMEncryptedUserBubble(bubble.contentId, {provider: BUBBLE_SERVER_URL});
        await expect(newBubble.initialise()).resolves.not.toThrow();
      })

      test('AESGCMEncryptedMultiUserBubble can initialise with provider as string', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        const bubbleFactory = new BubbleFactory(ownerSign, owner.key);
        const newBubble = bubbleFactory.createAESGCMEncryptedUserBubble(bubble.contentId, BUBBLE_SERVER_URL);
        await expect(newBubble.initialise()).resolves.not.toThrow();
      })

    })


    describe('update metadata', () => {

      beforeEach(async () => {
        deleteAllBubbles();
        await expect(ownerBubble.create({userMetadata: OWNER_METADATA})).resolves.not.toThrow();
      })
      
      test('writeUserMetadata updates the bubble and local metadata', async () => {
        expect(ownerBubble.userMetadata).toStrictEqual(OWNER_METADATA);
        await expect(ownerBubble.writeUserMetadata(REQUESTER_METADATA)).resolves.not.toThrow();
        expect(ownerBubble.userMetadata).toStrictEqual(REQUESTER_METADATA);
      })

      test('addUser can update the requester metadata', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        await expect(requesterBubble.initialise()).resolves.toStrictEqual(REQUESTER_METADATA);
        expect(requesterBubble.userMetadata).toStrictEqual(REQUESTER_METADATA);
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, OWNER_METADATA)).resolves.not.toThrow();
        await expect(requesterBubble.initialise()).resolves.toStrictEqual(OWNER_METADATA);
        expect(requesterBubble.userMetadata).toStrictEqual(OWNER_METADATA);
      })

    })


    describe('metadata is encrypted', () => {

      beforeAll(async () => {
        await expect(ownerBubble.create({userMetadata: OWNER_METADATA, silent: true})).resolves.not.toThrow();
      })
      
      test('owner metadata is encrypted', async () => {
        const plainBubble = new Bubble(bubble.contentId, bubble.provider, ownerSign)
        await expect(plainBubble.read(plainBubble.toFileId(owner.address))).resolves.toMatch(/^[0-9a-f]+$/);
      })

      test('user metadata is encrypted', async () => {
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        const plainBubble = new Bubble(bubble.contentId, bubble.provider, requesterSign)
        await expect(plainBubble.read(plainBubble.toFileId(requester.address))).resolves.toMatch(/^[0-9a-f]+$/);
      })

    })


    describe('read and write files', () => {

      beforeAll(async () => {
        deleteAllBubbles();
        await expect(ownerBubble.create({userMetadata: OWNER_METADATA})).resolves.not.toThrow();
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
        await expect(requesterBubble.initialise()).resolves.toStrictEqual(REQUESTER_METADATA);
      })
      
      test('written data is encrypted', async () => {
        await expect(ownerBubble.write(logFile, 'hello world')).resolves.not.toThrow();
        const plainBubble = new Bubble(bubble.contentId, bubble.provider, ownerSign)
        await expect(plainBubble.read(logFile)).resolves.toMatch(/^(0x)?[0-9a-f]+$/);
      })

      test('written data can be read by user', async () => {
        await expect(ownerBubble.write(logFile, 'hello world')).resolves.not.toThrow();
        await expect(requesterBubble.read(logFile)).resolves.toEqual('hello world');
      })

    })


    describe('remove user', () => {

      beforeEach(async () => {
        deleteAllBubbles();
        await expect(ownerBubble.create(OWNER_METADATA)).resolves.not.toThrow();
        await expect(ownerBubble.addUser(requester.address, requester.key.cPublicKey, REQUESTER_METADATA)).resolves.not.toThrow();
      })
      
      test('removed user can no longer initialise', async () => {
        await expect(requesterBubble.initialise()).resolves.toStrictEqual(REQUESTER_METADATA);
        await expect(ownerBubble.removeUser(requester.address)).resolves.not.toThrow();
        await expect(requesterBubble.initialise()).rejects.toThrow('user metadata file is missing');
      })

    })


  })

})

