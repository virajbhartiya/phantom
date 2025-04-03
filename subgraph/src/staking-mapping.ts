import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  Staked as StakedEvent,
  Withdrawn as WithdrawnEvent,
  RewardClaimed as RewardClaimedEvent,
  RewardRateUpdated as RewardRateUpdatedEvent,
  StakingContract,
} from "../generated/StakingContract/StakingContract";
import {
  User,
  StakingActivity,
  GlobalStats,
  Transaction,
} from "../generated/schema";

function getOrCreateUser(address: Address): User {
  let userId = address.toHexString();
  let user = User.load(userId);

  if (!user) {
    user = new User(userId);
    user.tokenBalance = BigInt.fromI32(0);
    user.stakedAmount = BigInt.fromI32(0);
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.lastRewardClaimed = BigInt.fromI32(0);
    user.save();
  }

  return user;
}

function getOrCreateGlobalStats(): GlobalStats {
  let statsId = "global";
  let stats = GlobalStats.load(statsId);

  if (!stats) {
    stats = new GlobalStats(statsId);
    stats.totalTokenSupply = BigInt.fromI32(0);
    stats.totalStaked = BigInt.fromI32(0);
    stats.totalRewardsPaid = BigInt.fromI32(0);
    stats.stakingContractAddress = "";
    stats.tokenContractAddress = "";
    stats.rewardRate = BigInt.fromI32(0);
    stats.updatedAt = BigInt.fromI32(0);
    stats.save();
  }

  return stats;
}

function getOrCreateTransaction(
  event:
    | StakedEvent
    | WithdrawnEvent
    | RewardClaimedEvent
    | RewardRateUpdatedEvent
): Transaction {
  let txHash = event.transaction.hash.toHexString();
  let transaction = Transaction.load(txHash);

  if (!transaction) {
    transaction = new Transaction(txHash);
    transaction.blockNumber = BigInt.fromI32(event.block.number.toI32());
    transaction.timestamp = BigInt.fromI32(event.block.timestamp.toI32());
    transaction.save();
  }

  return transaction;
}

export function handleStaked(event: StakedEvent): void {
  let user = getOrCreateUser(event.params.user);
  let amount = event.params.amount;

  user.stakedAmount = user.stakedAmount.plus(amount);
  user.stakedAt = BigInt.fromI32(event.block.timestamp.toI32());
  user.save();

  let transaction = getOrCreateTransaction(event);
  let activityId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let activity = new StakingActivity(activityId);
  activity.user = user.id;
  activity.type = "STAKE";
  activity.amount = amount;
  activity.timestamp = BigInt.fromI32(event.block.timestamp.toI32());
  activity.transaction = transaction.id;
  activity.save();

  let stats = getOrCreateGlobalStats();
  stats.totalStaked = stats.totalStaked.plus(amount);
  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());

  if (stats.stakingContractAddress == "") {
    stats.stakingContractAddress = event.address.toHexString();

    let stakingContract = StakingContract.bind(event.address);
    let tokenAddress = stakingContract.stakingToken();
    stats.tokenContractAddress = tokenAddress.toHexString();
  }

  stats.save();
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  let user = getOrCreateUser(event.params.user);
  let amount = event.params.amount;

  user.stakedAmount = user.stakedAmount.minus(amount);
  if (user.stakedAmount.equals(BigInt.fromI32(0))) {
    user.stakedAt = null;
  }
  user.save();

  let transaction = getOrCreateTransaction(event);
  let activityId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let activity = new StakingActivity(activityId);
  activity.user = user.id;
  activity.type = "WITHDRAW";
  activity.amount = amount;
  activity.timestamp = BigInt.fromI32(event.block.timestamp.toI32());
  activity.transaction = transaction.id;
  activity.save();

  let stats = getOrCreateGlobalStats();
  stats.totalStaked = stats.totalStaked.minus(amount);
  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());
  stats.save();
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  let user = getOrCreateUser(event.params.user);
  let amount = event.params.amount;

  user.totalRewardsClaimed = user.totalRewardsClaimed.plus(amount);
  user.lastRewardClaimed = BigInt.fromI32(event.block.timestamp.toI32());
  user.save();

  let transaction = getOrCreateTransaction(event);
  let activityId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let activity = new StakingActivity(activityId);
  activity.user = user.id;
  activity.type = "CLAIM";
  activity.amount = amount;
  activity.timestamp = BigInt.fromI32(event.block.timestamp.toI32());
  activity.transaction = transaction.id;
  activity.save();

  let stats = getOrCreateGlobalStats();
  stats.totalRewardsPaid = stats.totalRewardsPaid.plus(amount);
  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());
  stats.save();
}

export function handleRewardRateUpdated(event: RewardRateUpdatedEvent): void {
  let newRate = event.params.newRate;

  let stats = getOrCreateGlobalStats();
  stats.rewardRate = newRate;
  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());
  stats.save();
}
