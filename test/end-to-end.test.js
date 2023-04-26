import Web3 from 'web3';
import { GanacheServer } from "./GanacheServer";
import { Web3Provider } from '../packages/client/src/blockchain-providers/Web3Provider';
import contractSrc from './contracts/TestContract.json';
import { RamBasedBubbleServer } from './RamBasedBubbleServer';
import { BubblePermissions } from '../packages/core/src/Permissions';
import { BubbleError } from '../packages/core/src/errors';
import { Bubble } from '../packages/client/src/Bubble';
import { HTTPBubbleProvider } from '../packages/client/src/bubble-providers/HTTPBubbleProvider';
import jayson from 'jayson';
import { ErrorCodes } from './common';

const CHAIN_ID = 1;
const CONTRACT_ABI_VERSION = '0.0.2';
const GANACHE_MNEMONIC = 'foil message analyst universe oval sport super eye spot easily veteran oblige';

let ganacheServer, bubbleServer, blockchainProvider, bubbleProvider, contract, ownerBubble, requesterBubble;

const owner = {
  privateKey: "24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063",
  address: "0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929"
};

const requester = {
  privateKey: "e68e40257cfee330038c49637fcffff82fae04b9c563f4ea071c20f2eb55063c",
  address: "0x41A60F71063CD7c9e5247d3E7d551f91f94b5C3b"
};

// Permissions are set to support a variety of tests:
//   - Vault Root: owner:rwa, requester:r
//   - cid 1: owner:wa, requester:r
//   - cid 2: owner:r, requester:w
//   - cid 3: owner:r, requester:a
//   - cid 4: owner:da, requester:dr
//   - cid 5: owner:dr, requester:dwa
//   - cid 6: owner:rwa, requester:-
const file0 = "0x0000000000000000000000000000000000000000000000000000000000000000";
const file1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
const file2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
const file3 = "0x0000000000000000000000000000000000000000000000000000000000000003";
const file4 = "0x0000000000000000000000000000000000000000000000000000000000000004";
const file5 = "0x0000000000000000000000000000000000000000000000000000000000000005";
const file6 = "0x0000000000000000000000000000000000000000000000000000000000000006";

function sign(web3, address, hash) {
  return web3.eth.sign(hash, address);
}


