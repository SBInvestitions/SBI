const BigNumber = web3.BigNumber;
const txRevertRegExp = /VM Exception while processing transaction: revert|invalid opcode/;

class testLib {

  constructor() {
  }

  /*
   ERC20 Allowance test
   @token - token contract instance
   @address1 - who allows
   @address2 - allowed
   */
  checkCurrentTimeBeforeGeneralSale(generalSaleDate) {
    var currentTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    assert.isTrue(currentTime < generalSaleDate, 'Restart TestRPC or update ICO date');
  }

  /*
   ERC20 Allowance test
   @token - token contract instance
   @address1 - who allows
   @address2 - allowed
   */
  async checkAccountForZeroTokenBalance(token, address) {
    const initialBalance = await token.balanceOf(address);
    assert.equal(0, initialBalance.valueOf(), 'The owner balance was non-zero');
  }

  /*
   ERC20 Allowance test
   @token - token contract instance
   @address1 - who allows
   @address2 - allowed
   */
  async checkMintedAccounts(token, accounnts, amounts) {
    const balances = [];
    for (let i = 0; i < accounnts.length; i += 1) {
      balances.push((await token.balanceOf(accounnts[i])).valueOf());
    }
    for (let i = 0; i < accounnts.length; i += 1) {
      assert.equal(amounts[i], balances[i], 'Wallet' + accounnts[i] + ' balance is wrong');
    }
  }

  /*
   Checking opportunity to send tokens to token wallets
   @token - token contract instance
   @donor - who is the donor of first funds
   @senders - senders wallets
   @recipients - recipients wallets
   */
  async prepareTrasnfer(token, senders, recipients, amounts) {

    const transfers = [];
    senders.forEach((sender, index) => {
      const newTransfer = {
        to: recipients[index],
        value: amounts[index],
      };
      transfers.push(newTransfer);
    });

    const initialSenderBalances = [];
    const initialRecipientBalances = [];
    const finalSenderBalances = [];
    const finalRecipientBalances = [];

    const senderDiff = [];
    const recipientsDiff = [];

    for (let i = 0; i < senders.length; i += 1) {
      initialSenderBalances.push(new BigNumber(await token.balanceOf(senders[i])));
      initialRecipientBalances.push(new BigNumber(await token.balanceOf(recipients[i])));
      await token.transfer(...Object.values(transfers[i]), {from: senders[i]});
    }

    for (let i = 0; i < senders.length; i += 1) {
      finalSenderBalances.push(new BigNumber(await token.balanceOf(senders[i])));
      finalRecipientBalances.push(new BigNumber(await token.balanceOf(recipients[i])));
      senderDiff.push(initialSenderBalances[i].sub(finalSenderBalances[i]));
      recipientsDiff.push(finalRecipientBalances[i].sub(initialRecipientBalances[i]));
    }

    for (let i = 0; i < senders.length; i += 1) {
      senderDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
      recipientsDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
    }
  }
  /*
   VestingPositiveScenario
   transfer tokens should allows 2 times
   @
   */
  async tokenVestingPositiveScenario(token, vestingDate, vestedAmounts, senders, recipients) {
    await this.prepareTrasnfer(token, senders, recipients, vestedAmounts);
    await this.setTestRPCTime(vestingDate);
    await this.prepareTrasnfer(token, senders, recipients, vestedAmounts);
  }

  /*

   */
  async tokenVestingNegativeScenario(token, vestedAmounts, senders, recipients ) {
    this.prepareTrasnfer(token, senders, recipients, vestedAmounts);
    try {
      this.prepareTrasnfer(token, senders, recipients, vestedAmounts)
    } catch (error) {
      const invalidOptcode = error.message.search('not a number') >= 0;
      const revert = error.message.search('VM Exception while processing transaction: revert') >= 0;
      assert(invalidOptcode || revert, 'Expected throw, got <' + error + '> instead');
    }
  }

