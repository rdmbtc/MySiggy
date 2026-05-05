// Web3 интеграция с Ritual Testnet
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm';

// Конфигурация Ritual Testnet
const RITUAL_TESTNET = {
    chainId: '0x...', // Замените на реальный Chain ID Ritual Testnet
    chainName: 'Ritual Testnet',
    nativeCurrency: {
        name: 'Ritual',
        symbol: 'RTL',
        decimals: 18
    },
    rpcUrls: ['https://testnet.ritual.network'], // Замените на реальный RPC
    blockExplorerUrls: ['https://explorer.ritual.network']
};

// Адрес смарт-контракта (деплойте свой контракт)
const CONTRACT_ADDRESS = '0x...'; // Замените на адрес вашего контракта

// ABI контракта
const CONTRACT_ABI = [
    "function feedPet() public payable",
    "function playWithPet() public payable",
    "function sleepPet() public",
    "function getPetStats(address owner) public view returns (uint256 hunger, uint256 happiness, uint256 energy)",
    "function getPetLevel(address owner) public view returns (uint256)",
    "event PetFed(address indexed owner, uint256 timestamp)",
    "event PetPlayed(address indexed owner, uint256 timestamp)",
    "event PetSlept(address indexed owner, uint256 timestamp)"
];

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
    }

    // Проверка наличия MetaMask
    async checkMetaMask() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask не установлен! Установите расширение MetaMask.');
        }
        return true;
    }

    // Подключение кошелька
    async connectWallet() {
        try {
            await this.checkMetaMask();

            // Запрос доступа к аккаунтам
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.userAddress = accounts[0];

            // Создаем провайдер
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Проверяем сеть
            await this.switchToRitualTestnet();

            // Подключаемся к контракту
            this.contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                this.signer
            );

            console.log('Кошелек подключен:', this.userAddress);
            return this.userAddress;

        } catch (error) {
            console.error('Ошибка подключения кошелька:', error);
            throw error;
        }
    }

    // Переключение на Ritual Testnet
    async switchToRitualTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: RITUAL_TESTNET.chainId }]
            });
        } catch (switchError) {
            // Если сеть не добавлена, добавляем её
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [RITUAL_TESTNET]
                    });
                } catch (addError) {
                    throw new Error('Не удалось добавить Ritual Testnet');
                }
            } else {
                throw switchError;
            }
        }
    }

    // Покормить питомца
    async feedPet() {
        try {
            if (!this.contract) {
                throw new Error('Контракт не подключен');
            }

            // Стоимость кормления (0.01 RTL)
            const feedCost = ethers.parseEther('0.01');

            const tx = await this.contract.feedPet({
                value: feedCost
            });

            console.log('Транзакция отправлена:', tx.hash);
            
            // Ждем подтверждения
            const receipt = await tx.wait();
            console.log('Транзакция подтверждена:', receipt);

            return receipt;

        } catch (error) {
            console.error('Ошибка при кормлении:', error);
            throw error;
        }
    }

    // Играть с питомцем
    async playWithPet() {
        try {
            if (!this.contract) {
                throw new Error('Контракт не подключен');
            }

            const playCost = ethers.parseEther('0.005');

            const tx = await this.contract.playWithPet({
                value: playCost
            });

            console.log('Транзакция отправлена:', tx.hash);
            const receipt = await tx.wait();
            console.log('Транзакция подтверждена:', receipt);

            return receipt;

        } catch (error) {
            console.error('Ошибка при игре:', error);
            throw error;
        }
    }

    // Уложить спать (бесплатно)
    async sleepPet() {
        try {
            if (!this.contract) {
                throw new Error('Контракт не подключен');
            }

            const tx = await this.contract.sleepPet();

            console.log('Транзакция отправлена:', tx.hash);
            const receipt = await tx.wait();
            console.log('Транзакция подтверждена:', receipt);

            return receipt;

        } catch (error) {
            console.error('Ошибка при укладывании спать:', error);
            throw error;
        }
    }

    // Получить статистику питомца
    async getPetStats() {
        try {
            if (!this.contract || !this.userAddress) {
                throw new Error('Контракт не подключен');
            }

            const stats = await this.contract.getPetStats(this.userAddress);
            
            return {
                hunger: Number(stats.hunger),
                happiness: Number(stats.happiness),
                energy: Number(stats.energy)
            };

        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            throw error;
        }
    }

    // Получить уровень питомца
    async getPetLevel() {
        try {
            if (!this.contract || !this.userAddress) {
                throw new Error('Контракт не подключен');
            }

            const level = await this.contract.getPetLevel(this.userAddress);
            return Number(level);

        } catch (error) {
            console.error('Ошибка получения уровня:', error);
            throw error;
        }
    }

    // Отключение кошелька
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        console.log('Кошелек отключен');
    }

    // Форматирование адреса
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Получение баланса
    async getBalance() {
        try {
            if (!this.provider || !this.userAddress) {
                throw new Error('Кошелек не подключен');
            }

            const balance = await this.provider.getBalance(this.userAddress);
            return ethers.formatEther(balance);

        } catch (error) {
            console.error('Ошибка получения баланса:', error);
            throw error;
        }
    }
}

// Экспорт
export default Web3Manager;
