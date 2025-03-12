import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import type { 
  RabbitSponsoredFarm, 
  MockERC20, 
  MockNFTManager,
  ProxyAdmin,
  TransparentUpgradeableProxy 
} from '../typechain-types';

describe('RabbitSponsoredFarm', () => {
    let farm: RabbitSponsoredFarm;
    let implementation: RabbitSponsoredFarm;
    let proxyAdmin: ProxyAdmin;
    let proxy: TransparentUpgradeableProxy;
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
        nftManager = await MockNFTManager.deploy();
        await nftManager.waitForDeployment();
        
        // Deploy mock reward token
        const MockERC20 = await ethers.getContractFactory('MockERC20');
        rewardToken = await MockERC20.deploy('Reward Token', 'RWD');
        await rewardToken.waitForDeployment();

        // Deploy implementation
        const RabbitSponsoredFarm = await ethers.getContractFactory('RabbitSponsoredFarm');
        implementation = await RabbitSponsoredFarm.deploy();
        await implementation.waitForDeployment();

        // Deploy ProxyAdmin
        const ProxyAdmin = await ethers.getContractFactory('ProxyAdmin');
        proxyAdmin = await ProxyAdmin.deploy();
        await proxyAdmin.waitForDeployment();

        // Transfer ProxyAdmin ownership
        await proxyAdmin.transferOwnership(owner.address);

        // Prepare initialization data
        const initData = RabbitSponsoredFarm.interface.encodeFunctionData('initialize', [await nftManager.getAddress()]);

        // Deploy TransparentUpgradeableProxy
        const TransparentUpgradeableProxy = await ethers.getContractFactory('TransparentUpgradeableProxy');
        proxy = await TransparentUpgradeableProxy.deploy(
            await implementation.getAddress(),
            await proxyAdmin.getAddress(),
            initData
        ) as TransparentUpgradeableProxy;
        await proxy.waitForDeployment();

        // Get farm instance
        farm = RabbitSponsoredFarm.attach(await proxy.getAddress()) as RabbitSponsoredFarm;

        // Add farm
        await farm.addFarm(await rewardToken.getAddress(), signer.address, ethers.Wallet.createRandom().address, 0);
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
            const initialRewardPerBlock = ethers.parseEther('5');
            await farm.addFarm(await newToken.getAddress(), signer.address, poolAddress, initialRewardPerBlock);
            const farmData = await farm.farms(1);
            expect(farmData.rewardToken).to.equal(await newToken.getAddress());
            expect(farmData.signer).to.equal(signer.address);
            expect(farmData.active).to.equal(true);
            expect(farmData.totalClaimable).to.equal(0);
            expect(farmData.totalClaimed).to.equal(0);
            expect(farmData.pool).to.equal(poolAddress);
            expect(farmData.rewardPerBlock).to.equal(initialRewardPerBlock);
        });

        it('should not allow zero address reward token', async () => {
            await expect(farm.addFarm(ethers.ZeroAddress, signer.address, ethers.Wallet.createRandom().address, 0))
                .to.be.revertedWith('Invalid reward token');
        });

        it('should not allow zero address signer', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await expect(farm.addFarm(await newToken.getAddress(), ethers.ZeroAddress, ethers.Wallet.createRandom().address, 0))
                .to.be.revertedWith('Invalid signer');
        });

        it('should not allow zero address pool', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW');
            await newToken.waitForDeployment();

            await expect(farm.addFarm(await newToken.getAddress(), signer.address, ethers.ZeroAddress, 0))
                .to.be.revertedWith('Invalid pool');
        });

        it('should emit FarmAdded event', async () => {
            const MockERC20 = await ethers.getContractFactory('MockERC20');
            const newToken = await MockERC20.deploy('New Token', 'NEW') as MockERC20;
            await newToken.waitForDeployment();

            const poolAddress = ethers.Wallet.createRandom().address;
            const initialRewardPerBlock = ethers.parseEther('5');
            await expect(farm.addFarm(await newToken.getAddress(), signer.address, poolAddress, initialRewardPerBlock))
                .to.emit(farm, 'FarmAdded')
                .withArgs(1, await newToken.getAddress(), signer.address, poolAddress, initialRewardPerBlock);
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

        beforeEach(async () => {
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
                    { name: 'blockNumber', type: 'uint256' }
                ]
            };

            const blockNumber = await ethers.provider.getBlockNumber();
            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber
            };

            const signature = await signer.signTypedData(domain, types, value);

            const balanceBefore = await rewardToken.balanceOf(user.address);
            await farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber,
                signature
            });

            expect(await rewardToken.balanceOf(user.address)).to.equal(balanceBefore + amount);
            expect(await farm.positionTotalClaimed(tokenId, farmId)).to.equal(amount);
        });

        it('should not allow harvest with future block number', async () => {
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
                    { name: 'blockNumber', type: 'uint256' }
                ]
            };

            const blockNumber = (await ethers.provider.getBlockNumber()) + 100;
            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber
            };

            const signature = await signer.signTypedData(domain, types, value);

            await expect(farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber,
                signature
            })).to.be.revertedWith('Block not reached');
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
                    { name: 'blockNumber', type: 'uint256' }
                ]
            };

            const blockNumber = await ethers.provider.getBlockNumber();
            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber
            };

            const signature = await owner.signTypedData(domain, types, value);

            await expect(farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber,
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
                    { name: 'blockNumber', type: 'uint256' }
                ]
            };

            const blockNumber = await ethers.provider.getBlockNumber();
            const value = {
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber
            };

            const signature = await signer.signTypedData(domain, types, value);
            const tx = await farm.connect(user).harvest({
                tokenId,
                farmId,
                totalClaimable: amount,
                blockNumber,
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
            await farm.addFarm(await newToken.getAddress(), signer.address, ethers.Wallet.createRandom().address, 0);

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

    describe('setRewardPerBlock', () => {
        const newRewardPerBlock = ethers.parseEther('10');

        it('should update reward per block successfully', async () => {
            await farm.setRewardPerBlock(farmId, newRewardPerBlock);
            const farmData = await farm.farms(farmId);
            expect(farmData.rewardPerBlock).to.equal(newRewardPerBlock);
        });

        it('should not allow setting reward per block for inactive farm', async () => {
            await expect(farm.setRewardPerBlock(99, newRewardPerBlock))
                .to.be.revertedWith('Farm not active');
        });

        it('should emit RewardPerBlockUpdated event', async () => {
            await expect(farm.setRewardPerBlock(farmId, newRewardPerBlock))
                .to.emit(farm, 'RewardPerBlockUpdated')
                .withArgs(farmId, 0, newRewardPerBlock);
        });
    });

    describe('upgrades', () => {
        it('should be upgradeable', async () => {
            // Deploy V2 implementation
            const RabbitSponsoredFarmV2 = await ethers.getContractFactory('RabbitSponsoredFarm');
            const implementationV2 = await RabbitSponsoredFarmV2.deploy();
            await implementationV2.waitForDeployment();

            // Upgrade using ProxyAdmin
            await proxyAdmin.upgrade(await proxy.getAddress(), await implementationV2.getAddress());

            // Get V2 instance
            const farmV2 = RabbitSponsoredFarmV2.attach(await proxy.getAddress()) as RabbitSponsoredFarm;

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
            const RabbitSponsoredFarmV2 = await ethers.getContractFactory('RabbitSponsoredFarm');
            const implementationV2 = await RabbitSponsoredFarmV2.deploy();
            await implementationV2.waitForDeployment();

            await expect(
                proxyAdmin.connect(user).upgrade(await proxy.getAddress(), await implementationV2.getAddress())
            ).to.be.reverted;
        });
    });
});
