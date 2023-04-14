import { ethers, network } from "hardhat";
import fs from 'fs'
import path from 'path'
import { Raffle, VRFCoordinatorV2Mock } from "../typechain-types";

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

const networkConfig: Record<number, { vrfCoordinatorV2: string }> = {
  5: {
    vrfCoordinatorV2: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D'
  }
}

const gasLane = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" // 30 gwei
const callbackGasLimit = "500000" // 500,000 gas
const keepersUpdateInterval = "30" // in seconds

const ABI_FILE = path.resolve(__dirname, "../frontend/src/constants/abi.json")
const ADDRESSES_FILE = path.resolve(__dirname, "../frontend/src/constants/addresses.json")

async function updateABI(raffle: Raffle) {
  const data = raffle.interface.format(ethers.utils.FormatTypes.json) as string
  fs.writeFileSync(ABI_FILE, data, 'utf-8')
}

async function updateAddresses(raffleAddress: string, vrfCoordinatorAddress: string) {
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify({
    raffleAddress,
    vrfCoordinatorAddress,
  }))
}

async function main() {
  const networkName = network.name

  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock | null =  null
  let vrfCoordinatorAddress, subscriptionId

  // TODO deployment is a duplicated in tests, do just once. DRY it up!

  // If we are on a local development network, we need to deploy mocks!
  if (['localhost', 'hardhat'].includes(networkName)) {
    console.log("Local network detected! Deploying mocks...")
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK)
    vrfCoordinatorAddress = vrfCoordinatorV2Mock.address
    console.log(`Deployed VRFCoordinatorV2Mock at ${vrfCoordinatorAddress}`)

    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait(1)
    subscriptionId = transactionReceipt.events![0].args!.subId
  } else {
    // TODO!!
    const chainId = network.config.chainId
    if (!chainId) throw new Error('No chain id on network')
    vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2
  }

  const Raffle = await ethers.getContractFactory("Raffle");
  const raffle = await Raffle.deploy(vrfCoordinatorAddress, subscriptionId, gasLane, callbackGasLimit, keepersUpdateInterval);

  await raffle.deployed();

  if (vrfCoordinatorV2Mock) {
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      ethers.utils.parseEther("30")
    );
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
  }

  console.log(`Raffle deployed to ${raffle.address} on network ${network.name}`);

  await updateABI(raffle)
  await updateAddresses(raffle.address, vrfCoordinatorAddress)

  console.log('Updated contracts metadata files');

  const accounts = await ethers.getSigners()
  raffle.connect(accounts[1]).join({ value: 1 })

  console.log(`Account ${accounts[1].address} joined the raffle`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
