const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SBIToken', function (accounts) {
  const SBIToken = artifacts.require('./SBIToken.sol');
  let sut;
  var generalSaleAddress; // Customer wallets
  var communityReserveAddress;
  var teamAddress;
  var advisorsAddress;
  var bountyAddress;
  var administrativeAddress;
  var userAddress1;
  var userAddress2;
  var userAddress3;
  var userAddress4;
  var userAddress5;
  var userAddress6;
  var userAddress7;
  var generalSaleEndDate;

  describe('SBIToken tests', async () => {

    beforeEach(async function () {
      BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN });
      // Provide 10M gas for token deployment. As of Nov-16-17, this is 0.001 ETH == $0.30
      sut = await SBIToken.new({gas: 10000000});
      generalSaleAddress = accounts[1]; // 0x8d6d63c22d114c18c2a0da6db0a8972ed9c40343
      communityReserveAddress = accounts[8]; // 0xa7a629529599023207b3b89a7ee792ad20e6a8fb
      teamAddress = accounts[12]; // 0xd00094c27603bade402d572e845354e31655f65b
      advisorsAddress = accounts[13]; // 0x1ea0a708a84b2b45e99a6f8f0aef7434b7677ab8
      bountyAddress = accounts[14]; // 0xbf39026615ae31c0534e61132f4a306828fcd27a
      administrativeAddress = accounts[15]; // 0xc1e49322d28ea5b6cefb43e5069c64f5cd4015bf
      userAddress1 = accounts[2]; // 0x9567397b445998e7e405d5fc3d239391bf5d0200
      userAddress2 = accounts[3]; // 0x5d2fca837fdfddcb034555d8e79ca76a54038e16
      userAddress3 = accounts[4]; // 0xd3b6b8528841c1c9a63ffa38d96785c32e004fa5
      userAddress4 = accounts[6]; // 0xd9bbeda239cf85ed4157ae333073597c8ee206bf
      userAddress5 = accounts[7]; // 0x54ff4c68d05e2598c9241ade09ac1fd5ffb8279c
      userAddress6 = accounts[9]; // 0x2587160168148c7c63ea8e7ca66755dbec62c77e
      userAddress7 = accounts[10]; // 0x64820b0f23d263ffb468edcc749e6a30c4e49852
      generalSaleEndDate = (await sut.generalSaleEndDate()).toNumber();
    });

    //#### 1. Contract default parameters.
    it('0. TestRPC should have current time before generalSaleEndDate', async () => {
      var currentTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      assert.isTrue(currentTime < generalSaleEndDate, 'Restart TestRPC or update ICO end date');
    });

    it('1. Should put 0 in the first account', async () => {
      const address = accounts[0];
      const initialBalance = await sut.balanceOf(address);
      assert.equal(0, initialBalance.valueOf(), 'The owner balance was non-zero');
    });

    //#### 2. Mint tokens.
    it('2. Should put correct amounts in all wallets in the first account', async () => {
      const generalSaleWalletBalance = await sut.balanceOf(generalSaleAddress);
      const communityReserveBalance = await sut.balanceOf(communityReserveAddress);
      const teamBalance = await sut.balanceOf(teamAddress);
      const advisorsBalance = await sut.balanceOf(advisorsAddress);
      const bountyBalance = await sut.balanceOf(bountyAddress);
      const administrativeBalance = await sut.balanceOf(administrativeAddress);
      const initialBalance7 = await sut.balanceOf(userAddress1);
      const initialBalance8 = await sut.balanceOf(userAddress2);

      assert.equal(350e24, generalSaleWalletBalance.valueOf(), 'Wallet generalSaleWalletBalance is wrong');
      assert.equal(450e24, communityReserveBalance.valueOf(), 'Wallet communityReserveBalance is wrong');
      assert.equal(170e24, teamBalance.valueOf(), 'Wallet teamBalance is wrong');
      assert.equal(24e23, advisorsBalance.valueOf(), 'Wallet advisorsBalance is wrong');
      assert.equal(176e23, bountyBalance.valueOf(), 'Wallet bountyBalance is wrong');
      assert.equal(10e24, administrativeBalance.valueOf(), 'Wallet administrativeBalance is wrong');
      assert.equal(0, initialBalance7.valueOf(), 'Wallet 7 balance is wrong');
      assert.equal(0, initialBalance8.valueOf(), 'Wallet 8 balance is wrong');
    });

    //#### 3. Setting stage periods.
    it('3. Tokens can be transferred from all wallets to customer wallets', async () => {
      // Contract deployed and general parameters initialization called. Mint function called.
      // Allocation owner requests transfer from allocation wallet to their address
      await prepareTrasnfer(true);
    });

    it('4. Transferred tokens vest as appropriate by the end of ICO', async () => {
      // Verify that
      //   1. Vested balance changes after vesting
      //   2. Vested balance can be transferred after vesting

      const recipient = accounts[17]; // Yet unused

      // First transfer
      // await prepareTrasnfer(false);
      // await setTestRPCTime(generalSaleEndDate + 3600);

      const senders = [
        generalSaleAddress, communityReserveAddress, teamAddress, advisorsAddress, bountyAddress, administrativeAddress,
      ];

      let newTransfer1 = {
        to: recipient,
        value: new BigNumber(350e24),
      };
      let newTransfer2 = {
        to: recipient,
        value: new BigNumber(450e24),
      };
      let newTransfer3 = {
        to: recipient,
        value: new BigNumber(170e24),
      };
      let newTransfer4 = {
        to: recipient,
        value: new BigNumber(24e23),
      };
      let newTransfer5 = {
        to: recipient,
        value: new BigNumber(176e23),
      };
      let newTransfer6 = {
        to: recipient,
        value: new BigNumber(10e24),
      };
      const transfers = [newTransfer1, newTransfer2, newTransfer3, newTransfer4, newTransfer5, newTransfer6];

      const initialSenderBalances = [];
      const vestedSenderBalances = [];
      const finalSenderBalances = [];
      const senderDiff = [];

      const initialRecipientBalance = new BigNumber(await sut.balanceOf(recipient));

      for (let i = 0; i < 6; i += 1) {
        initialSenderBalances.push(new BigNumber(await sut.balanceOf(senders[i])));
        vestedSenderBalances.push(new BigNumber(await sut.vestedBalanceOf(senders[i])));
        await sut.transfer(...Object.values(transfers[i]), {from: senders[i]});
      }

      const finalRecipientBalance =  new BigNumber(await sut.balanceOf(recipient));
      const recipientDiff = finalRecipientBalance.sub(initialRecipientBalance);

      let expectedRecipientDiff = new BigNumber(0);

      for (let i = 0; i < 6; i += 1) {
        finalSenderBalances.push(new BigNumber(await sut.balanceOf(senders[i])));
        senderDiff.push(initialSenderBalances[i].sub(finalSenderBalances[i]));
        if (i !== 0 && i !== 2) {
          expectedRecipientDiff = expectedRecipientDiff.plus(transfers[i].value);
        }
      }

      for (let i = 0; i < 6; i += 1) {
        if (i !== 0 && i !== 2) {
          senderDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
          vestedSenderBalances[i].should.be.bignumber.equal(transfers[i].value, 'User' +  i + ' vested balance');
        } else {
          senderDiff[i].should.be.bignumber.equal(new BigNumber(0), 'Wallet' +  i + ' balance decreased by transfer value');
          vestedSenderBalances[i].should.be.bignumber.equal(new BigNumber(0), 'User' +  i + ' vested balance');
        }
      }
      recipientDiff.should.be.bignumber.equal(expectedRecipientDiff, 'Recipient balance increased by sum of transfer values');
    });

    it('5. Transferred tokens do not vest above vesting percentage at the end of ICO (Negative transfer scenario.)', async () => {
      await negativeVestingTest(generalSaleAddress);
    });

    it('6. Transferred tokens vest as appropriate 6 month after the end of ICO', async () => {
      await setTestRPCTime(generalSaleEndDate + 3600 * 24 * (30.4375 * 6) + 3600 * 24);
      await positiveVestingTest(generalSaleAddress);
    });

    it('7. Transferred tokens do not vest as appropriate at the end of ICO + 2 years (Negative transfer scenario.)', async () => {
      await negativeVestingTest(teamAddress);
    });

    it('8. Transferred tokens vest as appropriate 2 years after the end of ICO', async () => {
      await setTestRPCTime(generalSaleEndDate + 3600 * 24 * (30.4375 * 6) * 4 + 3600 * 24);
      await positiveVestingTest(teamAddress);
    });

    it('9. ERC20 Comliance Tests - Transfer generates correct Transfer event', async () => {
      // Set watcher to Transfer event that we are looking for
      const watcher = sut.Transfer();

      const sender1 = communityReserveAddress;
      const recipient1 = accounts[17];
      const transfer1 = {
        to: recipient1,
        value: 1
      };

      await sut.transfer(...Object.values(transfer1), {from: sender1});
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
      arg1Value.should.be.equal(sender1, 'Transfer event from address');
      arg2Name.should.be.equal('to', 'Transfer event second argument name');
      arg2Value.should.be.equal(recipient1, 'Transfer event to address');
      arg3Name.should.be.equal('tokens', 'Transfer event third argument name');
      arg3Value.should.be.bignumber.equal(transfer1.value, 'Transfer event value');
    });

    it('10. ERC20 Comliance Tests - Allocate + TransferFrom generates correct Approval and Transfer event', async () => {
      // Set watcher to Transfer event that we are looking for
      var watcher = sut.Transfer();
      var approvalWatcher = sut.Approval();

      const sender = communityReserveAddress;
      const owner = bountyAddress;
      const recipient = accounts[17];

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

      await sut.approve(...Object.values(approve), {from: owner});
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


      await sut.transferFrom(...Object.values(transfer), {from: sender});
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
    });

    it('11. ERC20 Comliance Tests - totalSupply', async () => {
      var totalSupply = new BigNumber(await sut.totalSupply());
      totalSupply.should.be.bignumber.equal(1e27, 'Token total supply');
    });

    it('12. ERC20 Comliance Tests - balanceOf', async () => {
      await sut.balanceOf(accounts[1]).should.be.fulfilled;
    });

    it('13. ERC20 Comliance Tests - allowance', async () => {
      await sut.allowance(accounts[1], accounts[0]).should.be.fulfilled;
    });
  });

  /*********************************************************************************************************************/
  const prepareTrasnfer = async (doAssertions) => {
    const allSenders = [
      generalSaleAddress, communityReserveAddress, teamAddress, advisorsAddress, bountyAddress, administrativeAddress,
      userAddress1, userAddress2, userAddress3
    ];
    // sendersWithoutVesting
    const senders = [
      userAddress1, userAddress2, userAddress3, userAddress4, userAddress5, userAddress6
    ];
    const recipients = [
      generalSaleAddress, communityReserveAddress, teamAddress, advisorsAddress, bountyAddress, administrativeAddress,
    ];

    const transfers = [];
    senders.forEach((sender, index) => {
      const newTransfer = {
        to: recipients[index],
        value: 1000*index,
      };
      transfers.push(newTransfer);
    });

    if (doAssertions) {
      const initialSenderBalances = [];
      const initialRecipientBalances = [];
      const finalSenderBalances = [];
      const finalRecipientBalances = [];
      const senderDiff = [];
      const recipientsDiff = [];

      // before let's transfer some tokens to test addresses senders
      for (let i = 0; i < 6; i += 1) {
        await sut.transfer(senders[i], 1000*i, {from: communityReserveAddress});
      }

      for (let i = 0; i < 6; i += 1) {
        initialSenderBalances.push(new BigNumber(await sut.balanceOf(senders[i])));
        initialRecipientBalances.push(new BigNumber(await sut.balanceOf(recipients[i])));
        await sut.transfer(...Object.values(transfers[i]), {from: senders[i]});
      }

      for (let i = 0; i < 6; i += 1) {
        finalSenderBalances.push(new BigNumber(await sut.balanceOf(senders[i])));
        finalRecipientBalances.push(new BigNumber(await sut.balanceOf(recipients[i])));
        senderDiff.push(initialSenderBalances[i].sub(finalSenderBalances[i]));
        recipientsDiff.push(finalRecipientBalances[i].sub(initialRecipientBalances[i]));
      }

      for (let i = 0; i < 6; i += 1) {
        senderDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
        recipientsDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
      }

    } else {
      /*await sut.transfer(...Object.values(transfer1), {from: sender1});
       await sut.transfer(...Object.values(transfer2), {from: sender2});
       await sut.transfer(...Object.values(transfer3), {from: sender3});*/
    }
  };

  const increaseTime = async (time) => {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time], // 86400 is num seconds in day
        id: new Date().getTime()
      }, (err, result) => {
        if(err){ return reject(err) }
        return resolve(result)
      });
    })
  };

  const mineNewBlock = async (time) => {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0},
        (err, result) => {
          if(err){ return reject(err) }
          return resolve(result)
        });
    })
  };

  // Only sets future time, can't go back
  const setTestRPCTime = async (newtime) => {
    var currentTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    if (newtime > currentTime + 3600) {
      var timeDiff = newtime - currentTime;
      await increaseTime(timeDiff);
      await mineNewBlock();
    }
  };

  const negativeVestingTest = async (address) => {
    const recipient = accounts[17]; // Yet unused
    const transfer = {
      to: recipient,
      value: 100
    };
    const initialSenderBalance = new BigNumber(await sut.balanceOf(address));
    const initialRecipientBalance = new BigNumber(await sut.balanceOf(recipient));
    sut.transfer(...Object.values(transfer), {from: address});
    const finalSenderBalance = new BigNumber(await sut.balanceOf(address));
    const finalRecipientBalance = new BigNumber(await sut.balanceOf(recipient));
    finalSenderBalance.should.be.bignumber.equal(initialSenderBalance, address + ' balance not frozen');
    finalRecipientBalance.should.be.bignumber.equal(initialRecipientBalance, address + ' balance not frozen');
  };

  const positiveVestingTest = async (address) => {
    const recipient = accounts[17]; // Yet unused
    const transfer = {
      to: recipient,
      value: 100
    };
    const initialSenderBalance = new BigNumber(await sut.balanceOf(address));
    const initialRecipientBalance = new BigNumber(await sut.balanceOf(recipient));
    sut.transfer(...Object.values(transfer), {from: address});
    const finalSenderBalance = new BigNumber(await sut.balanceOf(address));
    const finalRecipientBalance = new BigNumber(await sut.balanceOf(recipient));
    finalSenderBalance.should.be.bignumber.equal(initialSenderBalance.sub(transfer.value), address + ' balance not frozen');
    finalRecipientBalance.should.be.bignumber.equal(initialRecipientBalance + transfer.value, address + ' balance not frozen');
  }
});