import React from 'react';
import { Web3ReactProvider } from '@web3-react/core'
import Connect from './Connect';
import { Web3Provider } from "@ethersproject/providers";
import RaffleProvider from './RaffleProvider';
import Main from './Main';
import { Hero } from '@web3uikit/core';

function App() {
  return (
    <Web3ReactProvider getLibrary={provider => new Web3Provider(provider)}>
      <div style={{ margin: '2rem' }}>
        <Hero backgroundColor='#90c2fb' title='Web3 playground' align='right'>
          <Connect />
        </Hero>
        <RaffleProvider>
          <Main />
        </RaffleProvider>
      </div>
    </Web3ReactProvider>
  );
}

export default App;
