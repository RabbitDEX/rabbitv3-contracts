import { ethers } from 'hardhat';
import type { RabbitSponsoredFarm } from '../../typechain-types';
import { deploy } from '../steps';
import { addressFor } from '../metadata';

export const DEPLOY_NEW_IMPLEMENTATION = async () => {
  const contractFactory = await ethers.getContractFactory('RabbitSponsoredFarm');
  return await deploy(
    'RabbitSponsoredFarm_Implementation_V2',
    'RabbitSponsoredFarm',
    contractFactory
  );
};

export const UPGRADE_PROXY = async (newImplementation: RabbitSponsoredFarm) => {
  // Get proxy and proxy admin addresses
  const proxyAddress = addressFor('RabbitSponsoredFarm_Proxy');
  const proxyAdminAddress = addressFor('RabbitSponsoredFarm_ProxyAdmin');

  // Get proxy admin contract
  const proxyAdmin = await ethers.getContractAt('ProxyAdmin', proxyAdminAddress);

  // Upgrade proxy to new implementation
  await proxyAdmin.upgrade(proxyAddress, await newImplementation.getAddress());
  console.log('Proxy upgraded to new implementation');
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Upgrading contract with account:', deployer.address);

  const newImplementation = await DEPLOY_NEW_IMPLEMENTATION();
  await UPGRADE_PROXY(newImplementation);

  console.log('\nUpgrade complete:');
  console.log('New Implementation:', await newImplementation.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
