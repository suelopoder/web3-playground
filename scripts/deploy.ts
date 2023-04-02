import { ethers, network } from "hardhat";

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

const networkConfig: Record<number, { vrfCoordinatorV2: string }> = {
  5: {
    vrfCoordinatorV2: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D'
  }
}

async function main() {
  const networkName = network.name

  let vrfCoordinatorAddress
  // If we are on a local development network, we need to deploy mocks!
  if (['localhost', 'hardhat'].includes(networkName)) {
    console.log("Local network detected! Deploying mocks...")
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinatorAddress = (await VRFCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK)).address
  } else {
    const chainId = network.config.chainId
    if (!chainId) throw new Error('No chain id on network')
    vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2
  }

  const Raffle = await ethers.getContractFactory("Raffle");
  const raffle = await Raffle.deploy(vrfCoordinatorAddress);

  await raffle.deployed();

  console.log(`Raffle deployed to ${raffle.address} on network ${network.name}`);

  const accounts = await ethers.getSigners()
  raffle.connect(accounts[1]).join({ value: 1 })
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
