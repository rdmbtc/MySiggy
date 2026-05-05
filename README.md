# 🎮 My Talking Pet - Web3 Edition

Браузерная игра в стиле My Talking Tom с интеграцией Web3 и Ritual Testnet.

## ✨ Особенности

- 🎨 **3D персонаж с текстурами** - живой персонаж с анимациями
- 🎭 **8+ анимаций** - ходьба, танцы, прыжки, и многое другое
- 🔗 **Web3 интеграция** - транзакции на Ritual Testnet
- 💰 **Игровая экономика** - кормление и игры за токены
- 📊 **Система прогресса** - уровни и опыт
- 🎯 **Статистика** - голод, счастье, энергия

## 🚀 Быстрый старт

### 1. Запуск локально

```bash
# Установите локальный сервер (если нет)
npm install -g http-server

# Запустите сервер в папке проекта
cd my-talking-pet-web3
http-server -p 8080

# Откройте в браузере
# http://localhost:8080
```

### 2. Подготовка файлов

Убедитесь, что структура папок выглядит так:

```
my-talking-pet-web3/
├── index.html
├── game.js
├── web3.js
├── contracts/
│   └── TalkingPet.sol
└── README.md

output_with_textures/
├── model.gltf
├── model.mtl
├── e8ac44da4f2641a190a3b03367783ead_RGB_gltf_embedded_1.png
└── b8f21768cc7b42c5b27adb3c1e2bcf37_N_gltf_embedded_3.png

ready animations without texture/
├── Female Walk.fbx
├── Hip Hop Dancing.fbx
├── Jump.fbx
├── kick.fbx
├── Nervously Look Around.fbx
├── no food.fbx
└── Flair.fbx
```

## 🎮 Как играть

### Без Web3 (локальный режим)

1. Откройте `index.html` в браузере
2. Персонаж загрузится с текстурами
3. Используйте кнопки для взаимодействия:
   - 🍔 **Покормить** - увеличивает голод
   - 🎮 **Играть** - увеличивает счастье
   - 😴 **Спать** - восстанавливает энергию
   - 💃 **Танцевать** - веселье!

### С Web3 (Ritual Testnet)

