const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SBIToken', function (accounts) {
  const SBIToken = artifacts.require('./../contracts/SBIToken.sol');
  let sut;
  let generalSaleAddress; // Customer wallets
  let bountyAddress;
  let partnersAddress;
  let teamAddress;
  let featureDevelopmentAddress;
  let userAddress1;
  let userAddress2;
  let userAddress3;
  let userAddress4;
  let userAddress5;
  let generalSaleStartDate;
  let generalSaleEndDate;

  describe('SBIToken tests', async () => {

    beforeEach(async function () {
      BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN });
      // Provide 10M gas for token deployment. As of Nov-16-17, this is 0.001 ETH == $0.30
      sut = await SBIToken.new({gas: 10000000});
      generalSaleAddress = accounts[1];
      bountyAddress = accounts[2];
      partnersAddress = accounts[3];
      teamAddress = accounts[4];
      featureDevelopmentAddress = accounts[5];
      userAddress1 = accounts[6];
      userAddress2 = accounts[7];
      userAddress3 = accounts[8];
      userAddress4 = accounts[7];
      userAddress5 = accounts[10];
      generalSaleStartDate = (await sut.generalSaleStartDate()).toNumber();
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
      const generalSaleAddressBalance = await sut.balanceOf(generalSaleAddress);
      const bountyAddressBalance = await sut.balanceOf(bountyAddress);
      const partnersAddressBalance = await sut.balanceOf(partnersAddress);
      const teamAddressBalance = await sut.balanceOf(teamAddress);
      const featureDevelopmentAddressBalance = await sut.balanceOf(featureDevelopmentAddress);
      const userAddress1Balance = await sut.balanceOf(userAddress1);
      const userAddress2Balance = await sut.balanceOf(userAddress2);
      const userAddress3Balance = await sut.balanceOf(userAddress3);
      const userAddress4Balance = await sut.balanceOf(userAddress4);
      const userAddress5Balance = await sut.balanceOf(userAddress5);

      assert.equal(22800000 * 1e18, generalSaleAddressBalance.valueOf(), 'Wallet generalSaleAddress is wrong');
      assert.equal(2000000 * 1e18, bountyAddressBalance.valueOf(), 'Wallet bountyAddress is wrong');
      assert.equal(3200000 * 1e18, partnersAddressBalance.valueOf(), 'Wallet partnersAddress is wrong');
      assert.equal(12000000 * 1e18, teamAddressBalance.valueOf(), 'Wallet teamAddress is wrong');
      assert.equal(0, featureDevelopmentAddressBalance.valueOf(), 'Wallet featureDevelopmentAddress is wrong');
      assert.equal(0, userAddress1Balance.valueOf(), 'Wallet userAddress1 is wrong');
      assert.equal(0, userAddress2Balance.valueOf(), 'Wallet userAddress2 balance is wrong');
      assert.equal(0, userAddress3Balance.valueOf(), 'Wallet userAddress3 balance is wrong');
      assert.equal(0, userAddress4Balance.valueOf(), 'Wallet userAddress2 balance is wrong');
      assert.equal(0, userAddress5Balance.valueOf(), 'Wallet userAddress3 balance is wrong');
    });

    //#### 3. Setting stage periods.
    it('3. Tokens can be transferred from all wallets to customer wallets', async () => {
      // Contract deployed and general parameters initialization called. Mint function called.
      // Allocation owner requests transfer from allocation wallet to their address
      await prepareTrasnfer(
        [userAddress1, userAddress2, userAddress3, userAddress4, userAddress5],
        [generalSaleAddress, bountyAddress, partnersAddress, teamAddress, featureDevelopmentAddress],
      )
    });

    it('4. ERC20 Comliance Tests - Transfer generates correct Transfer event', async () => {
      // Set watcher to Transfer event that we are looking for
      await checkTransferEvents(accounts[1], accounts[7]);


    });

    it('5. ERC20 Comliance Tests - Allocate + TransferFrom generates correct Approval and Transfer event', async () => {
      // Set watcher to Transfer event that we are looking for
      await checkTransferFromAndApprovalEvents(accounts[1], accounts[2], accounts[7]);
    });

    it('6. ERC20 Comliance Tests - totalSupply', async () => {
      var totalSupply = new BigNumber(await sut.totalSupply());
      totalSupply.should.be.bignumber.equal(40000000 * 1e18, 'Token total supply');
    });

    it('7. ERC20 Comliance Tests - balanceOf', async () => {
      await sut.balanceOf(accounts[1]).should.be.fulfilled;
    });

    it('8. ERC20 Comliance Tests - allowance', async () => {
      await sut.allowance(accounts[1], accounts[0]).should.be.fulfilled;
    });
  });

  /*********************************************************************************************************************/
  const prepareTrasnfer = async (sen, rec) => {
    const senders = sen;
    const recipients = rec;
    const transfers = [];
    for (let i = 0; i < senders.length; i += 1) {
      const newTransfer = {
        to: recipients[i],
        value: 1000*i,
      };
      transfers.push(newTransfer);
    }
    console.log('transfers = ', transfers);
    const initialSenderBalances = [];
    const initialRecipientBalances = [];
    const finalSenderBalances = [];
    const finalRecipientBalances = [];
    const senderDiff = [];
    const recipientsDiff = [];

    // before let's transfer some tokens to test addresses senders
    for (let i = 0; i < senders.length; i += 1) {
      console.log('i',i, senders[i]);
      await sut.transfer(senders[i], 1000*i, {from: generalSaleAddress});
    }

    for (let i = 0; i < senders.length; i += 1) {
      initialSenderBalances.push(new BigNumber(await sut.balanceOf(senders[i])));
      initialRecipientBalances.push(new BigNumber(await sut.balanceOf(recipients[i])));
      await sut.transfer(...Object.values(transfers[i]), {from: senders[i]});
    }
    console.log('initialSenderBalances = ', initialSenderBalances);
    console.log('initialRecipientBalances = ', initialRecipientBalances);

    for (let i = 0; i < senders.length; i += 1) {
      finalSenderBalances.push(new BigNumber(await sut.balanceOf(senders[i])));
      finalRecipientBalances.push(new BigNumber(await sut.balanceOf(recipients[i])));
      senderDiff.push(initialSenderBalances[i].sub(finalSenderBalances[i]));
      recipientsDiff.push(finalRecipientBalances[i].sub(initialRecipientBalances[i]));
    }
    console.log('finalSenderBalances = ', finalSenderBalances);
    console.log('finalRecipientBalances = ', finalRecipientBalances);
    console.log('senderDiff = ', senderDiff);
    console.log('recipientsDiff = ', recipientsDiff);

    for (let i = 0; i < senders.length; i += 1) {
      senderDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
      recipientsDiff[i].should.be.bignumber.equal(transfers[i].value, 'Wallet' +  i + ' balance decreased by transfer value');
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

  const checkTransferFromAndApprovalEvents = async (account1, account2, account3) => {
    var watcher = sut.Transfer();
    var approvalWatcher = sut.Approval();

    const sender = account1;
    const owner = account2;
    const recipient = account3;

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
  };

  const checkTransferEvents = async (account1, account2) => {
    const watcher = sut.Transfer();

    const sender1 = account1;
    const recipient1 = account2;
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
  }
});