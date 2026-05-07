import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EvolutionManager } from './evolution.js';

// Game variables
let scene, camera, renderer, controls;
let character, mixer, animations = {};
let currentAnimation = null;

// Player level for evolution system
let playerLevel = 0;
let playerXP = 0;
const XP_PER_LEVEL = 10;

// Evolution system
let evolutionManager = null;

// IndexedDB for persistence
let animationDB = null;

// Pet stats
let petStats = {
    hunger: 70,
    happiness: 80,
    energy: 60
};

// Textures
let textures = {
    diffuse: null,
    normal: null
};

// Initialize IndexedDB
function initIndexedDB() {
    const request = indexedDB.open('MySiggyDB', 2);
    
    request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
    };
    
    request.onsuccess = (event) => {
        animationDB = event.target.result;
        console.log('IndexedDB initialized successfully');
    };
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create animations object store if it doesn't exist
        if (!db.objectStoreNames.contains('animations')) {
            db.createObjectStore('animations', { keyPath: 'name' });
            console.log('Created animations object store');
        }
        
        // Create evolutionState object store if it doesn't exist
        if (!db.objectStoreNames.contains('evolutionState')) {
            db.createObjectStore('evolutionState', { keyPath: 'id' });
            console.log('Created evolutionState object store');
        }
        
        // Create particleTextures object store if it doesn't exist
        if (!db.objectStoreNames.contains('particleTextures')) {
            db.createObjectStore('particleTextures', { keyPath: 'id' });
            console.log('Created particleTextures object store');
        }
    };
}

// Initialize scene
function init() {
    // Initialize IndexedDB first
    initIndexedDB();

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // Camera
    const container = document.getElementById('canvas-container');
    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 3);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Floor
    const floorGeometry = new THREE.CircleGeometry(5, 32);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Load textures first
    loadTextures();

    // Responsive
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();

    // Start game loop
    startGameLoop();
}

// Load textures
function loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    let texturesLoaded = 0;
    const totalTextures = 2;
    
    function checkAllLoaded() {
        texturesLoaded++;
        if (texturesLoaded === totalTextures) {
            console.log('All textures loaded, loading character...');
            loadCharacter();
        }
    }
    
    // Diffuse texture
    textureLoader.load(
        'textures/e8ac44da4f2641a190a3b03367783ead_RGB_gltf_embedded_1.png',
        (texture) => {
            console.log('Diffuse texture loaded');
            textures.diffuse = texture;
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.error('Error loading diffuse texture:', error);
            checkAllLoaded();
        }
    );
    
    // Normal map
    textureLoader.load(
        'textures/b8f21768cc7b42c5b27adb3c1e2bcf37_N_gltf_embedded_3.png',
        (texture) => {
            console.log('Normal texture loaded');
            textures.normal = texture;
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.error('Error loading normal texture:', error);
            checkAllLoaded();
        }
    );
}

// Apply textures to model
function applyTextures(model) {
    console.log('Applying textures to model...');
    
    model.traverse((child) => {
        if (child.isMesh) {
            // Create new material with textures
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.8,
                metalness: 0.2
            });
            
            if (textures.diffuse) {
                material.map = textures.diffuse;
                material.needsUpdate = true;
            }
            
            if (textures.normal) {
                material.normalMap = textures.normal;
                material.needsUpdate = true;
            }
            
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
            
            console.log('Applied textures to mesh:', child.name);
        }
    });
}

