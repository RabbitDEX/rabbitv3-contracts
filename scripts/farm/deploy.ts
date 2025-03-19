import { ethers } from 'hardhat';
import type { RabbitSponsoredFarm, ProxyAdmin } from '../../typechain-types';
import { deploy } from '../steps';

export const DEPLOY_SPONSORED_FARM_IMPLEMENTATION = async () => {
  const contractFactory = await ethers.getContractFactory('RabbitSponsoredFarm');
  return await deploy(
    'RabbitSponsoredFarm_Implementation',
    'RabbitSponsoredFarm',
    contractFactory
  );
};

export const DEPLOY_PROXY_ADMIN = async () => {
  const [deployer] = await ethers.getSigners();
  const contractFactory = await ethers.getContractFactory('ProxyAdmin');
  const proxyAdmin = await deploy(
    'RabbitSponsoredFarm_ProxyAdmin',
    'ProxyAdmin',
    contractFactory,
  );

  // Transfer ownership
  await proxyAdmin.transferOwnership(deployer.address);
  return proxyAdmin;

};

export const DEPLOY_SPONSORED_FARM_PROXY = async (
  implementation: RabbitSponsoredFarm, 
  proxyAdmin: ProxyAdmin
) => {
  // Get NFT manager address based on network
  const supportedNetworks: Record<number, string> = {
    88: '0xbF73c6E53965C3f34020D58cfe85D027Fe375C96', // Viction Mainnet
  };
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const nftManagerAddress = supportedNetworks[chainId];

  // Prepare initialization data
  const RabbitSponsoredFarm = await ethers.getContractFactory('RabbitSponsoredFarm');
  const initData = RabbitSponsoredFarm.interface.encodeFunctionData('initialize', [nftManagerAddress]);

  // Deploy TransparentUpgradeableProxy
  const contractFactory = await ethers.getContractFactory('TransparentUpgradeableProxy');
  return await deploy(
    'RabbitSponsoredFarm_Proxy',
    'TransparentUpgradeableProxy',
    contractFactory,
    await implementation.getAddress(),
    await proxyAdmin.getAddress(),
    initData
  )   
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  const implementation = await DEPLOY_SPONSORED_FARM_IMPLEMENTATION();
  const proxyAdmin = await DEPLOY_PROXY_ADMIN();
  const proxy = await DEPLOY_SPONSORED_FARM_PROXY(implementation, proxyAdmin);

  console.log('\nDeployment addresses:');
  console.log('Implementation:', await implementation.getAddress());
  console.log('ProxyAdmin:', await proxyAdmin.getAddress());
  console.log('Proxy:', await proxy.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
