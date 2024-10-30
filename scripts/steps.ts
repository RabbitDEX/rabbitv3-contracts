import { ethers } from 'hardhat';
import { addressFor } from './metadata';
import hre from 'hardhat';
import { writeMetadata } from './metadata';
import { ContractFactory, ContractTransactionResponse } from 'ethers';
import { asciiStringToBytes32 } from './utils/asciiStringToBytes32';

const ONE_BP_FEE = 100;
const ONE_BP_TICK_SPACING = 1;

type InferFactoryContractType<T> = T extends {
  deploy(
    ...args: never[]
  ): Promise<
    infer R & { deploymentTransaction(): ContractTransactionResponse }
  >;
}
  ? R
  : never;

export const gasLimit = 10_000_000;

export async function deploy<T extends ContractFactory>(
  metadataName: string,
  contractName: string,
  factory: T,
  ...args: Parameters<T['deploy']>
) {
  console.log(`Deploying: ${metadataName}...`);
  const contract = await factory.deploy(...args, { gasLimit });
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  writeMetadata(metadataName, address);

  console.log(`Deployed: ${metadataName} at ${address}`);

  if (process.env.ETHERNAL_PUSH) {
    await hre.ethernal.push({
      name: contractName,
      address,
    });
  }

  return contract as InferFactoryContractType<T>;
}

export const DEPLOY_V3_CORE_FACTORY = async () => {
  const contractFactory = await ethers.getContractFactory(
    'RabbitSwapV3Factory',
  );
  return await deploy(
    'RabbitSwapV3Factory',
    'RabbitSwapV3Factory',
    contractFactory,
  );
};

export const ADD_1BP_FEE_TIER = async () => {
  const contract = await ethers.getContractAt(
    'RabbitSwapV3Factory',
    addressFor('RabbitSwapV3Factory'),
  );

  // add 1BP fee tier
  console.log('Adding 1BP fee tier to factory...');
  const tx = await contract.enableFeeAmount(ONE_BP_FEE, ONE_BP_TICK_SPACING, {
    gasLimit,
  });
  await tx.wait();

  // TODO: transfer ownership

  return contract;
};

export const SET_PROTOCOL_FEE_DEFAULT = async () => {
  const contract = await ethers.getContractAt(
    'RabbitSwapV3Factory',
    addressFor('RabbitSwapV3Factory'),
  );

  // set protocolFeeDefault
  console.log('Setting default protocol fee to 20%');
  const tx = await contract.setFeeProtocolDefault(2_000, 2_000, {
    gasLimit,
  });
  await tx.wait();

  // TODO: transfer ownership

  return contract;
};

export const DEPLOY_MULTICALL2 = async () => {
  const contractFactory = await ethers.getContractFactory(
    'RabbitSwapInterfaceMulticall',
  );
  return await deploy(
    'RabbitSwapInterfaceMulticall',
    'RabbitSwapInterfaceMulticall',
    contractFactory,
  );
};

export const DEPLOY_PROXY_ADMIN = async () => {
  const contractFactory = await ethers.getContractFactory('ProxyAdmin');
  const contract = await deploy('ProxyAdmin', 'ProxyAdmin', contractFactory);

  // TODO: transfer ownership

  return contract;
};

export const DEPLOY_TICK_LENS = async () => {
  const contractFactory = await ethers.getContractFactory('TickLens');
  return await deploy('TickLens', 'TickLens', contractFactory);
};

export const nativeCurrencyLabelBytes: string = process.env.nativeCurrencyLabel
  ? asciiStringToBytes32(process.env.nativeCurrencyLabel)
  : asciiStringToBytes32('ETH');

export const DEPLOY_NFT_DESCRIPTOR_LIBRARY_V1 = async () => {
  const contractFactory = await ethers.getContractFactory('NFTDescriptor');
  const contract = await deploy(
    'NFTDescriptorLibraryV1',
    'NFTDescriptor',
    contractFactory,
  );

  return contract;
};

export const DEPLOY_NFT_POSITION_DESCRIPTOR_V1 = async () => {
  const contractFactory = await ethers.getContractFactory(
    'NonfungibleTokenPositionDescriptor',
    {
      libraries: {
        'contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor':
          addressFor('NFTDescriptorLibraryV1'),
      },
    },
  );
  const contract = await deploy(
    'NFTPositionDescriptorV1',
    'NonfungibleTokenPositionDescriptor',
    contractFactory,
    addressFor('WETH'),
    nativeCurrencyLabelBytes,
  );

  return contract;
};

export const DEPLOY_TRANSPARENT_PROXY_DESCRIPTOR = async () => {
  const contractFactory = await ethers.getContractFactory(
    'TransparentUpgradeableProxy',
  );
  const contract = await deploy(
    'NFTPositionDescriptorProxy',
    'TransparentUpgradeableProxy',
    contractFactory,
    addressFor('NFTPositionDescriptorV1'),
    addressFor('ProxyAdmin'),
    '0x',
  );

  return contract;
};

export const DEPLOY_NONFUNGIBLE_POSITION_MANAGER = async () => {
  const contractFactory = await ethers.getContractFactory(
    'NonfungiblePositionManager',
  );
  return await deploy(
    'NFTPositionManager',
    'NonfungiblePositionManager',
    contractFactory,
    addressFor('RabbitSwapV3Factory'),
    addressFor('WETH'),
    addressFor('NFTPositionDescriptorProxy'),
  );
};

export const DEPLOY_QUOTER_V2 = async () => {
  const contractFactory = await ethers.getContractFactory('QuoterV2');
  return await deploy(
    'QuoterV2',
    'QuoterV2',
    contractFactory,
    addressFor('RabbitSwapV3Factory'),
    addressFor('WETH'),
  );
};

export const DEPLOY_SWAP_ROUTER = async () => {
  const contractFactory = await ethers.getContractFactory('SwapRouter');
  return await deploy(
    'SwapRouter',
    'SwapRouter',
    contractFactory,
    addressFor('RabbitSwapV3Factory'),
    addressFor('WETH'),
  );
};
