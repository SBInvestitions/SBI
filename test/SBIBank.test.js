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

    describe('Initial parameters and ownership', async function () {

      beforeEach(async function () {
        /* contrancts */
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

    describe('Crowdsale is opened', async function () {
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
        await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank, web3.toWei(1.0, 'ether'));
        const bankBalance = await web3.eth.getBalance(bank.address);
        await bank.addVoting(web3.toWei(1.0, 'ether'));
        const currentVotingAmount = await bank.currentVotingAmount();
        const currentVotingDate = await bank.currentVotingDate();

        console.log('bankBalance = ', bankBalance.toNumber());
        console.log('currentVotingAmount = ', currentVotingAmount);
        console.log('currentVotingDate = ', currentVotingDate);

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
        console.log('allowedWithdraw = ', allowedWithdraw.toNumber());
        console.log('allowedRefund = ', allowedRefund.toNumber());
        assert.equal(allowedWithdraw, 0, 'allowedWithdraw should be 0');
        assert.equal(allowedRefund, 0, 'allowedRefund should be 0');
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

        describe('Tokens purchase', async() => {

          it('Cannot buy 0 tokens', async() => {
            await testLib.checkBuy0Tokens(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address);
          });

          it('Buy part of tokens', async() => {
            await testLib.checkBuyPartOfTokens(crowdsale,
              token,
              crowdsaleParams.pools[6].address,
              crowdsaleParams.pools[0].address,
              saleGoalInWei,
              crowdsaleParams.tokensPerEthGeneral);
          });

          it('Buy all tokens', async() => {
            await testLib.checkBuyAllTokens(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, crowdsaleParams.tokensPerEthGeneral);
          });

          it('Buy tokens and receive change', async() => {
            await testLib.checkBuyTokensWithChange(crowdsale, token, crowdsaleParams.pools[6].address, crowdsaleParams.pools[0].address, saleGoalInWei, crowdsaleParams.tokensPerEthGeneral);
          });
        });

        it('10. Can not kill contract after generalSaleEndDate if there are funds on generalSale wallet.', async () => {
          await testLib.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
          await testLib.killCrowdsaleNegative(crowdsale);
        });

        it("11. ICO goal reached: can not kill contract, can withdrawal money, then can kill contract", async() => {
          await testLib.buyAllTokens(accounts[2], crowdsale, saleGoalInWei);
          await testLib.killCrowdsaleNegative(crowdsale);
          await testLib.checkWithdrawalIsAllowed(crowdsale, owner, bank, web3.toWei(475.0, 'ether'));
          await testLib.killCrowdsalePositive(crowdsale);
        });
      });

      describe('> crowdsale end date', async () => {

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

        it("Cannot withdraw money more then collected", async() => {
          await testLib.checkWithdrawalIsDenied(crowdsale, owner, saleGoalInWei);
        });

        it("Only owner can withdraw money", async() => {
          await testLib.checkWithdrawalIsDenied(crowdsale, accounts[1], 1);
        });

        it('Can kill contract with no tokens on generalSaleWallet', async() => {
          await testLib.killCrowdsalePositive(crowdsale);
        });

        it('Only owner can kill contract', async() => {
          await testLib.killCrowdsaleNegative(crowdsale, accounts[2]);
        });
      });*/
  });
});