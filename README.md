# web 3 playground

This project acts a sandbox project to teach myself web3 stuff.
Right now I am trying a decentralised lottery from heavily inspired from https://github.com/PatrickAlphaC/hardhat-smartcontract-lottery-fcc. Thank you @PatrickAlphaC!

## Running locally

`yarn local` To run a local node.

On a new terminal tab do `yarn deploy` to deploy Raflle contract on local node.

Now we can start the frontend by doing: `cd frontend; yarn start`. User can join the raffle contract.

On a third terminal we can end raffle round by doing `yarn endRound`. Frontend should reflect the new status.

## Run Tests

`yarn test`