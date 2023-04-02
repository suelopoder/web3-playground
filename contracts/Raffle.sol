// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Raffle__NotEnoughMoney();
error Raffle__CantJoinWhileCalculatingWinner();
error Raffle__TransferFailed(address payable winner, uint256 amount);
error Raffle__UpkeepNotNeeded(uint256 players, uint256 state);

enum Raffle_State {
    OPEN,
    CALCULATING
}

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    address private immutable i_owner;
    uint256 private immutable i_interval;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    
    address payable[] private s_players;
    address payable s_lastWinner;
    Raffle_State private s_state;
    uint256 private s_lastTimeStamp;

    event WinnerPicked(address payable winner, uint256 amount);
    event RequestedWinner(uint256 requestId);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_owner = msg.sender;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_interval = interval;
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_state = Raffle_State.OPEN;
        s_lastTimeStamp = block.timestamp;
    }

    function join() public payable {
        if (msg.value < 1) {
            revert Raffle__NotEnoughMoney();
        }

        if (s_state == Raffle_State.CALCULATING) {
            revert Raffle__CantJoinWhileCalculatingWinner();
        }

        s_players.push(payable(msg.sender));
    }

    // Got dice results!
    function fulfillRandomWords(
        uint256,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable winner = s_players[indexOfWinner];
        s_lastWinner = winner;
        s_lastTimeStamp = block.timestamp;
        s_players = new address payable[](0);
        s_state = Raffle_State.OPEN;

        // Send money to winner
        uint256 amount = address(this).balance;
        (bool success, ) = winner.call{value: amount}("");

        if (!success) {
            revert Raffle__TransferFailed(winner, amount);
        }
        emit WinnerPicked(winner, amount);
    }

    // can current raffle end?
    function canClose() public view returns (bool) {
        bool isOpen = s_state == Raffle_State.OPEN;
        bool hasPlayers = s_players.length > 0;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        return isOpen && hasPlayers && timePassed;
    }

    // chainlink checking if it needs to call perform upkeep
    function checkUpkeep(
        bytes calldata
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = canClose();
        return (upkeepNeeded, "0x0");
    }

    // chainlink letting us now it's time to check if we need to end raffle
    function performUpkeep(bytes calldata) external override {
        bool close = canClose();
        if (!close) {
            revert Raffle__UpkeepNotNeeded(
                s_players.length,
                uint256(s_state)
            );
        }

        s_state = Raffle_State.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            1,
            i_callbackGasLimit,
            1
        );
        emit RequestedWinner(requestId);
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getPlayerCount() public view returns (uint256) {
        return s_players.length;
    }
}
