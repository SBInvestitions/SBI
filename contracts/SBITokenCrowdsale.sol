pragma solidity ^0.4.20;

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

contract SBIToken is Owned, CrowdsaleParameters {
    using SafeMath for uint256;
    /* Public variables of the token */
    string public standard = 'Token 0.1';
    string public name = 'Suboil Blockchain investitions';
    string public symbol = 'SBI';
    uint8 public decimals = 18;

    /* Arrays of all balances */
    mapping (address => uint256) private balances;
    mapping (address => mapping (address => uint256)) private allowed;
    mapping (address => mapping (address => bool)) private allowanceUsed;

    /* This generates a public event on the blockchain that will notify clients */

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Issuance(uint256 _amount); // triggered when the total supply is increased
    event Destruction(uint256 _amount); // triggered when the total supply is decreased

    event NewSBIToken(address _token);

    /* Miscellaneous */

    uint256 public totalSupply = 0; // 32700000;
    bool public transfersEnabled = true;

    /**
    *  Constructor
    *
    *  Initializes contract with initial supply tokens to the creator of the contract
    */

    function SBIToken() public {
        owner = msg.sender;
        mintToken(generalSaleWallet);
        mintToken(bounty);
        mintToken(partners);
        mintToken(team);
        NewSBIToken(address(this));
    }

    modifier transfersAllowed {
        require(transfersEnabled);
        _;
    }

    modifier onlyPayloadSize(uint size) {
        assert(msg.data.length >= size + 4);
        _;
    }

    /**
    *  1. Associate crowdsale contract address with this Token
    *  2. Allocate general sale amount
    *
    * @param _crowdsaleAddress - crowdsale contract address
    */
    function approveCrowdsale(address _crowdsaleAddress) external onlyOwner {
        approveAllocation(generalSaleWallet, _crowdsaleAddress);
    }

    function approveAllocation(AddressTokenAllocation tokenAllocation, address _crowdsaleAddress) internal {
        uint uintDecimals = decimals;
        uint exponent = 10**uintDecimals;
        uint amount = tokenAllocation.amount * exponent;

        allowed[tokenAllocation.addr][_crowdsaleAddress] = amount;
        Approval(tokenAllocation.addr, _crowdsaleAddress, amount);
    }

    /**
    *  Get token balance of an address
    *
    * @param _address - address to query
    * @return Token balance of _address
    */
    function balanceOf(address _address) public constant returns (uint256 balance) {
        return balances[_address];
    }

    /**
    *  Get token amount allocated for a transaction from _owner to _spender addresses
    *
    * @param _owner - owner address, i.e. address to transfer from
    * @param _spender - spender address, i.e. address to transfer to
    * @return Remaining amount allowed to be transferred
    */

    function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    /**
    *  Send coins from sender's address to address specified in parameters
    *
    * @param _to - address to send to
    * @param _value - amount to send in Wei
    */

    function transfer(address _to, uint256 _value) public transfersAllowed onlyPayloadSize(2*32) returns (bool success) {

        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
    *  Create token and credit it to target address
    *  Created tokens need to vest
    *
    */
    function mintToken(AddressTokenAllocation tokenAllocation) internal {

        uint uintDecimals = decimals;
        uint exponent = 10**uintDecimals;
        uint mintedAmount = tokenAllocation.amount * exponent;

        // Mint happens right here: Balance becomes non-zero from zero
        balances[tokenAllocation.addr] += mintedAmount;
        totalSupply += mintedAmount;

        // Emit Issue and Transfer events
        Issuance(mintedAmount);
        Transfer(address(this), tokenAllocation.addr, mintedAmount);
    }

    /**
    *  Allow another contract to spend some tokens on your behalf
    *
    * @param _spender - address to allocate tokens for
    * @param _value - number of tokens to allocate
    * @return True in case of success, otherwise false
    */
    function approve(address _spender, uint256 _value) public onlyPayloadSize(2*32) returns (bool success) {
        require(_value == 0 || allowanceUsed[msg.sender][_spender] == false);
        allowed[msg.sender][_spender] = _value;
        allowanceUsed[msg.sender][_spender] = false;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
    *  Allow another contract to spend some tokens on your behalf
    *
    * @param _spender - address to allocate tokens for
    * @param _currentValue - current number of tokens approved for allocation
    * @param _value - number of tokens to allocate
    * @return True in case of success, otherwise false
    */
    function approve(address _spender, uint256 _currentValue, uint256 _value) public onlyPayloadSize(3*32) returns (bool success) {
        require(allowed[msg.sender][_spender] == _currentValue);
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
    *  A contract attempts to get the coins. Tokens should be previously allocated
    *
    * @param _to - address to transfer tokens to
    * @param _from - address to transfer tokens from
    * @param _value - number of tokens to transfer
    * @return True in case of success, otherwise false
    */
    function transferFrom(address _from, address _to, uint256 _value) public transfersAllowed onlyPayloadSize(3*32) returns (bool success) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    /**
    *  Default method
    *
    *  This unnamed function is called whenever someone tries to send ether to
    *  it. Just revert transaction because there is nothing that Token can do
    *  with incoming ether.
    *
    *  Missing payable modifier prevents accidental sending of ether
    */
    function() public {}

    /**
    *  Enable or disable transfers
    *
    * @param _enable - True = enable, False = disable
    */
    function toggleTransfers(bool _enable) external onlyOwner {
        transfersEnabled = _enable;
    }
}


contract SBITokenCrowdsale is Owned, CrowdsaleParameters {
    using SafeMath for uint256;
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
    uint public tokensPerEth = 48000;
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
