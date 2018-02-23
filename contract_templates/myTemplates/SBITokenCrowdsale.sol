pragma solidity 0.4.18;
import './Owned.sol';
import './SBIToken.sol';

contract SBITokenCrowdsale is Owned, CrowdsaleParameters {
    /* Token and records */
    SBIToken private token;
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
    function SBITokenCrowdsale(address _tokenAddress) public {
        token = SBIToken(_tokenAddress);
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

        if (owner.send(amount)) {
            FundTransfer(address(this), msg.sender, amount);
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
        if (now < generalSaleStartDate) {
            selfdestruct(owner);
        }
        if (token.balanceOf(generalSaleWallet.addr) > 0) {
            revert();
        }
        // save the not sold tokens to featureDevelopment wallet
        uint featureDevelopmentAmount = token.balanceOf(saleWalletAddress);
        // Transfer tokens to baker and return ETH change
        token.transferFrom(saleWalletAddress, featureDevelopment.addr, featureDevelopmentAmount);
        FundTransfer(address(this), msg.sender, this.balance);
        selfdestruct(owner);
    }
}
