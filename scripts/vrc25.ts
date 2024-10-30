import { ethers } from 'hardhat';
import { gasLimit } from './steps';
import { addressFor, writeMetadata } from './metadata';

async function main() {
  console.log('Deploying: SwapRouterTest');
  const swapRouterFactory = await ethers.getContractFactory('SwapRouterTest');
  const swapRouter = await swapRouterFactory.deploy(
    addressFor('RabbitV3Factory'),
    addressFor('WETH'),
    {
      gasLimit,
    },
  );

  writeMetadata('SwapRouterTest', await swapRouter.getAddress());

  console.log(`Deployed: SwapRouterTest at ${await swapRouter.getAddress()}`);
  console.log(
    'To verify: ' +
      `npx hardhat verify --network ${process.env.HARDHAT_NETWORK} ${await swapRouter.getAddress()} "${addressFor('RabbitV3Factory')}" "${addressFor('WETH')}"`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
