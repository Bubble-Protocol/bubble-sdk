import { pingWebsocketServerTest, startServers, stopServers } from '../mockups/test-servers.js';
import { bubbleAvailableTest, owner, ownerBubble, requester} from '../mockups/test-bubble.js';
import { constructTestBubble } from '../mockups/test-bubble.js';
import '../../packages/core/test/BubbleErrorMatcher.js';
import contractSrc from '../contracts/GroupBubble.json';
import { assert } from '../../packages/core/src/index.js';
import { encryptionPolicies, toFileId, userManagers } from '../../packages/client/src/index.js';
import { ecdsa, ecies } from '../../packages/crypto/src/index.js';
import { Chat, CONTENT, DEFAULT_METADATA } from './Chat.js';

describe('simulated application tests', () => {

  const DEFAULT_USER_METADATA = {
    title: 'simulated-app'
  }

  let bubbleId;
  const encryptionKey = new ecdsa.Key().privateKey;

  beforeAll(async () => {
    await startServers({protocol: 'ws:'});
    bubbleId = await constructTestBubble({protocol: 'ws:', contractSrc: contractSrc, args: [[owner.address, requester.address]]});
  }, 20000)

  afterAll( async () => {
    await ownerBubble.provider.close();
    await stopServers();
  }, 20000)


  pingWebsocketServerTest();
  bubbleAvailableTest();

  test("Creating a public chat creates public chat metadata", async () => {
    const chat = new Chat(
      bubbleId, 
      owner.key
    );
    await chat.create(DEFAULT_METADATA, {silent: true});
    // confirm public metadata file has been written
    let chatMetadata;
    try {
      const json = await chat.read(CONTENT.metadataFile, {encrypted: false});
      chatMetadata = JSON.parse(json);
    }
    catch(error) {
      chat.close();
      throw new Error('Failed to read chat metadata file: '+error.message, {cause: error});
    }
    chat.close();
    expect(assert.isHexString(chatMetadata)).toBe(false);
    expect(chatMetadata.title).toBe(DEFAULT_METADATA.title);
    expect(typeof chat.metadata).toBe('object');
    expect(chat.metadata.title).toBe(DEFAULT_METADATA.title);
    expect(chat.userMetadata).toBeUndefined();
  })

  
  test("Creating a private chat creates the owner's user metadata file and encrypted chat metadata", async () => {
    const chat = new Chat(
      bubbleId, 
      owner.key, 
      new encryptionPolicies.AESGCMEncryptionPolicy(encryptionKey), 
      new userManagers.MultiUserManager(owner.key)
    );
    await chat.create(DEFAULT_METADATA, {userMetadata: DEFAULT_USER_METADATA, silent: true});
    // confirm owner metadata file has been written
    let ownerMetadata;
    try {
      const encryptedMetadata = await chat.read(toFileId(owner.address), {encrypted: false});
      const decryptedMetadata = await ecies.decrypt(owner.privateKey, encryptedMetadata);
      ownerMetadata = JSON.parse(decryptedMetadata);
    }
    catch(error) {
      chat.close();
      throw new Error('Failed to read owner metadata file: '+error.message, {cause: error});
    }
    let chatMetadata;
    try {
      const encryptedMetadata = await chat.read(CONTENT.metadataFile, {encrypted: false});
      expect(assert.isHexString(encryptedMetadata)).toBe(true);
      const decryptedMetadata = await chat.read(CONTENT.metadataFile);
      chatMetadata = JSON.parse(decryptedMetadata);
    }
    catch(error) {
      chat.close();
      throw new Error('Failed to read chat metadata file: '+error.message, {cause: error});
    }
    chat.close();
    expect(typeof ownerMetadata.userEncryptionPolicy).toBe('object');
    expect(ownerMetadata.metadata.title).toBe(DEFAULT_USER_METADATA.title);
    expect(chatMetadata.title).toBe(DEFAULT_METADATA.title);
    expect(typeof chat.userMetadata).toBe('object');
    expect(chat.userMetadata.title).toBe(DEFAULT_USER_METADATA.title);
    expect(typeof chat.metadata).toBe('object');
    expect(chat.metadata.title).toBe(DEFAULT_METADATA.title);
  })

  
  test("Adding a user creates the user's user metadata file", async () => {
    const chat = new Chat(
      bubbleId, 
      owner.key, 
      new encryptionPolicies.AESGCMEncryptionPolicy(encryptionKey), 
      new userManagers.MultiUserManager(owner.key)
    );
    await chat.create(DEFAULT_METADATA, {userMetadata: DEFAULT_USER_METADATA, silent: true});
    await chat.userManager.addUser(requester.key.cPublicKey, {userMetadata: DEFAULT_USER_METADATA});
    // confirm user metadata file has been written
    let userMetadata;
    try {
      const encryptedMetadata = await chat.read(toFileId(requester.address), {encrypted: false});
      const decryptedMetadata = await ecies.decrypt(requester.privateKey, encryptedMetadata);
      userMetadata = JSON.parse(decryptedMetadata);
    }
    catch(error) {
      chat.close();
      throw new Error('Failed to read user metadata file: '+error.message, {cause: error});
    }
    chat.close();
    expect(typeof userMetadata.userEncryptionPolicy).toBe('object');
    expect(userMetadata.metadata.title).toBe(DEFAULT_USER_METADATA.title);
  })

    
  describe("When the chat is already created", () => {

    beforeAll(async () => {
      const chat = new Chat(
        bubbleId, 
        owner.key, 
        new encryptionPolicies.AESGCMEncryptionPolicy(encryptionKey), 
        new userManagers.MultiUserManager(owner.key)
      );
      await chat.create(DEFAULT_METADATA, {userMetadata: DEFAULT_USER_METADATA, silent: true});
      await chat.userManager.addUser(requester.key.cPublicKey, {userMetadata: DEFAULT_USER_METADATA});
      chat.close();
    })

    test("owner can initialise a chat without the encryption key", async () => {
      const chat = new Chat(
        bubbleId, 
        owner.key, 
        new encryptionPolicies.AESGCMEncryptionPolicy(), 
        new userManagers.MultiUserManager(owner.key)
        );
      await chat.initialise();
      chat.close();
      expect(chat.userMetadata.title).toBe(DEFAULT_USER_METADATA.title); 
      expect(chat.metadata.title).toBe('Group Chat'); 
    })

    test("user can initialise a chat without the encryption key", async () => {
      const chat = new Chat(
        bubbleId, 
        requester.key, 
        new encryptionPolicies.AESGCMEncryptionPolicy(), 
        new userManagers.MultiUserManager(requester.key)
        );
      await chat.initialise();
      chat.close();
      expect(chat.userMetadata.title).toBe(DEFAULT_USER_METADATA.title); 
      expect(chat.metadata.title).toBe('Group Chat'); 
    })

  })


  describe("App notifications", () => {

    let ownerChat, userChat;

    beforeAll(async () => {
      ownerChat = new Chat(
        bubbleId, 
        owner.key, 
        new encryptionPolicies.AESGCMEncryptionPolicy(encryptionKey), 
        new userManagers.MultiUserManager(owner.key)
        );
      await ownerChat.create(DEFAULT_METADATA, {userMetadata: DEFAULT_USER_METADATA, silent: true});
      await ownerChat.userManager.addUser(requester.key.cPublicKey, {userMetadata: DEFAULT_USER_METADATA});

      userChat = new Chat(
        bubbleId, 
        requester.key, 
        new encryptionPolicies.AESGCMEncryptionPolicy(), 
        new userManagers.MultiUserManager(requester.key)
        );
      await userChat.initialise();
    })

    afterAll(() => {
      ownerChat.close();
      userChat.close();
    })

    test("updating metadata causes owner and user bubbles to update", async () => {
      await ownerChat.setMetadata({...DEFAULT_METADATA, title: 'New Group'});
      // wait for notifications to occur then check new metadata has been received
      await new Promise(resolve => setTimeout(resolve, 400));
      expect(ownerChat.metadata.title).toBe('New Group');    
      expect(userChat.metadata.title).toBe('New Group');  
    })

    test("posting a message from owner is received by user", async () => {
      await ownerChat.postMessage({id: 1, text: "hello user!"});
      // wait for notifications to occur then check new message has been received
      await new Promise(resolve => setTimeout(resolve, 400));
      expect(userChat.messages.length).toBeGreaterThan(0);  
      expect(userChat.messages[userChat.messages.length-1].text).toBe("hello user!");  
    })

  })

})