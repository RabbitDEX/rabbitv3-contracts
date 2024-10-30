// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "../libraries/SignatureChecker.sol";

contract SignatureCheckerTest {
    using SignatureChecker for address;

    function isValidSignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) external view returns (bool) {
        return SignatureChecker.isValidSignatureNow(signer, hash, signature);
    }
}

