import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import type { RabbitSponsoredFarm } from '../typechain-types';
import type { BaseContract } from 'ethers';

describe('RabbitSponsoredFarm', () => {
    let farm: RabbitSponsoredFarm;
    let owner: SignerWithAddress;
    let nftManager: SignerWithAddress;
    let rewardToken: BaseContract;
    let signer: SignerWithAddress;

    beforeEach(async () => {
        [owner, nftManager, signer] = await ethers.getSigners();
        
        // Deploy mock reward token
        const MockERC20 = await ethers.getContractFactory('MockERC20');
        rewardToken = await MockERC20.deploy('Reward Token', 'RWD');
        await rewardToken.waitForDeployment();

        // Deploy farm
        const RabbitSponsoredFarm = await ethers.getContractFactory('RabbitSponsoredFarm');
        farm = await RabbitSponsoredFarm.deploy(nftManager.address);
        await farm.waitForDeployment();

        // Add farm
        await farm.addFarm(await rewardToken.getAddress(), signer.address);
    });

    describe('deployment', () => {
        it('should set correct owner', async () => {
            expect(await farm.owner()).to.equal(owner.address);
        });

        it('should set correct NFT manager', async () => {
            expect(await farm.nonfungiblePositionManager()).to.equal(nftManager.address);
        });

        it('should initialize with zero total staked', async () => {
            expect(await farm.totalStaked()).to.equal(0);
        });
    });

    describe('addFarm', () => {
        it('should add new farm with correct parameters', async () => {
            const farmData = await farm.farms(0);
            expect(farmData.rewardToken).to.equal(await rewardToken.getAddress());
            expect(farmData.signer).to.equal(signer.address);
            expect(farmData.active).to.equal(true);
            expect(farmData.totalClaimable).to.equal(0);
            expect(farmData.totalClaimed).to.equal(0);
        });

        it('should not allow duplicate reward tokens', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await farm.addFarm(await newToken.getAddress(), signer.address);
            await expect(farm.addFarm(await newToken.getAddress(), signer.address))
                .to.be.revertedWith('Reward token already in use');
        });

        it('should not allow zero address reward token', async () => {
            await expect(farm.addFarm(ethers.ZeroAddress, signer.address))
                .to.be.revertedWith('Invalid reward token');
        });

        it('should not allow zero address signer', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await expect(farm.addFarm(await newToken.getAddress(), ethers.ZeroAddress))
                .to.be.revertedWith('Invalid signer');
        });
    });
});
