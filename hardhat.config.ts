import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"
import dotenv from "dotenv"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  gasReporter: {
    enabled: true,
    outputFile: './gasReport'
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/'
    }
  }
};

export default config;
