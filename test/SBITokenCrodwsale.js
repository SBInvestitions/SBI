const BigNumber = web3.BigNumber;
const TestLib = require('./../lib/testLib');
const testLib = new TestLib();

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
    generalSaleStartDate: new Date('2018-03-05T00:00+00:00').getTime() / 1000, // March 5, 2018
    generalSaleEndDate: new Date('2018-07-05T00:00+00:00').getTime() / 1000, // June 5, 2018.
    //  misc
    weiInEth: 1000000000000000000,
    //  pools
    pools: [
      {
        name: 'generalSale',
        address: accounts[1],
        allocationAmount: 22800000 * 1e18,
        vestingTime: new Date(1539648000)
      },
      {
        name: 'bounty',
        address: accounts[2],
        allocationAmount: 2000000 * 1e18,
        vestingTime: 0
      },
      {
        name: 'partners',
        address: accounts[3],
        allocationAmount: 170 * 1000 * 1000,
        vestingTime: new Date(1586995200)
      },
      {
        name: 'team',
        address: accounts[4],
        allocationAmount: 2.4 * 1000 * 1000,
        vestingTime: 0
      },
      {
        name: 'featureDevelopment',
        address: accounts[5],
        allocationAmount: 176 * 100 * 1000,
        vestingTime: 0
      },
      {
        name: 'wallet1',
        address: accounts[6],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet2',
        address: accounts[7],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet3',
        address: accounts[8],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet4',
        address: accounts[9],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet5',
        address: accounts[10],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet6',
        address: accounts[11],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet7',
        address: accounts[12],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet8',
        address: accounts[13],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet9',
        address: accounts[14],
        allocationAmount: 0,
        vestingTime: 0
      },
      {
        name: 'wallet10',
        address: accounts[15],
        allocationAmount: 0,
        vestingTime: 0
      },
    ]
  };

  let crowdsale;
  let owner;
  let token;

  /* sale dates */
  let generalSaleEndDate;
  let generalSaleStartDate;

  const crowdSaleInitialParams = (token) => {
    return Object.values({
      tokenAddress: token.address
    });
  };

  const generalSaleAmountInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount).times(crowdsaleParams.weiInEth);

  describe('Actual values tests', async () => {

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
        await testLib.killCrowdsalePositive(crowdsale);
      });

      it('ICO not started - cannot close sales', async() => {
        await testLib.checkICOClosingDenied(token, crowdsale, owner, accounts[1], generalSaleAmountInWei);
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
        await testLib.checkCurrentTimeBeforeGeneralSale(generalSaleStartDate);
        await testLib.checkTotalCollected(crowdsale, 0);
      });

      it('2 Should have an owner', async function () {
        await testLib.hasOwner(owner, accounts[0]);
      });

      it('3 Should be able to transfer ownership', async function () {
        await testLib.checkTransferOwnership(crowdsale, owner, accounts[1]);
      });

      it('4 ICO status should be closed for period dates in future', async function () {
        await testLib.checkIcoActive(crowdsale, false);
      });

      it('5. Should be able to set initial parameters accordingly to crowdsale conditions', async function () {
        await testLib.checkCrowdsaleConditions(token, crowdsale, crowdsaleParams.pools, crowdsaleParams.pools[0].allocationAmount);
      });

      it('6. Setting stage periods', async() => {
        await testLib.checkIcoStageDates(crowdsale, null, null, crowdsaleParams.generalSaleStartDate, crowdsaleParams.generalSaleEndDate);
      });

      it('7. Receiving Ether outside of stage periods', async() => {
        await testLib.receivingEtherNegative(crowdsale, web3.toWei(1.0, 'ether'));
      });

    });

    describe('Crowdsale is opened', async function () {

      before(async() => {
        await testLib.setTestRPCTime(generalSaleStartDate + 3600 * 24);
      });

      beforeEach(async function () {
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token));
        owner = await crowdsale.owner();
        /* sale dates */
        generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
        generalSaleStartDate = (await token.generalSaleStartDate()).toNumber();
        await token.approveCrowdsale(crowdsale.address);
      });

      //Проверить, что контракт нельзя убить после начала ICO, но до окончания
      it('8. Can not kill contract after ICO started.', async function () {
        await testLib.checkIcoActive(crowdsale, true);
        await testLib.killCrowdsaleNegative(crowdsale);
      });

      it('9. ICO should be open', async () => {
        await testLib.checkIcoActive(crowdsale, true);
      });

      it('10. Shoud send tokens accordingly to crowdsale conditions.', async function () {
        const gasPrice = 20e9;
        const gasLimit = 100000;
        const tokenRate = 10000;
        await testLib.checkSendingTokens(crowdsale, token, generalSaleStartDate, gasPrice, gasLimit, crowdsaleParams.pools[6].address, tokenRate);
      });

      it('ICO is open - cannot close sales', async() => {
        await testLib.checkICOClosingDenied(token, crowdsale, owner, accounts[1], generalSaleAmountInWei);
      });

      // ICO goal in wei ((tokensGoal / tokensPerEth) * weiInEth)
      const saleGoalInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount)
        .dividedBy(crowdsaleParams.tokensPerEthGeneral)
        .times(crowdsaleParams.weiInEth);

      it("ICO goal reached: can close sale", async() => {
        await testLib.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
        await testLib.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], new BigNumber(0));
      });

      it("ICO goal reached: can kill contract", async() => {
        await testLib.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
        await testLib.killCrowdsalePositive(crowdsale);
      });

    });

    describe('> crowdsale end date', async () => {

      before(async() => {
        await testLib.setTestRPCTime(generalSaleEndDate + 3600 * 24);
      });

      beforeEach(async function () {
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token));
        owner = await crowdsale.owner();
        /* sale dates */
        generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
        generalSaleStartDate = (await token.generalSaleStartDate()).toNumber();
        await token.approveCrowdsale(crowdsale.address);
      });

      it('10. Can not kill contract after generalSaleEndDate if there are tokens on generalSale wallet.', async () => {
        await testLib.killCrowdsaleNegative(crowdsale);
      });

      it('12. Shoud close ICO accordingly to conditions.', async () => {
        await testLib.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], generalSaleAmountInWei);
      });

      it('Can kill contract with no tokens on generalSaleWallet', async() => {
        // close sales to transfer tokens
        await testLib.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], generalSaleAmountInWei);
        await testLib.killCrowdsalePositive(crowdsale);
      });

      it('Only owner can kill contract', async() => {
        // close sales to transfer tokens
        await testLib.checkICOClosingAllowed(token, crowdsale, owner, accounts[1], accounts[16], generalSaleAmountInWei);
        await testLib.killCrowdsaleNegative(crowdsale, accounts[2]);
      });

      it("Only owner can close sale", async() => {
        await testLib.checkICOClosingDenied(token, crowdsale, accounts[2], accounts[1], generalSaleAmountInWei);
      })
    });
  });
});
