import { AESGCMEncryptionPolicy } from "../encryption-policies/AESGCMEncryptionPolicy.js";
import { assert } from '@bubble-protocol/core';
import { UserEncryptedBubble } from "./UserEncryptedBubble.js";
import { MultiUserEncryptedBubble } from "./MultiUserEncryptedBubble.js";
import { ecies } from '@bubble-protocol/crypto';

/**
 * Allows Bubbles to be easily created with common encryption and/or user patterns.
 */
export class BubbleFactory {

  /**
   * Construct a bubble factory for the local user. The `userOrKey` parameter is only required if
   * creating User or Multi-User bubbles.
   * 
   * @param {Function} signFunction local user's sign function - see `Bubble.js`
   * @param {Object|Key} userOrKey Optional crypto Key, or object containing address, cPublicKey 
   * and either a privateKey or decryptFunction.  Decrypt function has the form:
   * 
   *   (data) => Promise to resolve the ECIES encrypted data
   */
  constructor(signFunction, userOrKey) {
    assert.isFunction(signFunction, 'signFunction');
    if (userOrKey) {
      assert.isObject(userOrKey, 'userOrKey');
      assert.isHexString(userOrKey.address, 'userOrKey address');
      ecies.assert.isCompressedPublicKey(userOrKey.cPublicKey, 'userOrKey cPublicKey');
      if (userOrKey.privateKey) ecies.assert.isPrivateKey(userOrKey.privateKey, 'userOrKey privateKey');
      if (userOrKey.decryptFunction) assert.isFunction(userOrKey.decryptFunction, 'userOrKey decryptFunction');
      if (!userOrKey.privateKey && !userOrKey.decryptFunction) throw new Error('userOrKey must have a privateKey or decryptFunction');
    }
    this.user = {
      ...userOrKey,
      signFunction: signFunction
    }
  }

  /**
   * A basic bubble with no encryption.
   * 
   * @option {BubbleProvider} provider if absent, an HTTPBubbleProvider will be constructed from contentId.provider
   */
  createUnencryptedBubble(contentId, options={}) {
    return new Bubble(contentId, options.provider || contentId.provider, user.signFunction, options);
  }

  /**
   * A basic bubble with AESGCM encryption.  The encryption key must be stored locally.
   * 
   * @option {hex string} encryptionKey if absent, a random encryption key will be generated
   * @option {BubbleProvider} provider if absent, an HTTPBubbleProvider will be constructed from contentId.provider
   */
  createAESGCMEncryptedBubble(contentId, options={}) {
    return new Bubble(contentId, options.provider || contentId.provider, user.signFunction, new AESGCMEncryptionPolicy(options.encryptionKey), options);
  }

  /**
   * A bubble with AESGCM encryption designed for a single user.  The encryption key is saved to the bubble in a
   * metadata file ECIES encrypted with the user's public key.  On initialisation, the key will be recovered
   * from the bubble and so does not need to be stored locally.  @See UserEncryptedBubble.js
   * 
   * @option {hex string} encryptionKey only applicable if creating the bubble.  If absent, a random encryption 
   * key will be generated
   * @option {BubbleProvider} provider if absent, an HTTPBubbleProvider will be constructed from contentId.provider
   */
  createAESGCMEncryptedUserBubble(contentId, options={}) {
    return this.createUserEncryptedBubble(contentId, new AESGCMEncryptionPolicy(options.encryptionKey), options);
  }

  /**
   * A bubble with AESGCM encryption designed for multiple users.  The encryption key is saved to the bubble in a
   * metadata file for each user, ECIES encrypted with the user's public key.  When each user initialises their
   * client, the key will be recovered from the bubble so that it does not need to be pre-shared.
   * @See MultiUserEncryptedBubble.js
   * 
   * @option {hex string} encryptionKey only applicable if creating the bubble.  If absent, a random encryption 
   * key will be generated
   * @option {BubbleProvider} provider if absent, an HTTPBubbleProvider will be constructed from contentId.provider
   */
  createAESGCMEncryptedMultiUserBubble(contentId, options={}) {
    return this.createMultiUserEncryptedBubble(contentId, new AESGCMEncryptionPolicy(options.encryptionKey), options);
  }

  /**
   * A bubble with a custom encryption policy designed for use by a single user.  The encryption policy is serialised
   * and saved to the bubble in a metadata file ECIES encrypted with the user's public key.  On initialisation, the
   * policy state (including any encryption keys) will be recovered from the bubble and so does not need to be stored 
   * locally.  @See UserEncryptedBubble.js
   * 
   * @option {BubbleProvider} provider if absent, an HTTPBubbleProvider will be constructed from contentId.provider
   */
  createUserEncryptedBubble(contentId, encryptionPolicy, options={}) {
    return new UserEncryptedBubble(contentId, options.provider || contentId.provider, this.user, encryptionPolicy, options);
  }

  /**
   * A bubble with a custom encryption policy designed for use by multiple users.  The encryption policy is serialised
   * and saved to the bubble in a metadata file for each user, ECIES encrypted with the user's public key.  When each 
   * user initialises their client, the policy state (inluding any encryption keys) will be recovered from the bubble 
   * so that it does not need to be pre-shared. @See UserEncryptedBubble.js
   * 
   * @option {BubbleProvider} provider if absent, an HTTPBubbleProvider will be constructed from contentId.provider
   */
  createMultiUserEncryptedBubble(contentId, encryptionPolicy, options={}) {
    return new MultiUserEncryptedBubble(contentId, options.provider || contentId.provider, this.user, encryptionPolicy, options);
  }

}