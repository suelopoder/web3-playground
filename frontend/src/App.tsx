import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Contract, ethers } from "ethers";
import abi from './constants/abi.json'
import addresses from './constants/addresses.json'

const LOCAL_NODE_URL = 'http://127.0.0.1:8545/'

function shortenAddress(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-3)}`
}

function App() {
  const [contract, setContract] = useState<Contract>()
  const [lastWinner, setLastWinner] = useState('')
  const [canClose, setCanClose] = useState(false)

  async function boot() {
    const provider = new ethers.JsonRpcProvider(LOCAL_NODE_URL)
    const signer = await provider.getSigner()
    const balance = await provider.getBalance(await signer.getAddress())
    console.log('Signer balance', ethers.formatEther(balance))

    const contract = new ethers.Contract(addresses.raffleAddress, abi, signer)
    setContract(contract)
    await updateUI(contract)
  }

  async function updateUI(contract: Contract) {
    const close = await contract.canClose()
    setCanClose(close)
    const winner = await contract.getLastWinner()
    setLastWinner(winner)
  }

  async function joinRaffle() {
    if (!contract) return
    await contract.join({ value: ethers.parseEther('1') })
    updateUI(contract)
  }

  useEffect(() => {
    boot()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Last winner was <b>{shortenAddress(lastWinner)}</b>. Congrats</p>
        {canClose ? <p>Raffle can end now</p> : <p>Waiting...</p>}
        <button onClick={joinRaffle}>Join</button>
      </header>
    </div>
  );
}

export default App;
