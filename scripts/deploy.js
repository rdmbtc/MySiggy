import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying TalkingPet contract to Ritual Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "RITUAL\n");

  if (balance < hre.ethers.parseEther("0.0005")) {
    console.log("⚠️  WARNING: Balance is low! You need at least 0.0005 RITUAL for deployment.");
    console.log("   Get tokens from: https://faucet.ritualfoundation.org\n");
  }

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const TalkingPet = await hre.ethers.getContractFactory("TalkingPet");
  const talkingPet = await TalkingPet.deploy();

  await talkingPet.waitForDeployment();

  const contractAddress = await talkingPet.getAddress();
  
  console.log("\n✅ TalkingPet deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔍 View on explorer: https://explorer.ritualfoundation.org/address/" + contractAddress);
  
  // Verify contract details
  console.log("\n📊 Contract Details:");
  const mintCost = await talkingPet.MINT_COST();
  const syncCost = await talkingPet.SYNC_COST();
  const owner = await talkingPet.owner();
  
  console.log("   Mint Cost:", hre.ethers.formatEther(mintCost), "RITUAL");
  console.log("   Sync Cost:", hre.ethers.formatEther(syncCost), "RITUAL");
  console.log("   Owner:", owner);
  
  // Check remaining balance
  const newBalance = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - newBalance;
  console.log("\n⛽ Gas used:", hre.ethers.formatEther(gasUsed), "RITUAL");
  console.log("💰 Remaining balance:", hre.ethers.formatEther(newBalance), "RITUAL");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Open index.html");
  console.log("3. Find line: const CONTRACT_ADDRESS = '0x0000...'");
  console.log("4. Replace with: const CONTRACT_ADDRESS = '" + contractAddress + "';");
  console.log("5. Save and test your game!");
  
  console.log("\n🎮 Ready to play! Open index.html in your browser.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
