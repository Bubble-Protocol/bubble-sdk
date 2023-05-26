import { pingServerTest, startServers, stopServers } from '../mockups/test-servers.js';
import { bubbleAvailableTest, clearTestBubble, constructTestBubble, owner, ownerSign, requesterBubble, requesterSign } from '../mockups/test-bubble.js';
import { BubbleContentManager } from '../../packages/client';

// Imports under test
import { BubbleFilename } from "../../packages/core/src/index.js";
import { encryptionPolicies } from '../../packages/client/src/index.js';
import { ContentManager } from '../../packages/client';


describe('Client README encryption policy code example', () => {

  beforeAll(async () => {
    await startServers();
    await constructTestBubble();
  }, 20000)

  beforeEach(() => {
    clearTestBubble()
  })

  afterAll( async () => {
    await stopServers();
  }, 20000)


  pingServerTest();
  bubbleAvailableTest();


  //
  // Code under test

  const filenames = {
    publicDir: ContentManager.toFileId(1),          // '0x0000000000000000000000000000000000000000000000000000000000000001'
    welcome: ContentManager.toFileId(1, 'welcome'), // '0x0000000000000000000000000000000000000000000000000000000000000001/welcome'
    privateDir: ContentManager.toFileId(5)          // '0x0000000000000000000000000000000000000000000000000000000000000005'
  }
  

  class MyEncryptionPolicy extends encryptionPolicies.AESGCMEncryptionPolicy {

    isEncrypted(contentId) {
      // Return false if the content is public, otherwise true;
      const filename = new BubbleFilename(contentId.file);
      return (filename.getPermissionedPart() !== filenames.publicDir );
    }
  
  }
  
  // construct the policy passing it an encryption key
  const encryptionKey = owner.privateKey;  // '0xc65..9a7';
  const encryptionPolicy = new MyEncryptionPolicy(encryptionKey);
  
  // example 1: encrypt and decrypt some data directly
  //const encryptedData = await encryptionPolicy.encrypt('hello world');     --> moved to test 1
  //const decryptedDataBuf = await encryptionPolicy.decrypt(encryptedData);  --> moved to test 2
  //console.log(Buffer.from(decryptedDataBuf).toString());                   --> moved to test 2
    
  // example 2: configure the ContentManager to use the policy (a Bubble is configured in the same way)
  ContentManager.setEncryptionPolicy(encryptionPolicy);

  // End code under test
  //



  test("correctly encrypts data directly", async () => {
    const encryptedData = await encryptionPolicy.encrypt('hello world');
    expect(encryptedData).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test("correctly decrypts data directly", async () => {
    const encryptedData = await encryptionPolicy.encrypt('hello world');
    const decryptedDataBuf = await encryptionPolicy.decrypt(encryptedData);
    expect(Buffer.from(decryptedDataBuf).toString()).toBe('hello world');
  });

  test("correctly encrypts data via the ContentManager", async () => {
    const nonEncryptedContentManager = new BubbleContentManager(ownerSign);
    const contentId = requesterBubble.getContentId(filenames.privateDir+'/test');
    await expect(ContentManager.write(contentId, 'hello world', requesterSign)).resolves.not.toThrow();
    await expect(nonEncryptedContentManager.read(contentId)).resolves.toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test("correctly decrypts data via the ContentManager", async () => {
    const contentId = requesterBubble.getContentId(filenames.privateDir+'/test');
    await expect(ContentManager.write(contentId, 'hello world', requesterSign)).resolves.not.toThrow();
    await expect(ContentManager.read(contentId, ownerSign)).resolves.toBe('hello world');
  });


});