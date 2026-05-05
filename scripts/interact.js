import hre from "hardhat";

async function main() {
  // Your deployed contract address
  const CONTRACT_ADDRESS = "0x1af2673041db41476591aD459e6FB29db46b7BdA";
  
  if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Please update CONTRACT_ADDRESS in this script first!");
    console.log("   Deploy the contract and copy the address.");
    return;
  }

  console.log("🔗 Connecting to TalkingPet contract...\n");
  console.log("📍 Contract:", CONTRACT_ADDRESS);

  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Account:", signer.address);

  // Get contract instance
  const TalkingPet = await hre.ethers.getContractFactory("TalkingPet");
  const contract = TalkingPet.attach(CONTRACT_ADDRESS);

  // Read contract info
  console.log("\n📊 Contract Information:");
  
  const mintCost = await contract.MINT_COST();
  console.log("   Mint Cost:", hre.ethers.formatEther(mintCost), "RITUAL");
  
  const syncCost = await contract.SYNC_COST();
  console.log("   Sync Cost:", hre.ethers.formatEther(syncCost), "RITUAL");
  
  const owner = await contract.owner();
  console.log("   Owner:", owner);
  
  // Check if user has a pet
  const hasPet = await contract.hasPet(signer.address);
  console.log("\n🐾 Your Pet Status:");
  console.log("   Has Pet:", hasPet);
  
  if (hasPet) {
    const petStats = await contract.getPetStats(signer.address);
    console.log("   Name:", petStats.name);
    console.log("   Hunger:", petStats.hunger.toString());
    console.log("   Happiness:", petStats.happiness.toString());
    console.log("   Energy:", petStats.energy.toString());
    console.log("   Level:", petStats.level.toString());
    console.log("   Experience:", petStats.experience.toString());
    console.log("   Last Update:", new Date(Number(petStats.lastUpdate) * 1000).toLocaleString());
  } else {
    console.log("   You haven't minted a pet yet!");
    console.log("   Use the game UI to mint your pet.");
  }
  
  // Check contract balance
  const contractBalance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log("\n💰 Contract Balance:", hre.ethers.formatEther(contractBalance), "RITUAL");
  
  console.log("\n✅ Contract is working correctly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