1. Установите [MetaMask](https://metamask.io/)
2. Добавьте Ritual Testnet в MetaMask
3. Получите тестовые токены
4. Нажмите "Подключить кошелек"
5. Взаимодействуйте с питомцем через транзакции

## 🔧 Настройка Web3

### 1. Деплой смарт-контракта

```bash
# Установите Hardhat
npm install --save-dev hardhat

# Инициализируйте проект
npx hardhat init

# Скопируйте контракт
cp contracts/TalkingPet.sol hardhat-project/contracts/

# Настройте hardhat.config.js для Ritual Testnet
# Деплойте контракт
npx hardhat run scripts/deploy.js --network ritual-testnet
```

### 2. Обновите конфигурацию

В файле `web3.js` обновите:

```javascript
// Ritual Testnet конфигурация
const RITUAL_TESTNET = {
    chainId: '0x...', // Chain ID Ritual Testnet
    rpcUrls: ['https://testnet.ritual.network']
};

// Адрес вашего контракта
const CONTRACT_ADDRESS = '0x...';
```

### 3. Добавьте Ritual Testnet в MetaMask

1. Откройте MetaMask
2. Сети → Добавить сеть
3. Введите данные Ritual Testnet:
   - **Network Name**: Ritual Testnet
   - **RPC URL**: https://testnet.ritual.network
   - **Chain ID**: (получите из документации)
   - **Currency Symbol**: RTL

## 📝 Смарт-контракт

### Функции контракта

```solidity
// Создать питомца
function createPet() external

// Покормить (0.01 RTL)
function feedPet() external payable

// Играть (0.005 RTL)
function playWithPet() external payable

// Спать (бесплатно)
function sleepPet() external

// Получить статистику
function getPetStats(address owner) external view returns (
    uint256 hunger,
    uint256 happiness,
    uint256 energy,
    uint256 level,
    uint256 experience
)
```

### События

```solidity
event PetCreated(address indexed owner, uint256 timestamp);
event PetFed(address indexed owner, uint256 hunger, uint256 experience);
event PetPlayed(address indexed owner, uint256 happiness, uint256 experience);
event PetSlept(address indexed owner, uint256 energy, uint256 experience);
event PetLevelUp(address indexed owner, uint256 newLevel);
```

## 🎨 Анимации

Игра поддерживает следующие анимации:

- 🚶 **Walk** - Ходьба
- 💃 **Dance** - Танец хип-хоп
- 🦘 **Jump** - Прыжок
- 🦵 **Kick** - Удар ногой
- 😰 **Nervous** - Нервничает
- 😢 **No Food** - Голодный
- ✨ **Flair** - Флер

Анимации автоматически применяются к персонажу с текстурами!

## 🔨 Разработка

### Добавление новых анимаций

1. Поместите FBX файл в `ready animations without texture/`
2. Добавьте в `game.js`:

```javascript
const animationFiles = [
    { name: 'my_animation', file: '../ready animations without texture/My Animation.fbx' }
];
```

3. Текстуры применятся автоматически!

### Изменение текстур

Замените файлы в `output_with_textures/`:
- `e8ac44da4f2641a190a3b03367783ead_RGB_gltf_embedded_1.png` - основная текстура
- `b8f21768cc7b42c5b27adb3c1e2bcf37_N_gltf_embedded_3.png` - карта нормалей

### Настройка игровой логики

В `game.js` измените:

```javascript
// Скорость уменьшения статов
petStats.hunger = Math.max(0, petStats.hunger - 1);
petStats.happiness = Math.max(0, petStats.happiness - 0.5);
petStats.energy = Math.max(0, petStats.energy - 0.3);

// Награды за действия
petStats.hunger = Math.min(100, petStats.hunger + 30);
```

## 🌐 Деплой в продакшн

### Vercel / Netlify

1. Загрузите проект на GitHub
2. Подключите к Vercel/Netlify
3. Деплойте!

### IPFS (децентрализованный хостинг)

```bash
# Установите IPFS
npm install -g ipfs

# Добавьте проект
ipfs add -r my-talking-pet-web3/

# Получите CID и используйте через IPFS Gateway
```

## 📊 Игровая экономика

| Действие | Стоимость | Награда (опыт) | Эффект |
|----------|-----------|----------------|--------|
| Покормить | 0.01 RTL | 10 XP | +30 голод, +10 счастье |
| Играть | 0.005 RTL | 15 XP | +30 счастье, -10 энергия |
| Спать | Бесплатно | 5 XP | +40 энергия, +5 счастье |

**Повышение уровня**: 100 XP

## 🐛 Решение проблем

### Модель не загружается

- Проверьте пути к файлам в `game.js`
- Убедитесь, что запущен локальный сервер (не просто открыт файл)
- Проверьте консоль браузера (F12)

### Анимации не работают

- Убедитесь, что FBX файлы в правильной папке
- Проверьте, что файлы не повреждены
- Посмотрите консоль на ошибки загрузки

### Web3 не подключается

- Установите MetaMask
- Добавьте Ritual Testnet
- Получите тестовые токены
- Обновите адрес контракта в `web3.js`

## 📚 Ресурсы

- [Three.js документация](https://threejs.org/docs/)
- [Ethers.js документация](https://docs.ethers.org/)
- [Ritual Network](https://ritual.network/)
- [Solidity документация](https://docs.soliditylang.org/)

## 🤝 Вклад

Хотите улучшить игру? Создайте Pull Request!

## 📄 Лицензия

MIT License

## 🎉 Готово!

Ваша браузерная игра с Web3 готова! Наслаждайтесь! 🚀

---

**Создано с ❤️ для Ritual Testnet**
