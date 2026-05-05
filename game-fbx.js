import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Game variables
let scene, camera, renderer, controls;
let character, mixer, animations = {};
let currentAnimation = null;

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

// Initialize scene
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

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
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.CircleGeometry(5, 32);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x90EE90
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Load textures and character
    loadTextures();

    window.addEventListener('resize', onWindowResize);
    animate();
    startGameLoop();
}

// Load textures
function loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    Promise.all([
        new Promise((resolve) => {
            textureLoader.load(
                'textures/e8ac44da4f2641a190a3b03367783ead_RGB_gltf_embedded_1.png',
                (texture) => {
                    textures.diffuse = texture;
                    console.log('✓ Diffuse texture loaded');
                    resolve();
                },
                undefined,
                () => resolve()
            );
        }),
        new Promise((resolve) => {
            textureLoader.load(
                'textures/b8f21768cc7b42c5b27adb3c1e2bcf37_N_gltf_embedded_3.png',
                (texture) => {
                    textures.normal = texture;
                    console.log('✓ Normal texture loaded');
                    resolve();
                },
                undefined,
                () => resolve()
            );
        })
    ]).then(() => {
        console.log('All textures loaded, loading character...');
        loadCharacter();
    });
}

// Load character
function loadCharacter() {
    const fbxLoader = new FBXLoader();
    
    fbxLoader.load(
        'models/base-model.fbx',
        (fbx) => {
            console.log('✓ FBX model loaded');
            character = fbx;
            
            // Apply textures
            character.traverse((child) => {
                if (child.isMesh) {
                    const material = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.7,
                        metalness: 0.1
                    });
                    
                    if (textures.diffuse) {
                        material.map = textures.diffuse;
                    }
                    if (textures.normal) {
                        material.normalMap = textures.normal;
                    }
                    
                    child.material = material;
                    child.castShadow = true;
                    console.log('✓ Applied textures to:', child.name);
                }
            });
            
            // Scale
            character.scale.set(0.01, 0.01, 0.01);
            scene.add(character);
            
            // Setup mixer
            mixer = new THREE.AnimationMixer(character);
            
            // Load animations
            loadAnimations();
            
            document.getElementById('loading').classList.add('hidden');
        },
        (progress) => {
            console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        },
        (error) => {
            console.error('Error loading FBX:', error);
            document.getElementById('loading').innerHTML = 
                '<div style="color: red;">Error: ' + error.message + '</div>';
        }
    );
}

// Load animations
function loadAnimations() {
    const fbxLoader = new FBXLoader();
    const animationFiles = [
        { name: 'walk', file: 'animations/Female Walk.fbx', label: '🚶 Walk' },
        { name: 'dance', file: 'animations/Hip Hop Dancing.fbx', label: '💃 Dance' },
        { name: 'jump', file: 'animations/Jump.fbx', label: '🦘 Jump' },
        { name: 'kick', file: 'animations/kick.fbx', label: '🦵 Kick' },
        { name: 'nervous', file: 'animations/Nervously Look Around.fbx', label: '😰 Nervous' },
        { name: 'no_food', file: 'animations/no food.fbx', label: '😢 Hungry' },
        { name: 'flair', file: 'animations/Flair.fbx', label: '✨ Flair' }
    ];

    const animationSelect = document.getElementById('animation-list');
    
    animationFiles.forEach(({ name, file, label }) => {
        fbxLoader.load(
            file,
            (fbx) => {
                if (fbx.animations && fbx.animations.length > 0) {
                    const clip = fbx.animations[0];
                    animations[name] = mixer.clipAction(clip);
                    
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = label;
                    animationSelect.appendChild(option);
                    
                    console.log(`✓ Animation ${name} loaded`);
                }
            },
            undefined,
            (error) => console.error(`Error loading ${name}:`, error)
        );
    });

    animationSelect.addEventListener('change', (e) => {
        playAnimation(e.target.value);
    });
}

// Play animation
function playAnimation(name) {
    if (!animations[name]) {
        console.log(`Animation ${name} not ready yet`);
        return;
    }

    if (currentAnimation) {
        currentAnimation.fadeOut(0.5);
    }

    currentAnimation = animations[name];
    currentAnimation.reset().fadeIn(0.5).play();
    console.log(`▶ Playing: ${name}`);
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
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
        petStats.hunger = Math.max(0, petStats.hunger - 1);
        petStats.happiness = Math.max(0, petStats.happiness - 0.5);
        petStats.energy = Math.max(0, petStats.energy - 0.3);
        updateStatsUI();
    }, 3000);
}

function updateStatsUI() {
    document.getElementById('hunger-bar').style.width = petStats.hunger + '%';
    document.getElementById('happiness-bar').style.width = petStats.happiness + '%';
    document.getElementById('energy-bar').style.width = petStats.energy + '%';
}

// Actions
window.feedPet = () => {
    petStats.hunger = Math.min(100, petStats.hunger + 30);
    petStats.happiness = Math.min(100, petStats.happiness + 10);
    updateStatsUI();
    playAnimation('jump');
};

window.playWithPet = () => {
    petStats.happiness = Math.min(100, petStats.happiness + 30);
    petStats.energy = Math.max(0, petStats.energy - 10);
    updateStatsUI();
    playAnimation('dance');
};

window.sleepPet = () => {
    petStats.energy = Math.min(100, petStats.energy + 40);
    petStats.happiness = Math.min(100, petStats.happiness + 5);
    updateStatsUI();
    playAnimation('walk');
};

window.dancePet = () => {
    petStats.happiness = Math.min(100, petStats.happiness + 20);
    petStats.energy = Math.max(0, petStats.energy - 15);
    updateStatsUI();
    playAnimation('flair');
};

document.getElementById('connect-wallet').addEventListener('click', () => {
    alert('Web3 wallet connection (in development)');
});

init();
