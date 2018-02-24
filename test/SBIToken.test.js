const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SBIToken', function (accounts) {
  const SBIToken = artifacts.require('./../contracts/SBIToken.sol');
  let token;
  let generalSaleAddress = accounts[1]; // Customer wallets
  let bountyAddress = accounts[2];
  let partnersAddress = accounts[3];
  let teamAddress = accounts[4];
  let featureDevelopmentAddress = accounts[5];
  let userAddress1 = accounts[6];
  let userAddress2 = accounts[7];
  let userAddress3 = accounts[8];
  let userAddress4 = accounts[9];
  let userAddress5 = accounts[10];
  let userAddress6 = accounts[11];
  let userAddress7 = accounts[12];
  let userAddress8 = accounts[13];
  let userAddress9 = accounts[14];
  let userAddress10 = accounts[15];
  let generalSaleStartDate;
  let generalSaleEndDate;

  describe('SBIToken tests', async () => {

    beforeEach(async function () {
      BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN });
      // Provide 10M gas for token deployment. As of Nov-16-17, this is 0.001 ETH == $0.30
      token = await SBIToken.new({gas: 10000000});
      generalSaleStartDate = '1520208000';
      generalSaleEndDate = '1528156800';
      // generalSaleEndDate = (await token.generalSaleEndDate()).toNumber();
    });

    //#### 1. Contract default parameters.
    it('0. TestRPC should have current time before generalSaleEndDate', async () => {
      var currentTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      assert.isTrue(currentTime < generalSaleEndDate, 'Restart TestRPC or update ICO end date');
    });

    it('1. Should put 0 in the first account', async () => {
      const address = accounts[0];
      const initialBalance = await token.balanceOf(address);
      assert.equal(0, initialBalance.valueOf(), 'The owner balance was non-zero');
    });

    //#### 2. Mint tokens.
    it('2. Should put correct amounts in all wallets in the first account', async () => {
      const generalSaleAddressBalance = await token.balanceOf(generalSaleAddress);
      const bountyAddressBalance = await token.balanceOf(bountyAddress);
      const partnersAddressBalance = await token.balanceOf(partnersAddress);
      const teamAddressBalance = await token.balanceOf(teamAddress);
      const featureDevelopmentAddressBalance = await token.balanceOf(featureDevelopmentAddress);
      const userAddress1Balance = await token.balanceOf(userAddress1);
      const userAddress2Balance = await token.balanceOf(userAddress2);
      const userAddress3Balance = await token.balanceOf(userAddress3);
      const userAddress4Balance = await token.balanceOf(userAddress4);
      const userAddress5Balance = await token.balanceOf(userAddress5);
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
        [userAddress6, userAddress7, userAddress8, userAddress9, userAddress10],
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
      var totalSupply = new BigNumber(await token.totalSupply());
      totalSupply.should.be.bignumber.equal(40000000 * 1e18, 'Token total supply');
    });

    it('7. ERC20 Comliance Tests - balanceOf', async () => {
      await token.balanceOf(accounts[1]).should.be.fulfilled;
    });

    it('8. ERC20 Comliance Tests - allowance', async () => {
      await token.allowance(accounts[1], accounts[0]).should.be.fulfilled;
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
    const initialSenderBalances = [];
    const initialRecipientBalances = [];
    const finalSenderBalances = [];
    const finalRecipientBalances = [];

    // before let's transfer some tokens to test addresses senders
    for (let i = 0; i < senders.length; i += 1) {
      await token.transfer(senders[i], 1000*i, {from: generalSaleAddress});
    }

    for (let i = 0; i < senders.length; i += 1) {
      initialSenderBalances.push(new BigNumber(await token.balanceOf(senders[i])));
      initialRecipientBalances.push(new BigNumber(await token.balanceOf(recipients[i])));
      await token.transfer(...Object.values(transfers[i]), {from: senders[i]});
    }

    for (let i = 0; i < senders.length; i += 1) {
      finalSenderBalances.push(new BigNumber(await token.balanceOf(senders[i])));
      finalRecipientBalances.push(new BigNumber(await token.balanceOf(recipients[i])));
    }
    for (let i = 0; i < senders.length; i += 1) {
      initialSenderBalances[i].should.be.bignumber.equal(finalSenderBalances[i].plus(transfers[i].value), 'Wallet' +  i + ' balance decreased by transfer value');
      finalRecipientBalances[i].should.be.bignumber.equal(initialRecipientBalances[i].plus(transfers[i].value), 'Wallet' +  i + ' balance decreased by transfer value');
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
    var watcher = token.Transfer();
    var approvalWatcher = token.Approval();

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
  };

  const checkTransferEvents = async (account1, account2) => {
    const watcher = token.Transfer();

    const sender1 = account1;
    const recipient1 = account2;
    const transfer1 = {
      to: recipient1,
      value: 1
    };

    await token.transfer(...Object.values(transfer1), {from: sender1});
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