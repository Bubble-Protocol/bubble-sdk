import { BubblePermissions, ContentId } from '../../packages/core';
import { Bubble, toEthereumSignFunction } from '../../packages/client';


//
// Contract & Bubbles
//

export class TestContract {
  
  
  constructor(web3, sourceCode) {
    this.web3 = web3;
    this.sourceCode = sourceCode;
  }

  async initialiseAccounts() {
    if (!this.accounts) this.accounts = await this.web3.eth.getAccounts();
  }

  async deploy(params=[]) {

    await this.initialiseAccounts();

    this.web3Contract = new this.web3.eth.Contract(this.sourceCode.abi);

    await this.web3Contract.deploy({
        data: this.sourceCode.bytecode,
        arguments: params
      })
      .send({
        from: this.accounts[0],
        gas: 1500000,
        gasPrice: '30000000000000'
      })
      .on('receipt', receipt => {
        this.address = receipt.contractAddress;
        this.web3Contract.options.address = receipt.contractAddress;
      })
      .catch(err => {
        throw err;
      });
    
  }


  getBubble(chainId, bubbleServerURL, bubbleProvider, accountIndex=0) {
    if( !this.address) throw new Error("TestContract - you must deploy the contract first");

    const bubbleId = new ContentId({
      chain: chainId,
      contract: this.address,
      provider: bubbleServerURL
    });

    return new Bubble(bubbleId, bubbleProvider, toEthereumSignFunction((hash) => this.web3.eth.sign(hash, this.accounts[accountIndex])));
  }


  getAccounts() {
    if( !this.accounts) throw new Error("TestContract - you must initialiseAccounts or deploy the contract first");
    return this.accounts;
  }
  
  getAccount(accountIndex=0) {
    if( !this.accounts) throw new Error("TestContract - you must initialiseAccounts or deploy the contract first");
    return this.accounts[accountIndex];
  }
  
  getAddress() {
    if( !this.address) throw new Error("TestContract - you must deploy the contract first");
    return this.address;
  }


  async testContractIsAvailable() {
    if( !this.address) throw new Error("TestContract - you must deploy the contract first");
    const file0 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const permissionBits = await this.web3Contract.methods.getAccessPermissions(this.accounts[0], file0).call();
    const permissions = new BubblePermissions(BigInt(permissionBits));
    expect(permissions.bubbleTerminated()).toBe(false);
    expect(permissions.isDirectory()).toBe(false);
    expect(permissions.canRead()).toBe(true);
    expect(permissions.canWrite()).toBe(true);
    expect(permissions.canAppend()).toBe(true);
    expect(permissions.canExecute()).toBe(true);
  }

}
