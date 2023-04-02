import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

describe("Raffle", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, ...accounts] = await ethers.getSigners();

    // if (['localhost', 'hardhat'].includes(network.name) {
    const VRFCoordMock = await ethers.getContractFactory("VRFCoordinatorV2Mock")
    const vrfCoordinatorV2Mock = await VRFCoordMock.deploy(BASE_FEE, GAS_PRICE_LINK)

    console.log('VRFCoordinatorV2Mock deployed at', vrfCoordinatorV2Mock.address)

    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait()
    const subscriptionId = transactionReceipt.events[0].args.subId

    const gasLane = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" // 30 gwei
    const callbackGasLimit = "500000" // 500,000 gas
    const keepersUpdateInterval = "30" // in seconds
    
    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(vrfCoordinatorV2Mock.address, subscriptionId, gasLane, callbackGasLimit, keepersUpdateInterval);

    return { raffle, owner, accounts };
  }

  describe("Deployment", function () {
    it("Should not fail", async function () {
      const { raffle } = await loadFixture(deploy);

      // expect(await raffle.getVal()).to.equal(6);
    });
  });

  describe("Join", function() {
    it('Should fail when no money is passed', async () => {
      const { raffle } = await loadFixture(deploy);
      expect(raffle.join()).to.be.revertedWith("Raffle__NotEnoughMoney")
    })
    it('Should fail when little money is passed', async () => {
      const { raffle } = await loadFixture(deploy);
      expect(raffle.join({ value: 0.1 })).to.be.revertedWith("Raffle__NotEnoughMoney")
    })
    it('Should store a new joiner', async () => {
      const { raffle, owner } = await loadFixture(deploy);
      expect(raffle.join({ value: 1 }))
      expect(await raffle.getPlayer(0)).to.equal(owner.address)
    })
    it('Should store multiple players', async () => {
      const { raffle, accounts } = await loadFixture(deploy);
      await raffle.join({ value: 1 })
      await raffle.connect(accounts[0]).join({ value: 1 })
      await raffle.connect(accounts[1]).join({ value: 1 })
      expect(await raffle.getPlayerCount()).to.equal(3)
    })
  })

  describe("Winners", () => {
    // TODO
  })
});
