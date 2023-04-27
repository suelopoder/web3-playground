import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv"
import "@nomicfoundation/hardhat-toolbox";

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/'
    }
  }
};

export default config;
