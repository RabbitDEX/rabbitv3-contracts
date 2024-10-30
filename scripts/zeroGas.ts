import { ethers } from 'hardhat';
import { gasLimit } from './steps';
import { addressFor } from './metadata';
import { VRC25Issuer__factory } from '../typechain-types';
import { VRC25_ISSUER_ADDRESS } from './constant';

async function apply() {
  const [owner] = await ethers.getSigners();
  const vrc25Issuer = VRC25Issuer__factory.connect(VRC25_ISSUER_ADDRESS, owner);

  console.log('Applying: NFTPositionManager');

  await vrc25Issuer.apply(addressFor('NFTPositionManager'), {
    gasLimit,
    value: 10_000000000_000000000n,
  });

  console.log('Applying: SwapRouter');

  await vrc25Issuer.apply(addressFor('SwapRouter'), {
    gasLimit,
    value: 10_000000000_000000000n,
  });
}

apply().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
