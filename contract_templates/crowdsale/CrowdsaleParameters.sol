pragma solidity 0.4.18;

contract CrowdsaleParameters {
    struct AddressTokenAllocation {
        address addr;
        uint256 amount;
        uint256 vestingTS;
    }
    // addresses for vested tokens
    address internal constant preSaleWallet       = 0x8d6d63c22D114C18C2a0dA6Db0A8972Ed9C40343; // 6 months vesting 50% and 1/6 * 0.5: for next 6 months - every month
    address internal constant bountyWallet        = 0x8d6d63c22D114C18C2a0dA6Db0A8972Ed9C40343; // 6 months vesting 33.33% and 1/6 * 0.6667: for next 6 months - every month

    // Vesting time stamps: 50% will vest after ICO ends. The rest will vest within 6 months in equal monthly installments
    // 1532131200 = July 21, 2018. 6 months from Jan 21, 2018. 00:00:00 GMT
    // 1534809600 = August 21, 2018. 1 month from July 21, 2018. 00:00:00 GMT
    // 1537488000 = September 21, 2018. 1 month from August 21, 2018. 00:00:00 GMT
    // 1540080000 = October 21, 2018. 1 month from September 21, 2018. 00:00:00 GMT
    // 1542758400 = November 21, 2018. 1 month from October 21, 2018. 00:00:00 GMT
    // 1545350400 = December 21, 2018. 1 month from November 21, 2018. 00:00:00 GMT
    // 1548028800 = Jan 21, 2019. 1 month from December 21, 2018. 00:00:00 GMT

    uint256 internal constant preSaleDate1 = 1515974400; // Jan, 21, 2018 00:00:00 UTC
    uint256 internal constant preSaleDate2 = 1515974400; // Jan, 21, 2018 00:00:00 UTC
    uint256 internal constant generalSaleStartDate = 1513296000; // Dec, 15, 2017 00:00:00 UTC
    uint256 internal constant generalSaleEndDate = 1515974400; // Jan, 21, 2018 00:00:00 UTC

    AddressTokenAllocation internal generalSaleWallet   = AddressTokenAllocation(0x9567397B445998E7E405D5Fc3d239391bf5d0200, 238966760, 0);
    AddressTokenAllocation internal preSaleWallet1      = AddressTokenAllocation(0x9567397B445998E7E405D5Fc3d239391bf5d0200, 24989988, 0);
    AddressTokenAllocation internal preSaleWallet2      = AddressTokenAllocation(0x9567397B445998E7E405D5Fc3d239391bf5d0200, 36043252, 0);
    AddressTokenAllocation internal foundersWallet      = AddressTokenAllocation(0x2587160168148C7c63EA8E7CA66755dbEc62c77e, 28e7, 0);
    AddressTokenAllocation internal walletReserve       = AddressTokenAllocation(0x0f0E2f4843620b10d369cf8a165817eeB9b87e86, 261103324, 0);
    AddressTokenAllocation internal walletAdvisors      = AddressTokenAllocation(0x0f0E2f4843620b10d369cf8a165817eeB9b87e86, 4e7, 0);
    AddressTokenAllocation internal walletDubdubTeam    = AddressTokenAllocation(0x0f0E2f4843620b10d369cf8a165817eeB9b87e86, 28e7, 0);
    AddressTokenAllocation internal walletBounty        = AddressTokenAllocation(0x0f0E2f4843620b10d369cf8a165817eeB9b87e86, 2e7, 0);
    AddressTokenAllocation internal walletAirDrop       = AddressTokenAllocation(0x0f0E2f4843620b10d369cf8a165817eeB9b87e86, 98896676, 0);
}
