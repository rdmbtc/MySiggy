#!/usr/bin/env python3
"""
Скрипт автоматической настройки проекта My Talking Pet Web3
"""
import os
import shutil
from pathlib import Path

def setup_project():
    print("="*60)
    print("НАСТРОЙКА MY TALKING PET - WEB3 EDITION")
    print("="*60)
    
    current_dir = Path(__file__).parent
    project_root = current_dir.parent
    
    # Проверяем необходимые папки
    required_folders = {
        'textures': project_root / 'output_with_textures',
        'animations': project_root / 'ready animations without texture'
    }
    
    print("\n1. Проверка файлов...")
    
    all_ok = True
    for name, folder in required_folders.items():
        if folder.exists():
            print(f"  ✓ {name}: {folder}")
        else:
            print(f"  ❌ {name}: НЕ НАЙДЕНО - {folder}")
            all_ok = False
    
    if not all_ok:
        print("\n❌ Некоторые файлы не найдены!")
        print("Убедитесь, что папки находятся в правильном месте.")
        return False
    
    # Проверяем файлы текстур
    print("\n2. Проверка текстур...")
    texture_files = [
        'e8ac44da4f2641a190a3b03367783ead_RGB_gltf_embedded_1.png',
        'b8f21768cc7b42c5b27adb3c1e2bcf37_N_gltf_embedded_3.png',
        'model.gltf'
    ]
    
    textures_folder = required_folders['textures']
    for texture in texture_files:
        texture_path = textures_folder / texture
        if texture_path.exists():
            print(f"  ✓ {texture}")
        else:
            print(f"  ❌ {texture} - НЕ НАЙДЕНО")
            all_ok = False
    
    # Проверяем анимации
    print("\n3. Проверка анимаций...")
    animations_folder = required_folders['animations']
    fbx_files = list(animations_folder.glob('*.fbx'))
    
    if fbx_files:
        print(f"  ✓ Найдено анимаций: {len(fbx_files)}")
        for fbx in fbx_files:
            print(f"    - {fbx.name}")
    else:
        print("  ❌ Анимации не найдены")
        all_ok = False
    
    if not all_ok:
        print("\n❌ Настройка не завершена из-за отсутствующих файлов")
        return False
    
    # Создаем package.json для удобства
    print("\n4. Создание package.json...")
    package_json = current_dir / 'package.json'
    
    if not package_json.exists():
        with open(package_json, 'w') as f:
            f.write('''{
  "name": "my-talking-pet-web3",
  "version": "1.0.0",
  "description": "My Talking Pet game with Web3 integration",
  "scripts": {
    "start": "http-server -p 8080 -c-1",
    "dev": "http-server -p 8080 -c-1 -o"
  },
  "keywords": ["web3", "game", "3d", "ritual", "blockchain"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
''')
        print("  ✓ package.json создан")
    else:
        print("  ✓ package.json уже существует")
    
    # Создаем .gitignore
    print("\n5. Создание .gitignore...")
    gitignore = current_dir / '.gitignore'
    
    if not gitignore.exists():
        with open(gitignore, 'w') as f:
            f.write('''node_modules/
.env
.DS_Store
*.log
dist/
build/
.cache/
''')
        print("  ✓ .gitignore создан")
    else:
        print("  ✓ .gitignore уже существует")
    
    # Создаем инструкцию по запуску
    print("\n6. Создание инструкции...")
    start_guide = current_dir / 'START.md'
    
    with open(start_guide, 'w', encoding='utf-8') as f:
        f.write('''# 🚀 Быстрый старт

## Вариант 1: С Node.js (Рекомендуется)

```bash
# Установите зависимости
npm install

# Запустите сервер
npm start

# Откройте в браузере
# http://localhost:8080
```

## Вариант 2: Python HTTP Server

```bash
# Python 3
python -m http.server 8080

# Откройте в браузере
# http://localhost:8080
```

## Вариант 3: VS Code Live Server

1. Установите расширение "Live Server"
2. Откройте index.html
3. Нажмите "Go Live" внизу справа

## Вариант 4: Просто откройте файл

⚠️ Некоторые браузеры блокируют загрузку файлов через file://
Используйте локальный сервер для лучшей работы!

---

## 🎮 Управление

- **🍔 Покормить** - увеличивает голод
- **🎮 Играть** - увеличивает счастье
- **😴 Спать** - восстанавливает энергию
- **💃 Танцевать** - веселье!

## 🔗 Web3

1. Установите MetaMask
2. Добавьте Ritual Testnet
3. Нажмите "Подключить кошелек"

Подробности в README.md
''')
    print("  ✓ START.md создан")
    
    print("\n" + "="*60)
    print("✅ НАСТРОЙКА ЗАВЕРШЕНА!")
    print("="*60)
    
    print("\n📁 Структура проекта:")
    print(f"  {current_dir}/")
    print("  ├── index.html       - Главная страница")
    print("  ├── game.js          - Игровая логика")
    print("  ├── web3.js          - Web3 интеграция")
    print("  ├── contracts/       - Смарт-контракты")
    print("  ├── README.md        - Документация")
    print("  └── START.md         - Инструкция по запуску")
    
    print("\n🚀 Следующие шаги:")
    print("\n1. Запустите локальный сервер:")
    print("   npm install")
    print("   npm start")
    print("\n2. Откройте в браузере:")
    print("   http://localhost:8080")
    print("\n3. Наслаждайтесь игрой!")
    
    print("\n📚 Документация:")
    print("   - README.md - полная документация")
    print("   - START.md - быстрый старт")
    
    return True

if __name__ == "__main__":
    try:
        success = setup_project()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        exit(1)
