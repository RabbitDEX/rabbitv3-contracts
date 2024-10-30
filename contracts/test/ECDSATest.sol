// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "../vrc725/libraries/ECDSA.sol";

contract ECDSATest {
    using ECDSA for bytes32;

    function recover(bytes32 hash, bytes memory signature) 
        external
        pure
        returns (address)
    {
        return ECDSA.recover(hash, signature);
    }
}