// Load character with all animations from single GLB file
function loadCharacter() {
    const gltfLoader = new GLTFLoader();
    
    console.log('Loading unified GLTF model with all animations...');
    
    // Используй свой объединенный .glb файл
    // Если файл называется по-другому, измени путь
    const modelPath = 'models/character-with-animations.glb'; // или .gltf
    
    gltfLoader.load(
        modelPath,
        (gltf) => {
            console.log('✅ GLTF loaded successfully');
            character = gltf.scene;
            
            // Apply textures
            applyTextures(character);
            
            // Scale and position
            const box = new THREE.Box3().setFromObject(character);
            const size = box.getSize(new THREE.Vector3());
            const scale = 2 / Math.max(size.x, size.y, size.z);
            character.scale.multiplyScalar(scale);
            
            const center = box.getCenter(new THREE.Vector3());
            character.position.sub(center.multiplyScalar(scale));
            character.position.y = 0;
            
            scene.add(character);
            
            // Setup animation mixer
            mixer = new THREE.AnimationMixer(character);
            
            // Load ALL animations from the GLB file
            if (gltf.animations && gltf.animations.length > 0) {
                console.log(`📦 Found ${gltf.animations.length} animations in GLB file`);
                
                gltf.animations.forEach((clip) => {
                    // Создаем action для каждой анимации
                    const action = mixer.clipAction(clip);
                    
                    // Сохраняем по имени (которое ты задал в Blender)
                    animations[clip.name] = action;
                    
                    console.log(`  ✓ Loaded animation: ${clip.name} (${clip.duration.toFixed(2)}s)`);
                });
                
                // Кэшируем анимации в IndexedDB для еще более быстрой загрузки
                cacheAnimationsToIndexedDB(gltf.animations);
                
                // Создаем UI селектор для всех анимаций
                populateAnimationSelector();
            } else {
                console.warn('⚠️ No animations found in GLB file');
            }
            
            // Initialize evolution system
            initializeEvolutionSystem();
            
            // Hide loading screen
            document.getElementById('loading').classList.add('hidden');
            
            console.log('🎮 Game ready! Total animations:', Object.keys(animations).length);
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            const loadingBar = document.querySelector('.loading-bar-fill');
            const loadingPercentage = document.querySelector('.loading-percentage');
            
            if (loadingBar) loadingBar.style.width = `${percent}%`;
            if (loadingPercentage) loadingPercentage.textContent = `${percent}%`;
            
            console.log(`Loading: ${percent}%`);
        },
        (error) => {
            console.error('❌ Error loading model:', error);
            document.getElementById('loading').innerHTML = 
                '<div style="color: red;">Error loading model. Check console.</div>';
        }
    );
}

// Populate animation selector UI
function populateAnimationSelector() {
    const animationSelect = document.getElementById('animation-list');
    if (!animationSelect) return;
    
    // Очищаем существующие опции
    animationSelect.innerHTML = '<option value="">Select Animation</option>';
    
    // Маппинг имен анимаций на эмодзи (настрой под свои названия)
    const animationLabels = {
        // Основные действия
        'Idle': '🧍 Idle',
        'Walk': '🚶 Walk',
        'Run': '🏃 Run',
        'Jump': '🦘 Jump',
        
        // Эмоции
        'Happy': '😊 Happy',
        'Sad': '😢 Sad',
        'Angry': '😠 Angry',
        'Excited': '🤩 Excited',
        'Crying': '😭 Crying',
        'Laughing': '😂 Laughing',
        
        // Танцы
        'Dance': '💃 Dance',
        'Hip Hop Dancing': '🕺 Hip Hop',
        'Dancing Twerk': '💃 Twerk',
        'Dancing Maraschino Step': '🎵 Maraschino',
        'Dancing Running Man': '🏃 Running Man',
        'Northern Soul Dance': '🎶 Soul Dance',
        
        // Действия
        'Eating': '🍔 Eating',
        'Drinking': '🥤 Drinking',
        'Sleeping': '😴 Sleeping',
        'Sitting': '🪑 Sitting',
        
        // Боевые
        'Punch': '👊 Punch',
        'Kick': '🦵 Kick',
        'Boxing': '🥊 Boxing',
        
        // Другие
        'Wave': '👋 Wave',
        'Clap': '👏 Clap',
        'Flair': '✨ Flair'
    };
    
    // Добавляем все загруженные анимации
    Object.keys(animations).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = animationLabels[name] || `🎬 ${name}`;
        animationSelect.appendChild(option);
    });
    
    console.log(`📋 Animation selector populated with ${Object.keys(animations).length} animations`);
}

