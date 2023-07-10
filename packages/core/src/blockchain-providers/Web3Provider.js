// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

import { BlockchainProvider } from '../BlockchainProvider.js';
import { ecdsa } from '@bubble-protocol/crypto';
import { ABIs } from './abi.js';

export class Web3Provider extends BlockchainProvider {

  url;
  client;
  chainId;


  constructor(chainId, web3, abiVersion) {
    super();
    this.chainId = chainId;
    this.web3 = web3;
    this.abi = ABIs[abiVersion];
    if (!this.abi) throw new Error(`Web3Provider error: abi version ${abiVersion} does not exist`);
  }


  getPermissions(contract, account, file) {
    const contractObj = new this.web3.eth.Contract(this.abi, contract);
    return contractObj.methods.getAccessPermissions(account, file).call()
      .then(permissions => {
        return BigInt(permissions);
      })
  }

  hasBeenRevoked() {
    return false;  // revocation service not yet available
  }

  getChainId() {
    return this.chainId;
  }


  recoverSignatory(message, signature) {
    return Promise.resolve(ecdsa.recover(message, signature));
  }

}