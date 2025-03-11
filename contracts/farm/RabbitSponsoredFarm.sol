// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';
import './interfaces/IRabbitSponsoredFarm.sol';
import '../periphery/interfaces/INonfungiblePositionManager.sol';

contract RabbitSponsoredFarm is
    IRabbitSponsoredFarm,
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using ECDSAUpgradeable for bytes32;

    bytes32 private constant HARVEST_TYPEHASH =
        keccak256(
            'Harvest(uint256 tokenId,uint256 farmId,uint256 totalClaimable,uint256 deadline)'
        );

    INonfungiblePositionManager public override nonfungiblePositionManager;
    mapping(uint256 => Farm) private _farms; // farmId => Farm
    mapping(uint256 => address) public override positionOwner; // tokenId => owner
    mapping(uint256 => uint256) public override positionLastHarvestTime; // tokenId => lastHarvestTime
    mapping(uint256 => mapping(uint256 => uint256))
        public
        override positionTotalClaimed; // tokenId => farmId => amount
    uint256 public override totalStaked;
    uint256 public nextFarmId;

    function initialize(
        address _nonfungiblePositionManager
    ) public initializer {
        require(
            _nonfungiblePositionManager != address(0),
            'Invalid NFT manager'
        );
        nonfungiblePositionManager = INonfungiblePositionManager(
            _nonfungiblePositionManager
        );
        __Context_init();
        __Ownable_init();
        __ReentrancyGuard_init();
        __EIP712_init('RabbitSponsoredFarm', '1');
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual onlyOwner {}

    function farms(
        uint256 farmId
    ) external view override returns (Farm memory) {
        return _farms[farmId];
    }

    function addFarm(
        address rewardToken,
        address signer,
        address pool,
        uint256 rewardPerBlock
    ) external override onlyOwner {
        require(rewardToken != address(0), 'Invalid reward token');
        require(signer != address(0), 'Invalid signer');
        require(pool != address(0), 'Invalid pool');

        uint256 farmId = nextFarmId++;
        _farms[farmId] = Farm({
            rewardToken: IERC20Upgradeable(rewardToken),
            signer: signer,
            active: true,
            totalClaimable: 0,
            totalClaimed: 0,
            pool: pool,
            rewardPerBlock: rewardPerBlock
        });

        emit FarmAdded(farmId, rewardToken, signer, pool, rewardPerBlock);
    }

    function stake(uint256 tokenId) external override nonReentrant {
        require(positionOwner[tokenId] == address(0), 'Already staked');
        require(
            nonfungiblePositionManager.ownerOf(tokenId) == msg.sender,
            'Not owner'
        );

        nonfungiblePositionManager.transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        positionOwner[tokenId] = msg.sender;
        positionLastHarvestTime[tokenId] = block.timestamp;

        totalStaked++;
        emit PositionStaked(msg.sender, tokenId, block.number, block.timestamp);
    }

    function unstake(uint256 tokenId) external override nonReentrant {
        require(positionOwner[tokenId] == msg.sender, 'Not owner');

        delete positionOwner[tokenId];
        delete positionLastHarvestTime[tokenId];
        totalStaked--;

        nonfungiblePositionManager.transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        emit PositionUnstaked(
            msg.sender,
            tokenId,
            block.number,
            block.timestamp
        );
    }

    function harvest(
        HarvestParams calldata params
    ) external override nonReentrant {
        require(positionOwner[params.tokenId] == msg.sender, 'Not owner');
        require(block.timestamp <= params.deadline, 'Signature expired');

        Farm memory farm = _farms[params.farmId];
        require(farm.active, 'Farm not active');

        bytes32 structHash = keccak256(
            abi.encode(
                HARVEST_TYPEHASH,
                params.tokenId,
                params.farmId,
                params.totalClaimable,
                params.deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);

        require(
            digest.recover(params.signature) == farm.signer,
            'Invalid signature'
        );

        uint256 harvestAmount = params.totalClaimable -
            positionTotalClaimed[params.tokenId][params.farmId];
        require(harvestAmount > 0, 'No rewards to harvest');
        require(
            harvestAmount <= farm.totalClaimable - farm.totalClaimed,
            'Insufficient farm rewards'
        );

        positionLastHarvestTime[params.tokenId] = block.timestamp;
        positionTotalClaimed[params.tokenId][params.farmId] = params
            .totalClaimable;
        _farms[params.farmId].totalClaimed += harvestAmount;

        farm.rewardToken.safeTransfer(msg.sender, harvestAmount);
        emit RewardHarvested(
            msg.sender,
            params.tokenId,
            params.farmId,
            harvestAmount,
            block.number,
            block.timestamp
        );
    }

    function depositReward(
        uint256 farmId,
        uint256 amount
    ) external override onlyOwner {
        require(amount > 0, 'Amount must be greater than 0');
        Farm memory farm = _farms[farmId];
        require(farm.active, 'Farm not active');

        farm.rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        _farms[farmId].totalClaimable += amount;
        emit RewardDeposited(farmId, amount);
    }

    function setSigner(
        uint256 farmId,
        address _signer
    ) external override onlyOwner {
        require(_signer != address(0), 'Invalid signer');
        Farm memory farm = _farms[farmId];
        require(farm.active, 'Farm not active');

        address oldSigner = farm.signer;
        _farms[farmId].signer = _signer;
        emit SignerUpdated(farmId, oldSigner, _signer);
    }

    function setRewardPerBlock(
        uint256 farmId,
        uint256 rewardPerBlock
    ) external override onlyOwner {
        Farm memory farm = _farms[farmId];
        require(farm.active, 'Farm not active');

        uint256 oldRewardPerBlock = farm.rewardPerBlock;
        _farms[farmId].rewardPerBlock = rewardPerBlock;
        emit RewardPerBlockUpdated(farmId, oldRewardPerBlock, rewardPerBlock);
    }
}
