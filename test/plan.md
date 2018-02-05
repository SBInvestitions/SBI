## DBNToken project test plan

### Test targets

The test targets will be both token and crowdsale contracts.

### Testing methodology

For testing purposes we shall use testrpc development environment. Configuration script for testrpc could be found at ./testrpc.sh.
Testing shall be performed on local test network.
Truffle framework shall be the main tool.

### Acceptance criteria

All tests should be completed with expected outcomes in order to fulfill acceptance criteria.

### Assumptions

### Test cases

#### Crowdsale contract

#### 1. Contract default parameters.

###### Precondition

* Following actions performed by contract owner.
* Contract deployed and general parameters initialization called.

###### Expected outcome

* Pool addresses are set.
* Total collected amount set to zero.
* Goal set.
* Threshold set.
* Vesting period for Seed Incentive Reserve set.
* Vesting period for Lottery set.
* Vesting period for Founding team Reserve set.


#### 2. Mint tokens.

###### Precondition

* Following actions performed by contract owner.
* Contract deployed and general parameters initialization called. Mint function called.

###### Expected outcome

* Presale tokens minted and transferred to presale wallet address. The amount of tokens transferred matches Crowdsale terms.
* General sale tokens minted and transferred to general sale wallet address. The amount of tokens transferred matches Crowdsale terms.
* Founders team tokens minted and transferred to founders team wallet address. The amount of tokens transferred matches Crowdsale terms.
* Reserve tokens minted and transferred to reserve wallet address. The amount of tokens transferred matches Crowdsale terms.
* Strategic partners tokens minted and transferred to strategic partners wallet address. The amount of tokens transferred matches Crowdsale terms.
* Bounty and promotions tokens minted and transferred to bounty and promotions wallet address. The amount of tokens transferred matches Crowdsale terms.
* Lottery tokens minted and transferred to lottery wallet address. The amount of tokens transferred matches Crowdsale terms.

#### 3. Setting stage periods.

###### Precondition
* Following actions performed by contract owner.

* Contract deployed and general parameters initialization called. Mint function called.

###### Condition

* Calling a function to set block numbers of stages (presale and general sale).

#### 4. Receiving Ether outside of stage periods.

###### Precondition

* Following actions performed by contract owner.
* Contract deployed and general parameters initialization called. Mint function called.

###### Condition

* Current block number (or date if periods set by exact dates) doesn't fall in any of periods.
* Receiving a payment with positive amount of Ether attached.

###### Expected outcome

* Transaction failed.

#### 5. Token allocation for Ether transfers.

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.
* Call executed by buyer.
* One of stages is active at the time of transaction mining.

###### Condition

* Supplied amount of Ether is sufficient to buy at least 1 TKLN token.
* Stage's wallet contains enough TKLN tokens to pay back.
* Token price matches stage price

###### Expected outcome

* TKLN tokens transferred to buyer's wallet.
* Calculation of amount of transferred TKLN tokens considers stage price.
* Amount of transferred TKLN is truncated to integer

#### 6. Bonus calculation for pre-sale.

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.
* Call executed by buyer.
* Pre-sale is active at the time of transaction mining.

###### Condition

* Supplied amount of Ether is sufficient to buy at least 1 TKLN token.
* Pre-sale wallet contains enough TKLN tokens to pay back.

###### Expected outcome

* Amount of TKLN tokens per ETH is 30000 plus bonus
* ETH amount less than 3 does not receive bonus
* ETH amount greater or equal to 3, but less than 7 receives 1% bonus
* ETH amount greater or equal to 7, but less than 15 receives 2% bonus
* ETH amount greater or equal to 15, but less than 30 receives 3% bonus
* ETH amount greater or equal to 30, but less than 75 receives 4% bonus
* ETH amount greater or equal to 75, but less than 150 receives 5% bonus
* ETH amount greater or equal to 150, but less than 250 receives 6% bonus
* ETH amount greater or equal to 250, but less than 500 receives 7% bonus
* ETH amount greater or equal to 500, but less than 750 receives 8% bonus
* ETH amount greater or equal to 750, but less than 1000 receives 9% bonus
* ETH amount greater or equal to 1000 receives 10% bonus

#### 7. Bonus calculation for general sale.

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.
* Call executed by buyer.
* Main sale is active at the time of transaction mining.

###### Condition

* Supplied amount of Ether is sufficient to buy at least 1 TKLN token.
* Main sale wallet contains enough TKLN tokens to pay back.

###### Expected outcome

* Amount of TKLN tokens per ETH is 15000 plus bonus
* Bonus percentage is same as in test 6

#### 8. Wallet balance checks

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.
* No funding yet

###### Condition

###### Expected outcome

* Stage wallet balances match initial values

#### 9. Reaching stage goal (All pre-sale tokens are sold).

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.
* Pre-sale is active
* Balane of pre-sale wallet is zero (tokens are sold out)

###### Condition

* Purchase received for a non-zerro TKLN amount

###### Expected outcome

* Buyer receives zero TKLN and all ETH is returned to buyer

#### 10. Correctness of investment records

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.

###### Condition

* Several purchases received for a non-zerro TKLN amount from multiple addresses
* Some addresses send multiple purchases

###### Expected outcome

* Ivestment records show correct cumulative amounts for each sender address


#### 11. Destruction of crowdsale contract.

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.

###### Condition

* Owner calls method to destruct contract

###### Expected outcome

* Contract address does not exist in blockchain



#### Token contract

#### 1. First account has 0 balance

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.

###### Condition

###### Expected outcome

* First account (wallet) has zero balance

#### 2. Tokens can be destroyed

###### Precondition

* Contract deployed and general parameters initialization called. Mint function called.

###### Condition

* At least one stage wallet contains non-zero balance
* Owner calls method to destruct N tokens

###### Expected outcome

* Resulting wallet balance is less by N tokens
