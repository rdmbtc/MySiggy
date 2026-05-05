// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TalkingPet
 * @dev Smart contract for My Talking Pet game on Ritual Testnet
 */
contract TalkingPet {
    
    // Pet structure
    struct Pet {
        string name;         // Pet name
        uint256 hunger;      // 0-100
        uint256 happiness;   // 0-100
        uint256 energy;      // 0-100
        uint256 level;       // Pet level
        uint256 experience;  // Experience points
        uint256 lastUpdate;  // Last update timestamp
        bool exists;         // Does pet exist
    }
    
    // Mapping owners to pets
    mapping(address => Pet) public pets;
    
    // Mapping names to check uniqueness
    mapping(string => bool) public nameExists;
    
    // Action costs (very low for testnet)
    uint256 public constant MINT_COST = 0.0001 ether;  // 0.0001 RITUAL
    uint256 public constant SYNC_COST = 0.00005 ether; // 0.00005 RITUAL
    
    // Experience rewards
    uint256 public constant FEED_EXPERIENCE = 10;
    uint256 public constant PLAY_EXPERIENCE = 15;
    uint256 public constant SLEEP_EXPERIENCE = 12;
    uint256 public constant DANCE_EXPERIENCE = 20;
    
    // Experience for level up
    uint256 public constant LEVEL_UP_EXPERIENCE = 100;
    
    // Contract owner
    address public owner;
    
    // Events
    event PetMinted(address indexed owner, string name, uint256 timestamp);
    event PetSynced(address indexed owner, uint256 hunger, uint256 happiness, uint256 energy, uint256 level, uint256 experience);
    event PetLevelUp(address indexed owner, uint256 newLevel);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier petExists() {
        require(pets[msg.sender].exists, "Pet does not exist. Please mint first!");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Mint new pet with name
     */
    function mintPet(string memory _name) external payable {
        require(!pets[msg.sender].exists, "Pet already exists");
        require(msg.value >= MINT_COST, "Insufficient payment for minting");
        require(bytes(_name).length > 0 && bytes(_name).length <= 20, "Name must be 1-20 characters");
        require(!nameExists[_name], "Name already taken");
        
        pets[msg.sender] = Pet({
            name: _name,
            hunger: 70,
            happiness: 80,
            energy: 60,
            level: 1,
            experience: 0,
            lastUpdate: block.timestamp,
            exists: true
        });
        
        nameExists[_name] = true;
        
        emit PetMinted(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Sync pet progress to blockchain
     */
    function syncPet(
        uint256 _hunger,
        uint256 _happiness,
        uint256 _energy,
        uint256 _level,
        uint256 _experience
    ) external payable petExists {
        require(msg.value >= SYNC_COST, "Insufficient payment for sync");
        require(_hunger <= 100 && _happiness <= 100 && _energy <= 100, "Stats must be 0-100");
        require(_level >= pets[msg.sender].level, "Cannot decrease level");
        
        Pet storage pet = pets[msg.sender];
        
        pet.hunger = _hunger;
        pet.happiness = _happiness;
        pet.energy = _energy;
        pet.level = _level;
        pet.experience = _experience;
        pet.lastUpdate = block.timestamp;
        
        emit PetSynced(msg.sender, _hunger, _happiness, _energy, _level, _experience);
    }
    
    /**
     * @dev Get pet stats
     */
    function getPetStats(address petOwner) external view returns (
        string memory name,
        uint256 hunger,
        uint256 happiness,
        uint256 energy,
        uint256 level,
        uint256 experience,
        uint256 lastUpdate
    ) {
        require(pets[petOwner].exists, "Pet does not exist");
        
        Pet memory pet = pets[petOwner];
        
        return (
            pet.name,
            pet.hunger,
            pet.happiness,
            pet.energy,
            pet.level,
            pet.experience,
            pet.lastUpdate
        );
    }
    
    /**
     * @dev Check if pet exists
     */
    function hasPet(address petOwner) external view returns (bool) {
        return pets[petOwner].exists;
    }
    
    /**
     * @dev Check if name is available
     */
    function isNameAvailable(string memory _name) external view returns (bool) {
        return !nameExists[_name];
    }
    
    /**
     * @dev Get pet name
     */
    function getPetName(address petOwner) external view returns (string memory) {
        require(pets[petOwner].exists, "Pet does not exist");
        return pets[petOwner].name;
    }
    
    /**
     * @dev Withdraw funds (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
