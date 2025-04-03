import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  TokensMinted as TokensMintedEvent,
  TokensBurned as TokensBurnedEvent,
  PhantomToken,
} from "../generated/PhantomToken/PhantomToken";
import { User, Transfer, GlobalStats, Transaction } from "../generated/schema";

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

function getOrCreateTransaction(event: TransferEvent): Transaction {
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

export function handleTransfer(event: TransferEvent): void {
  let from = getOrCreateUser(event.params.from);
  let to = getOrCreateUser(event.params.to);
  let amount = event.params.amount;

  from.tokenBalance = from.tokenBalance.minus(amount);
  to.tokenBalance = to.tokenBalance.plus(amount);

  from.save();
  to.save();

  let transaction = getOrCreateTransaction(event);
  let transferId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let transfer = new Transfer(transferId);
  transfer.from = from.id;
  transfer.to = to.id;
  transfer.amount = amount;
  transfer.timestamp = BigInt.fromI32(event.block.timestamp.toI32());
  transfer.transaction = transaction.id;
  transfer.save();

  let stats = getOrCreateGlobalStats();
  if (
    event.params.from.toHexString() ==
    "0x0000000000000000000000000000000000000000"
  ) {
    stats.totalTokenSupply = stats.totalTokenSupply.plus(amount);
  } else if (
    event.params.to.toHexString() ==
    "0x0000000000000000000000000000000000000000"
  ) {
    stats.totalTokenSupply = stats.totalTokenSupply.minus(amount);
  }
  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());
  stats.save();
}

export function handleTokensMinted(event: TokensMintedEvent): void {
  let to = getOrCreateUser(event.params.to);
  let stats = getOrCreateGlobalStats();

  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());
  stats.save();
}

export function handleTokensBurned(event: TokensBurnedEvent): void {
  let stats = getOrCreateGlobalStats();

  stats.updatedAt = BigInt.fromI32(event.block.timestamp.toI32());
  stats.save();
}
