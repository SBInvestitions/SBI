pragma solidity ^0.4.19;

contract CrowdsaleParameters {
    ///////////////////////////////////////////////////////////////////////////
    // Production Config
    ///////////////////////////////////////////////////////////////////////////

    // ICO period timestamps:
    // 1524182400 = April 20, 2018.
    // 1529452800 = June 20, 2018.

    uint256 public constant generalSaleStartDate = 1524182400;
    uint256 public constant generalSaleEndDate = 1529452800;

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
