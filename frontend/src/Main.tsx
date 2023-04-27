import React, { useContext, useEffect, useState } from 'react'
import { ContractContext } from './RaffleProvider'
import { Button } from '@web3uikit/core'
import { shortenAddress } from './utils'
import { useWeb3React } from '@web3-react/core'

const Main = () => {
  const contract = useContext(ContractContext)
  const { account } = useWeb3React()
  const [playerCount, setPlayerCount] = useState(0)
  const [lastWinner, setLastWinner] = useState('')
  const [canClose, setCanClose] = useState(false)
  useEffect(() => { updateUI() }, [contract])

  async function updateUI() {
    if (!contract) return

    const close = await contract.canClose()
    setCanClose(close)
    const winner = await contract.getLastWinner()
    setLastWinner(winner)
    const playerCount = await contract.getPlayerCount()
    setPlayerCount(playerCount.toNumber())
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
    <main style={{ margin: '1rem 0' }}>
      Last winner was <b>{shortenAddress(lastWinner)}</b>
      <p>{playerCount.toString()} players in round</p>
      {canClose && <p>Raffle can end now</p>}
      <Button onClick={joinRaffle} text='Join' />
    </main>
  )
}

export default Main
