import { ethers } from 'hardhat';
import { deploy } from './steps';

async function main() {
  const wethFactory = await ethers.getContractFactory('WETH');
  await deploy('WETH', 'WETH', wethFactory);

  // await hre.run('verify', {
  //   address: addressFor('WETH'),
  //   contractArgument: [],
  //   contract: 'contracts/external/WETH.sol:WETH',
  // });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
