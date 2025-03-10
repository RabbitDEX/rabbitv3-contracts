import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import type { RabbitSponsoredFarm, MockERC20, MockNFTManager } from '../typechain-types';

describe('RabbitSponsoredFarm', () => {
    let farm: RabbitSponsoredFarm;
    let owner: SignerWithAddress;
    let nftManager: MockNFTManager;
    let rewardToken: MockERC20;
    let signer: SignerWithAddress;
    let user: SignerWithAddress;
    const tokenId = 1;
    const farmId = 0;

    beforeEach(async () => {
        [owner, signer, user] = await ethers.getSigners();
        
        // Deploy mock NFT manager
        const MockNFTManager = await ethers.getContractFactory('MockNFTManager');
        nftManager = await MockNFTManager.deploy() as MockNFTManager;
        await nftManager.waitForDeployment();
        
        // Deploy mock reward token
        const MockERC20 = await ethers.getContractFactory('MockERC20');
        rewardToken = await MockERC20.deploy('Reward Token', 'RWD') as MockERC20;
        await rewardToken.waitForDeployment();

        // Deploy farm with proxy
        const RabbitSponsoredFarm = await ethers.getContractFactory('RabbitSponsoredFarm');
        farm = await upgrades.deployProxy(
            RabbitSponsoredFarm,
            [await nftManager.getAddress()],
            { kind: 'transparent' }
        ) as RabbitSponsoredFarm;
        await farm.waitForDeployment();

        // Add farm
        await farm.addFarm(await rewardToken.getAddress(), signer.address, ethers.Wallet.createRandom().address);
    });

    describe('deployment', () => {
        it('should set correct owner', async () => {
            expect(await farm.owner()).to.equal(owner.address);
        });

        it('should set correct NFT manager', async () => {
            expect(await farm.nonfungiblePositionManager()).to.equal(await nftManager.getAddress());
        });

        it('should initialize with zero total staked', async () => {
            expect(await farm.totalStaked()).to.equal(0);
        });
    });

    describe('addFarm', () => {
        it('should add new farm with correct parameters', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW') as MockERC20;
            await newToken.waitForDeployment();

            const poolAddress = ethers.Wallet.createRandom().address;
            await farm.addFarm(await newToken.getAddress(), signer.address, poolAddress);
            const farmData = await farm.farms(1);
            expect(farmData.rewardToken).to.equal(await newToken.getAddress());
            expect(farmData.signer).to.equal(signer.address);
            expect(farmData.active).to.equal(true);
            expect(farmData.totalClaimable).to.equal(0);
            expect(farmData.totalClaimed).to.equal(0);
            expect(farmData.pool).to.equal(poolAddress);
        });

        it('should not allow duplicate reward tokens', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await farm.addFarm(await newToken.getAddress(), signer.address, ethers.Wallet.createRandom().address);
            await expect(farm.addFarm(await newToken.getAddress(), signer.address, ethers.Wallet.createRandom().address))
                .to.be.revertedWith('Reward token already in use');
        });

        it('should not allow zero address reward token', async () => {
            await expect(farm.addFarm(ethers.ZeroAddress, signer.address, ethers.Wallet.createRandom().address))
                .to.be.revertedWith('Invalid reward token');
        });

        it('should not allow zero address signer', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await expect(farm.addFarm(await newToken.getAddress(), ethers.ZeroAddress, ethers.Wallet.createRandom().address))
                .to.be.revertedWith('Invalid signer');
        });

        it('should not allow zero address pool', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await expect(farm.addFarm(await newToken.getAddress(), signer.address, ethers.ZeroAddress))
                .to.be.revertedWith('Invalid pool');
        });

        it('should emit FarmAdded event', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW') as MockERC20;
            await newToken.waitForDeployment();

            const poolAddress = ethers.Wallet.createRandom().address;
            await expect(farm.addFarm(await newToken.getAddress(), signer.address, poolAddress))
                .to.emit(farm, 'FarmAdded')
                .withArgs(1, await newToken.getAddress(), signer.address, poolAddress);
        });
    });

    describe('stake', () => {
        beforeEach(async () => {
            await nftManager.setOwner(tokenId, user.address);
        });

        it('should stake NFT successfully', async () => {
            const tx = await farm.connect(user).stake(tokenId);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt!.blockNumber);
            
            expect(await farm.positionOwner(tokenId)).to.equal(user.address);
            expect(await farm.totalStaked()).to.equal(1);
            
            await expect(tx)
                .to.emit(farm, 'PositionStaked')
                .withArgs(user.address, tokenId, receipt!.blockNumber, block!.timestamp);
        });

        it('should not allow staking already staked NFT', async () => {
            await farm.connect(user).stake(tokenId);
            await expect(farm.connect(user).stake(tokenId))
                .to.be.revertedWith('Already staked');
        });

        it('should not allow staking NFT not owned', async () => {
            await nftManager.setOwner(tokenId, owner.address);
            await expect(farm.connect(user).stake(tokenId))
                .to.be.revertedWith('Not owner');
        });
    });

    describe('unstake', () => {
        beforeEach(async () => {
            await nftManager.setOwner(tokenId, user.address);
            await farm.connect(user).stake(tokenId);
        });

        it('should unstake NFT successfully', async () => {
            await farm.connect(user).unstake(tokenId);
            expect(await farm.positionOwner(tokenId)).to.equal(ethers.ZeroAddress);
            expect(await farm.totalStaked()).to.equal(0);
        });

        it('should not allow unstaking by non-owner', async () => {
            await expect(farm.connect(owner).unstake(tokenId))
                .to.be.revertedWith('Not owner');
        });

        it('should emit PositionUnstaked event', async () => {
            const tx = await farm.connect(user).unstake(tokenId);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt!.blockNumber);

            await expect(tx)
                .to.emit(farm, 'PositionUnstaked')
                .withArgs(user.address, tokenId, receipt!.blockNumber, block!.timestamp);
        });
    });

    describe('harvest', () => {
        const amount = ethers.parseEther('100');
        let deadline: number;

        beforeEach(async () => {
            deadline = Math.floor(Date.now() / 1000) + 3600;
            await nftManager.setOwner(tokenId, user.address);
            await farm.connect(user).stake(tokenId);
            await rewardToken.mint(owner.address, amount);
            await rewardToken.connect(owner).approve(await farm.getAddress(), amount);
            await farm.connect(owner).depositReward(farmId, amount);
        });

        it('should harvest rewards successfully', async () => {
            const domain = {
                name: 'RabbitSponsoredFarm',
                version: '1',
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await farm.getAddress()
            };

            const types = {
                Harvest: [
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'farmId', type: 'uint256' },
                    { name: 'totalClaimable', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline
            };

            const signature = await signer.signTypedData(domain, types, value);

            const balanceBefore = await rewardToken.balanceOf(user.address);
            await farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline,
                signature
            });

            expect(await rewardToken.balanceOf(user.address)).to.equal(balanceBefore + amount);
            expect(await farm.positionTotalClaimed(tokenId, farmId)).to.equal(amount);
        });

        it('should not allow harvest with expired signature', async () => {
            const expiredDeadline = Math.floor(Date.now() / 1000) - 3600;
            const domain = {
                name: 'RabbitSponsoredFarm',
                version: '1',
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await farm.getAddress()
            };

            const types = {
                Harvest: [
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'farmId', type: 'uint256' },
                    { name: 'totalClaimable', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline: expiredDeadline
            };

            const signature = await signer.signTypedData(domain, types, value);

            await expect(farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline: expiredDeadline,
                signature
            })).to.be.revertedWith('Signature expired');
        });

        it('should not allow harvest with invalid signature', async () => {
            const domain = {
                name: 'RabbitSponsoredFarm',
                version: '1',
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await farm.getAddress()
            };

            const types = {
                Harvest: [
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'farmId', type: 'uint256' },
                    { name: 'totalClaimable', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline
            };

            const signature = await owner.signTypedData(domain, types, value);

            await expect(farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline,
                signature
            })).to.be.revertedWith('Invalid signature');
        });

        it('should emit RewardHarvested event', async () => {
            const domain = {
                name: 'RabbitSponsoredFarm',
                version: '1',
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await farm.getAddress()
            };

            const types = {
                Harvest: [
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'farmId', type: 'uint256' },
                    { name: 'totalClaimable', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline
            };

            const signature = await signer.signTypedData(domain, types, value);
            const tx = await farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                deadline,
                signature
            });
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt!.blockNumber);

            await expect(tx)
                .to.emit(farm, 'RewardHarvested')
                .withArgs(user.address, tokenId, farmId, amount, receipt!.blockNumber, block!.timestamp);
        });
    });

    describe('depositReward', () => {
        const amount = ethers.parseEther('100');

        beforeEach(async () => {
            await rewardToken.mint(owner.address, amount);
            await rewardToken.approve(await farm.getAddress(), amount);
        });

        it('should deposit rewards successfully', async () => {
            await farm.depositReward(farmId, amount);
            const farmData = await farm.farms(farmId);
            expect(farmData.totalClaimable).to.equal(amount);
        });

        it('should not allow deposit of zero amount', async () => {
            await expect(farm.depositReward(farmId, 0))
                .to.be.revertedWith('Amount must be greater than 0');
        });

        it('should not allow deposit to inactive farm', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();
            await farm.addFarm(await newToken.getAddress(), signer.address, ethers.Wallet.createRandom().address);

            await expect(farm.depositReward(99, amount))
                .to.be.revertedWith('Farm not active');
        });

        it('should emit RewardDeposited event', async () => {
            await expect(farm.depositReward(farmId, amount))
                .to.emit(farm, 'RewardDeposited')
                .withArgs(farmId, amount);
        });
    });

    describe('setSigner', () => {
        const newSigner = ethers.Wallet.createRandom();

        it('should update signer successfully', async () => {
            await farm.setSigner(farmId, newSigner.address);
            const farmData = await farm.farms(farmId);
            expect(farmData.signer).to.equal(newSigner.address);
        });

        it('should not allow setting zero address signer', async () => {
            await expect(farm.setSigner(farmId, ethers.ZeroAddress))
                .to.be.revertedWith('Invalid signer');
        });

        it('should not allow setting signer for inactive farm', async () => {
            await expect(farm.setSigner(99, newSigner.address))
                .to.be.revertedWith('Farm not active');
        });

        it('should emit SignerUpdated event', async () => {
            await expect(farm.setSigner(farmId, newSigner.address))
                .to.emit(farm, 'SignerUpdated')
                .withArgs(farmId, signer.address, newSigner.address);
        });
    });

    describe('upgrades', () => {
        it('should be upgradeable', async () => {
            // Deploy V2 implementation
            const RabbitSponsoredFarmV2 = await ethers.getContractFactory('RabbitSponsoredFarm');
            const farmV2 = await upgrades.upgradeProxy(
                await farm.getAddress(),
                RabbitSponsoredFarmV2
            ) as RabbitSponsoredFarm;

            // Check that storage values are preserved
            expect(await farmV2.owner()).to.equal(owner.address);
            expect(await farmV2.nonfungiblePositionManager()).to.equal(await nftManager.getAddress());
            expect(await farmV2.totalStaked()).to.equal(0);

            const farmData = await farmV2.farms(0);
            expect(farmData.rewardToken).to.equal(await rewardToken.getAddress());
            expect(farmData.signer).to.equal(signer.address);
            expect(farmData.active).to.equal(true);
        });

        it('should not allow non-owner to upgrade', async () => {
            const RabbitSponsoredFarmV2 = await ethers.getContractFactory('RabbitSponsoredFarm', user);
            await expect(
                upgrades.upgradeProxy(await farm.getAddress(), RabbitSponsoredFarmV2)
            ).to.be.revertedWithCustomError;
        });
    });
});
