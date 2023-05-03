import React, { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from "@web3-react/injected-connector";
import { shortenAddress } from './utils';
import { Button } from '@web3uikit/core'

const Injected = new InjectedConnector({
  supportedChainIds: [31337]
});

const Connect = () => {
  const { activate, account, deactivate, active } = useWeb3React()
  const [error, setError] = useState<Error | undefined>()
  
  const onError = (err: Error) => {
    setError(err)
    console.error(err)
  }

  const onConnect = async () => {
    console.debug('Connect request')
    try {
      await activate(Injected, onError)
    } catch (e) {
      console.error('Could not connect', e)
    }
  }

  if (!account || !active) {
    return (
      <div>
        {error ? <span>Something when wrong!</span> : ''}
        <Button type='button' onClick={onConnect} text='Connect' />
      </div>
    )
  }

  return (
    <div>
      <span>{shortenAddress(account)}</span>
      <Button type='button' onClick={deactivate} text='Disonnect' />
    </div>
  )
}

export default Connect