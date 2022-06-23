const RFTClaim = artifacts.require("RFTClaim");

contract("RFT Claim", function (accounts) {

  it("Add a claimer", async function () {
    let rtfinst = await RFTClaim.deployed();
    await rtfinst.addClaimer(accounts[1], {from: accounts[0]});
  });

  it("Add a claimer should fail from non-owner", async function () {
    let rtfinst = await RFTClaim.deployed();

    try {
      await rtfinst.addClaimer(accounts[2], {from: accounts[1]});
    } catch (error) {
      return;
    }
    assert.isFalse(true, 'Adding from non-owner did not fail');
  });

  it("Claim from added address", async function () {
    let rtfinst = await RFTClaim.deployed();
    await rtfinst.addClaimer(accounts[1], {from: accounts[0]});
    await rtfinst.claim({from: accounts[1]});
  });

  it("Claim from non-added address should fail", async function () {
    let rtfinst = await RFTClaim.deployed();
    try {
      await rtfinst.claim({from: accounts[2]});
    } catch (error) {
      return;
    }
    assert.isFalse(true, 'Claim did not fail');
  });

  it("Double-claim from added address should fail", async function () {
    let rtfinst = await RFTClaim.deployed();
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
