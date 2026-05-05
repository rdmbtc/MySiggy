import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

// Load character
function loadCharacter() {
    const gltfLoader = new GLTFLoader();
    
    console.log('Loading GLTF model...');
    
    gltfLoader.load(
        'models/model.gltf',
        (gltf) => {
            console.log('GLTF loaded successfully');
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
            
            // Setup animations
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(character);
                gltf.animations.forEach((clip) => {
                    animations[clip.name] = mixer.clipAction(clip);
                });
            }
            
            // Load additional animations
            loadAnimations();
            
            document.getElementById('loading').classList.add('hidden');
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            console.log(`Loading: ${percent}%`);
        },
        (error) => {
            console.error('Error loading model:', error);
            document.getElementById('loading').innerHTML = 
                '<div style="color: red;">Error loading model. Check console.</div>';
        }
    );
}

// Load additional animations
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
                    clip.name = name;
                    
                    if (mixer && character) {
                        // Apply textures to FBX model
                        applyTextures(fbx);
                        
                        animations[name] = mixer.clipAction(clip);
                        
                        // Add to selector
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = label;
                        animationSelect.appendChild(option);
                        
                        console.log(`Animation ${name} loaded`);
                    }
                }
            },
            undefined,
            (error) => {
                console.error(`Error loading animation ${name}:`, error);
            }
        );
    });

    // Animation selector handler
    animationSelect.addEventListener('change', (e) => {
        playAnimation(e.target.value);
    });
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

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    
    if (mixer) {
        mixer.update(delta);
    }

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

// Export functions for HTML
window.feedPet = async function() {
    petStats.hunger = Math.min(100, petStats.hunger + 30);
    petStats.happiness = Math.min(100, petStats.happiness + 10);
    updateStatsUI();
    if (animations['jump']) playAnimation('jump');
    console.log('Fed the pet!');
};

window.playWithPet = async function() {
    petStats.happiness = Math.min(100, petStats.happiness + 30);
    petStats.energy = Math.max(0, petStats.energy - 10);
    updateStatsUI();
    if (animations['dance']) playAnimation('dance');
    console.log('Playing with pet!');
};

window.sleepPet = async function() {
    petStats.energy = Math.min(100, petStats.energy + 40);
    petStats.happiness = Math.min(100, petStats.happiness + 5);
    updateStatsUI();
    if (animations['walk']) playAnimation('walk');
    console.log('Pet is sleeping!');
};

window.dancePet = async function() {
    petStats.happiness = Math.min(100, petStats.happiness + 20);
    petStats.energy = Math.max(0, petStats.energy - 15);
    updateStatsUI();
    if (animations['flair']) playAnimation('flair');
    console.log('Pet is dancing!');
};

// Web3 connection
document.getElementById('connect-wallet').addEventListener('click', async () => {
    console.log('Connecting to wallet...');
    alert('Web3 wallet connection (in development)');
});

// Start game
init();