  /*
   Increases ether network time while mining new blocks

   @time - new network time
   */
  async increaseTime(time) {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time], // 86400 is num seconds in day
        id: new Date().getTime()
      }, (err, result) => {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      });
    })
  };

  async mineNewBlock() {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0},
        (err, result) => {
          if (err) {
            return reject(err)
          }
          return resolve(result)
        });
    })
  };

  // Only sets future time, can't go back
  async setTestRPCTime(newtime) {
    const currentTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    if (newtime > currentTime + 3600) {
      const timeDiff = newtime - currentTime;
      await this.increaseTime(timeDiff);
      await this.mineNewBlock();
    }
  };

  /**
   *  Assert throw error for async functions
   *
   * @param fn - async function
   * @param regExp - error.message pattern
   * @returns {Promise.<void>}
   */
  async assertThrowsAsync(fn, regExp) {
    let f = () => {};
    try {
      await fn();
    } catch(e) {
      f = () => {throw e};
    } finally {
      assert.throws(f, regExp);
    }
  }

  /****************** for Crowdsale ******************/

  /*
   Close main sale ICO from address and return tx block timestamp
   */
  async closeMainSaleICO(crowdsale, address){
    var tt = await crowdsale.closeMainSaleICO({ from: address });
    return web3.eth.getBlock(tt.receipt.blockNumber).timestamp;
  }

  /*
   Check if ICO cannot be closed
   */
  async checkICOClosingDenied(token, crowdsale, address, generalSaleAddress, saleAmountInWei) {
    const initialICOStatus = await crowdsale.isICOActive();

    var closingCall = async() => {
      await this.closeMainSaleICO(crowdsale, address);
    };
    await this.assertThrowsAsync(closingCall, txRevertRegExp);

    // check if tokens not transferred
    (await token.balanceOf(generalSaleAddress)).should.be.bignumber.equal(saleAmountInWei);
    // check ICO status not changed
    await this.checkIcoActive(crowdsale, initialICOStatus);
  }

  /*
   Check if ICO can be closed
   */
  async checkICOClosingAllowed(token, crowdsale, address, generalSaleAddress, playersReserveAddress, restTokenAmountInWei) {
    var closingCall = async() => {
      return (await this.closeMainSaleICO(crowdsale, address));
    };
    (await closingCall()).should.be.bignumber.equal(await crowdsale.generalSaleEndDate());
    // check tokens were transferred
    (await token.balanceOf(generalSaleAddress)).should.be.bignumber.equal(new BigNumber(0));
    (await token.balanceOf(playersReserveAddress)).should.be.bignumber.equal(restTokenAmountInWei);
    // check ICO status is not active
    await this.checkIcoActive(crowdsale, false);
  }

  /*
   Buy all tokens - the goal will be reached after that
   */
  async buyAllTokens(customerAddress, crowdsale, saleGoalInWei) {
    await crowdsale.sendTransaction({ from: customerAddress, to: crowdsale.address, value: saleGoalInWei, gasLimit: 20e9, gasPrice: 100000 });
  }

  /*
   get latest block size
   * @gasPrice
   */

  getLatestBlockCost(gasPrice) {
    return web3.eth.getBlock('latest').gasUsed * gasPrice;
  }

  /*
   Check totalCollected
   @expectedAmount
   */

  async checkTotalCollected(crowdsale, expectedAmount) {
    const totalCollected = await crowdsale.totalCollected();
    assert.equal(totalCollected, expectedAmount, 'Total collected amount should be zero on opening');
  }

  /*
   Has owner test
   @owner - owner address
   */
  async hasOwner(owner, address) {
    assert.isTrue(owner === address);
  }

  /*
   Transfer ownership test
   @crowdsale - crowdsale address,
   @oldOwner - old owner address of crowdsale contract
   @newOwner - new owner address of crowdsale contract
   */
  async checkTransferOwnership(crowdsale, oldOwner, newOwner) {
    await crowdsale.changeOwner(newOwner);
    let owner = await crowdsale.owner();
    assert.isTrue(oldOwner !== owner);
  }

  /*
   Check ico active test
   @crowdsale - crowdsale address,
   @active - ico status for checking
   */
  async checkIcoActive(crowdsale, active) {
    const status = await crowdsale.isICOActive();
    status.should.be.equal(active);
  }

  /*
   Check crowdsale conditions test
   @token - token address
   @crowdsale - crowdsale address,
   @pools - pools of addresses with conditions
   @goal - ico goal amount
   */
  async checkCrowdsaleConditions(token, crowdsale, pools, goal) {
    const tokenDecimals = await token.decimals();
    for (let i = 0; i < pools.length; i +=1) {
      const addressBalance = (await token.balanceOf(pools[i].address)).toNumber();
      assert.equal(pools[i].allocationAmount * 10 ** tokenDecimals, addressBalance, pools[i].name + ' pool tokens should be allocated accordingly to crowdsale conditions');
    }
    // Check ICO goal
    const crowdsaleGoal = (await crowdsale.saleGoal()).toNumber();
    assert.equal(goal, crowdsaleGoal, 'ICO Goal should match crowdsale conditions');
  }

  /*
   Check crowdsale dates test
   @crowdsale - crowdsale address,
   @preSaleStartDate - pre sale start date
   @preSaleEndDate ***
   @generalSaleStartDate ***
   @generalSaleEndDate ***
   */
  async checkIcoStageDates(crowdsale, preSaleStartDate, preSaleEndDate, generalSaleStartDate, generalSaleEndDate) {
    if (preSaleStartDate && preSaleEndDate) {
      assert.equal(preSaleStartDate, (await crowdsale.preSaleStartDate()).toNumber(), 'Pre-sale start date should be set accordingly to crowdsale conditions');
      assert.equal(preSaleEndDate, (await crowdsale.preSaleEndDate()).toNumber(), 'Pre-sale end date should be set accordingly to crowdsale conditions');
    }
    assert.equal(generalSaleStartDate, (await crowdsale.generalSaleStartDate()).toNumber(), 'General sale start date should be set accordingly to crowdsale conditions');
    assert.equal(generalSaleEndDate, (await crowdsale.generalSaleEndDate()).toNumber(), 'General sale end date should be set accordingly to crowdsale conditions');
  }

  /*
   Check receiving ether from crowdsale address test - negative scenario
   @crowdsale - crowdsale address,
   @amount - amount to sale
   */
  async receivingEtherNegative(crowdsale, amount) {
    // conditions:
    // * Current block number (or date if periods set by exact dates) doesn't fall in any of periods.
    // * Receiving a payment with positive amount of Ether attached.
    try {
      await crowdsale.send(amount);
    } catch (error) {
      // expected - * Transaction failed.
      const invalidOptcode = error.message.search('invalid opcode') >= 0;
      const revert = error.message.search('VM Exception while processing transaction: revert') >= 0;
      assert(invalidOptcode || revert, 'Expected throw, got <' + error + '> instead');
      return;
    }
    assert.fail('Expected throw not received');
  }

  /*
   Check sending eth to crowdsale address from sender
   @crowdsale - crowdsale address,
   @generalSaleStartDate
   @gasPrice
   @gasLimit
   @sender - sender address
   */
  async checkSendingTokens(crowdsale, token, generalSaleStartDate, gasPrice, gasLimit, sender, tokenRate) {
    this.setTestRPCTime(generalSaleStartDate + 3600 * 24);
    const recipient = crowdsale.address;
    const senderBalanceBefore = await web3.eth.getBalance(sender);
    const recipientBalanceBefore = await web3.eth.getBalance(recipient);
    await crowdsale.sendTransaction({ from: sender, to: recipient, value: web3.toWei(2.0, 'ether'), gasLimit: gasLimit, gasPrice: gasPrice });
    const senderBalanceAfter = await web3.eth.getBalance(sender);
    const recipientBalanceAfter = await web3.eth.getBalance(recipient);
    const senderTokenBalance = await token.balanceOf(sender);
    recipientBalanceAfter.should.be.bignumber.equal(recipientBalanceBefore.plus(web3.toWei(2.0, 'ether')), 'recipientBalance');
    senderBalanceBefore.should.be.bignumber.equal(senderBalanceAfter.plus(web3.toWei(2.0, 'ether')).plus(this.getLatestBlockCost(gasPrice)), 'senderBalance');
    // sender should have tokens accordingly crowdsale conditions
    senderTokenBalance.should.be.bignumber.equal(tokenRate * web3.toWei(2.0, 'ether'), 'sender tokens balance');
  }

  async killCrowdsalePositive(crowdsale) {
    // save initial owner and contract balances (ETH)
    const owner = await crowdsale.owner();
    const initialOwnerBalance = await web3.eth.getBalance(owner);
    const contractBalance =  await web3.eth.getBalance(crowdsale.address);

    const gasPrice = 1;
    await this.checkIcoActive(crowdsale, false);
    const tx = await crowdsale.kill({gasLimit: 9000000000000000000000000, gasPrice: gasPrice});
    // owner balance (ETH) must be equal: initial balance + killed contract balance - price for gas
    new BigNumber(initialOwnerBalance).plus(contractBalance).minus(tx.receipt.gasUsed).should.be.bignumber.equal((await web3.eth.getBalance(owner)));
  }

  async killCrowdsaleNegative(crowdsale, address) {
    if(typeof address == 'undefined'){
      address = await crowdsale.owner()
    }

    const gasPrice = 1;
    var killCall = async() => {
      await crowdsale.kill({gasLimit: 9000000000000000000000000, gasPrice: gasPrice, from: address});
    };
    await this.assertThrowsAsync(killCall, txRevertRegExp);
    await crowdsale.isICOActive(); // check if contract is alive
  }

  /***************************************************/

  /*
   ERC20 transfer test
   @token - token contract instance
   @sender - sender of tokens
   #recipient - recipient of tokens
   */
  async ERC20Transfer(token, sender, recipient) {
    // Set watcher to Transfer event that we are looking for
    const watcher = token.Transfer();
    const transfer1 = {
      to: recipient,
      value: 1
    };

    await token.transfer(...Object.values(transfer1), {from: sender});
    const output = watcher.get();

    const eventArguments = output[0].args;
    const argCount = Object.keys(eventArguments).length;
    const arg1Name = Object.keys(eventArguments)[0];
    const arg1Value = eventArguments[arg1Name];
    const arg2Name = Object.keys(eventArguments)[1];
    const arg2Value = eventArguments[arg2Name];
    const arg3Name = Object.keys(eventArguments)[2];
    const arg3Value = eventArguments[arg3Name];

    argCount.should.be.equal(3, 'Transfer event number of arguments');
    arg1Name.should.be.equal('from', 'Transfer event first argument name');
    arg1Value.should.be.equal(sender, 'Transfer event from address');
    arg2Name.should.be.equal('to', 'Transfer event second argument name');
    arg2Value.should.be.equal(recipient, 'Transfer event to address');
    arg3Name.should.be.equal('tokens', 'Transfer event third argument name');
    arg3Value.should.be.bignumber.equal(transfer1.value, 'Transfer event value');
  }

  /*
   ERC20 transferFrom test
   @token - token contract instance
   @sender - who approved to send
   @owner - owner of approved tokens
   #recipient - recipient of tokens
   */
  async ERC20AllocateTransferFrom(token, sender, owner, recipient) {
// Set watcher to Transfer event that we are looking for
    const watcher = token.Transfer();
    const approvalWatcher = token.Approval();

    // Approve parameters
    const approve = {
      spender: sender,
      value: 100
    };

    // TransferFrom parameters
    const transfer = {
      from: owner,
      to: recipient,
      value: 100
    };

    await token.approve(...Object.values(approve), {from: owner});
    const approvalOutput = approvalWatcher.get();

    // Verify number of Approval event arguments, their names, and content
    let eventArguments = approvalOutput[0].args;
    const arg0Count = Object.keys(eventArguments).length;
    const arg01Name = Object.keys(eventArguments)[0];
    const arg01Value = eventArguments[arg01Name];
    const arg02Name = Object.keys(eventArguments)[1];
    const arg02Value = eventArguments[arg02Name];
    const arg03Name = Object.keys(eventArguments)[2];
    const arg03Value = eventArguments[arg03Name];

    arg0Count.should.be.equal(3, 'Approval event number of arguments');
    arg01Name.should.be.equal('tokenOwner', 'Transfer event first argument name');
    arg01Value.should.be.equal(owner, 'Transfer event from address');
    arg02Name.should.be.equal('spender', 'Transfer event second argument name');
    arg02Value.should.be.equal(sender, 'Transfer event to address');
    arg03Name.should.be.equal('tokens', 'Transfer event third argument name');
    arg03Value.should.be.bignumber.equal(transfer.value, 'Transfer event value');


    await token.transferFrom(...Object.values(transfer), {from: sender});
    const output = watcher.get();

    // Verify number of Transfer event arguments, their names, and content
    eventArguments = output[0].args;
    const argCount = Object.keys(eventArguments).length;
    const arg1Name = Object.keys(eventArguments)[0];
    const arg1Value = eventArguments[arg1Name];
    const arg2Name = Object.keys(eventArguments)[1];
    const arg2Value = eventArguments[arg2Name];
    const arg3Name = Object.keys(eventArguments)[2];
    const arg3Value = eventArguments[arg3Name];

    argCount.should.be.equal(3, 'Transfer event number of arguments');
    arg1Name.should.be.equal('from', 'Transfer event first argument name');
    arg1Value.should.be.equal(owner, 'Transfer event from address');
    arg2Name.should.be.equal('to', 'Transfer event second argument name');
    arg2Value.should.be.equal(recipient, 'Transfer event to address');
    arg3Name.should.be.equal('tokens', 'Transfer event third argument name');
    arg3Value.should.be.bignumber.equal(transfer.value, 'Transfer event value');
  }

  /*
   ERC20 totalSupply test
   @token - contract instance
   @totalS - totalSupply of tokens
   */
  async ERC20TotalSupply(token, totalS) {
    var totalSupply = new BigNumber(await token.totalSupply());
    totalSupply.should.be.bignumber.equal(totalS, 'Token total supply');
  }

  /*
   ERC20 balanceOf test
   @token - contract instance
   @walletAddress - wallet to check balance
   */
  async ERC20BalanceOf(token, walletAddress) {
    await token.balanceOf(walletAddress).should.be.fulfilled;
  }

  /*
   ERC20 Allowance test
   @token - token contract instance
   @address1 - who allows
   @address2 - allowed
   */
  async ERC20Allowonce(token, address1, address2) {
    await token.allowance(address1, address2).should.be.fulfilled;
  }
}

module.exports = testLib;