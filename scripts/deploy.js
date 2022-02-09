const { JsonRpcProvider, Provider } = require("@ethersproject/providers")
const { UINT_MAX, to18, a, deploy } = require("../test/utils")
const { utils, Wallet, ContractFactory, Contract } = require("ethers")
const network = process.env.HARDHAT_NETWORK
const secrets = require("../secrets.json")
const WP = require("../test/WP.json")
const wp_address = "0xB31E40265e7941398B8c83304Cef92b61fa0a411"

const main = async () => {
  const provider = new JsonRpcProvider(secrets.shibuya.url)
  const wallet = new Wallet(secrets.shibuya.key_wp_owner, provider)
  const [deployer] = await ethers.getSigners()
  const ac = await ethers.getSigners()
  const wp = new Contract(wp_address, WP.abi, wallet)

  console.log("deploying Config...")
  const config = await deploy("Config")
  console.log("Config", a(config))

  console.log("deploying Pay...")
  const pay = await deploy(
    "Pay",
    50,
    a(wp),
    "0xAc589E489348D36910aB28654bb12dC81CB101c5",
    a(config)
  )
  console.log("Pay", a(pay))

  console.log("adding Pay as editor to Config...")
  await config.addEditor(a(pay))

  console.log("approving Pay to use WP...")

  await wp.approve(a(pay), UINT_MAX)

  console.log("all set!")
}

main()
