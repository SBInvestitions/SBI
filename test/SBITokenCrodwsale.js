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
  const SBIBank = artifacts.require('./../contracts/SBIBank.sol');

  const crowdsaleParams = {
    //  prices
    tokensPerEthPre: 27314,
    tokensPerEthGeneral: 10500,
    //  dates
    preSaleStartDate: new Date('2018-06-15T00:00+00:00').getTime() / 1000, // June 15, 2018
    preSaleEndDate: new Date('2018-06-30T23:59+00:00').getTime() / 1000, // June 30, 2018.
    generalSaleStartDate: new Date('2018-07-01T00:00+00:00').getTime() / 1000, // July 1, 2018
    generalSaleEndDate: new Date('2018-08-31T23:59+00:00').getTime() / 1000, // August 31, 2018.
    //  misc
    weiInEth: 1000000000000000000,
    //  pools
    pools: [
      {
        name: 'generalSale',
        address: accounts[1],
        allocationAmount: 22800000,
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
  let bank;

  let crowdsaleForWithdrawal;
  let tokenForWithdrawal;
  let bankForWithdrawal;

  /* sale dates */
  const generalSaleStartDate = 1530403200;
  const generalSaleEndDate = 1535759940;
  const preSaleStartDate = 1529020800;
  const preSaleEndDate = 1530403140;

  const crowdSaleInitialParams = (token, bank) => {
    return Object.values({
      tokenAddress: token.address,
      bankAddress: bank.address,
    });
  };

  const bankInitialParams = (token) => {
    return Object.values({
      tokenAddress: token.address,
    });
  };

  // ICO goal in wei ((tokensGoal / tokensPerEth) * weiInEth)
  const saleGoalInWei =  new BigNumber(2172).times(crowdsaleParams.weiInEth); // new BigNumber(crowdsaleParams.pools[0].allocationAmount).dividedBy(crowdsaleParams.tokensPerEthGeneral).times(crowdsaleParams.weiInEth);
  console.log('saleGoalInWei = ', saleGoalInWei.toNumber());
  // ICO goal in token's wei
  const generalSaleAmountInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount).times(crowdsaleParams.weiInEth);

  describe('Actual values tests', async () => {

    /*before(async() => {
      // To check correct withdrawal we need to have crawsdale contract instance across different tests
      tokenForWithdrawal = await SBIToken.new({gas: 7000000});
      bankForWithdrawal = await SBIBank.new(...bankInitialParams(tokenForWithdrawal));
      crowdsaleForWithdrawal = await SBITokenCrowdsale.new(...crowdSaleInitialParams(tokenForWithdrawal, bankForWithdrawal));
    });*/

    // TestRPC should have current time before generalSaleStartDate
    describe('Before generalSaleStartDate', async function () {

      beforeEach(async function () {
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        bank =  await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
      });

      /*it('0. Can kill contract before ico start date', async function() {
        await testLib.killCrowdsalePositive(crowdsale);
      });*/
    });

    /*describe('Initial parameters and ownership', async function () {

      beforeEach(async function () {
        /!* contrancts *!/
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
      });

      it('1. Contract default parameters.', async function () {
        await testLib.checkCurrentTimeBeforeGeneralSale(preSaleStartDate);
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
        await testLib.checkIcoStageDates(crowdsale, crowdsaleParams.preSaleStartDate, crowdsaleParams.preSaleEndDate, crowdsaleParams.generalSaleStartDate, crowdsaleParams.generalSaleEndDate);
      });

      it('7. Receiving Ether outside of stage periods', async() => {
        await testLib.receivingEtherNegative(crowdsale, web3.toWei(1.0, 'ether'));
      });

    });*/

    /*describe('PreICO is opened', async function () {

      beforeEach(async function () {
        /!* contrancts *!/
        token = await SBIToken.new({ gas: 7000000 });
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        /!* sale dates *!/
        await token.approveCrowdsale(crowdsale.address);
        await tokenForWithdrawal.approveCrowdsale(crowdsaleForWithdrawal.address);
      });

      /!* before(async() => {
        await testLib.setTestRPCTime(preSaleStartDate + 3600 * 24);
      }); *!/

      // Check that contract is not killable after ICO begins, but before it ends
      it('7.1. Can not kill contract after preICO started.', async function () {
        await testLib.checkIcoActive(crowdsale, true);
        await testLib.killCrowdsaleNegative(crowdsale);
      });

      it('7.2. ICO should be open', async () => {
        await testLib.checkIcoActive(crowdsale, true);
      });

      it('7.3 Buy part of tokens', async() => {
        const gasPrice = 1;
        const gasLimit = 4660000;
        console.log('saleGoalInWei', saleGoalInWei);

        const contractBalanceFunsBefore = await web3.eth.getBalance(crowdsale.address);
        console.log('contractBalanceFunsBefore = ', contractBalanceFunsBefore.toNumber());

        const contractBalanceTokensBefore = await token.balanceOf(crowdsaleParams.pools[0].address);
        console.log('contractBalanceTokensBefore = ', contractBalanceTokensBefore.dividedBy(crowdsaleParams.weiInEth).toNumber());

        const senderBalanceTokensBefore = await token.balanceOf(crowdsaleParams.pools[6].address);
        console.log('senderBalanceTokensBefore = ', senderBalanceTokensBefore.toNumber());

        const transaction = await crowdsale.sendTransaction({
          from: crowdsaleParams.pools[6].address,
          to: crowdsale.address,
          value: new BigNumber(0.01).times(crowdsaleParams.weiInEth),
          gasLimit: gasLimit,
          gasPrice: gasPrice
        });
        console.log('TRANSACTION', transaction);

        const contractBalanceFundsAfter = await web3.eth.getBalance(crowdsale.address);
        console.log('contractBalanceFundsAfter = ', contractBalanceFundsAfter.toNumber());

        const contractBalanceTokensAfter = await token.balanceOf(crowdsaleParams.pools[0].address);
        console.log('contractBalanceTokensAfter = ', contractBalanceTokensAfter.dividedBy(crowdsaleParams.weiInEth).toNumber());

        const senderBalanceTokensAfter = await token.balanceOf(crowdsaleParams.pools[6].address);
        console.log('senderBalanceTokensAfter = ', senderBalanceTokensAfter.dividedBy(crowdsaleParams.weiInEth).toNumber());

        const diff = contractBalanceFundsAfter.minus(contractBalanceFunsBefore).toNumber();
        console.log('diff', diff);

        const tokenDiff = contractBalanceTokensBefore.minus(contractBalanceTokensAfter).dividedBy(crowdsaleParams.weiInEth).toNumber();
        console.log('tokenDiff', tokenDiff);

        contractBalanceFundsAfter.should.be.bignumber.equal(diff);
      });

      /!* it('7.4 Buy part of tokens bigger', async() => {
        const gasPrice = 100000;
        const gasLimit = 30e9;
        console.log('saleGoalInWei', saleGoalInWei);

        const contractBalanceFunsBefore = await web3.eth.getBalance(crowdsale.address);
        console.log('contractBalanceFunsBefore = ', contractBalanceFunsBefore.toNumber());

        const senderBalanceFundsBefore = await web3.eth.getBalance(crowdsaleParams.pools[6].address);
        console.log('senderBalanceFundsBefore = ', senderBalanceFundsBefore.toNumber());

        const contractBalanceTokensBefore = await token.balanceOf(crowdsaleParams.pools[0].address);
        console.log('contractBalanceTokensBefore = ', contractBalanceTokensBefore.dividedBy(crowdsaleParams.weiInEth).toNumber());

        const senderBalanceTokensBefore = await token.balanceOf(crowdsaleParams.pools[6].address);
        console.log('senderBalanceTokensBefore = ', senderBalanceTokensBefore.toNumber());

        await crowdsale.sendTransaction({
          from: crowdsaleParams.pools[6].address,
          to: crowdsale.address,
          value: new BigNumber(2000).times(crowdsaleParams.weiInEth),
          gasLimit: gasLimit,
          gasPrice: gasPrice
        });

        const contractBalanceFundsAfter = await web3.eth.getBalance(crowdsale.address);
        console.log('contractBalanceFundsAfter = ', contractBalanceFundsAfter.toNumber());

        const senderBalanceFundsAfter = await web3.eth.getBalance(crowdsaleParams.pools[6].address);
        console.log('senderBalanceFundsAfter = ', senderBalanceFundsAfter.toNumber());

        const contractBalanceTokensAfter = await token.balanceOf(crowdsaleParams.pools[0].address);
        console.log('contractBalanceTokensAfter = ', contractBalanceTokensAfter.dividedBy(crowdsaleParams.weiInEth).toNumber());

        const senderBalanceTokensAfter = await token.balanceOf(crowdsaleParams.pools[6].address);
        console.log('senderBalanceTokensAfter = ', senderBalanceTokensAfter.dividedBy(crowdsaleParams.weiInEth).toNumber());

        const diff = contractBalanceFundsAfter.minus(contractBalanceFunsBefore);
        console.log('diff', diff.toNumber());

        const tokenDiff = contractBalanceTokensBefore.minus(contractBalanceTokensAfter).dividedBy(crowdsaleParams.weiInEth).toNumber();
        console.log('tokenDiff', tokenDiff);

        const senderFundDiff = senderBalanceFundsBefore.minus(senderBalanceFundsAfter).dividedBy(crowdsaleParams.weiInEth).toNumber();
        console.log('senderFundDiff', senderFundDiff);

        contractBalanceFundsAfter.should.be.bignumber.equal(diff);
      });
    }); *!/

    /!* it('7.5 Buy part of tokens more than preICO', async() => {
      const gasPrice = 100000;
      const gasLimit = 30e9;
      console.log('saleGoalInWei', saleGoalInWei);

      const contractBalanceFunsBefore = await web3.eth.getBalance(crowdsale.address);
      console.log('contractBalanceFunsBefore = ', contractBalanceFunsBefore.toNumber());

      const senderBalanceFundsBefore = await web3.eth.getBalance(crowdsaleParams.pools[6].address);
      console.log('senderBalanceFundsBefore = ', senderBalanceFundsBefore.toNumber());

      const contractBalanceTokensBefore = await token.balanceOf(crowdsaleParams.pools[0].address);
      console.log('contractBalanceTokensBefore = ', contractBalanceTokensBefore.dividedBy(crowdsaleParams.weiInEth).toNumber());

      const senderBalanceTokensBefore = await token.balanceOf(crowdsaleParams.pools[6].address);
      console.log('senderBalanceTokensBefore = ', senderBalanceTokensBefore.toNumber());

      await crowdsale.sendTransaction({
        from: crowdsaleParams.pools[6].address,
        to: crowdsale.address,
        value: new BigNumber(214).times(crowdsaleParams.weiInEth),
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });

      const contractBalanceFundsAfter = await web3.eth.getBalance(crowdsale.address);
      console.log('contractBalanceFundsAfter = ', contractBalanceFundsAfter.toNumber());

      const senderBalanceFundsAfter = await web3.eth.getBalance(crowdsaleParams.pools[6].address);
      console.log('senderBalanceFundsAfter = ', senderBalanceFundsAfter.toNumber());

      const contractBalanceTokensAfter = await token.balanceOf(crowdsaleParams.pools[0].address);
      console.log('contractBalanceTokensAfter = ', contractBalanceTokensAfter.dividedBy(crowdsaleParams.weiInEth).toNumber());

      const senderBalanceTokensAfter = await token.balanceOf(crowdsaleParams.pools[6].address);
      console.log('senderBalanceTokensAfter = ', senderBalanceTokensAfter.dividedBy(crowdsaleParams.weiInEth).toNumber());

      const diff = contractBalanceFundsAfter.minus(contractBalanceFunsBefore);
      console.log('contractBalanceFundsDiff', diff.dividedBy(crowdsaleParams.weiInEth).toNumber());

      const tokenDiff = contractBalanceTokensBefore.minus(contractBalanceTokensAfter).dividedBy(crowdsaleParams.weiInEth).toNumber();
      console.log('tokenDiff', tokenDiff);

      const senderFundDiff = senderBalanceFundsBefore.minus(senderBalanceFundsAfter).dividedBy(crowdsaleParams.weiInEth).toNumber();
      console.log('senderFundDiff', senderFundDiff);

      contractBalanceFundsAfter.should.be.bignumber.equal(diff);
    }); *!/
  });*/

    describe('Crowdsale is opened, try to safeWithdraw', async function () {

      before(async() => {
        await testLib.setTestRPCTime(generalSaleStartDate + 3600 * 24);
        /* contrancts */
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        /* sale dates */
        await token.approveCrowdsale(crowdsale.address);
      });

      it('100. Buy part of tokens', async() => {
        /*await testLib.checkBuyPartOfTokens(crowdsale,
          token,
          crowdsaleParams.pools[6].address,
          crowdsaleParams.pools[0].address,
          saleGoalInWei,
          crowdsaleParams.tokensPerEthGeneral);*/

        const gasPrice = 100000;
        const gasLimit = 30e9;
        const sender = crowdsaleParams.pools[6].address;
        const generalSaleWalletAddress = crowdsaleParams.pools[0].address;

        const senderBalanceETHBefore = await web3.eth.getBalance(sender);
        const senderBalanceTokensBefore = await token.balanceOf(sender);
        const contractBalanceETHBefore = await web3.eth.getBalance(crowdsale.address);
        const contractBalanceTokensBefore = await token.balanceOf(generalSaleWalletAddress);
        const amountInWei =  new BigNumber(0.029).times(crowdsaleParams.weiInEth);
        const amountToBuyInTokens = new BigNumber(amountInWei).times(crowdsaleParams.tokensPerEthGeneral);
        // const expectedTokensAmount = 48000 * amountInWei;
        await crowdsale.sendTransaction({ from: sender, to: crowdsale.address, value: amountInWei, gasLimit: gasLimit, gasPrice: gasPrice });

        const senderETHDiff = (senderBalanceETHBefore).minus(await web3.eth.getBalance(sender)).minus(testLib.getLatestBlockCost(gasPrice));
        const senderTokensDiff = (await token.balanceOf(sender)).minus(senderBalanceTokensBefore);
        const contractETHDiff = (await web3.eth.getBalance(crowdsale.address)).minus(contractBalanceETHBefore);
        const contractTokensDiff = (contractBalanceTokensBefore).minus(await token.balanceOf(generalSaleWalletAddress));

        console.log('senderETHDiff = ', senderETHDiff.toNumber());
        console.log('contractETHDiff = ', contractETHDiff.toNumber());
        console.log('senderTokensDiff = ', senderTokensDiff.toNumber());
        console.log('contractTokensDiff = ', contractTokensDiff.toNumber());
        console.log('amountInWei', amountInWei.toNumber());
        console.log('amountToBuyInTokens', amountToBuyInTokens.toNumber());

        senderETHDiff.should.be.bignumber.equal(new BigNumber(amountInWei));
        contractETHDiff.should.be.bignumber.equal(new BigNumber(amountInWei));
        senderTokensDiff.should.be.bignumber.equal(new BigNumber(amountToBuyInTokens));
        contractTokensDiff.should.be.bignumber.equal(new BigNumber(amountToBuyInTokens));
      });

      it('101. Safe withdraw', async() => {
        const gasPrice = 100000;

        const contractBalanceFunsBefore = await web3.eth.getBalance(crowdsale.address);
        console.log('contractBalanceFunsBefore = ', contractBalanceFunsBefore.toNumber());

        const bankBalanceFunsBefore = await web3.eth.getBalance(bank.address);
        console.log('bankBalanceFunsBefore = ', bankBalanceFunsBefore.toNumber());

        await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank);

        const contractBalanceFunsAfter = await web3.eth.getBalance(crowdsale.address);
        console.log('contractBalanceFundsAfter = ', contractBalanceFunsAfter.toNumber());

        const bankBalanceFunsAfter = await web3.eth.getBalance(bank.address);

        console.log('bankBalanceFunsAfter = ', bankBalanceFunsAfter.toNumber());
        contractBalanceFunsAfter.should.be.bignumber.equal(0);
        console.log('bankBalanceFundsBefore = ', contractBalanceFunsAfter.toNumber());

        console.log('testLib.getLatestBlockCost(gasPrice)', testLib.getLatestBlockCost(gasPrice));
        contractBalanceFunsAfter.should.be.bignumber.equal(0);
      })
    });


    /*describe('Crowdsale is opened', async function () {

      before(async() => {
        await testLib.setTestRPCTime(generalSaleStartDate + 3600 * 24);
      });

      beforeEach(async function () {
        /!* contrancts *!/
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        /!* sale dates *!/
        await token.approveCrowdsale(crowdsale.address);
        await tokenForWithdrawal.approveCrowdsale(crowdsaleForWithdrawal.address);
      });

      // Check that contract is not killable after ICO begins, but before it ends
      it('8. Can not kill contract after ICO started.', async function () {
        await testLib.checkIcoActive(crowdsale, true);
        await testLib.killCrowdsaleNegative(crowdsale);
      });

      it('9. ICO should be open', async () => {
        await testLib.checkIcoActive(crowdsale, true);
      });

      it('9.1 Cannot buy 0 tokens', async() => {
        await testLib.checkBuy0Tokens(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address);
      });

      it('9.2 Buy part of tokens', async() => {
        await testLib.checkBuyPartOfTokens(crowdsale,
          token,
          crowdsaleParams.pools[6].address,
          crowdsaleParams.pools[0].address,
          saleGoalInWei,
          crowdsaleParams.tokensPerEthGeneral);
      });

      it('9.3 Buy all tokens', async() => {
        await testLib.checkBuyAllTokens(crowdsale,
          token,
          crowdsaleParams.pools[6].address,
          crowdsaleParams.pools[0].address,
          saleGoalInWei,
          crowdsaleParams.tokensPerEthGeneral);
      });

      it('9.4 Buy tokens and receive change', async() => {
        await testLib.checkBuyTokensWithChange(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, crowdsaleParams.tokensPerEthGeneral);
      });

      it('10. Can not kill contract after generalSaleEndDate if there are funds on generalSale wallet.', async () => {
        await testLib.buyAllTokens(accounts[2], crowdsale, saleGoalInWei, token, crowdsaleParams.pools[0].address);
        await testLib.killCrowdsaleNegative(crowdsale, crowdsaleParams.pools[0].address);
      });

      it("11. ICO goal reached: can not kill contract, can withdrawal money, then can kill contract", async() => {
        await testLib.buyAllTokens(accounts[2], crowdsale, saleGoalInWei, token, crowdsaleParams.pools[0].address);
        await testLib.killCrowdsaleNegative(crowdsale, crowdsaleParams.pools[0].address);
        await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank);
        await testLib.killCrowdsalePositive(crowdsale, token, crowdsaleParams.pools[0].address);
      });
    });*/

    /*describe('> crowdsale end date', async () => {

      before(async() => {
        await testLib.setTestRPCTime(generalSaleEndDate + 3600 * 24);
      });

      beforeEach(async function () {
        /!* contrancts *!/
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        await token.approveCrowdsale(crowdsale.address);
      });

      it("12 Only owner can withdraw money", async() => {
        await testLib.checkWithdrawalIsDenied(crowdsale, accounts[1]);
      });

      it('13 Can kill contract with no tokens on generalSaleWallet', async() => {
        await testLib.killCrowdsalePositive(crowdsale);
      });

      it('14 Only owner can kill contract', async() => {
        await testLib.killCrowdsaleNegative(crowdsale, accounts[2]);
      });
    });*/
  });
});

async function beforeEachFunc(token, bank, crowdsale, owner) {
  token = await SBIToken.new({gas: 7000000});
  bank = await await SBIBank.new(...bankInitialParams(token));
  crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
  owner = await crowdsale.owner();
}