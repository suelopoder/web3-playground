import React, { useContext, useEffect, useState } from 'react'
import { ContractContext } from './RaffleProvider'
import { shortenAddress } from './utils'
import { useWeb3React } from '@web3-react/core'

const Main = () => {
  const contract = useContext(ContractContext)
  const { account } = useWeb3React()
  const [players, setPlayers] = useState<string[]>([])
  const [lastWinner, setLastWinner] = useState('')
  const [canClose, setCanClose] = useState(false)
  useEffect(() => { updateUI() }, [contract])

  async function updateUI() {
    if (!contract) return

    const close = await contract.canClose()
    setCanClose(close)
    const winner = await contract.getLastWinner()
    setLastWinner(winner)

    const playerCount = (await contract.getPlayerCount()).toNumber()
    const players: string[] = []
    for (let i = 0; i < playerCount; i++) {
      const playerAddress = await contract.getPlayer(i)
      players.push(playerAddress)
    }
    setPlayers(players)
  }

  async function joinRaffle() {
    if (!contract || !account) return

    try {
      const joinResponse = await contract.join({ from: account, value: 1 })
      console.debug('joined Raffle', joinResponse)
      updateUI()
    } catch (e) {
      console.error('Could not join Raffle.', e)
    }
  }

  return (
    <main className='m-2'>
      <h2>Last winner was <b>{shortenAddress(lastWinner)}</b></h2>
      <section className='my-2'>
        <h3 className='font-semibold'>This round we have:</h3>
        <ul>
          {players.map(p => (
          <li className='p-2' key={p}>
            {shortenAddress(p)}
            {p === account && <small>You</small>}
          </li>
          ))}
        </ul>
      </section>
      {canClose && <p>Raffle can end now</p>}
      <button className='btn-primary' onClick={joinRaffle}>Join</button>
    </main>
  )
}

export default Main
