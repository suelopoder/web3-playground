import React, { useEffect, useState } from 'react'
import abi from './constants/abi.json'
import addresses from './constants/addresses.json'
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { Raffle } from '../../typechain-types'
import { Web3Provider } from '@ethersproject/providers';

export const ContractContext = React.createContext<Raffle | null>(null)

type Props = { children: React.ReactNode }
export function RaffleProvider({ children }: Props) {
  const { library } = useWeb3React<Web3Provider>()
  const [contract, setContract] = useState<Raffle>()

  useEffect(() => {
    if (library) {
      const signer = library.getSigner();
      const contract = new ethers.Contract(addresses.raffleAddress, abi, signer) as Raffle
      setContract(contract)
      console.debug('Instantiated Raffle contract')
    }
  }, [library])

  if (!contract) return null

  return <ContractContext.Provider value={contract}>{children}</ContractContext.Provider>
}

export default RaffleProvider
