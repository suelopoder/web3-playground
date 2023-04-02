import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

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
    const VRFCoordMock = await ethers.getContractFactory("VRFCoordinatorV2Mock", owner)
    const vrfCoordinatorV2Mock = await VRFCoordMock.deploy(BASE_FEE, GAS_PRICE_LINK)

    console.log('VRFCoordinatorV2Mock deployed at', vrfCoordinatorV2Mock.address)
    
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait(1)
    const subscriptionId = transactionReceipt.events[0].args.subId
    
    const gasLane = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" // 30 gwei
    const callbackGasLimit = "500000" // 500,000 gas
    const keepersUpdateInterval = "30" // in seconds
    
    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(vrfCoordinatorV2Mock.address, subscriptionId, gasLane, callbackGasLimit, keepersUpdateInterval);
    console.log('Raffle deployed at', raffle.address)
    
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      ethers.utils.parseEther("30")
    );
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
    
    return { raffle, owner, accounts, vrfCoordinatorV2Mock, subscriptionId };
  }

  describe("Deployment", function () {
    it("Should not fail", async function () {
      const { raffle } = await loadFixture(deploy);

      // expect(await raffle.getVal()).to.equal(6);
    });
  });

  describe("Join", function () {
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

  describe("Raffle end", () => {
    it('Should pick a winner eventually', async () => {
      const { owner, raffle, accounts, vrfCoordinatorV2Mock, subscriptionId } = await loadFixture(deploy);
      await raffle.connect(accounts[1]).join({ value: 1 })
      await raffle.connect(accounts[2]).join({ value: 1 })
      await raffle.connect(accounts[3]).join({ value: 1 })
      // console.log('Players:', accounts[0].address, accounts[1].address, accounts[2].address)
      const balancesBefore = [await accounts[0].getBalance(), await accounts[1].getBalance(), await accounts[2].getBalance()]
      await raffle.connect(owner)

      // Magically push time forward
      await network.provider.send("evm_increaseTime", [31])
      await network.provider.request({ method: "evm_mine", params: [] })

      await new Promise<void>(async (resolve, revert) => {
        try {
          raffle.once('WinnerPicked', async (winnerAddress: string, balance: BigNumber) => {
            // console.log('Winner Picked', winnerAddress, balance.toNumber())

            for (let i = 1; i <= 3; i++) {
              const currentAccount = accounts[i]
              if (currentAccount.address === winnerAddress) {
                const balanceNow = await currentAccount.getBalance()
                const balanceBefore = balancesBefore[i - 1]
                expect(balanceNow).to.be.greaterThan(balanceBefore)
                // TODO check the exact amount won. Consider fees!
                resolve()
                return
              }
            }

            revert(new Error('Winner not found'))
          })

          // Mock chainlink external call
          const tx = await raffle.performUpkeep("0x")
          await tx.wait(1)

          await vrfCoordinatorV2Mock.fulfillRandomWords(
            subscriptionId,
            raffle.address,
          )
        } catch (e) {
          revert(e)
        }
      })
    })
  })
});