describe('end-to-end bubble to server and blockchain tests', () => {

  beforeAll(async () => {

    // Setup a test blockchain and a basic bubble server
    const web3 = new Web3('http://127.0.0.1:8545');
    blockchainProvider = new Web3Provider(CHAIN_ID, web3, CONTRACT_ABI_VERSION);
    ganacheServer = new GanacheServer(8545, {mnemonic: GANACHE_MNEMONIC});
    bubbleServer = new RamBasedBubbleServer(8131, blockchainProvider);
    ganacheServer.start();
    bubbleServer.start();

    // Deploy the test contract on the blockchain
    contract = new web3.eth.Contract(contractSrc.abi);
    await contract.deploy({
        data: contractSrc.bytecode,
        arguments: [owner.address, requester.address]
      })
      .send({
        from: owner.address,
        gas: 1500000,
        gasPrice: '30000000000000'
      })
      .on('receipt', receipt => {
        contract.options.address = receipt.contractAddress;
      });
    
    // Construct a bubble wrapper instance now we have the contract address
    bubbleProvider = new HTTPBubbleProvider(new URL('http://127.0.0.1:8131'));
    ownerBubble = new Bubble(bubbleProvider, CHAIN_ID, contract.options.address, (hash) => {return sign(web3, owner.address, hash)});
    requesterBubble = new Bubble(bubbleProvider, CHAIN_ID, contract.options.address, (hash) => {return sign(web3, requester.address, hash)});

    // Mock a bubble created on the bubble server
    await bubbleServer.dataServer.create(contract.options.address);

  }, 20000)


  beforeEach(() => {
    // reset the bubble so it is empty
    bubbleServer._resetBubble(contract.options.address);
  })


  afterAll( async () => {
    await Promise.all([
      new Promise(resolve => bubbleServer.close(resolve)),
      new Promise(resolve => ganacheServer.close(resolve))
    ])
  }, 20000)


  test('confirm contract has deployed', async () => {
    const permissionBits = await blockchainProvider.getPermissions(contract.options.address, owner.address, file0);
    const permissions = new BubblePermissions(BigInt(permissionBits));
    expect(permissions.bubbleTerminated()).toBe(false);
    expect(permissions.isDirectory()).toBe(false);
    expect(permissions.canRead()).toBe(true);
    expect(permissions.canWrite()).toBe(true);
    expect(permissions.canAppend()).toBe(true);
    expect(permissions.canExecute()).toBe(true);
  }, 20000)


  test('confirm bubble server is running', async () => {
    const client = jayson.Client.http('http://localhost:8131');
    await new Promise((resolve, reject) => {
      client.request('ping', [], function(err, response) {
        if(err) reject(err);
        else resolve(response.result || response);
      });
    })
    .then(result => expect(result).toBe('pong'))
  }, 20000)


  describe('basic functions', () => {

    describe('bubble create', () => {

      test('fails if permission is denied', async () => {
        await expect(requesterBubble.create()).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('is successful if permitted and unsuccessful if bubble already exists', async () => {
        bubbleServer._reset(); // delete all bubbles
        await expect(ownerBubble.create()).resolves.toBe(null);
        await expect(ownerBubble.create()).rejects.withBubbleError(new BubbleError());
      })

    })

    describe('bubble write', () => {

      test('fails if permission is denied', async () => {
        await expect(requesterBubble.write(file1, "hello")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails if path is a directory', async () => {
        await expect(requesterBubble.write(file5, "hello")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails to write to a file within a directory if directory permission is denied', async () => {
        await expect(ownerBubble.write(file5+'/test1', "hello")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails to write to a file within a directory if only have append permissions', async () => {
        await expect(ownerBubble.append(file4+'/test1', "hello")).resolves.toBe(null);
        await expect(ownerBubble.write(file4+'/test2', "hello")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('writes ok if permitted', async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toBe(null);
      })

      test('can write to a file within a directory', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBe(null);
      })

    })

    describe('bubble append', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toBe(null);
        await expect(requesterBubble.append(file1, " world")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails if path is a directory', async () => {
        await expect(requesterBubble.append(file5, "hello")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails to append to a file within a directory if directory permission is denied', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBe(null);
        await expect(ownerBubble.append(file5+'/test1', "hello")).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('appends ok if permitted', async () => {
        await expect(ownerBubble.write(file1, "hello")).resolves.toBe(null);
        await expect(ownerBubble.append(file1, " world")).resolves.toBe(null);
      })

      test('can append to a file within a directory', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBe(null);
        await expect(requesterBubble.append(file5+'/test1', " world")).resolves.toBe(null);
      })

    })

    describe('bubble read', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBe(null);
        await expect(requesterBubble.read(file6)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails if the file does not exist', async () => {
        await expect(ownerBubble.read(file6)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST));
      })

      test('resolves with empty string if file does not exist but the silent option is given', async () => {
        await expect(ownerBubble.read(file6, {silent: true})).resolves.toBe('');
      })

      test('reads ok if permitted', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBe(null);
        await expect(ownerBubble.read(file6)).resolves.toBe("hello");
      })

      test('can read an empty file', async () => {
        await expect(ownerBubble.write(file6, "")).resolves.toBe(null);
        await expect(ownerBubble.read(file6)).resolves.toBe('');
      })

    })

    describe('bubble delete', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBe(null);
        await expect(requesterBubble.delete(file6)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails if file does not exist', async () => {
        await expect(ownerBubble.delete(file1)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST));
      })

      test('does not fail if file does not exist and silent option is given', async () => {
        await expect(ownerBubble.delete(file1, {silent: true})).resolves.toBe(null);
      })

      test('deletes file if permitted', async () => {
        await expect(ownerBubble.write(file6, "hello")).resolves.toBe(null);
        await expect(ownerBubble.delete(file6)).resolves.toBe(null);
      })

      test('deletes empty directory if permitted', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBe(null);
        await expect(requesterBubble.delete(file5)).resolves.toBe(null);
      })

      test('fails to delete directory if not empty', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBe(null);
        await expect(requesterBubble.delete(file5)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_DIR_NOT_EMPTY));
      })

      test('deletes non-empty directory if force option is given', async () => {
        await expect(requesterBubble.write(file5+'/test1', "hello")).resolves.toBe(null);
        await expect(requesterBubble.delete(file5, {force: true})).resolves.toBe(null);
      })

    })


    describe('bubble mkdir', () => {

      test('fails if permission is denied', async () => {
        await expect(ownerBubble.mkdir(file5)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('fails if path is not a directory', async () => {
        await expect(ownerBubble.mkdir(file1)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('succeeds if permitted', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBe(null);
      })

      test('fails if directory already exists', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBe(null);
        await expect(requesterBubble.mkdir(file5)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_DIR_ALREADY_EXISTS));
      })

      test('does not fail if directory already exists but silent option is given', async () => {
        await expect(requesterBubble.mkdir(file5)).resolves.toBe(null);
        await expect(requesterBubble.mkdir(file5, {silent: true})).resolves.toBe(null);
      })

    })


    describe('bubble list', () => {

      test('fails if permission is denied', async () => {
        await expect(requesterBubble.list(file6)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('succeeds if permitted', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBe(null);
        const listing = await ownerBubble.list(file6);
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].directory).toBe(false);
        expect(listing[0].length).toBeUndefined();
        expect(listing[0].created).toBeUndefined();
        expect(listing[0].modified).toBeUndefined();
      })

      test('returns directory contents', async () => {
        await expect(ownerBubble.append(file4+'/f1', "hello world")).resolves.toBe(null);
        await expect(ownerBubble.append(file4+'/f2', "hello solar system")).resolves.toBe(null);
        await expect(ownerBubble.append(file4+'/f3', "hello universe")).resolves.toBe(null);
        const listing = await requesterBubble.list(file4, {long: true});
        expect(listing).toHaveLength(3);
        function checkFile(meta, name, length) {
          expect(meta.name).toBe(name);
          expect(meta.directory).toBe(false);
          expect(meta.length).toBe(length);
          expect(typeof meta.created).toBe('number');
          expect(typeof meta.modified).toBe('number');
        }
        checkFile(listing[0], 'f1', 11);
        checkFile(listing[1], 'f2', 18);
        checkFile(listing[2], 'f3', 14);
      })

      test('fails if directory does not exist', async () => {
        await expect(ownerBubble.list(file5)).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_SERVER_ERROR_FILE_DOES_NOT_EXIST));
      })

      test('does not fail if directory does not exist but silent option is given', async () => {
        await expect(ownerBubble.list(file5, {silent: true})).resolves.toStrictEqual([]);
      })

      test('returns length if the length option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBe(null);
        const listing = await ownerBubble.list(file6, {length: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].directory).toBe(false);
        expect(listing[0].length).toBe(11);
        expect(listing[0].created).toBeUndefined();
        expect(listing[0].modified).toBeUndefined();
      })

      test('returns created time if the create option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBe(null);
        const listing = await ownerBubble.list(file6, {created: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].directory).toBe(false);
        expect(listing[0].length).toBeUndefined();
        expect(typeof listing[0].created).toBe('number');
        expect(listing[0].modified).toBeUndefined();
      })

      test('returns length if the length option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBe(null);
        const listing = await ownerBubble.list(file6, {modified: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].directory).toBe(false);
        expect(listing[0].length).toBeUndefined();
        expect(listing[0].created).toBeUndefined();
        expect(typeof listing[0].modified).toBe('number');
      })

      test('returns length, created and modified fields if the long option is given', async () => {
        await expect(ownerBubble.write(file6, "hello world")).resolves.toBe(null);
        const listing = await ownerBubble.list(file6, {long: true});
        expect(listing).toHaveLength(1);
        expect(listing[0].name).toBe(file6);
        expect(listing[0].directory).toBe(false);
        expect(listing[0].length).toBe(11);
        expect(typeof listing[0].created).toBe('number');
        expect(typeof listing[0].modified).toBe('number');
      })

      test('time filters', async () => {
        // create files
        await expect(ownerBubble.append(file4+'/f1', "hello world")).resolves.toBe(null);
        await expect(ownerBubble.append(file4+'/f2', "hello solar system")).resolves.toBe(null);
        await expect(ownerBubble.append(file4+'/f3', "hello universe")).resolves.toBe(null);
        // modify in reverse order
        await expect(ownerBubble.append(file4+'/f3', " again")).resolves.toBe(null);
        await expect(ownerBubble.append(file4+'/f2', " again")).resolves.toBe(null);
        await expect(ownerBubble.append(file4+'/f1', " again")).resolves.toBe(null);

        // list without filter and check modified times are different from created times
        const fullListing = await requesterBubble.list(file4, {long: true});
        expect(fullListing).toHaveLength(3);
        expect(fullListing[0].name).toBe('f1');
        expect(fullListing[1].name).toBe('f2');
        expect(fullListing[2].name).toBe('f3');
        expect(fullListing[0].modified).not.toBe(fullListing[0].created);
        expect(fullListing[1].modified).not.toBe(fullListing[1].created);
        expect(fullListing[2].modified).not.toBe(fullListing[2].created);

        // list with filter: modified after f3
        let filteredListing = await requesterBubble.list(file4, {long: true, after: fullListing[2].modified});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe('f1');
        expect(filteredListing[1].name).toBe('f2');
        
        // list with filter: modified before f1
        filteredListing = await requesterBubble.list(file4, {long: true, before: fullListing[0].modified});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe('f2');
        expect(filteredListing[1].name).toBe('f3');

        // list with filter: created after f1
        filteredListing = await requesterBubble.list(file4, {long: true, createdAfter: fullListing[0].created});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe('f2');
        expect(filteredListing[1].name).toBe('f3');
        
        // list with filter: created before f3
        filteredListing = await requesterBubble.list(file4, {long: true, createdBefore: fullListing[2].created});
        expect(filteredListing).toHaveLength(2);
        expect(filteredListing[0].name).toBe('f1');
        expect(filteredListing[1].name).toBe('f2');

        //
        // Check boundary conditions
        //

        // list with filter: modified after (f3 - 1)
        filteredListing = await requesterBubble.list(file4, {long: true, after: fullListing[2].modified-1});
        expect(filteredListing).toHaveLength(3);
        
        // list with filter: modified before (f1 + 1)
        filteredListing = await requesterBubble.list(file4, {long: true, before: fullListing[0].modified+1});
        expect(filteredListing).toHaveLength(3);
        
        // list with filter: created after (f1 - 1)
        filteredListing = await requesterBubble.list(file4, {long: true, createdAfter: fullListing[0].created-1});
        expect(filteredListing).toHaveLength(3);
        
        // list with filter: created before (f3 + 1)
        filteredListing = await requesterBubble.list(file4, {long: true, createdBefore: fullListing[2].created+1});
        expect(filteredListing).toHaveLength(3);
        
      })

    })


    describe('bubble getPermissions', () => {

      test('for a file', async () => {
        // owner
        let permissions = await ownerBubble.getPermissions(file1);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(false);
        expect(permissions.canRead()).toBe(false);
        expect(permissions.canWrite()).toBe(true);
        expect(permissions.canAppend()).toBe(true);
        expect(permissions.canExecute()).toBe(false);
        // requester
        permissions = await requesterBubble.getPermissions(file1);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(false);
        expect(permissions.canRead()).toBe(true);
        expect(permissions.canWrite()).toBe(false);
        expect(permissions.canAppend()).toBe(false);
        expect(permissions.canExecute()).toBe(false);
      })

      test('for a directory', async () => {
        // owner
        let permissions = await ownerBubble.getPermissions(file5);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(true);
        expect(permissions.canRead()).toBe(true);
        expect(permissions.canWrite()).toBe(false);
        expect(permissions.canAppend()).toBe(false);
        expect(permissions.canExecute()).toBe(false);
        // requester
        permissions = await requesterBubble.getPermissions(file5);
        expect(permissions.bubbleTerminated()).toBe(false);
        expect(permissions.isDirectory()).toBe(true);
        expect(permissions.canRead()).toBe(false);
        expect(permissions.canWrite()).toBe(true);
        expect(permissions.canAppend()).toBe(true);
        expect(permissions.canExecute()).toBe(false);
      })

    })


    describe('bubble terminate and isTerminated', () => {

      test('fails if contract is not terminated', async () => {
        await expect(ownerBubble.isTerminated()).resolves.toBe(false);
        await expect(ownerBubble.terminate()).rejects.withBubbleError(new BubbleError(ErrorCodes.BUBBLE_ERROR_PERMISSION_DENIED));
      })

      test('succeeds if contract is terminated', async () => {
        await expect(ownerBubble.isTerminated()).resolves.toBe(false);
        await contract.methods.terminate().send({
          from: owner.address,
          gas: 1500000,
          gasPrice: '30000000000000'
        });
        await expect(ownerBubble.isTerminated()).resolves.toBe(true);
        await expect(ownerBubble.terminate()).resolves.toBeNull();
        await expect(requesterBubble.terminate()).resolves.toBeNull(); // anyone can terminate even if no permissions and bubble already deleted
      })

    })

  })

})