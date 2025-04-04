# Phantom Protocol Subgraph

## How Subgraphs Consume Events

### Event Indexing Process

1. **Event Detection**

   - The subgraph listens to new blocks on the blockchain
   - When a block contains transactions involving our tracked contracts, it processes the emitted events
   - Events are processed in the order they appear in the block

2. **Event Handlers**

   ```typescript
   // PhantomToken Events
   export function handleTransfer(event: TransferEvent): void {
     // Updates token balances
     // Updates global stats
     // Creates transfer entity
   }

   // StakingContract Events
   export function handleStaked(event: StakedEvent): void {
     // Updates user's staked amount
     // Updates global TVL
     // Creates staking activity entity
   }
   ```

3. **Data Transformation**
   - Raw event data is transformed into structured entities
   - Related entities are updated to maintain data consistency
   - Example: A Transfer event updates:
     - Sender's balance
     - Receiver's balance
     - Global token statistics
     - Creates a new Transfer entity

### Event Flow Architecture

```
Blockchain → Event Emission → Subgraph Node → Event Handlers → Graph Database
```

1. **Contract Events**

   ```solidity
   // PhantomToken.sol
   event Transfer(address indexed from, address indexed to, uint256 amount)
   event TokensMinted(address indexed to, uint256 amount)
   event TokensBurned(address indexed from, uint256 amount)

   // StakingContract.sol
   event Staked(address indexed user, uint256 amount)
   event Withdrawn(address indexed user, uint256 amount)
   event RewardClaimed(address indexed user, uint256 amount)
   ```

2. **Subgraph Mapping**

   ```yaml
   dataSources:
     - kind: ethereum
       name: PhantomToken
       mapping:
         eventHandlers:
           - event: Transfer(indexed address,indexed address,uint256)
             handler: handleTransfer
           - event: TokensMinted(indexed address,uint256)
             handler: handleTokensMinted

     - kind: ethereum
       name: StakingContract
       mapping:
         eventHandlers:
           - event: Staked(indexed address,uint256)
             handler: handleStaked
           - event: RewardClaimed(indexed address,uint256)
             handler: handleRewardClaimed
   ```

### Real-time Data Flow Example

1. **Transfer Event Flow**

   ```
   Transfer Event Emitted
   ↓
   handleTransfer triggered
   ↓
   Update sender balance
   Update receiver balance
   Create Transfer entity
   Update global stats
   ```

2. **Staking Event Flow**
   ```
   Stake Event Emitted
   ↓
   handleStaked triggered
   ↓
   Update user staked amount
   Create StakingActivity entity
   Update global TVL
   ```

## Analytics Enabled by Event Consumption

1. **Real-time Analytics**

   - Token holder distribution
   - Staking participation rates
   - TVL tracking
   - User engagement metrics

2. **Historical Analysis**

   - Token velocity trends
   - Staking behavior patterns
   - Reward distribution efficiency
   - Protocol growth metrics

3. **Cross-Contract Analytics**
   - Correlation between token movements and staking
   - Impact of reward rates on token velocity
   - User behavior across different protocol actions
