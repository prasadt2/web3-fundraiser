//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Fundraiser is Ownable {
    string public name;
    string public url;
    string public imageUrl;
    string public description;
    address payable public beneficiary;
    uint256 public totalDonations;
    uint256 public donationsCount;

    struct Donation {
        uint256 value;
        uint256 date;
    }

    mapping(address => Donation[]) private _donations;

    event DonationReceived(address indexed donor, uint256 value);
    event Withdraw(address indexed beneficiary, uint256 amount);

    constructor(
        string memory _name,
        string memory _url,
        string memory _imageUrl,
        string memory _description,
        address payable _beneficiary,
        address _owner
    ) {
        name = _name;
        url = _url;
        imageUrl = _imageUrl;
        description = _description;
        beneficiary = _beneficiary;
        _transferOwnership(_owner);
    }

    function setBeneficiary(address payable _beneficiary) public onlyOwner {
        beneficiary = _beneficiary;
    }

    function myDonationsCount() public view returns (uint256) {
        return _donations[msg.sender].length;
    }

    function myDonations()
        public
        view
        returns (uint256[] memory values, uint256[] memory dates)
    {
        uint256 count = myDonationsCount();
        // Donation[] memory _myDonations = _donations[msg.sender];
        Donation storage _donation;
        uint256[] memory _values = new uint256[](count);
        uint256[] memory _dates = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            _donation = _donations[msg.sender][i];
            _values[i] = _donation.value;
            _dates[i] = _donation.date;
        }

        return (_values, _dates);
    }

    function myDonationAmounts() public view returns (uint256[] memory values) {
        uint256 count = myDonationsCount();
        // Donation[] memory _myDonations = _donations[msg.sender];
        Donation storage _donation;
        values = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            _donation = _donations[msg.sender][i];
            values[i] = _donation.value;
        }

        return values;
    }

    function myDonationDates() public view returns (uint256[] memory dates) {
        uint256 count = myDonationsCount();
        // Donation[] memory _myDonations = _donations[msg.sender];
        Donation storage _donation;
        dates = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            _donation = _donations[msg.sender][i];
            dates[i] = _donation.date;
        }

        return dates;
    }

    function donate() public payable {
        Donation memory _donation = Donation(msg.value, block.timestamp);
        _donations[msg.sender].push(_donation);
        totalDonations += msg.value;
        donationsCount += 1;

        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw() public payable onlyOwner {
        uint256 balance = address(this).balance;
        beneficiary.transfer(balance);
        emit Withdraw(beneficiary, balance);
    }

    receive() external payable {
        totalDonations = totalDonations + msg.value;
        donationsCount++;
    }
}
