// const { FEE } = require("@/constants/common");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", () => {
  const FEE = ethers.parseUnits("0.01", 18)

  const deployFactoryFixture = async () => {
    // Fetch accounts
    const [deployer, creator] = await ethers.getSigners()
    
    // Fetch the contract
    const Factory = await ethers.getContractFactory("Factory");
    // Deploy the contract
    const factory = await Factory.deploy(FEE);

    // Create token
    const transaction = await factory.connect(creator).create("Dapp Uni", "DAPP", {value: FEE})
    await transaction.wait()

    // Get token address
    const tokenAddress = await factory.tokens(0)
    const token = await ethers.getContractAt("Token", tokenAddress)

    return { factory, token, deployer, creator };
  };

  describe("Deployment", () => {
    it("Should set the fee", async () => {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.fee()).to.equal(FEE);
    });

    it("Should set the owner", async () => {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      expect(await factory.owner()).to.equal(deployer.address);
    });
  });

  describe("Creating", () => {
    it("Shout create a token", async () => {
      const { factory, token } = await loadFixture(deployFactoryFixture)
      expect(await token.owner()).to.equal(await factory.getAddress())
    })

    it("Should set the supply", async () => {
      const { factory, token } = await loadFixture(deployFactoryFixture)
      const totalSupply = ethers.parseUnits("1000000", 18)
      expect(await token.balanceOf(await factory.getAddress())).to.equal(totalSupply)
    })

    it("Should update ETH balance", async () => {
      const { factory } = await loadFixture(deployFactoryFixture)
      const balance = await ethers.provider.getBalance(await factory.getAddress())
      expect(balance).to.equal(FEE)
    })

    it("Should create the sale", async () => {
      const { factory, token, creator } = await loadFixture(deployFactoryFixture)
      const count = await factory.totalTokens()
      expect(count).to.equal(1)

      const sale = await factory.getTokenSale(0)
      expect(sale.token).to.equal(await token.getAddress())
      expect(sale.creator).to.equal(creator.address)
      expect(sale.sold).to.equal(0)
      expect(sale.raised).to.equal(0)
      expect(sale.isOpen).to.equal(true)
    })
  })
});
