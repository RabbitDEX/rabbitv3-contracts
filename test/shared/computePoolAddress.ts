import { ethers } from 'hardhat';

import { RabbitSwapV3Pool__factory } from '../../typechain-types';

export const POOL_BYTECODE_HASH = ethers.keccak256(
  RabbitSwapV3Pool__factory.bytecode,
);

export function computePoolAddress(
  factoryAddress: string,
  [tokenA, tokenB]: [string, string],
  fee: number,
): string {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];
  const constructorArgumentsEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'uint24'],
    [token0, token1, fee],
  );
  const create2Inputs = [
    '0xff',
    factoryAddress,
    // salt
    ethers.keccak256(constructorArgumentsEncoded),
    // init code hash
    POOL_BYTECODE_HASH,
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;
  return ethers.getAddress(`0x${ethers.keccak256(sanitizedInputs).slice(-40)}`);
}
