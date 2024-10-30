/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('ERC165 Support', function () {
  const ERC165InterfaceId = '0x01ffc9a7';

  async function deploySwapRouter() {
    // Deploy the contract
    const v3CoreFactory = await ethers.deployContract('RabbitSwapV3Factory');
    const weth = await ethers.deployContract('WETH');

    const SwapRouter = await ethers.getContractFactory('SwapRouter');
    const swapRouter = await SwapRouter.deploy(v3CoreFactory, weth);
    await swapRouter.waitForDeployment();

    return { swapRouter };
  }

  it('should support ERC165 interface', async function () {
    const { swapRouter } = await loadFixture(deploySwapRouter);

    const supportsERC165 =
      await swapRouter.supportsInterface(ERC165InterfaceId);
    expect(supportsERC165).to.be.true;
  });

  it('should not support random interface', async function () {
    const { swapRouter } = await loadFixture(deploySwapRouter);

    const randomInterfaceId = '0x12345678';
    const supportsRandomInterface =
      await swapRouter.supportsInterface(randomInterfaceId);
    expect(supportsRandomInterface).to.be.false;
  });

  it('should support VRC25 interface', async function () {
    const { swapRouter } = await loadFixture(deploySwapRouter);

    const vrc25InterfaceId = '0x08617865';
    const supportsCustomInterface =
      await swapRouter.supportsInterface(vrc25InterfaceId);
    expect(supportsCustomInterface).to.be.true;
  });
});
