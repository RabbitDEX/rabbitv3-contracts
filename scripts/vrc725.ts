import { ethers } from 'hardhat';
import { gasLimit } from './steps';
import { addressFor, writeMetadata } from './metadata';
import { VRC25Issuer__factory } from '../typechain-types';
import { VRC25_ISSUER_ADDRESS } from './constant';

async function main() {
  console.log('Deploying: NonfungiblePositionManagerTest');
  const contractFactory = await ethers.getContractFactory(
    'NonfungiblePositionManagerTest',
  );

  const contract = await contractFactory.deploy(
    addressFor('RabbitSwapV3Factory'),
    addressFor('WETH'),
    addressFor('NFTPositionDescriptorProxy'),
    { gasLimit },
  );

  writeMetadata('NonfungiblePositionManagerTest', await contract.getAddress());

  console.log(
    `Deployed: NonfungiblePositionManagerTest at ${await contract.getAddress()}`,
  );
  console.log(
    'To verify: ' +
      `npx hardhat verify --network ${process.env.HARDHAT_NETWORK} ${await contract.getAddress()} "${addressFor('RabbitSwapV3Factory')}" "${addressFor('WETH')}" "${addressFor('NFTPositionDescriptorProxy')}"`,
  );
}

export async function write() {
  const contract = await ethers.getContractAt(
    'NonfungiblePositionManagerTest',
    addressFor('NonfungiblePositionManagerTest'),
  );

  await contract.write('Hello, World!', { gasLimit });
}

export async function apply() {
  const [owner] = await ethers.getSigners();
  const vrc25Issuer = VRC25Issuer__factory.connect(VRC25_ISSUER_ADDRESS, owner);

  await vrc25Issuer.apply(addressFor('NonfungiblePositionManagerTest'), {
    gasLimit,
    value: 10_000000000_000000000n,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
