// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import '../NonfungiblePositionManager.sol';

contract NonfungiblePositionManagerTest is NonfungiblePositionManager {

    constructor(address _factory, address _WETH9, address _tokenDescriptor) NonfungiblePositionManager(_factory, _WETH9, _tokenDescriptor) {}

    string public message;

    function write(string calldata newMessage) external {
        message = newMessage;
    }
}

