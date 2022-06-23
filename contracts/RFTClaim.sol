// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RFTClaim is Ownable {
    string public about = "Unique Network RFT Claim Contract";

    // An array with all eligible addresses and their status, only owner can add in it
    // status = 1 => eligible
    // status = 2 => already claimed
    mapping (address => uint8) private claimer;

    constructor() {
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
     *  3. Send the NFT to claimer
     */
    function claim() public {
        require(claimer[msg.sender] == 1);
        claimer[msg.sender] = 2;

        // Transfer NFT
        // TBD
    }
}
