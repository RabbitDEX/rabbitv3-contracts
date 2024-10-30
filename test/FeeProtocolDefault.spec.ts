import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { computePoolAddress } from './shared/computePoolAddress';

describe('FeeProtocol Default', async () => {
  async function deployPoolFactory() {
    // Deploy the contract
    const poolFactory = await ethers.deployContract('RabbitSwapV3Factory');

    const tokenA = await ethers.deployContract('MyERC20', ['TokenA', 'A']);
    const tokenB = await ethers.deployContract('MyERC20', ['TokenB', 'B']);

    return { poolFactory, tokenA, tokenB };
  }

  it('default fee protocol be zero', async () => {
    const { poolFactory, tokenA, tokenB } =
      await loadFixture(deployPoolFactory);

    const tx = await poolFactory.createPool(tokenA, tokenB, 500);
    await tx.wait();

    const poolAddress = computePoolAddress(
      await poolFactory.getAddress(),
      [await tokenA.getAddress(), await tokenB.getAddress()],
      500,
    );
    const pool = await ethers.getContractAt('RabbitSwapV3Pool', poolAddress);
    const slot0 = await pool.slot0();

    expect(slot0.feeProtocol).to.eq(0);
  });

  it('should support custom default fee protocol', async () => {
    const { poolFactory, tokenA, tokenB } =
      await loadFixture(deployPoolFactory);

    const feeProtocol = 2_000n + (2_000n << 16n);
    expect(feeProtocol).to.eq(131074000);

    await expect(poolFactory.setFeeProtocolDefault(2_000, 2_000))
      .to.emit(poolFactory, 'SetFeeProtocolDefault')
      .withArgs(0, 0, 2_000, 2_000);
    expect(await poolFactory.feeProtocolDefault()).to.eq(feeProtocol);

    const tx = await poolFactory.createPool(tokenA, tokenB, 500);
    await tx.wait();

    const poolAddress = computePoolAddress(
      await poolFactory.getAddress(),
      [await tokenA.getAddress(), await tokenB.getAddress()],
      500,
    );
    const pool = await ethers.getContractAt('RabbitSwapV3Pool', poolAddress);
    await pool.initialize(1_000000000_000000000n);

    const slot0 = await pool.slot0();
    expect(slot0.feeProtocol).to.eq(feeProtocol);
  });
});
