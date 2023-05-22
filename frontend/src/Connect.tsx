import React, { useState } from 'react'
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from "@web3-react/injected-connector";
import { shortenAddress } from './utils';

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
      <>
        {error ? <span className='text-red-600'>Something went wrong!</span> : ''}
        <button className='btn-primary' type='button' onClick={onConnect}>Connect</button>
      </>
    )
  }

  return (
    <div className='flex align-middle gap-2'>
      <span className='m-auto'>{shortenAddress(account)}</span>
      <button className='btn-primary' type='button' onClick={deactivate}>Disonnect</button>
    </div>
  )
}

export default Connect