// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

import { BlockchainProvider } from '@bubble-protocol/core';
import ABIs from './abi.json';

export class Web3Provider extends BlockchainProvider {

  url;
  client;
  chainId;


  constructor(chainId, web3, abiVersion) {
    super();
    this.chainId = chainId;
    this.web3 = web3;
    this.abi = ABIs[`${abiVersion}`];
    if (!this.abi) throw new Error(`Web3Provider error: abi version ${abiVersion} does not exist`);
  }


  getPermissions(contract, account, file) {
    const contractObj = new this.web3.eth.Contract(this.abi, contract);
    return contractObj.methods.getAccessPermissions(account, file).call()
      .then(permissions => {
        return BigInt(permissions);
      })
  }


  getChainId() {
    return this.chainId;
  }


  recoverSignatory(message, signature) {
    return this.web3.eth.accounts.recover(message, signature);
  }

}