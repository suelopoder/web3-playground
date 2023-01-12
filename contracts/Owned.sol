// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";

/**
 * @title Owned
 * @dev Buy this contract
 */
contract Owned {

    address private owner;

    // event for EVM logging
    event OwnerSet(address indexed oldOwner, address indexed newOwner);

    /**
     * @dev Set contract deployer as owner
     */
    constructor() {
        owner = msg.sender;
        emit OwnerSet(address(0), owner);
    }

    /**
     * @dev But this contract
     */
    function buy() public payable {
        require(msg.value >= 1, "Min 1 to buy");
        uint256 balanceBeforeThiBuy = address(this).balance - msg.value;
        require(msg.value >= balanceBeforeThiBuy, "Must be greater than total value");
        
        address newOwner = msg.sender;
        emit OwnerSet(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @dev Return owner address 
     * @return address of owner
     */
    function getOwner() external view returns (address) {
        return owner;
    }

    /**
     * @dev Return contract value
     * @return contract value
     */
    function getValue() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Return true is caller is the owner
     * @return address of owner
     */
    function amIOwner() external view returns (bool) {
        return owner == msg.sender;
    }
} 