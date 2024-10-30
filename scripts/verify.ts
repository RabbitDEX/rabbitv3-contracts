import hre from 'hardhat';
import { nativeCurrencyLabelBytes } from './steps';
import { addressFor } from './metadata';

async function main() {
  console.log('Verifying RabbitSwapV3Factory');
  await hre.run('verify:verify', {
    address: addressFor('RabbitSwapV3Factory'),
    constructorArguments: [],
    contract: 'contracts/core/RabbitSwapV3Factory.sol:RabbitSwapV3Factory',
  });

  console.log('Verifying RabbitSwapInterfaceMulticall');
  await hre.run('verify:verify', {
    address: addressFor('RabbitSwapInterfaceMulticall'),
    constructorArguments: [],
    contract:
      'contracts/periphery/lens/RabbitSwapInterfaceMulticall.sol:RabbitSwapInterfaceMulticall',
  });

  console.log('Verifying ProxyAdmin');
  await hre.run('verify:verify', {
    address: addressFor('ProxyAdmin'),
    constructorArguments: [],
    contract: '@openzeppelin/contracts/proxy/ProxyAdmin.sol:ProxyAdmin',
  });

  console.log('Verifying TickLens');
  await hre.run('verify:verify', {
    address: addressFor('TickLens'),
    constructorArguments: [],
    contract: 'contracts/periphery/lens/TickLens.sol:TickLens',
  });

  console.log('Verifying NFTDescriptorLibraryV1');
  await hre.run('verify:verify', {
    address: addressFor('NFTDescriptorLibraryV1'),
    constructorArguments: [],
    contract: 'contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor',
  });

  console.log('Verifying NFTPositionDescriptorV1');
  await hre.run('verify:verify', {
    address: addressFor('NFTPositionDescriptorV1'),
    constructorArguments: [addressFor('WETH'), nativeCurrencyLabelBytes],
    contract:
      'contracts/periphery/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor',
  });

  console.log('Verifying NFTPositionDescriptorProxy');
  await hre.run('verify:verify', {
    address: addressFor('NFTPositionDescriptorProxy'),
    constructorArguments: [
      addressFor('NFTPositionDescriptorV1'),
      addressFor('ProxyAdmin'),
      '0x',
    ],
    contract:
      '@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy',
  });

  console.log('Verifying NFTPositionManager');
  await hre.run('verify:verify', {
    address: addressFor('NFTPositionManager'),
    constructorArguments: [
      addressFor('RabbitSwapV3Factory'),
      addressFor('WETH'),
      addressFor('NFTPositionDescriptorProxy'),
    ],
    contract:
      'contracts/periphery/NonfungiblePositionManager.sol:NonfungiblePositionManager',
  });

  console.log('Verifying QuoterV2');
  await hre.run('verify:verify', {
    address: addressFor('QuoterV2'),
    constructorArguments: [
      addressFor('RabbitSwapV3Factory'),
      addressFor('WETH'),
    ],
    contract: 'contracts/periphery/lens/QuoterV2.sol:QuoterV2',
  });

  console.log('Verifying SwapRouter');
  await hre.run('verify:verify', {
    address: addressFor('SwapRouter'),
    constructorArguments: [
      addressFor('RabbitSwapV3Factory'),
      addressFor('WETH'),
    ],
    contract: 'contracts/periphery/SwapRouter.sol:SwapRouter',
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
