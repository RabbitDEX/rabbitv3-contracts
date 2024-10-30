// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "../libraries/ECDSA.sol";

contract SmartWalletTest {
    address public owner;
    
    constructor(address _owner) {
        owner = _owner;
    }
    
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4) {
        (address recovered, ECDSA.RecoverError error,) = ECDSA.tryRecover(hash, signature);
        
        if (error == ECDSA.RecoverError.NoError && recovered == owner) {
            // ERC1271 magic value
            return 0x1626ba7e;
        }
        return 0xffffffff;
    }
}
