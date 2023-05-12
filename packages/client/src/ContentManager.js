// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleContentManager } from "./BubbleContentManager.js";

/**
 * Default content manager.  Requires the user to pass a sign function in every call.
 */
export const ContentManager = new BubbleContentManager();

