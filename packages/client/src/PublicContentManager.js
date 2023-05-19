// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleContentManager } from "./BubbleContentManager.js";


/**
 * @dev If a request's signature is the string 'public' the storage server's Guardian will use a
 * random key to test for public access permissions
 */
const signFunction = () => Promise.resolve('public')


/**
 * Public content manager.  Can read any public content without needing to provide a sign function.
 */
export const PublicContentManager = new BubbleContentManager(signFunction);

