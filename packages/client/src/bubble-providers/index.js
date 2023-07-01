// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { HTTPBubbleProvider } from './HTTPBubbleProvider.js';
import { WebsocketBubbleProvider } from './WebsocketBubbleProvider.js';

export const bubbleProviders = {
  HTTPBubbleProvider: HTTPBubbleProvider,
  WebsocketBubbleProvider: WebsocketBubbleProvider
}