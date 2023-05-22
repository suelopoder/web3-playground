import React from 'react';
import { Web3ReactProvider } from '@web3-react/core'
import Connect from './Connect';
import { Web3Provider } from "@ethersproject/providers";
import RaffleProvider from './RaffleProvider';
import Main from './Main';

// backgroundColor='#90c2fb' align='right'
function App() {
  return (
    <Web3ReactProvider getLibrary={provider => new Web3Provider(provider)}>
      <div>
        <div className='m-2 flex justify-between align-middle'>
          <h1 className='text-black p-6 font-bold'>Web3 playground</h1>
          <Connect />
        </div>
        <RaffleProvider>
          <Main />
        </RaffleProvider>
      </div>
    </Web3ReactProvider>
  );
}

export default App;
