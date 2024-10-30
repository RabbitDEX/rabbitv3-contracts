// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MyERC20 is ERC20 {
    constructor (string memory name_, string memory symbol_) ERC20(name_, symbol_){
        _mint(msg.sender, 1_000_000_000);
    }
} 
