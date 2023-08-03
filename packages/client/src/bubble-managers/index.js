// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { MultiUserEncryptedBubbleManager } from "./MultiUserEncryptedBubbleManager.js";
import { ParallelBubbleMultiManager } from "./ParallelBubbleMultiManager.js";
import { SequentialBubbleMultiManager } from "./SequentialBubbleMultiManager.js";
import { UserEncryptedBubbleManager } from "./UserEncryptedBubbleManager.js";

export const bubbleManagers = {
  UserEncryptedBubbleManager: UserEncryptedBubbleManager,
  MultiUserEncryptedBubbleManager: MultiUserEncryptedBubbleManager,
  SequentialBubbleMultiManager: SequentialBubbleMultiManager,
  ParallelBubbleMultiManager: ParallelBubbleMultiManager
}