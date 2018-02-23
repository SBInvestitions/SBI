const BigNumber = web3.BigNumber;
const TokenTestHelper = require('./../testhelpers/tokenTestHelper');
const tokenTestHelper = new TokenTestHelper();

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

//  Defining crowdsale parameters-------------------------------------------------
//  This is actual parameters of crowdsale.
//  Edge cases should be tested on values set separately
//  ------------------------------------------------------------------------------

contract('SBITokenCrowdsale', function (accounts) {
  const SBITokenCrowdsale = artifacts.require('./../contracts/SBITokenCrowdsale.sol');
  const SBIToken = artifacts.require('./../contracts/SBIToken.sol');

  const crowdsaleParams = {
    //  prices
    tokensPerEthGeneral: 10000,
    //  dates
    generalSaleStartDate: new Date('2018-03-27T00:00+00:00').getTime() / 1000, // March 27, 2018
    generalSaleEndDate: new Date('2018-05-08T00:00+00:00').getTime() / 1000, // May 8, 2018.
    //  misc
    weiInEth: 1e18,
    //  pools
    pools: [
      {
        name: 'generalSale',
        address: accounts[1],
        allocationAmount: 228 * 100 * 1000,
      },
      {
        name: 'bounty',
        address: accounts[2],
        allocationAmount: 2 * 1000 * 1000,
      },
      {
        name: 'partners',
        address: accounts[3],
        allocationAmount: 32* 100 * 1000,
      },
      {
        name: 'team',
        address: accounts[4],
        allocationAmount: 12 * 1000 * 1000,
      },
      {
        name: 'featureDevelopment',
        address: accounts[5],
        allocationAmount: 0,
      },
      {
        name: 'wallet1',
        address: accounts[6],
        allocationAmount: 0,
      },
      {
        name: 'wallet2',
        address: accounts[7],
        allocationAmount: 0,
      },
      {
        name: 'wallet3',
        address: accounts[8],
        allocationAmount: 0,
      },
      {
        name: 'wallet4',
        address: accounts[9],
        allocationAmount: 0,
      },
      {
        name: 'wallet5',
        address: accounts[10],
        allocationAmount: 0,
      },
      {
        name: 'wallet6',
        address: accounts[11],
        allocationAmount: 0,
      },
      {
        name: 'wallet7',
        address: accounts[12],
        allocationAmount: 0,
      },
      {
        name: 'playersReserv',
        address: accounts[13],
        allocationAmount: 0,
      },
    ]
  };

  let crowdsale;
  let owner;
  let token;

  let crowdsaleForWithdrawal;
  let tokenForWithdrawal;

  /* sale dates */
  let generalSaleEndDate;
  let generalSaleStartDate;

  const crowdSaleInitialParams = (token) => {
    return Object.values({
      tokenAddress: token.address
    });
  };

  // ICO goal in wei ((tokensGoal / tokensPerEth) * weiInEth)
  const saleGoalInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount).dividedBy(crowdsaleParams.tokensPerEthGeneral).times(crowdsaleParams.weiInEth);
  // ICO goal in token's wei
  const generalSaleAmountInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount).times(crowdsaleParams.weiInEth);

  describe('Actual values tests', async () => {

    before(async() => {
      // To check correct withdrawal we need to have crawsdale contract instance across different tests
      tokenForWithdrawal = await SBIToken.new({gas: 7000000});
      crowdsaleForWithdrawal = await SBITokenCrowdsale.new(...crowdSaleInitialParams(tokenForWithdrawal));
    })

    // TestRPC should have current time before generalSaleStartDate
    describe('Before generalSaleStartDate', async function () {

      beforeEach(async function () {
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token));
        owner = await crowdsale.owner();
        /* sale dates */
        generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
        generalSaleStartDate = (await token.generalSaleStartDate()).toNumber();
      });

      it('0. Can kill contract before ico start date', async function() {
        await tokenTestHelper.killCrowdsalePositive(crowdsale);
      });

      it('ICO not started - cannot close sales', async() => {
        await tokenTestHelper.checkICOClosingDenied(token, crowdsale, owner, accounts[1], generalSaleAmountInWei);
      });
    });

    describe('Initial parameters and ownership', async function () {

      beforeEach(async function () {
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token));
        owner = await crowdsale.owner();
        /* sale dates */
        generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
        generalSaleStartDate = (await token.generalSaleStartDate()).toNumber();
      });

      it('1. Contract default parameters.', async function () {
        await tokenTestHelper.checkCurrentTimeBeforeGeneralSale(generalSaleStartDate);
        await tokenTestHelper.checkTotalCollected(crowdsale, 0);
      });

      it('2 Should have an owner', async function () {
        await tokenTestHelper.hasOwner(owner, accounts[0]);
      });

      it('3 Should be able to transfer ownership', async function () {
        await tokenTestHelper.checkTransferOwnership(crowdsale, owner, accounts[1]);
      });

      it('4 ICO status should be closed for period dates in future', async function () {
        await tokenTestHelper.checkIcoActive(crowdsale, false);
      });

      it('5. Should be able to set initial parameters accordingly to crowdsale conditions', async function () {
        await tokenTestHelper.checkCrowdsaleConditions(token, crowdsale, crowdsaleParams.pools, crowdsaleParams.pools[0].allocationAmount);
      });

      it('6. Setting stage periods', async() => {
        await tokenTestHelper.checkIcoStageDates(crowdsale, null, null, crowdsaleParams.generalSaleStartDate, crowdsaleParams.generalSaleEndDate);
      });

      it('7. Receiving Ether outside of stage periods', async() => {
        await tokenTestHelper.receivingEtherNegative(crowdsale, web3.toWei(1.0, 'ether'));
      });

    });

    describe('Crowdsale is opened', async function () {

      before(async() => {
        await tokenTestHelper.setTestRPCTime(generalSaleStartDate + 3600 * 24);
      })

      beforeEach(async function () {
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token));
        owner = await crowdsale.owner();
        /* sale dates */
        generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
        generalSaleStartDate = (await token.generalSaleStartDate()).toNumber();
        await token.approveCrowdsale(crowdsale.address);
        await tokenForWithdrawal.approveCrowdsale(crowdsaleForWithdrawal.address);
      });

      // Check that contract is not killable after ICO begins, but before it ends
      it('8. Can not kill contract after ICO started.', async function () {
        await tokenTestHelper.checkIcoActive(crowdsale, true);
        await tokenTestHelper.killCrowdsaleNegative(crowdsale);
      });

      it('9. ICO should be open', async () => {
        await tokenTestHelper.checkIcoActive(crowdsale, true);
      });

      describe('Tokens purchase', async() => {

        it('Cannot buy 0 tokens', async() => {
          await tokenTestHelper.checkBuy0Tokens(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address);
        })

        it('Buy part of tokens', async() => {
          await tokenTestHelper.checkBuyPartOfTokens(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, 10000);
        })

        it('Buy all tokens', async() => {
          await tokenTestHelper.checkBuyAllTokens(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, 10000);
        })

        it('Buy tokens and receive change', async() => {
          await tokenTestHelper.checkBuyTokensWithChange(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, 10000);
        })
      })

      it('ICO is open - cannot withdrawal money', async() => {
        await tokenTestHelper.checkBuyPartOfTokens(crowdsaleForWithdrawal, tokenForWithdrawal, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, 10000);
        await tokenTestHelper.checkWithdrawalIsDenied(crowdsaleForWithdrawal, owner, 1);
      })

      it("ICO goal reached: can withdrawal money", async() => {
        await tokenTestHelper.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
        await tokenTestHelper.checkWithdrawalIsAllowed(crowdsale, owner, 1);
      })

      it('ICO is open - cannot close sales', async() => {
        await tokenTestHelper.checkICOClosingDenied(token, crowdsale, owner, accounts[1], generalSaleAmountInWei);
      });

      it("ICO goal reached: can close sale", async() => {
        await tokenTestHelper.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
        await tokenTestHelper.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], new BigNumber(0));
      });

      it("ICO goal reached: can kill contract", async() => {
        await tokenTestHelper.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
        await tokenTestHelper.killCrowdsalePositive(crowdsale);
      });

    });

    describe('> crowdsale end date', async () => {

      before(async() => {
        await tokenTestHelper.setTestRPCTime(generalSaleEndDate + 3600 * 24);
      })

      beforeEach(async function () {
        /* contrancts */
        token = await FHFToken.new({gas: 7000000});
        crowdsale = await FHFTokenCrowdsale.new(...crowdSaleInitialParams(token));
        owner = await crowdsale.owner();
        /* sale dates */
        generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
        generalSaleStartDate = (await token.generalSaleStartDate()).toNumber();
        await token.approveCrowdsale(crowdsale.address);
        await tokenForWithdrawal.approveCrowdsale(crowdsaleForWithdrawal.address);
      });

      it('10. Can not kill contract after generalSaleEndDate if there are tokens on generalSale wallet.', async () => {
        await tokenTestHelper.killCrowdsaleNegative(crowdsale);
      });

      it('12. Shoud close ICO accordingly to conditions.', async () => {
        await tokenTestHelper.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], generalSaleAmountInWei);
      });

      it("Can withdraw money", async() => {
        await tokenTestHelper.checkWithdrawalIsAllowed(crowdsaleForWithdrawal, owner, 1);
      })

      it("Cannot withdraw money more then collected", async() => {
        await tokenTestHelper.checkWithdrawalIsDenied(crowdsaleForWithdrawal, owner, saleGoalInWei);
      })

      it("Only owner can withdraw money", async() => {
        await tokenTestHelper.checkWithdrawalIsDenied(crowdsaleForWithdrawal, accounts[1], 1);
      })

      it('Can kill contract with no tokens on generalSaleWallet', async() => {
        // close sales to transfer tokens
        await tokenTestHelper.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], generalSaleAmountInWei);
        await tokenTestHelper.killCrowdsalePositive(crowdsale);
      })

      it('Only owner can kill contract', async() => {
        // close sales to transfer tokens
        await tokenTestHelper.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], generalSaleAmountInWei);
        await tokenTestHelper.killCrowdsaleNegative(crowdsale, accounts[2]);
      })

      it("Only owner can close sale", async() => {
        await tokenTestHelper.checkICOClosingDenied(token, crowdsale, accounts[2], accounts[1], generalSaleAmountInWei);
      })
    });
  });
});
