const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const secret = require("../secret");
const { MintableNonFungibleToken } = require('non-fungible-token-abi');
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN, decimalSeparator: '.' });

const RFTClaim = artifacts.require("RFTClaim");
const abi = MintableNonFungibleToken;

const wsEndpoint = "wss://ws-rc.unique.network";
let collectionId;
let collectionAddress;
let nftOwnerAddress;
let firstNFTID = 1;
let rtfinst;
let api;

async function connectSubstrate() {
  // Initialise the provider to connect to the node
  const wsProvider = new WsProvider(wsEndpoint);

  // Create the API and wait until ready
  const defs = require('@unique-nft/unique-mainnet-types/definitions');
  api = await ApiPromise.create({ 
    provider: wsProvider,
    rpc: { unique: defs.unique.rpc }
  });

  return api;
}

const collectionIdToAddress = collectionId => {
  if (collectionId >= 0xffffffff || collectionId < 0) throw new Error('id overflow');
  const buf = Buffer.from([0x17, 0xc4, 0xe6, 0x45, 0x3c, 0xc4, 0x9a, 0xaa, 0xae, 0xac, 0xa8, 0x94, 0xe6, 0xd9, 0x68, 0x3e,
    collectionId >> 24,
    (collectionId >> 16) & 0xff,
    (collectionId >> 8) & 0xff,
    collectionId & 0xff,
  ]);
  return web3.utils.toChecksumAddress('0x' + buf.toString('hex'));
}

function getTransactionStatus({events, status}) {
  if (status.isReady) {
    return "NOT_READY";
  }
  if (status.isBroadcast) {
    return "NOT_READY";
  }
  if (status.isInBlock || status.isFinalized) {
    const errors = events.filter(e => e.event.data.method === 'ExtrinsicFailed');
    if (errors.length > 0) {
      return "FAILED";
    }
    if (events.filter(e => e.event.data.method === 'ExtrinsicSuccess').length > 0) {
      return "SUCCESS";
    }
  }

  return "FAILED";
}


function signTransaction(sender, transaction) {
  return new Promise(async (resolve, reject) => {
    try {
      let unsub = await transaction.signAndSend(sender, result => {
        const status = getTransactionStatus(result);

        if (status === "SUCCESS") {
          unsub();
          resolve({result, status});
        } else if (status === "FAILED") {
          let moduleError = null;

          if (result.hasOwnProperty('dispatchError')) {
            const dispatchError = result['dispatchError'];

            if (dispatchError.isModule) {
              const modErr = dispatchError.asModule;
              const errorMeta = dispatchError.registry.findMetaError(modErr);

              moduleError = `${errorMeta.section}.${errorMeta.name}`;
            }
          }

          unsub();
          reject({status, moduleError, result});
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function extractCollectionIdFromCreationResult(creationResult) {
  if (creationResult.status !== "SUCCESS") {
    throw Error(`Unable to create collection`);
  }

  let collectionId = null;
  creationResult.result.events.forEach(({event: {data, method, section}}) => {
    if ((section === 'common') && (method === 'CollectionCreated')) {
      collectionId = parseInt(data[0].toString(), 10);
    }
  });

  if (collectionId === null) {
    throw Error(`No CollectionCreated event`)
  }

  return collectionId;
}

async function createCollection(api, signer) {
  let collectionOptions = {};
  collectionOptions.mode = {nft: null}; // this is NFT collection
  const creationResult = await signTransaction(
    signer,
    api.tx.unique.createCollectionEx(collectionOptions)
  );
  return extractCollectionIdFromCreationResult(creationResult);
}

async function mintMultipleNFTs(api, signer, collectionId, nftOwner) {
  let rawTokens = [];
  for (let i=0; i<100; i++) {
    rawTokens.push({NFT: null});
  }
  await signTransaction(
    signer,
    api.tx.unique.createMultipleItems(collectionId, {Ethereum: nftOwner}, rawTokens)
  );
}

contract("RFT Claim", function (accounts) {

  before("Setup", async () => {
    // Get the contract instance
    rtfinst = await RFTClaim.deployed();

    nftOwnerAddress = accounts[0];

    // Init collection owner keyring
    keyring = new Keyring({ type: 'sr25519' });
    keyring.setSS58Format(255);
    const signer = keyring.addFromUri(secret.substrateCollectionOwnerSeed);

    // Init substrate API
    const api = await connectSubstrate();

    // Check that collection creator has balance
    const bal = new BigNumber((await api.query.system.account(signer.address)).data.free).div(1e18).toFixed();
    if (bal < 100) {
      console.log(`ERROR - CANNOT RUN TESTS. Make sure the collection owner address has balance: ${signer.address}`);
      process.exit(0);
    }

    // Create collection and tokens
    collectionId = await createCollection(api, signer);
    collectionAddress = collectionIdToAddress(collectionId);
    await mintMultipleNFTs(api, signer, collectionId, rtfinst.address); // contract is the NFT owner 

    // Setup the collection address in the contract
    await rtfinst.setCollection(collectionAddress, {from: accounts[0]});
    await rtfinst.setFirstNFTId(firstNFTID);

    console.log("collection ID: ", collectionId);
    console.log("collection address: ", collectionAddress);
    console.log("owner addres: ", nftOwnerAddress);
  });

  it("Add a claimer", async () => {
    await rtfinst.addClaimer(accounts[1], {from: accounts[0]});
  });

  it("Add a claimer should fail from non-owner", async () => {
    try {
      await rtfinst.addClaimer(accounts[2], {from: accounts[1]});
    } catch (error) {
      return;
    }
    assert.isFalse(true, 'Adding from non-owner did not fail');
  });

  it("Claim from added address", async () => {
    const token = new web3.eth.Contract(abi, collectionAddress);
    const balanceBefore = await token.methods.balanceOf(accounts[1]).call();

    await rtfinst.addClaimer(accounts[1], {from: accounts[0]});
    await rtfinst.claim({from: accounts[1]});

    // Check that the claimer receives an NFT
    const balanceAfter = await token.methods.balanceOf(accounts[1]).call();
    assert.ok(balanceAfter - balanceBefore == 1);
  });

  it("Claim from non-added address should fail", async () => {
    try {
      await rtfinst.claim({from: accounts[2]});
    } catch (error) {
      return;
    }
    assert.isFalse(true, 'Claim did not fail');
  });

  it("Double-claim from added address should fail", async () => {
    await rtfinst.addClaimer(accounts[3], {from: accounts[0]});
    await rtfinst.claim({from: accounts[3]});

    try {
      await rtfinst.claim({from: accounts[3]});
    } catch (error) {
      return;
    }
    assert.isFalse(true, 'Claim did not fail');
  });

});
