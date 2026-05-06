# MySiggy - Virtual Pet Game 🐾

Your virtual pet on Ritual blockchain with PWA support!

## 🎮 Features

- **3D Virtual Pet** - Interactive 3D character with 50+ animations
- **Daily Quests** - Complete quests to earn XP and level up
- **Daily Streaks** - Play every day to maintain your streak
- **PWA Support** - Install on mobile, works offline
- **Push Notifications** - Get reminded when your pet needs attention
- **Web3 Integration** - Mint your pet on Ritual blockchain
- **Mobile-First** - Optimized for mobile devices

## 🚀 Quick Start

### Local Development

1. **Start local server**
```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node
npx http-server -p 8000
```

2. **Open in browser**
```
http://localhost:8000
```

3. **Test PWA features**
```
http://localhost:8000/test-pwa.html
```

## 📱 PWA Features

### Installation
- Install prompt appears after 30 seconds
- Works on iOS, Android, and Desktop
- Standalone app experience

### Offline Support
- Caches critical assets
- Works without internet after first load

### Push Notifications
- Notifications when stats are low
- 🍔 Hunger < 30%
- ⚡ Energy < 20%
- 🐾 Happiness < 30%

### Daily Quests
- 4 daily quests with XP rewards
- Daily streak counter
- Auto-reset at midnight

## 🎯 Daily Quests

| Quest | Target | Reward |
|-------|--------|--------|
| 🍔 Feed pet | 3 times | +50 XP |
| 🎮 Play with pet | 5 times | +75 XP |
| 😴 Let pet sleep | 2 times | +40 XP |
| ⭐ Level up | 1 time | +100 XP |

## 🔗 Web3 Integration

### Ritual Testnet
- Chain ID: `0x7BB` (1979)
- RPC: `https://rpc.ritualfoundation.org`
- Explorer: `https://explorer.ritualfoundation.org`

### Smart Contract Functions
- `mintPet(name)` - Mint your pet NFT
- `syncPet(stats)` - Sync progress to blockchain
- `getPetStats(address)` - Load progress from blockchain

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for full guide.

## 🧪 Testing

Open `test-pwa.html` to test:
- Service Worker registration
- Manifest configuration
- Icon availability
- Notification permissions
- Cache status

## 📊 Performance

- **Load Time**: ~4-6 seconds
- **FPS**: Stable 60 FPS
- **Memory**: ~180MB
- **Lighthouse Score**: 90+

## 🐛 Troubleshooting

### PWA not installing
- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker registered

### Notifications not working
- Check permission granted
- Verify HTTPS enabled
- Test on supported browser

### Wallet not connecting
- Install MetaMask
- Switch to Ritual Testnet
- Check contract address

## 📈 Roadmap

### Phase 1 (Current)
- [x] 3D pet with animations
- [x] PWA support
- [x] Daily quests
- [x] Push notifications
- [x] Web3 integration

### Phase 2 (Next)
- [ ] Leaderboard
- [ ] Pet evolution
- [ ] Weekly quests
- [ ] Social features

## 🙏 Credits

- **Developer**: [@rdmnad](https://twitter.com/rdmnad)
- **Discord**: @therdm
- **Community**: [Ritual Network](https://ritual.net)

---

Made with ❤️ for the Ritual Community 🔮
