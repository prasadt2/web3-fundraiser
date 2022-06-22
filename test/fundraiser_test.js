const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers");
const { expect } = require("chai");
const { assert } = require("console");
const { ethers } = require("hardhat");


describe("Fundraiser", function () {
    let deployer, fundraiser, beneficiary, owner, newBeneficiary, donor;

    const name = "Beneficiary name";
    const url = "beneficiaryname.org";
    const imageUrl = "https://placekitten.com/600/350";
    const description = "Beneficiary description";
    const donationAmount = 100.0;


    beforeEach("deploy contract", async () => {
        [deployer, beneficiary, owner, newOwner, newBeneficiary, donor, unauthorized, anonymous] = await ethers.getSigners();

        // Deploy Fundraiser
        const fundraiserContract = await ethers.getContractFactory("Fundraiser");
        fundraiser = await fundraiserContract.connect(deployer).deploy(
            name,
            url,
            imageUrl,
            description,
            beneficiary.address,
            owner.address
        );
        await fundraiser.deployed();
        // console.log("Fundraiser address:", fundraiser.address);
    });

    describe("Initiatialization", function () {
        it("gets the beneficiary name", async () => {
            expect(
                await fundraiser.name()
            ).to.equal(name);
        });
        it("gets the beneficiary url", async () => {
            expect(
                await fundraiser.url()
            ).to.equal(url);
        });
        it("gets the beneficiary image url", async () => {
            expect(
                await fundraiser.imageUrl()
            ).to.equal(imageUrl);
        });
        it("gets the beneficiary description", async () => {
            expect(
                await fundraiser.description()
            ).to.equal(description);
        });
        it("gets the beneficiary", async () => {
            expect(
                await fundraiser.beneficiary()
            ).to.equal(beneficiary.address);
        });
        it("gets the owner", async () => {
            expect(
                await fundraiser.owner()
            ).to.equal(owner.address);
        });
    })

    describe("Manage owner", function () {
        it('sets the owner', async () => {
            await fundraiser.connect(owner).transferOwnership(newOwner.address);
            expect(await fundraiser.owner()).to.equal(newOwner.address);
        });

        if ('Fails setting the owner', async () => {
            expect(await fundraiser.transferOwnership(newOwner)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

    describe("making donations", function () {
        it('increases donation count', async () => {
            const currentCount = await fundraiser.connect(donor).myDonationsCount();
            await fundraiser.connect(donor).donate({
                value: ethers.utils.parseEther(donationAmount.toString())
            });
            const newCount = await fundraiser.connect(donor).myDonationsCount();
            const diff = newCount - currentCount;
            expect(diff).to.equal(1, 'My donations count should increase by 1');
        });
        it('include donations in myDonation', async () => {
            await fundraiser.connect(donor).donate({
                value: ethers.utils.parseEther(donationAmount.toString())
            });
            const values = await fundraiser.connect(donor).myDonationAmounts();
            const dates = await fundraiser.connect(donor).myDonationDates();
            expect(parseInt(ethers.utils.formatUnits(values[0]))).to.equal(donationAmount, "My donation should match " + donationAmount);
        });
        it('increases the totalDonations amount', async () => {
            const currentTotalDonations = await fundraiser.totalDonations();
            await fundraiser.connect(donor).donate({
                value: ethers.utils.parseEther(donationAmount.toString())
            });
            const newTotalDonations = await fundraiser.totalDonations();
            const diff = ethers.utils.formatUnits(newTotalDonations) - ethers.utils.formatUnits(currentTotalDonations);
            expect(diff).to.equal(donationAmount, "difference should match the donation value");
        });
        it('increases the donations count', async () => {
            const currentNumberDonations = await fundraiser.donationsCount();
            await fundraiser.connect(donor).donate({
                value: ethers.utils.parseEther(donationAmount.toString())
            });
            const newNumberDonations = await fundraiser.donationsCount();
            const diff = newNumberDonations - currentNumberDonations;
            expect(diff).to.equals(1, "difference should match the new number of donations");
        });

        it('emits the DonationsReceived event', async () => {
            await expect(fundraiser.connect(donor).donate(
                { value: ethers.utils.parseEther(donationAmount.toString()) }))
                .to.emit(fundraiser, "DonationReceived");
        });
    });

    describe("withdrawing funds", function () {

        this.beforeEach(async () => {
            await fundraiser.connect(donor).donate({ value: ethers.utils.parseEther(donationAmount.toString()) });
        });

        describe("access controls", function () {
            it("throws an error when called from a non-owner account", async () => {
                await expect(fundraiser.connect(unauthorized).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
                assert(true, "no errors were thrown");
            });

            it("permits the owner to call withdraw", async () => {
                await fundraiser.connect(owner).withdraw();
                assert(true, "no errors were thrown");
            });

            it("Owner sends the donations to the beneficiary", async () => {
                const before = await ethers.provider.getBalance(beneficiary.address);
                await fundraiser.connect(owner).withdraw();
                const after = await ethers.provider.getBalance(beneficiary.address);
                const diff = ethers.utils.formatUnits(after) - ethers.utils.formatUnits(before);
                expect(diff).to.equals(donationAmount, "withdrawal amount does not match donations");

            });

            it("emits the withdrawn event", async () => {
                await expect(fundraiser.connect(owner).withdraw()).to.emit(fundraiser, "Withdraw");
            });
        });


    });

    describe("fallback function", function () {
        it("increases the totalDonations amount", async () => {
            const currentTotalDonations = await fundraiser.totalDonations();
            let amount = ethers.utils.parseEther(donationAmount.toString());
            await anonymous.sendTransaction({
                to: fundraiser.address,
                value: amount
            });
            const newTotalDonations = await fundraiser.totalDonations();
            const diff = ethers.utils.formatUnits(newTotalDonations) - ethers.utils.formatUnits(currentTotalDonations);
            expect(diff).to.equal(donationAmount, "difference should match the donation value");
        });

        it('increases the donations count', async () => {
            const currentNumberDonations = await fundraiser.donationsCount();
            let amount = ethers.utils.parseEther(donationAmount.toString());
            await anonymous.sendTransaction({
                to: fundraiser.address,
                value: amount
            });
            const newNumberDonations = await fundraiser.donationsCount();
            const diff = newNumberDonations - currentNumberDonations;
            expect(diff).to.equals(1, "difference should match the new number of donations");
        });
    });

});
