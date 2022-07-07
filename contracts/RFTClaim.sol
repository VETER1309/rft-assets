// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract RFTClaim is Ownable {
    using Counters for Counters.Counter;

    // Just an info string
    string public about = "Unique Network RFT Claim Contract";

    // The address of the collection being dropped (set once by owner)
    address public collectionAddress = address(0);

    // Last NFT ID that was successfully dropped
    Counters.Counter private lastSuccessfulId;

    // NFT Owner to transfer NFTs from
    address public nftOwner = address(0);

    // An array with all eligible addresses and their status, only owner can add in it
    // status = 1 => eligible
    // status = 2 => already claimed
    mapping (address => uint8) private claimer;

    constructor() {
    }

    /**
     * Set the address of the collection being dropped
     */
    function setCollection(address _collectionAddress) public onlyOwner {
        require(collectionAddress == address(0));
        collectionAddress = _collectionAddress;
    }

    /**
     * Set the ID of the first available NFT for the drop
     */
    function setFirstNFTId(uint _firstId) public onlyOwner {
        require(_firstId > 0);

        while (lastSuccessfulId.current() < _firstId) {
            lastSuccessfulId.increment();
        }
        while (lastSuccessfulId.current() > _firstId) {
            lastSuccessfulId.decrement();
        }
    }

    /**
     * Set the address of NFT owner to transfer NFTs from
     */
    function setNFTOwner(address _nftOwner) public onlyOwner {
        nftOwner = _nftOwner;
    }

    /**
     *  1. Add a single claimer address in the claimer list if not there yet
     *  2. If claimer did not exist, set status to 1 (eligible)
     *  3. If claimer already exists, quietly return (to be used in the loops to 
     *     handle arrays of claimers)
     *
     * @param _claimer - claimer address
     */
    function addClaimer(address _claimer) public onlyOwner {
        if (claimer[_claimer] > 0) return;
        claimer[_claimer] = 1;
    }

    /**
     *  1. Throw if message sender is not in the claimer list or has already claimed
     *  2. Set claimer status to 2 (already claimed)
     *  3. Send the first available NFT to claimer
     * 
     * Note: NFTs must be owned by this contract in order to be claimable 
     */
    function claim() public {
        require(claimer[msg.sender] == 1);
        claimer[msg.sender] = 2;

        // Get the collection contract 
        IERC721 collection = IERC721(collectionAddress);

        // Transfer the next NFT
        lastSuccessfulId.increment();
        uint256 nftId = lastSuccessfulId.current();
        collection.transferFrom(address(this), msg.sender, nftId);
    }
}
