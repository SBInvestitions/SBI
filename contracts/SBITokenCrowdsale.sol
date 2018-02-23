pragma solidity 0.4.21;

contract CrowdsaleParameters {
    ///////////////////////////////////////////////////////////////////////////
    // Production Config
    ///////////////////////////////////////////////////////////////////////////

    // ICO period timestamps:
    // 1520208000 = March 5, 2018.
    // 1528156800 = June 5, 2018.

    uint256 internal constant generalSaleStartDate = 1520208000;
    uint256 internal constant generalSaleEndDate = 1528156800;

    ///////////////////////////////////////////////////////////////////////////
    // QA Config
    ///////////////////////////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////////////////////
    // Configuration Independent Parameters
    ///////////////////////////////////////////////////////////////////////////

    struct AddressTokenAllocation {
        address addr;
        uint256 amount;
    }

    AddressTokenAllocation internal generalSaleWallet = AddressTokenAllocation(0x8d6d63c22D114C18C2a0dA6Db0A8972Ed9C40343, 22800000);
    AddressTokenAllocation internal bounty = AddressTokenAllocation(0x9567397B445998E7E405D5Fc3d239391bf5d0200, 2000000);
    AddressTokenAllocation internal partners = AddressTokenAllocation(0x5d2fca837fdFDDCb034555D8E79CA76A54038e16, 3200000);
    AddressTokenAllocation internal team = AddressTokenAllocation(0xd3b6B8528841C1c9a63FFA38D96785C32E004fA5, 12000000);
    AddressTokenAllocation internal featureDevelopment = AddressTokenAllocation(0xa83202b9346d9Fa846f1B0b3BB0AaDAbEa88908E, 0);
}


contract Owned {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
    *  Constructor
    *
    *  Sets contract owner to address of constructor caller
    */
    function Owned() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
    *  Change Owner
    *
    *  Changes ownership of this contract. Only owner can call this method.
    *
    * @param newOwner - new owner's address
    */
    function changeOwner(address newOwner) onlyOwner public {
        require(newOwner != address(0));
        require(newOwner != owner);
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract SBITokenCrowdsale is Owned, CrowdsaleParameters {
    /* Token and records */
    SBIToken private token;
    address bank;
    address saleWalletAddress;
    uint private tokenMultiplier = 10;
    uint public totalCollected = 0;
    uint public saleStartTimestamp;
    uint public saleStopTimestamp;
    uint public saleGoal;
    bool public goalReached = false;
    uint public tokensPerEth = 50000;
    mapping (address => uint256) private investmentRecords;

    /* Events */
    event TokenSale(address indexed tokenReceiver, uint indexed etherAmount, uint indexed tokenAmount, uint tokensPerEther);
    event FundTransfer(address indexed from, address indexed to, uint indexed amount);

    /**
    * Constructor
    *
    * @param _tokenAddress - address of token (deployed before this contract)
    */
    function SBITokenCrowdsale(address _tokenAddress, address _bankAddress) public {
        token = SBIToken(_tokenAddress);
        bank = _bankAddress;
        tokenMultiplier = tokenMultiplier ** token.decimals();
        saleWalletAddress = generalSaleWallet.addr;
        // Initialize sale goal
        saleGoal = generalSaleWallet.amount;
    }

    /**
    * Is sale active
    *
    * @return active - True, if sale is active
    */
    function isICOActive() public constant returns (bool active) {
        active = ((generalSaleStartDate <= now) && (now < generalSaleEndDate) && (!goalReached));
        return active;
    }


    /*
        eth rate is very volatile
    */
    function setTokenRate(uint rate) public onlyOwner {
        tokensPerEth = rate;
    }

    /**
    *  Process received payment
    *
    *  Determine the integer number of tokens that was purchased considering current
    *  stage, tier bonus, and remaining amount of tokens in the sale wallet.
    *  Transfer purchased tokens to investorAddress and return unused portion of
    *  ether (change)
    *
    * @param investorAddress - address that ether was sent from
    * @param amount - amount of Wei received
    */
    function processPayment(address investorAddress, uint amount) internal {
        require(isICOActive());
        assert(msg.value > 0 finney);

        // Fund transfer event
        FundTransfer(investorAddress, address(this), amount);

        // Calculate token amount that is purchased,
        // truncate to integer
        uint tokenAmount = amount * tokensPerEth / 1e18;

        // Check that stage wallet has enough tokens. If not, sell the rest and
        // return change.
        uint remainingTokenBalance = token.balanceOf(saleWalletAddress) / tokenMultiplier;
        if (remainingTokenBalance < tokenAmount) {
            tokenAmount = remainingTokenBalance;
            goalReached = true;
        }

        // Calculate Wei amount that was received in this transaction
        // adjusted to rounding and remaining token amount
        uint acceptedAmount = tokenAmount * 1e18 / tokensPerEth;

        // Transfer tokens to baker and return ETH change
        token.transferFrom(saleWalletAddress, investorAddress, tokenAmount * tokenMultiplier);
        TokenSale(investorAddress, amount, tokenAmount, tokensPerEth);

        // Return change
        uint change = amount - acceptedAmount;
        if (change > 0) {
            if (investorAddress.send(change)) {
                FundTransfer(address(this), investorAddress, change);
            }
            else revert();
        }

        // Update crowdsale performance
        investmentRecords[investorAddress] += acceptedAmount;
        totalCollected += acceptedAmount;
    }

    /**
    *  Transfer ETH amount from contract to owner's address.
    *  Can only be used if ICO is closed
    *
    * @param amount - ETH amount to transfer in Wei
    */
    function safeWithdrawal(uint amount) external onlyOwner {
        require(this.balance >= amount);
        require(!isICOActive());

        if (bank.send(amount)) {
            FundTransfer(address(this), bank, amount);
        }
    }

    /**
    *  Default method
    *
    *  Processes all ETH that it receives and credits TKLN tokens to sender
    *  according to current stage bonus
    */
    function () external payable {
        processPayment(msg.sender, msg.value);
    }

    /**
    *  Kill method
    *
    *  Destructs this contract
    */
    function kill() external onlyOwner {
        require(!isICOActive());
        if (this.balance > 0 || token.balanceOf(generalSaleWallet.addr) > 0) {
            revert();
        }
        if (now < generalSaleStartDate) {
            selfdestruct(owner);
        }
        // save the not sold tokens to featureDevelopment wallet
        uint featureDevelopmentAmount = token.balanceOf(saleWalletAddress);
        // Transfer tokens to baker and return ETH change
        token.transferFrom(saleWalletAddress, featureDevelopment.addr, featureDevelopmentAmount);
        FundTransfer(address(this), msg.sender, this.balance);
        selfdestruct(owner);
    }
}
