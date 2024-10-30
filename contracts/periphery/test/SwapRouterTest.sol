// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import '../SwapRouter.sol';

contract SwapRouterTest is SwapRouter {

    constructor(address _factory, address _WETH9) SwapRouter(_factory, _WETH9) {}

    string public message;

    function write(string calldata newMessage) external {
        message = newMessage;
    }
}

