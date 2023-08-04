// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { MultiUserManager } from "./MultiUserManager.js";
import { SingleUserManager } from "./SingleUserManager.js";

export const userManagers = {
  SingleUserManager: SingleUserManager,
  MultiUserManager: MultiUserManager
}