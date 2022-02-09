require("@nomiclabs/hardhat-waffle")
const secrets = require("./secrets.json")

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

module.exports = {
  solidity: "0.6.12",
  networks: {
    shibuya: {
      url: secrets.shibuya.url,
      accounts: [secrets.shibuya.key],
    },
  },
}
