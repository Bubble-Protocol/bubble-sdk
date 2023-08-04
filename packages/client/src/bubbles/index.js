// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { MultiUserEncryptedBubble } from "./MultiUserEncryptedBubble.js"
import { UserEncryptedBubble } from "./UserEncryptedBubble.js"

export { BubbleFactory } from "./BubbleFactory.js"

export const bubbles = {
  UserEncryptedBubble: UserEncryptedBubble,
  MultiUserEncryptedBubble: MultiUserEncryptedBubble
}