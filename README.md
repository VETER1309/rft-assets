# Creation of assets related to RFT Campaign

## Agenda

1. Create NFT chest collection of 100,000 tokens, one for each registered person plus some extra. Leave it mintable, so that we can mint more in the future. All chests will be "Regular", but there will be capacity to add "Silver" and "Gold" chests.
2. Create the vault Ethereum contract for locking NFTs and deploy both on Ethereum (for locking Monique) and Quartz (for locking the punk 6123).
3. Create RFT collection with two tokens on Quartz. One RFT token matching to Monique, one RFT token matching to punk 6123, both consist of 100,000 pieces, one for each registered person. This is the fixed number of fractions, we will not be able to add more.
4. Nest 2 QTZ, one fraction of Monique RFT, and one fraction of 6123 punk RFT in each chest NFT.
5. Create claiming contract and the matching UI on the campaign web page that will allow each registered address to claim one chest NFT.

## Chest Collection

Collection Properties:
    - Name: Unique Chests
    - Description: Unique NFT chests for keeping cool things inside
    - Token prefix: CHEST

Token Properties:
    - Rarity: Regular, Rare, Extremely Rare

Initial number of NFTs:
    - 100,000 Regular chests, 0 Rare, 0 Extremely Rare.
    - Capability to mint more in the future

Images:
    Regular: https://unique.network/markup/dist/static/images/chest/lootbox-1.png
    Rare: https://unique.network/markup/dist/static/images/chest/lootbox-2.png
    Extremenly Rarte: https://unique.network/markup/dist/static/images/chest/lootbox-3.png

## Process of Refractionalizing

This document describes the process:
https://docs.google.com/document/d/1kwpGurlbXjQHUjvmPsx7tEIXagUNiFOoxNrQQUml6JU/edit?usp=sharing

1. Deploy smart contracts on Ethereum and Quartz
2. Create an RFT collection and two RFT tokens, one for each NFT
    - Collection Properties
        - Name: RFTCampaign
        - Description: Monique and Substrapunk 6123 refractionalized
        - Token prefix: FPNK
        - Token limit: 2
    - Token Properties (immutable)
        - Name
        - Original ID
        - Lock contract address
        - Lock contract network (Ethereum or Quartz)
3. Approve NFT to the smart contract
4. Invoke a method on the smart contract to capture the NFT (via transferFrom) and record matching RFT ID and network
    - The smart contract will accept only one NFT.
    - It should contain Unique Network identification
    - For Ethereum the source code should be published on Etherscan
    - Smart contract will record the RFT ID and Network (Quartz) where the matching RFT is created in the same transaction that captures the NFT


## Smart Contract Setup

```
npm install -g truffle ganache-cli
npm install
truffle compile
truffle develop
truffle migrate --network development


truffle migrate --network rc
truffle migrate --network quartz

```