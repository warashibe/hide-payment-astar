const { expect } = require("chai")
const B = require("big.js")
const { waffle } = require("hardhat")
const { deployContract } = waffle
const { Contract, ContractFactory, Signer, Wallet, utils } = require("ethers")
const sigUtil = require("eth-sig-util")
const web3Abi = require("web3-eth-abi")
const eth = require("web3-eth")
const Web3 = require("web3")
const _Pay = require("../artifacts/contracts/Pay.sol/Pay.json").abi
const _WP = require("./WP")
const _deploy = async (abi, wallet, ...args) => {
  const _Contract = new ContractFactory(abi.abi, abi.bytecode, wallet)
  const contract = await _Contract.deploy(...args)
  await contract.deployTransaction.wait()
  return contract
}

const provider = waffle.provider
const {
  arr,
  str,
  isErr,
  to18,
  to32,
  from18,
  UINT_MAX,
  deploy,
  a,
  b,
} = require("./utils")

describe("Pay", function () {
  let ac, config, wp, pay
  let deployer, sender, receiver, wp_owner, bank
  beforeEach(async () => {
    ;[deployer, sender, receiver, wp_owner, bank] = await ethers.getSigners()
    config = await deploy("Config")
    wp = await _deploy(
      _WP,
      deployer,
      "Warashibe Point",
      "WP",
      a(wp_owner),
      to18(100000000)
    )
    pay = await deploy("Pay", 50, a(wp), a(wp_owner), a(config))
    await config.addEditor(a(pay))
    await wp.connect(wp_owner).approve(a(pay), UINT_MAX)
    await pay.setRate(to18("100"))
    return
  })

  it("should pay back wp", async function () {
    const pre_amount = from18(await provider.getBalance(a(deployer))) * 1

    const payback_rate = 1000 // = 10%

    // send 100 ASTR = 10000 WP
    await pay
      .connect(sender)
      .pay(a(receiver), "test", payback_rate, { value: to18("100") })

    const post_amount = from18(await provider.getBalance(a(deployer))) * 1

    // 1000 WP payback to sender
    expect((await b(wp, sender)) * 1).to.equal(1000)

    // sender loses 100 ASTR + GAS (less than 1 ASTR)
    expect(from18(await provider.getBalance(a(sender))) * 1).to.lt(9900)
    expect(from18(await provider.getBalance(a(sender))) * 1).to.gt(9899)

    // 10 ASTR goes to deployer
    expect(post_amount - pre_amount).to.equal(10)
  })
})
