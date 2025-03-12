import 'hardhat-ethernal';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

import 'dotenv/config';

const LOW_OPTIMIZER_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 1_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
};

const LOWEST_OPTIMIZER_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 200,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
};

const DEFAULT_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 1_000_000,
    },
    metadata: {
      // do not include the metadata hash, since this is machine dependent
      // and we want all generated code to be deterministic
      // https://docs.soliditylang.org/en/v0.7.6/metadata.html
      bytecodeHash: 'none',
    },
  },
};

const POOL_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 50,
    },
    metadata: {
      // do not include the metadata hash, since this is machine dependent
      // and we want all generated code to be deterministic
      // https://docs.soliditylang.org/en/v0.7.6/metadata.html
      bytecodeHash: 'none',
    },
  },
};

const v0_7_6 = { version: '0.7.6' } as const;
const v0_8_16 = { version: '0.8.16' } as const;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    'tomo-mainnet': {
      url: 'https://viction.blockpi.network/v1/rpc/public',
      // url: 'https://rpc.viction.xyz',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    'tomo-testnet': {
      url: 'https://rpc-testnet.viction.xyz',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    arbitrumOne: {
      url: 'https://arb1.arbitrum.io/rpc',
      // accounts:
      //   process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    arbitrumSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      'tomo-mainnet': 'tomoscan2023',
      'tomo-testnet': 'tomoscan2023',
      arbitrumOne: 'H3W7D9MB9RU7P8YCFVWKZ9HWYBAJAYTIJ5',
      arbitrumSepolia: 'H3W7D9MB9RU7P8YCFVWKZ9HWYBAJAYTIJ5',
    },
    customChains: [
      {
        network: 'tomo-mainnet',
        chainId: 88, // for mainnet
        urls: {
          apiURL: 'https://www.vicscan.xyz/api/contract/hardhat/verify', // for mainnet
          browserURL: 'https://vicscan.xyz', // for mainnet
        },
      },
      {
        network: 'tomo-testnet',
        chainId: 89, // for testnet
        urls: {
          apiURL:
            'https://scan-api-testnet.viction.xyz/api/contract/hardhat/verify', // for testnet
          browserURL: 'https://testnet.vicscan.xyz', // for testnet
        },
      },
      {
        network: 'arbitrumSepolia',
        chainId: 421614,
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io/',
        },
      },
    ],
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
    overrides: {
      // core
      'contracts/core/RabbitSwapV3Factory.sol': POOL_COMPILER_SETTINGS,
      'contracts/core/RabbitSwapV3Pool.sol': POOL_COMPILER_SETTINGS,
      'contracts/core/RabbitSwapV3PoolDeployer.sol': POOL_COMPILER_SETTINGS,

      // periphery
      'contracts/periphery/NonfungiblePositionManager.sol':
        LOWEST_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/periphery/NonfungibleTokenPositionDescriptor.sol':
        LOW_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/periphery/libraries/NFTDescriptor.sol':
        LOW_OPTIMIZER_COMPILER_SETTINGS,

      'contracts/periphery/test/NonfungiblePositionManagerTest.sol': v0_7_6,
      'contracts/external/WETH.sol': v0_8_16,

      'contracts/vrc725/libraries/ECDSA.sol': v0_7_6,
      'contracts/vrc725/libraries/SignatureChecker.sol': v0_7_6,
      'contracts/vrc725/VRC725.sol': v0_7_6,
    },
  },
  typechain: {
    externalArtifacts: ['externalArtifacts/*.json'],
  },
};

export default config;
