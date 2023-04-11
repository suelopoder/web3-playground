import { ethers, network } from "hardhat";

async function main() {
  const networkName = network.name

  if (!['localhost', 'hardhat'].includes(networkName)) return

  const Raffle = await ethers.getContractFactory("Raffle");
  const raffle = await Raffle.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0") // FIXME
  
  const tx = await raffle.performUpkeep("0x")
  await tx.wait(1)
  console.log('Sent performUpkeep on Raffle. Contract should be calculating now')

  console.log('State', await raffle.getState())
  console.log('Player count', await raffle.getPlayerCount())
  console.log('Last timestamp', await raffle.getLastTimestamp())

  const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3') // FIXME
  
  await vrfCoordinatorV2Mock.fulfillRandomWords(
    '1', // FIXME
    raffle.address
  )

  console.log('Sent fulfillRandomWords on VRF coordinator mock. Raffle should be done now')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
