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

contract('SBIBank', function (accounts) {
  const SBITokenCrowdsale = artifacts.require('./../contracts/SBITokenCrowdsale.sol');
  const SBIToken = artifacts.require('./../contracts/SBIToken.sol');
  const SBIBank = artifacts.require('./../contracts/SBIBank.sol');

  const crowdsaleParams = {
    //  prices
    tokensPerEthGeneral: 48000,
    //  dates
    generalSaleStartDate: new Date('2018-03-05T00:00+00:00').getTime() / 1000, // March 5, 2018
    generalSaleEndDate: new Date('2018-06-05T00:00+00:00').getTime() / 1000, // June 5, 2018.
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
  const generalSaleStartDate = 1520208000;
  const generalSaleEndDate = 1528156800;

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
  const saleGoalInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount).dividedBy(crowdsaleParams.tokensPerEthGeneral).times(crowdsaleParams.weiInEth);
  console.log('saleGoalInWei = ', saleGoalInWei);
  // ICO goal in token's wei
  const generalSaleAmountInWei = new BigNumber(crowdsaleParams.pools[0].allocationAmount).times(crowdsaleParams.weiInEth);
  const txRevertRegExp = /VM Exception while processing transaction: revert|invalid opcode/;

  describe('Actual values tests', async () => {

    before(async() => {
      // To check correct withdrawal we need to have crawsdale contract instance across different tests
      tokenForWithdrawal = await SBIToken.new({gas: 7000000});
      bankForWithdrawal = await SBIBank.new(...bankInitialParams(tokenForWithdrawal));
      crowdsaleForWithdrawal = await SBITokenCrowdsale.new(...crowdSaleInitialParams(tokenForWithdrawal, bankForWithdrawal));
    });

    /*describe('Initial parameters and ownership', async function () {

      beforeEach(async function () {
        /!* contrancts *!/
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        await token.approveCrowdsale(crowdsale.address);
      });

      it('1. Contract default parameters.', async function () {
        await testLib.checkCurrentTimeBeforeGeneralSale(generalSaleStartDate);
        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        const toRefund = await bank.toRefund();

        const currentVotingDate = await bank.currentVotingDate();
        const currentVotingAmount = await bank.currentVotingAmount();
        const allowedWithdraw = await bank.allowedWithdraw();
        const allowedRefund = await bank.allowedRefund();

        assert.equal(toAllow, 0, 'allow amount should be zero on opening');
        assert.equal(toCancel, 0, 'cancel amount should be zero on opening');
        assert.equal(toRefund, 0, 'refund amount should be zero on opening');

        assert.equal(currentVotingDate, 0, 'currentVotingDate amount should be zero on opening');
        assert.equal(currentVotingAmount, 0, 'currentVotingAmount amount should be zero on opening');
        assert.equal(allowedWithdraw, 0, 'allowedWithdraw amount should be zero on opening');
        assert.equal(allowedRefund, 0, 'allowedRefund amount should be zero on opening');
        await testLib.hasOwner(owner, accounts[0]);
      });

      it('2 Balance is null. Should not be able to addVoting', async function () {
        const bankBalance = await web3.eth.getBalance(bank.address);
        const addVoting = async() => {
          await bank.addVoting(web3.toWei(1.0, 'ether'));
        };
        await testLib.assertThrowsAsync(addVoting, txRevertRegExp);
        assert.equal(bankBalance, 0, 'bankBalance amount should be zero on opening');
      });

      it('3 Balance is null. Should not be able to vote', async function () {
        const bankBalance = await web3.eth.getBalance(bank.address);
        const vote = async() => {
          await bank.vote(1);
        };
        await testLib.assertThrowsAsync(vote, txRevertRegExp);
        assert.equal(bankBalance, 0, 'bankBalance amount should be zero on opening');
      });

      it('4 Balance is null. Should not be able to endVote', async function () {
        const bankBalance = await web3.eth.getBalance(bank.address);
        const endVote = async() => {
          await bank.endVoting();
        };
        await testLib.assertThrowsAsync(endVote, txRevertRegExp);
        assert.equal(bankBalance, 0, 'bankBalance amount should be zero on opening');
      });

      it('5 Balance is null. Should not be able to withdraw', async function () {
        const bankBalance = await web3.eth.getBalance(bank.address);
        const withdraw = async() => {
          await bank.withdraw();
        };
        await testLib.assertThrowsAsync(withdraw, txRevertRegExp);
        assert.equal(bankBalance, 0, 'bankBalance amount should be zero on opening');
      });

      it('6 Balance is null. Should not be able to refund', async function () {
        const bankBalance = await web3.eth.getBalance(bank.address);
        const refund = async() => {
          await bank.refund();
        };
        await testLib.assertThrowsAsync(refund, txRevertRegExp);
        assert.equal(bankBalance, 0, 'bankBalance amount should be zero on opening');
      });
    });

    describe('Cancel withdraw', async function () {
      before(async() => {
        await testLib.setTestRPCTime(generalSaleStartDate + 3600 * 24);
      });

      it('7 Balance is not null. Should be able to add voting', async function () {
        // crowdsaleParams.pools[6].address - buyer of tokens
        await testLib.checkBuyPartOfTokens(
          crowdsale,
          token,
          crowdsaleParams.pools[6].address,
          crowdsaleParams.pools[0].address,
          saleGoalInWei,
          crowdsaleParams.tokensPerEthGeneral);
        await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank, web3.toWei(4.0, 'ether'));
        const bankBalance = await web3.eth.getBalance(bank.address);
        await bank.addVoting(web3.toWei(1.0, 'ether'));
        const currentVotingAmount = await bank.currentVotingAmount();
        const currentVotingDate = await bank.currentVotingDate();

        /!*console.log('bankBalance = ', bankBalance.toNumber());
        console.log('currentVotingAmount = ', currentVotingAmount);
        console.log('currentVotingDate = ', currentVotingDate);*!/

        assert.notEqual(currentVotingDate, null);
        assert.equal(currentVotingAmount, web3.toWei(1.0, 'ether'), 'currentVotingAmount should be 1 eth');
      });

      it('8 Can not add voting twice', async function () {
        const addVoting = async() => {
          await bank.addVoting(web3.toWei(1.0, 'ether'));
        };
        await testLib.assertThrowsAsync(addVoting, txRevertRegExp);
      });

      it('9 Everyone, who has tokens, can vote', async function () {
        const address1 = crowdsaleParams.pools[2].address;
        const address2 = crowdsaleParams.pools[6].address;
        const voterOneTokenBalance = await token.balanceOf(address1);
        const voterTwoTokenBalance = await token.balanceOf(address2);
        // await bank.vote(1);
        await bank.vote(1, {from: address1});
        await bank.vote(2, {from: address2});
        // await bank.vote(2, { from: address2 });
        const vote1 = await bank.voteOf.call(address1);
        const vote2 = await bank.voteOf.call(address2);
        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        assert.equal(vote1.toNumber(), 1, 'vote1 should be 1');
        assert.equal(vote2.toNumber(), 2, 'vote2 should be 2');
        assert.equal(toAllow.toNumber(), voterOneTokenBalance.toNumber(), 'toAllow should be voterOneTokenBalance');
        assert.equal(toCancel.toNumber(), voterTwoTokenBalance.toNumber(), 'toCancel should be voterTwoTokenBalance');
      });
      it('10 Everyone, who has`t tokens, can`t vote', async function () {
        const addVoting1 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[7].address });
        };
        const addVoting2 = async() => {
          await bank.vote(3, { from: crowdsaleParams.pools[8].address });
        };
        await testLib.assertThrowsAsync(addVoting1, txRevertRegExp);
        await testLib.assertThrowsAsync(addVoting2, txRevertRegExp);
      });
      it('11 Everyone, who has tokens, can`t vote twice', async function () {
        const addVoting1 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[2].address });
        };
        const addVoting2 = async() => {
          await bank.vote(3, { from: crowdsaleParams.pools[6].address });
        };
        await testLib.assertThrowsAsync(addVoting1, txRevertRegExp);
        await testLib.assertThrowsAsync(addVoting2, txRevertRegExp);
      });
      it('12 Nobody can stop the voting before 3 days end', async function () {
        const endVoting = async() => {
          await bank.endVoting({ from: crowdsaleParams.pools[2].address });
        };
        const endVotingOwner = async() => {
          await bank.endVoting({ from: owner });
        };
        await testLib.assertThrowsAsync(endVoting, txRevertRegExp);
        await testLib.assertThrowsAsync(endVotingOwner, txRevertRegExp);
      });
      it('12/1', async function () {
        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        const toRefund = await bank.toRefund();
        console.log('toAllow', toAllow.toNumber());
        console.log('toCancel', toCancel.toNumber());
        console.log('toRefund', toRefund.toNumber());
      });

      it('13 Only owner can stop the voting after 3 days period ends', async function () {
        const endVoting = async() => {
          await bank.endVoting({ from: crowdsaleParams.pools[2].address });
        };
        const currentVotingDate = await bank.currentVotingDate();
        await testLib.setTestRPCTime(currentVotingDate + 3600 * 3 + 1);
        await testLib.assertThrowsAsync(endVoting, txRevertRegExp);
        await bank.endVoting({ from: owner });
        const allowedWithdraw = await bank.allowedWithdraw();
        const allowedRefund = await bank.allowedRefund();
        //console.log('allowedWithdraw = ', allowedWithdraw.toNumber());
        //console.log('allowedRefund = ', allowedRefund.toNumber());
        assert.equal(allowedWithdraw, 0, 'allowedWithdraw should be 0');
        assert.equal(allowedRefund, 0, 'allowedRefund should be 0');
      });

      it('13/1 try Refund', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const tokenDiff = web3.toWei(1.0, 'ether');
        const approve = {
          spender: bank.address,
          value: tokenDiff
        };
        // should approve transfer from investor address to bank address
        await token.approve(...Object.values(approve), { from: crowdsaleParams.pools[6].address });
        const tryRefund = async() => {
          await bank.refund({ from: crowdsaleParams.pools[6].address, gasLimit: gasLimit, gasPrice: gasPrice });
        };
        await testLib.assertThrowsAsync(tryRefund, txRevertRegExp);
      });

      it('14 nobody can vote after the voting ends', async function () {
        const addVoting1 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[2].address });
        };
        const addVoting2 = async() => {
          await bank.vote(3, { from: crowdsaleParams.pools[6].address });
        };
        const addVoting3 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[3].address });
        };
        const addVoting4 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[8].address });
        };
        await testLib.assertThrowsAsync(addVoting1, txRevertRegExp);
        await testLib.assertThrowsAsync(addVoting2, txRevertRegExp);
        await testLib.assertThrowsAsync(addVoting3, txRevertRegExp);
        await testLib.assertThrowsAsync(addVoting4, txRevertRegExp);
      });

      it('15 Should be able to add new voting', async function () {
        // crowdsaleParams.pools[6].address - buyer of tokens

        const bankBalance = await web3.eth.getBalance(bank.address);
        //console.log('bankBalance = ', bankBalance.toNumber());

        await bank.addVoting(web3.toWei(3.0, 'ether'));
        const currentVotingAmount = await bank.currentVotingAmount();
        const currentVotingDate = await bank.currentVotingDate();
        const senderBalance = await token.balanceOf(crowdsaleParams.pools[9].address);

        /!*console.log('senderBalance = ', senderBalance.toNumber());
        console.log('currentVotingAmount = ', currentVotingAmount);
        console.log('currentVotingDate = ', currentVotingDate);*!/

        assert.equal(bankBalance.toNumber(), web3.toWei(4.0, 'ether'), 'Bank balance not null');
        assert.equal(currentVotingAmount, web3.toWei(3.0, 'ether'), 'currentVotingAmount should be 3 eth');
      });

      it('16 Should be able to add new vote for everyone', async function () {
        const address1 = crowdsaleParams.pools[1].address;
        const address2 = crowdsaleParams.pools[3].address;
        const voterOneTokenBalance = await token.balanceOf(address1);
        const voterTwoTokenBalance = await token.balanceOf(address2);
        // await bank.vote(1);
        await bank.vote(1, {from: address1});
        await bank.vote(2, {from: address2});
        // await bank.vote(2, { from: address2 });
        const vote1 = await bank.voteOf.call(address1);
        const vote2 = await bank.voteOf.call(address2);
        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        assert.equal(vote1.toNumber(), 1, 'vote1 should be 1');
        assert.equal(vote2.toNumber(), 2, 'vote2 should be 2');
        assert.equal(toAllow.toNumber(), voterOneTokenBalance.toNumber(), 'toAllow should be voterOneTokenBalance');
        assert.equal(toCancel.toNumber(), voterTwoTokenBalance.toNumber(), 'toCancel should be voterTwoTokenBalance');

        // and can`t vote twice
        // console.log('and can`t vote twice');
        const addVoting1 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[1].address });
        };
        const addVoting2 = async() => {
          await bank.vote(1, { from: crowdsaleParams.pools[3].address });
        };
        await testLib.assertThrowsAsync(addVoting1, txRevertRegExp);
        await testLib.assertThrowsAsync(addVoting2, txRevertRegExp);
      });

      it('17 Can`t withdraw if vote not ended', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const bankBalanceBefore = await web3.eth.getBalance(bank.address);
        const ownerBalanceBefore = await web3.eth.getBalance(owner);
        const withdraw = async() => {
          await bank.withdraw({ from: owner, gasLimit: gasLimit, gasPrice: gasPrice });
        };
        await testLib.assertThrowsAsync(withdraw, txRevertRegExp);

        const bankBalanceAfter = await web3.eth.getBalance(bank.address);
        const ownerBalanceAfter = await web3.eth.getBalance(owner);
        const allowedWithdraw = await bank.allowedWithdraw();
        const allowedRefund = await bank.allowedRefund();

        /!*console.log('bankBalanceBefore', bankBalanceBefore.toNumber());
        console.log('ownerBalanceBefore', ownerBalanceBefore.toNumber());
        console.log('bankBalanceAfter', bankBalanceAfter.toNumber());
        console.log('ownerBalanceAfter', ownerBalanceAfter.toNumber());
        console.log('allowedWithdraw', allowedWithdraw.toNumber());
        console.log('allowedRefund', allowedRefund.toNumber());*!/

        assert.equal(bankBalanceBefore.toNumber(), web3.toWei(4.0, 'ether'), 'bankBalanceAfter should be 4 eth');
        assert.equal(allowedWithdraw.toNumber(), 0, 'allowedWithdraw should be 0');
        assert.equal(allowedRefund.toNumber(), 0, 'allowedRefund should be 0');
      });
    });*/

    /*describe('Allow withdraw', async () => {

      before(async() => {
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        await token.approveCrowdsale(crowdsale.address);
        await testLib.setTestRPCTime(generalSaleStartDate + 3600 * 24);
      });

      it('1 Balance is not null. Should be able to add voting', async function () {
        // crowdsaleParams.pools[6].address - buyer of tokens
        await testLib.checkBuyAllTokens(
          crowdsale,
          token,
          crowdsaleParams.pools[9].address,
          crowdsaleParams.pools[0].address,
          saleGoalInWei,
          crowdsaleParams.tokensPerEthGeneral);
        await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank, web3.toWei(475.0, 'ether'));
        const bankBalance = await web3.eth.getBalance(bank.address);
        await bank.addVoting(web3.toWei(475.0, 'ether'));
        const currentVotingAmount = await bank.currentVotingAmount();
        const currentVotingDate = await bank.currentVotingDate();
        const senderBalance = await token.balanceOf(crowdsaleParams.pools[9].address);
        console.log('senderBalance = ', senderBalance.toNumber());
        console.log('bankBalance = ', bankBalance.toNumber());
        console.log('currentVotingAmount = ', currentVotingAmount);
        console.log('currentVotingDate = ', currentVotingDate);

        assert.notEqual(currentVotingDate, null);
        assert.equal(currentVotingAmount, web3.toWei(475.0, 'ether'), 'currentVotingAmount should be 475 eth');
      });

      it('2 Vote', async function () {
        const address1 = crowdsaleParams.pools[3].address;
        const address2 = crowdsaleParams.pools[9].address;
        const voterOneTokenBalance = await token.balanceOf(address1);
        const voterTwoTokenBalance = await token.balanceOf(address2);
        console.log('voterOneTokenBalance', voterOneTokenBalance.toNumber());
        console.log('voterTwoTokenBalance', voterTwoTokenBalance.toNumber());
        await bank.vote(3, {from: address1});
        await bank.vote(1, {from: address2});
        // await bank.vote(2, { from: address2 });
        const vote1 = await bank.voteOf.call(address1);
        const vote2 = await bank.voteOf.call(address2);
        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        const toRefund = await bank.toRefund();

        console.log('toAllow', toAllow.toNumber());
        console.log('toCancel', toCancel.toNumber());
        console.log('toRefund', toRefund.toNumber());

        assert.equal(vote1.toNumber(), 3, 'vote1 should be 3');
        assert.equal(vote2.toNumber(), 1, 'vote2 should be 1');
        assert.equal(toRefund.toNumber(), voterOneTokenBalance.toNumber(), 'toAllow should be voterOneTokenBalance');
        assert.equal(toCancel.toNumber(), 0, 'toAllow should be voterOneTokenBalance');
        assert.equal(toAllow.toNumber(), voterTwoTokenBalance.toNumber(), 'toCancel should be voterTwoTokenBalance');
      });

      it('3 Stop the voting', async function () {
        const endVoting = async() => {
          await bank.endVoting({ from: owner });
        };
        await testLib.assertThrowsAsync(endVoting, txRevertRegExp);
        const currentVotingDate = await bank.currentVotingDate();
        await testLib.setTestRPCTime(currentVotingDate + 3600 * 3 + 1);
        await bank.endVoting({ from: owner });
        const allowedWithdraw = await bank.allowedWithdraw();
        const allowedRefund = await bank.allowedRefund();
        console.log('allowedWithdraw = ', allowedWithdraw.toNumber());
        console.log('allowedRefund = ', allowedRefund.toNumber());
        assert.equal(allowedWithdraw, web3.toWei(475.0, 'ether'), 'allowedWithdraw should be 0');
        assert.equal(allowedRefund, 0, 'allowedRefund should be 0');
      });

      it('4 Can`t vote after stop the voting', async function () {
        const address1 = crowdsaleParams.pools[3].address;
        const address2 = crowdsaleParams.pools[9].address;
        const voterOneTokenBalance = await token.balanceOf(address1);
        const voterTwoTokenBalance = await token.balanceOf(address2);

        /!*console.log('voterOneTokenBalance', voterOneTokenBalance.toNumber());
        console.log('voterTwoTokenBalance', voterTwoTokenBalance.toNumber());*!/

        const tryVote1 = async() => {
          await bank.vote(3, {from: address1});
        };
        const tryVote2 = async() => {
          await bank.vote(1, {from: address2});
        };

        await testLib.assertThrowsAsync(tryVote1, txRevertRegExp);
        await testLib.assertThrowsAsync(tryVote2, txRevertRegExp);

        const vote1 = await bank.voteOf.call(address1);
        const vote2 = await bank.voteOf.call(address2);

        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        const toRefund = await bank.toRefund();

        /!*console.log('toAllow', toAllow.toNumber());
        console.log('toCancel', toCancel.toNumber());
        console.log('toRefund', toRefund.toNumber());

        console.log('vote1.toNumber()', vote1.toNumber());
        console.log('vote2.toNumber()', vote2.toNumber());*!/

        assert.equal(vote1.toNumber(), 3, 'vote1 should be 3');
        assert.equal(vote2.toNumber(), 1, 'vote2 should be 1');
        assert.equal(toRefund.toNumber(),0, 'toAllow should be voterOneTokenBalance');
        assert.equal(toCancel.toNumber(), 0, 'toAllow should be voterOneTokenBalance');
        assert.equal(toAllow.toNumber(), 0, 'toCancel should be voterTwoTokenBalance');
      });

      it('4/1 try Refund', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const tokenDiff = web3.toWei(1.0, 'ether');
        const approve = {
          spender: bank.address,
          value: tokenDiff
        };
        // should approve transfer from investor address to bank address
        await token.approve(...Object.values(approve), { from: crowdsaleParams.pools[9].address });
        const tryRefund = async() => {
          await bank.refund({ from: crowdsaleParams.pools[9].address, gasLimit: gasLimit, gasPrice: gasPrice });
        };
        await testLib.assertThrowsAsync(tryRefund, txRevertRegExp);
      });

      it('5 Withdraw', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const bankBalanceBefore = await web3.eth.getBalance(bank.address);
        const ownerBalanceBefore = await web3.eth.getBalance(owner);
        await bank.withdraw({ from: owner, gasLimit: gasLimit, gasPrice: gasPrice });
        const bankBalanceAfter = await web3.eth.getBalance(bank.address);
        const ownerBalanceAfter = await web3.eth.getBalance(owner);

        console.log('bankBalanceBefore', bankBalanceBefore.toNumber());
        console.log('ownerBalanceBefore', ownerBalanceBefore.toNumber());
        console.log('bankBalanceAfter', bankBalanceAfter.toNumber());
        console.log('ownerBalanceAfter', ownerBalanceAfter.toNumber());

        assert.equal(bankBalanceBefore.toNumber(), bankBalanceAfter.toNumber() + web3.toWei(475.0, 'ether'), 'bankBalanceAfter should be bankBalanceBefore + 475 eth');
        assert.equal(ownerBalanceAfter.minus(ownerBalanceBefore).plus(testLib.getLatestBlockCost(gasPrice)).toNumber(), web3.toWei(475.0, 'ether'),'ownerBalanceAfter should be ownerBalanceBefore + 475 eth');
      });
    });*/

    describe('Allow refund', async () => {

      before(async() => {
        token = await SBIToken.new({gas: 7000000});
        bank = await SBIBank.new(...bankInitialParams(token));
        crowdsale = await SBITokenCrowdsale.new(...crowdSaleInitialParams(token, bank));
        owner = await crowdsale.owner();
        await token.approveCrowdsale(crowdsale.address);
        await testLib.setTestRPCTime(generalSaleStartDate + 3600 * 24);
      });

      it('1 Buy twice and add voting.', async function () {
        const amountToBuyInWei = new BigNumber(saleGoalInWei).dividedBy(2);
        const amountToBuyInTokens = new BigNumber(amountToBuyInWei).times(crowdsaleParams.tokensPerEthGeneral);
        await testLib.checkBuyTokens(crowdsale, token, crowdsaleParams.pools[10].address, crowdsaleParams.pools[0].address, amountToBuyInWei, amountToBuyInWei, amountToBuyInTokens, false);
        await testLib.checkBuyTokens(crowdsale, token, crowdsaleParams.pools[11].address, crowdsaleParams.pools[0].address, amountToBuyInWei, amountToBuyInWei, amountToBuyInTokens, true);
        await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank, web3.toWei(200.0, 'ether'));
        const bankBalanceBeforeVoting = await web3.eth.getBalance(bank.address);
        console.log('bankBalanceBeforeVoting = ', bankBalanceBeforeVoting.toNumber());
        await bank.addVoting(web3.toWei(200.0, 'ether'));
        const currentVotingAmount = await bank.currentVotingAmount();
        const currentVotingDate = await bank.currentVotingDate();
        assert.notEqual(currentVotingDate, null);
        assert.equal(currentVotingAmount, web3.toWei(200.0, 'ether'), 'currentVotingAmount should be 475 eth');
      });

      it('2 Vote', async function () {
        const address1 = crowdsaleParams.pools[10].address;
        const address2 = crowdsaleParams.pools[11].address;
        const address3 = crowdsaleParams.pools[1].address;
        const address4 = crowdsaleParams.pools[2].address;
        const address5 = crowdsaleParams.pools[3].address;
        const voterOneTokenBalance = await token.balanceOf(address1);
        const voterTwoTokenBalance = await token.balanceOf(address2);
        const voterThreeTokenBalance = await token.balanceOf(address3);
        const voterFourTokenBalance = await token.balanceOf(address4);
        const voterFiveTokenBalance = await token.balanceOf(address5);
        console.log('voterOneTokenBalance', voterOneTokenBalance.toNumber());
        console.log('voterTwoTokenBalance', voterTwoTokenBalance.toNumber());
        console.log('voterThreeTokenBalance', voterThreeTokenBalance.toNumber());
        console.log('voterFourTokenBalance', voterFourTokenBalance.toNumber());
        console.log('voterFiveTokenBalance', voterFiveTokenBalance.toNumber());

        await bank.vote(3, {from: address1});
        await bank.vote(3, {from: address2});
        await bank.vote(1, {from: address3});
        await bank.vote(1, {from: address4});
        await bank.vote(1, {from: address5});

        // await bank.vote(2, { from: address2 });
        const vote1 = await bank.voteOf.call(address1);
        const vote2 = await bank.voteOf.call(address2);
        const vote3 = await bank.voteOf.call(address3);
        const vote4 = await bank.voteOf.call(address4);
        const vote5 = await bank.voteOf.call(address5);
        const toAllow = await bank.toAllow();
        const toCancel = await bank.toCancel();
        const toRefund = await bank.toRefund();

        console.log('toAllow', toAllow.toNumber());
        console.log('toCancel', toCancel.toNumber());
        console.log('toRefund', toRefund.toNumber());

        assert.equal(vote1.toNumber(), 3, 'vote1 should be 3');
        assert.equal(vote2.toNumber(), 3, 'vote2 should be 3');
        assert.equal(vote3.toNumber(), 1, 'vote3 should be 1');
        assert.equal(vote4.toNumber(), 1, 'vote4 should be 1');
        assert.equal(vote5.toNumber(), 1, 'vote5 should be 1');
        assert.equal(toRefund.toNumber(), 22800000 * (10 ** 18), 'toRefund should be voterOneTokenBalance');
        assert.equal(toCancel.toNumber(), 0, 'toCancel should be voterOneTokenBalance');
        assert.equal(toAllow.toNumber(), 17200000 * (10 ** 18), 'toCancel should be voterTwoTokenBalance');
      });

      it('3 try Refund before stop the voting', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const tokenDiff = web3.toWei(3249000.0, 'ether');
        const approve = {
          spender: bank.address,
          value: tokenDiff
        };
        // should approve transfer from investor address to bank address
        await token.approve(...Object.values(approve), { from: crowdsaleParams.pools[10].address });
        const tryRefund = async() => {
          await bank.refund({ from: crowdsaleParams.pools[10].address, gasLimit: gasLimit, gasPrice: gasPrice });
        };
        await testLib.assertThrowsAsync(tryRefund, txRevertRegExp);
      });

      it('4 Stop the voting', async function () {
        const endVoting = async() => {
          await bank.endVoting({ from: owner });
        };
        await testLib.assertThrowsAsync(endVoting, txRevertRegExp);
        const currentVotingDate = await bank.currentVotingDate();
        await testLib.setTestRPCTime(currentVotingDate + 3600 * 3 + 1);
        await bank.endVoting({ from: owner });
        const allowedWithdraw = await bank.allowedWithdraw();
        const allowedRefund = await bank.allowedRefund();

        /*console.log('allowedWithdraw = ', allowedWithdraw.toNumber());
        console.log('allowedRefund = ', allowedRefund.toNumber());*/

        assert.equal(allowedRefund, web3.toWei(200.0, 'ether'), 'allowedRefund should be 0');
        assert.equal(allowedWithdraw, 0, 'allowedWithdraw should be 0');
      });

      it('5 Can`t vote after stop the voting', async function () {
        const address1 = crowdsaleParams.pools[3].address;
        const address2 = crowdsaleParams.pools[9].address;
        const tryVote1 = async() => {
          await bank.vote(3, {from: address1});
        };
        const tryVote2 = async() => {
          await bank.vote(1, {from: address2});
        };
        await testLib.assertThrowsAsync(tryVote1, txRevertRegExp);
        await testLib.assertThrowsAsync(tryVote2, txRevertRegExp);
      });

      it('6 Refund', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const watcher = bank.Refund();
        const bankBalanceBefore = await web3.eth.getBalance(bank.address);
        const investorsTokenBalanceBefore = await token.balanceOf(crowdsaleParams.pools[10].address);
        console.log('investorsTokenBalanceBefore = ', investorsTokenBalanceBefore.toNumber());
        const approve = {
          spender: bank.address,
          value: investorsTokenBalanceBefore
        };
        // should approve transfer from investor address to bank address
        await token.approve(...Object.values(approve), { from: crowdsaleParams.pools[10].address });
        const featureDevelopmentBalanceBefore = await token.balanceOf(crowdsaleParams.pools[4].address);
        await bank.refund({ from: crowdsaleParams.pools[10].address, gasLimit: gasLimit, gasPrice: gasPrice });
        const output = watcher.get();
        const eventArguments = output[0].args;
        const arg1Name = Object.keys(eventArguments)[1];
        const arg1Value = eventArguments[arg1Name];
        const bankBalanceAfter = await web3.eth.getBalance(bank.address);
        const investorsTokenBalanceAfter = await token.balanceOf(crowdsaleParams.pools[10].address);
        const featureDevelopmentBalanceAfter = await token.balanceOf(crowdsaleParams.pools[4].address);
        assert.equal(investorsTokenBalanceAfter.toNumber(), 0, 'investor token balance wrong');
        assert.equal(featureDevelopmentBalanceBefore.toNumber(), featureDevelopmentBalanceAfter.minus(investorsTokenBalanceBefore).toNumber(), 'feature address balance wrong');
        assert.equal(arg1Value.toNumber(), web3.toWei(57.0, 'ether'), 'eth to refund should be 57');
        assert.equal(bankBalanceBefore.toNumber(), bankBalanceAfter.plus(web3.toWei(57.0, 'ether')).toNumber(), 'bankBalanceAfter should be bankBalanceBefore + 57 eth');
      });

      it('6/1 Refund the second acc', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const watcher = bank.Refund();
        const bankBalanceBefore = await web3.eth.getBalance(bank.address);
        const investorsTokenBalanceBefore = await token.balanceOf(crowdsaleParams.pools[2].address);
        const approve = {
          spender: bank.address,
          value: investorsTokenBalanceBefore
        };
        // should approve transfer from investor address to bank address
        await token.approve(...Object.values(approve), { from: crowdsaleParams.pools[2].address });
        const featureDevelopmentBalanceBefore = await token.balanceOf(crowdsaleParams.pools[4].address);
        await bank.refund({ from: crowdsaleParams.pools[2].address, gasLimit: gasLimit, gasPrice: gasPrice });
        const output = watcher.get();
        const eventArguments = output[0].args;
        const arg1Name = Object.keys(eventArguments)[1];
        const arg1Value = eventArguments[arg1Name];
        const bankBalanceAfter = await web3.eth.getBalance(bank.address);
        const investorsTokenBalanceAfter = await token.balanceOf(crowdsaleParams.pools[2].address);
        const featureDevelopmentBalanceAfter = await token.balanceOf(crowdsaleParams.pools[4].address);
        const expectedAmount = bankBalanceBefore.mul(investorsTokenBalanceBefore.div(new BigNumber(40000000*(10**18))));
        // console.log('investorsTokenBalanceBefore = ', investorsTokenBalanceBefore.toNumber(), 'bankBalanceBefore', bankBalanceBefore.toNumber(), 'expectedAmount = ', expectedAmount.toNumber());

        assert.equal(investorsTokenBalanceAfter.toNumber(), 0, 'investor token balance wrong');
        assert.equal(featureDevelopmentBalanceBefore.toNumber(), featureDevelopmentBalanceAfter.minus(investorsTokenBalanceBefore).toNumber(), 'feature address balance wrong');
        assert.equal(arg1Value.toNumber(), expectedAmount, 'eth to refund should be 57');
        assert.equal(bankBalanceBefore.toNumber(), bankBalanceAfter.plus(expectedAmount).toNumber(), 'bankBalanceAfter should be bankBalanceBefore + 57 eth');
      });

      it('7 try Refund again', async function () {
        const gasPrice = 100000;
        const gasLimit = 20e9;
        const tokenDiff = web3.toWei(3249000.0, 'ether');
        const approve = {
          spender: bank.address,
          value: tokenDiff
        };
        // should approve transfer from investor address to bank address
        await token.approve(...Object.values(approve), { from: crowdsaleParams.pools[10].address });
        const tryRefund = async() => {
          await bank.refund({ from: crowdsaleParams.pools[10].address, gasLimit: gasLimit, gasPrice: gasPrice });
        };
        await testLib.assertThrowsAsync(tryRefund, txRevertRegExp);
      });

      it('8 Add voting again', async function() {
        const bankBalance = await web3.eth.getBalance(bank.address);
        console.log('bankBalance = ', bankBalance.toNumber());
        await bank.addVoting(web3.toWei(100.0, 'ether'));
        const currentVotingAmount = await bank.currentVotingAmount();
        const currentVotingDate = await bank.currentVotingDate();
        assert.notEqual(currentVotingDate, null);
        assert.equal(currentVotingAmount, web3.toWei(100.0, 'ether'), 'currentVotingAmount should be 475 eth');
      });
    });
  });
});