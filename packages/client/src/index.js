// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

export {Bubble} from './Bubble.js';
export {DeployableBubble} from './DeployableBubble.js';
export {BubbleContentManager} from './BubbleContentManager.js';
export {ContentManager} from './ContentManager.js';
export {PublicContentManager} from './PublicContentManager.js';
export {EncryptionPolicy} from './EncryptionPolicy.js';
export {UserManager} from './UserManager.js';
export {userManagers} from './user-managers/index.js';
export {bubbleProviders} from './bubble-providers/index.js';
export {encryptionPolicies} from './encryption-policies/index.js';
export {Delegation} from './Delegation.js';
export * from './bubbles/index.js';
export * from './utils.js';
export {eip712} from './eip712.js';
export {eip191} from './eip191.js';

// re-export bubble-core exports for convenience
export {BubbleProvider, ContentId, BubbleFilename, BubblePermissions, ROOT_PATH, BubbleError, ErrorCodes, assert} from '@bubble-protocol/core';

// re-export crypto exports for convenience
export {ecdsa, ecies} from '@bubble-protocol/crypto';
export * from '@bubble-protocol/crypto/utils';

// export server constants
export const NOTIFICATION_CONFIG_FILE = '0xb9f67f2a5b929a7c1f97864c755308c84d01d3764ba7d8061f6de8de52e0eec8'; // keccak256("bubble-protocol::notifications")
