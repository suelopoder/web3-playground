import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Owned", function () {
  describe("Deployment", function () {
    it("Should set the owner as the deployer", async function () {
      const Owned = await ethers.getContractFactory("Owned");
      const owned = await Owned.deploy();
      const [owner] = await ethers.getSigners();

      expect(await owned.getOwner()).to.equal(owner.address);
    });
  });

  describe("Buying", function () {
    it("Should change the owner", async function () {
      const Owned = await ethers.getContractFactory("Owned");
      const owned = await Owned.deploy();
      const [owner, otherAccount] = await ethers.getSigners();

      await owned.connect(otherAccount).buy({ value: 1 })

      let actual = await owned.connect(owner).amIOwner()
      expect(actual).to.equal(false);
      actual = await owned.connect(otherAccount).amIOwner()
      expect(actual).to.equal(true);
    });

    it("Should not buy for less than current supply", async function () {
      const Owned = await ethers.getContractFactory("Owned");
      const owned = await Owned.deploy();
      const [owner, acc1, acc2] = await ethers.getSigners();

      await owned.connect(acc1).buy({ value: 10 })
      expect(owned.connect(acc2).buy({ value: 1 })).to.be.rejectedWith('Must be greater that total value')
    });

    it("Should accumulate value as more buyers come in", async function () {
      const Owned = await ethers.getContractFactory("Owned");
      const owned = await Owned.deploy();
      const [owner, acc1, acc2] = await ethers.getSigners();

      await owned.connect(acc1).buy({ value: 1 })
      let value = await owned.getValue()
      expect(value).to.equal(1)

      await owned.connect(acc2).buy({ value: 2 })
      value = await owned.getValue()
      expect(value).to.equal(3)
    });
  });
});