// Cache animations to IndexedDB for faster subsequent loads
async function cacheAnimationsToIndexedDB(animationClips) {
    if (!animationDB) {
        console.warn('IndexedDB not available for animation caching');
        return;
    }
    
    try {
        const transaction = animationDB.transaction(['animations'], 'readwrite');
        const store = transaction.objectStore('animations');
        
        for (const clip of animationClips) {
            // Сохраняем метаданные анимации
            const animData = {
                name: clip.name,
                duration: clip.duration,
                tracks: clip.tracks.length,
                cached: Date.now()
            };
            
            await new Promise((resolve, reject) => {
                const request = store.put(animData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        console.log('💾 Animations metadata cached to IndexedDB');
    } catch (error) {
        console.warn('Failed to cache animations:', error);
    }
}

// Play animation
function playAnimation(name) {
    if (!mixer || !animations[name]) {
        console.log(`Animation ${name} not found`);
        return;
    }

    // Stop current animation
    if (currentAnimation) {
        currentAnimation.fadeOut(0.5);
    }

    // Play new animation
    currentAnimation = animations[name];
    currentAnimation.reset().fadeIn(0.5).play();
    
    console.log(`Playing animation: ${name}`);
}

// Animation loop
const clock = new THREE.Clock();
let lastTimestamp = 0;

function animate(timestamp = 0) {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    
    if (mixer) {
        mixer.update(delta);
    }

    // Update evolution system
    if (evolutionManager) {
        evolutionManager.update(timestamp, delta);
    }

    controls.update();
    renderer.render(scene, camera);
    
    lastTimestamp = timestamp;
}

// Responsive
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Game logic
function startGameLoop() {
    setInterval(() => {
        // Decrease stats over time
        petStats.hunger = Math.max(0, petStats.hunger - 1);
        petStats.happiness = Math.max(0, petStats.happiness - 0.5);
        petStats.energy = Math.max(0, petStats.energy - 0.3);

        updateStatsUI();

        // Auto reactions
        if (petStats.hunger < 30 && animations['no_food']) {
            playAnimation('no_food');
        }
        if (petStats.energy < 20 && animations['nervous']) {
            playAnimation('nervous');
        }
    }, 3000);
}

// Update stats UI
function updateStatsUI() {
    document.getElementById('hunger-bar').style.width = petStats.hunger + '%';
    document.getElementById('happiness-bar').style.width = petStats.happiness + '%';
    document.getElementById('energy-bar').style.width = petStats.energy + '%';
}

// Initialize evolution system
async function initializeEvolutionSystem() {
    if (!character || !scene || !animationDB) {
        console.warn('Cannot initialize evolution system: missing dependencies');
        return;
    }

    try {
        evolutionManager = new EvolutionManager(scene, character, animationDB);
        await evolutionManager.initialize();
        console.log('Evolution system initialized');
    } catch (error) {
        console.error('Failed to initialize evolution system:', error);
    }
}

// Add XP and check for level up
function addXP(amount) {
    playerXP += amount;
    
    // Check for level up
    while (playerXP >= XP_PER_LEVEL) {
        playerXP -= XP_PER_LEVEL;
        playerLevel++;
        console.log(`Level up! Now level ${playerLevel}`);
        
        // Update UI
        updateLevelUI();
        
        // Check for evolution
        if (evolutionManager) {
            evolutionManager.checkEvolution(playerLevel);
        }
    }
    
    // Update XP bar
    updateLevelUI();
}

// Update level display
function updateLevelUI() {
    const levelBadge = document.getElementById('level-badge');
    const xpFill = document.getElementById('xp-fill-top');
    
    if (levelBadge) {
        levelBadge.textContent = `Level ${playerLevel}`;
    }
    
    if (xpFill) {
        const xpPercent = (playerXP / XP_PER_LEVEL) * 100;
        xpFill.style.width = `${xpPercent}%`;
    }
}

// Export functions for HTML
window.feedPet = async function() {
    petStats.hunger = Math.min(100, petStats.hunger + 30);
    petStats.happiness = Math.min(100, petStats.happiness + 10);
    updateStatsUI();
    addXP(2); // Grant 2 XP for feeding
    if (animations['jump']) playAnimation('jump');
    console.log('Fed the pet!');
};

window.playWithPet = async function() {
    petStats.happiness = Math.min(100, petStats.happiness + 30);
    petStats.energy = Math.max(0, petStats.energy - 10);
    updateStatsUI();
    addXP(3); // Grant 3 XP for playing
    if (animations['dance']) playAnimation('dance');
    console.log('Playing with pet!');
};

window.sleepPet = async function() {
    petStats.energy = Math.min(100, petStats.energy + 40);
    petStats.happiness = Math.min(100, petStats.happiness + 5);
    updateStatsUI();
    addXP(1); // Grant 1 XP for sleeping
    if (animations['walk']) playAnimation('walk');
    console.log('Pet is sleeping!');
};

window.dancePet = async function() {
    petStats.happiness = Math.min(100, petStats.happiness + 20);
    petStats.energy = Math.max(0, petStats.energy - 15);
    updateStatsUI();
    addXP(3); // Grant 3 XP for dancing
    if (animations['flair']) playAnimation('flair');
    console.log('Pet is dancing!');
};

// Web3 connection
document.getElementById('connect-wallet').addEventListener('click', async () => {
    console.log('Connecting to wallet...');
    alert('Web3 wallet connection (in development)');
});

// Export for evolution system
export { animationDB, playerLevel };

// Start game
init();
