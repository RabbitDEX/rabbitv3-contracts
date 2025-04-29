import { ethers, run } from 'hardhat';
import { addressFor } from '../metadata';

async function verifyContracts() {
  // Get NFT manager address based on network
  const supportedNetworks: Record<number, string> = {
    88: '0xbF73c6E53965C3f34020D58cfe85D027Fe375C96', // Viction Mainnet
  };
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const nftManagerAddress = supportedNetworks[chainId];

  const [deployer] = await ethers.getSigners();

  // Get addresses from metadata
  const proxyAddress = addressFor('RabbitSponsoredFarm_Proxy');
  const implementationAddress = addressFor('RabbitSponsoredFarm_Implementation_V2');
  const adminAddress = addressFor('RabbitSponsoredFarm_ProxyAdmin');

  // verify proxy address
  console.log('Verifying proxy contract on block explorer...');
  const RabbitSponsoredFarm = await ethers.getContractFactory('RabbitSponsoredFarm');
  const initData = RabbitSponsoredFarm.interface.encodeFunctionData('initialize', [nftManagerAddress]);
  try {
    await run('verify:verify', {
      address: proxyAddress,
      constructorArguments: [implementationAddress, adminAddress, initData],
      contract: '@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy',
    });
  } catch (error) {
    console.log('Error verifying proxy contract:', error);
  }

  // verify implementation address
  console.log('Verifying implementation contract on block explorer...');
  try {
    await run('verify:verify', {
      address: implementationAddress,
      constructorArguments: [],
      contract: 'contracts/farm/RabbitSponsoredFarm.sol:RabbitSponsoredFarm'
    });
  } catch (error) {
    console.log('Error verifying implementation contract:', error);
  }

  // verify admin address
  console.log('Verifying admin contract on block explorer...');
  try {
    await run('verify:verify', {
      address: adminAddress,
      constructorArguments: [deployer.address],
      contract: '@openzeppelin/contracts/proxy/ProxyAdmin.sol:ProxyAdmin',
    });
  } catch (error) {
    console.log('Error verifying admin contract:', error);
  }
}

verifyContracts()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});