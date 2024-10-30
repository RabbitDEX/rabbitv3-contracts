// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import './pool/IRabbitSwapV3PoolImmutables.sol';
import './pool/IRabbitSwapV3PoolState.sol';
import './pool/IRabbitSwapV3PoolDerivedState.sol';
import './pool/IRabbitSwapV3PoolActions.sol';
import './pool/IRabbitSwapV3PoolOwnerActions.sol';
import './pool/IRabbitSwapV3PoolEvents.sol';

/// @title The interface for a RabbitSwap V3 Pool
/// @notice A RabbitSwap pool facilitates swapping and automated market making between any two assets that strictly conform
/// to the ERC20 specification
/// @dev The pool interface is broken up into many smaller pieces
interface IRabbitSwapV3Pool is
    IRabbitSwapV3PoolImmutables,
    IRabbitSwapV3PoolState,
    IRabbitSwapV3PoolDerivedState,
    IRabbitSwapV3PoolActions,
    IRabbitSwapV3PoolOwnerActions,
    IRabbitSwapV3PoolEvents
{

}
