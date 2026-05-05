import hre from "hardhat";

async function main() {
  console.log("💰 Checking Ritual Testnet Balance...\n");

  const [account] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(account.address);
  
  console.log("📍 Account:", account.address);
  console.log("💵 Balance:", hre.ethers.formatEther(balance), "RITUAL");
  
  const minRequired = hre.ethers.parseEther("0.0005");
  
  if (balance < minRequired) {
    console.log("\n⚠️  WARNING: Balance is too low for deployment!");
    console.log("   You need at least 0.0005 RITUAL");
    console.log("   Get tokens from: https://faucet.ritualfoundation.org");
  } else {
    console.log("\n✅ Balance is sufficient for deployment!");
  }
  
  // Show what you can do with current balance
  const mintCost = hre.ethers.parseEther("0.0001");
  const syncCost = hre.ethers.parseEther("0.00005");
  const deployCost = hre.ethers.parseEther("0.0005");
  
  if (balance > deployCost) {
    const remaining = balance - deployCost;
    const mints = remaining / mintCost;
    const syncs = remaining / syncCost;
    
    console.log("\n📊 After deployment, you can:");
    console.log("   - Mint:", Math.floor(Number(mints)), "pets");
    console.log("   - Sync:", Math.floor(Number(syncs)), "times");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
