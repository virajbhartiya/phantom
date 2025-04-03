// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {PhantomToken} from "./PhantomToken.sol";
import {Owned} from "solmate/auth/Owned.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";

contract StakingContract is Owned {
    using SafeTransferLib for PhantomToken;

    PhantomToken public immutable stakingToken;
    uint256 public rewardRate = 10;
    uint256 public constant REWARD_PRECISION = 1000;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaimed;
    }

    mapping(address => StakeInfo) public stakes;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _stakingToken) Owned(msg.sender) {
        stakingToken = PhantomToken(_stakingToken);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");

        if (stakes[msg.sender].amount > 0) {
            claimReward();
        }

        if (stakes[msg.sender].amount == 0) {
            stakes[msg.sender] = StakeInfo({
                amount: amount,
                stakedAt: block.timestamp,
                lastRewardClaimed: block.timestamp
            });
        } else {
            stakes[msg.sender].amount += amount;
            stakes[msg.sender].stakedAt = block.timestamp;
        }

        totalStaked += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");

        claimReward();

        userStake.amount -= amount;
        if (userStake.amount == 0) {
            userStake.stakedAt = 0;
        }

        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() public {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stakes found");

        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            userStake.lastRewardClaimed = block.timestamp;

            PhantomToken(stakingToken).mint(msg.sender, reward);

            emit RewardClaimed(msg.sender, reward);
        }
    }

    function calculateReward(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - userStake.lastRewardClaimed;

        uint256 secondsInDay = 86400;
        uint256 reward = (userStake.amount * rewardRate * timeElapsed) /
            (REWARD_PRECISION * secondsInDay);

        return reward;
    }

    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    function getStakeInfo(
        address user
    )
        external
        view
        returns (uint256 amount, uint256 stakedAt, uint256 pendingReward)
    {
        StakeInfo memory userStake = stakes[user];
        return (userStake.amount, userStake.stakedAt, calculateReward(user));
    }
}
