// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '../../periphery/interfaces/INonfungiblePositionManager.sol';

interface IRabbitSponsoredFarm {
    struct Farm {
        IERC20Upgradeable rewardToken;
        address signer;
        bool active;
        uint256 totalClaimable;
        uint256 totalClaimed;
        address pool;
    }

    struct HarvestParams {
        uint256 tokenId;
        uint256 farmId;
        uint256 totalClaimable;
        uint256 deadline;
        bytes signature;
    }

    event PositionStaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 blockNumber,
        uint256 timestamp
    );
    event PositionUnstaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 blockNumber,
        uint256 timestamp
    );
    event RewardHarvested(
        address indexed user,
        uint256 indexed tokenId,
        uint256 indexed farmId,
        uint256 amount,
        uint256 blockNumber,
        uint256 timestamp
    );
    event SignerUpdated(
        uint256 indexed farmId,
        address indexed oldSigner,
        address indexed newSigner
    );
    event RewardDeposited(uint256 indexed farmId, uint256 amount);
    event FarmAdded(
        uint256 indexed farmId,
        address indexed rewardToken,
        address indexed signer,
        address pool
    );

    function nonfungiblePositionManager()
        external
        view
        returns (INonfungiblePositionManager);
    function farms(uint256 farmId) external view returns (Farm memory);
    function positionOwner(uint256 tokenId) external view returns (address);
    function positionLastHarvestTime(
        uint256 tokenId
    ) external view returns (uint256);
    function positionTotalClaimed(
        uint256 tokenId,
        uint256 farmId
    ) external view returns (uint256);
    function totalStaked() external view returns (uint256);

    function addFarm(
        address rewardToken,
        address signer,
        address pool
    ) external;
    function stake(uint256 tokenId) external;
    function unstake(uint256 tokenId) external;
    function harvest(HarvestParams calldata params) external;
    function depositReward(uint256 farmId, uint256 amount) external;
    function setSigner(uint256 farmId, address _signer) external;
}
