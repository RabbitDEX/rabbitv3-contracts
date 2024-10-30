// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import '../../core/interfaces/IRabbitSwapV3Pool.sol';
import './PoolAddress.sol';

/// @notice Provides validation for callbacks from RabbitSwap V3 Pools
library CallbackValidation {
    /// @notice Returns the address of a valid RabbitSwap V3 Pool
    /// @param factory The contract address of the RabbitSwap V3 factory
    /// @param tokenA The contract address of either token0 or token1
    /// @param tokenB The contract address of the other token
    /// @param fee The fee collected upon every swap in the pool, denominated in hundredths of a bip
    /// @return pool The V3 pool contract address
    function verifyCallback(
        address factory,
        address tokenA,
        address tokenB,
        uint24 fee
    ) internal view returns (IRabbitSwapV3Pool pool) {
        return verifyCallback(factory, PoolAddress.getPoolKey(tokenA, tokenB, fee));
    }

    /// @notice Returns the address of a valid RabbitSwap V3 Pool
    /// @param factory The contract address of the RabbitSwap V3 factory
    /// @param poolKey The identifying key of the V3 pool
    /// @return pool The V3 pool contract address
    function verifyCallback(address factory, PoolAddress.PoolKey memory poolKey)
        internal
        view
        returns (IRabbitSwapV3Pool pool)
    {
        pool = IRabbitSwapV3Pool(PoolAddress.computeAddress(factory, poolKey));
        require(msg.sender == address(pool));
    }
}