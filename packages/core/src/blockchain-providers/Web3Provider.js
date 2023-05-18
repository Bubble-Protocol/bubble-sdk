// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
//

import { BlockchainProvider } from '../BlockchainProvider.js';
import { createRequire } from "module";
import { ecdsa } from '../../../crypto/src/index.js'; // '@bubble-protocol/crypto';
const require = createRequire(import.meta.url);
const ABIs = require('./abi.json');

export class Web3Provider extends BlockchainProvider {

  url;
  client;
  chainId;


  constructor(chainId, web3, abiVersion, options={}) {
    super();
    this.chainId = chainId;
    this.web3 = web3;
    this.abi = ABIs[abiVersion];
    this.options = options;
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
    if (this.options.ethereumSignatures) message = ecdsa.hash("\x19Ethereum Signed Message:\n64"+message);
    return Promise.resolve(ecdsa.recover(message, signature));
  }

}