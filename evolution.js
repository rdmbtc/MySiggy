/**
 * Pet Evolution System
 * Manages pet growth stages and visual transformations
 */

// Evolution configuration defining three growth stages
export const EVOLUTION_CONFIG = {
  stages: [
    { name: 'Baby', scale: 0.7, level: 0 },
    { name: 'Teen', scale: 1.0, level: 5 },
    { name: 'Adult', scale: 1.3, level: 10 }
  ]
};

/**
 * EvolutionState class
 * Tracks the current evolution state of the pet
 */
export class EvolutionState {
  constructor() {
    this.currentStage = 'Baby';
    this.currentScale = 0.7;
    this.isEvolving = false;
    this.baseScale = 2.0; // Will be set from character loading
  }

  /**
   * Convert state to JSON for persistence
   * @returns {Object} Serializable state object
   */
  toJSON() {
    return {
      stage: this.currentStage,
      scale: this.currentScale,
      level: typeof window !== 'undefined' && window.playerLevel !== undefined ? window.playerLevel : 0,
      timestamp: Date.now()
    };
  }

  /**
   * Load state from JSON
   * @param {Object} data - Saved state data
   */
  fromJSON(data) {
    if (data && typeof data === 'object') {
      this.currentStage = data.stage || 'Baby';
      this.currentScale = data.scale || 0.7;
    } else {
      // Reset to defaults if data is invalid
      this.currentStage = 'Baby';
      this.currentScale = 0.7;
    }
  }
}

/**
 * EvolutionPersistence class
 * Handles saving and loading evolution state to/from IndexedDB
 */
export class EvolutionPersistence {
  constructor(db) {
    this.db = db;
  }

  /**
   * Initialize evolution state by loading from storage or using defaults
   * @returns {Promise<Object>} Evolution state object with stage, scale, and level
   */
  async initialize() {
    try {
      // Attempt to load saved state
      const savedState = await this.load();
      
      // If no saved state, return default Baby stage
      if (!savedState) {
        console.log('No saved state found, initializing to Baby stage');
        return {
          stage: 'Baby',
          scale: 0.7,
          level: 0
        };
      }
      
      // Validate loaded state
      if (!this.isValidState(savedState)) {
        console.warn('Corrupted evolution state detected, resetting to Baby stage');
        return {
          stage: 'Baby',
          scale: 0.7,
          level: 0
        };
      }
      
      console.log('Evolution state initialized from storage:', savedState);
      return {
        stage: savedState.stage,
        scale: savedState.scale,
        level: savedState.level || 0
      };
      
    } catch (error) {
      console.error('Error initializing evolution state:', error);
      console.log('Falling back to default Baby stage');
      return {
        stage: 'Baby',
        scale: 0.7,
        level: 0
      };
    }
  }

  /**
   * Validate evolution state data
   * @param {Object} state - State object to validate
   * @returns {boolean} True if state is valid
   */
  isValidState(state) {
    if (!state || typeof state !== 'object') {
      return false;
    }
    
    // Check if stage is one of the valid stages
    const validStages = EVOLUTION_CONFIG.stages.map(s => s.name);
    if (!validStages.includes(state.stage)) {
      return false;
    }
    
    // Check if scale is a valid number
    if (typeof state.scale !== 'number' || isNaN(state.scale) || state.scale <= 0) {
      return false;
    }
    
    // Check if level is a valid number (if present)
    if (state.level !== undefined && (typeof state.level !== 'number' || isNaN(state.level) || state.level < 0)) {
      return false;
    }
    
    return true;
  }

  /**
   * Save evolution state to IndexedDB
   * @param {string} stage - Current evolution stage
   * @param {number} scale - Current scale multiplier
   * @param {number} level - Current player level
   * @returns {Promise<void>}
   */
  async save(stage, scale, level) {
    if (!this.db) {
      console.warn('IndexedDB not available, state will not persist');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['evolutionState'], 'readwrite');
        const store = transaction.objectStore('evolutionState');
        
        const data = {
          id: 'current',
          stage: stage,
          scale: scale,
          level: level,
          timestamp: Date.now()
        };
        
        const request = store.put(data);
        
        request.onsuccess = () => {
          console.log('Evolution state saved:', data);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Failed to save evolution state:', event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error('Error saving evolution state:', error);
        reject(error);
      }
    });
  }

  /**
   * Load evolution state from IndexedDB
   * @returns {Promise<Object|null>} Saved state or null if not found
   */
  async load() {
    if (!this.db) {
      console.warn('IndexedDB not available, returning null');
      return null;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['evolutionState'], 'readonly');
        const store = transaction.objectStore('evolutionState');
        const request = store.get('current');
        
        request.onsuccess = (event) => {
          const data = event.target.result;
          if (data) {
            console.log('Evolution state loaded:', data);
            resolve(data);
          } else {
            console.log('No saved evolution state found');
            resolve(null);
          }
        };
        
        request.onerror = (event) => {
          console.error('Failed to load evolution state:', event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error('Error loading evolution state:', error);
        reject(error);
      }
    });
  }
}

/**
 * ScaleManager class
 * Handles smooth scale transitions for the character model during evolution
 * Validates: Requirements 3.4, 8.4
 */
export class ScaleManager {
  /**
   * Create a new ScaleManager
   * @param {THREE.Object3D} character - The Three.js character model to scale
   * @param {number} baseScale - The base scale value of the character
   */
  constructor(character, baseScale) {
    this.character = character;
    this.baseScale = baseScale;
    this.targetScale = baseScale;
    this.currentScale = baseScale;
    this.startScale = baseScale;
    this.isInterpolating = false;
    this.startTime = null; // Use null instead of 0 to distinguish uninitialized state
    this.duration = 1000; // 1 second (1000ms) as per Requirement 3.4
  }

  /**
   * Set a new target scale and initiate interpolation
   * @param {number} multiplier - The scale multiplier to apply (e.g., 0.7, 1.0, 1.3)
   */
  setTargetScale(multiplier) {
    // Store the current scale as the starting point
    this.startScale = this.currentScale;
    
    // Calculate the new target scale by applying the multiplier to baseScale
    this.targetScale = this.baseScale * multiplier;
    
    // Mark interpolation as active
    this.isInterpolating = true;
    
    // Record the start time (will be set on first update call)
    this.startTime = null;
  }

  /**
   * Update the character scale based on elapsed time
   * Called each frame via requestAnimationFrame (Requirement 8.4)
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  update(timestamp) {
    // If not interpolating, nothing to do
    if (!this.isInterpolating) {
      return;
    }

    // Initialize start time on first update call
    if (this.startTime === null) {
      this.startTime = timestamp;
    }

    // Calculate elapsed time
    const elapsed = timestamp - this.startTime;

    // Check if interpolation is complete
    if (elapsed >= this.duration) {
      // Set final scale and stop interpolating
      this.currentScale = this.targetScale;
      this.isInterpolating = false;
      
      // Apply final scale to character
      if (this.character) {
        this.character.scale.set(this.currentScale, this.currentScale, this.currentScale);
      }
      return;
    }

    // Calculate normalized time (0 to 1)
    const t = elapsed / this.duration;

    // Apply ease-in-out cubic easing function
    const eased = this.easeInOutCubic(t);

    // Linear interpolation between start and target scale
    this.currentScale = this.lerp(this.startScale, this.targetScale, eased);

    // Apply the interpolated scale to the character
    if (this.character) {
      this.character.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }
  }

  /**
   * Ease-in-out cubic easing function
   * Provides smooth acceleration and deceleration
   * @param {number} t - Normalized time value (0 to 1)
   * @returns {number} Eased value (0 to 1)
   */
  easeInOutCubic(t) {
    // Ease-in-out cubic formula:
    // t < 0.5 ? 4 * t³ : 1 - Math.pow(-2 * t + 2, 3) / 2
    if (t < 0.5) {
      return 4 * t * t * t;
    } else {
      return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  }

  /**
   * Linear interpolation between two values
   * @param {number} start - Starting value
   * @param {number} end - Ending value
   * @param {number} t - Interpolation factor (0 to 1)
   * @returns {number} Interpolated value
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  }
}

/**
 * Create particle texture for evolution animation
 * Generates a 64x64 radial gradient texture (yellow to orange with alpha fade)
 * Validates: Requirements 4.2, 8.2
 * @param {IDBDatabase} db - IndexedDB database instance for caching
 * @returns {Promise<THREE.CanvasTexture|null>} Canvas texture or null on failure
 */
export async function createParticleTexture(db = null) {
  try {
    // Check if texture is cached in IndexedDB
    if (db) {
      const cachedTexture = await loadParticleTextureFromCache(db);
      if (cachedTexture) {
        console.log('Particle texture loaded from cache');
        return cachedTexture;
      }
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Create radial gradient from center
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    
    // Yellow center with full opacity
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    
    // Orange middle with 50% opacity
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.5)');
    
    // Orange edge with 0% opacity (fade out)
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Create THREE.js texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Cache texture in IndexedDB for future use
    if (db) {
      await saveParticleTextureToCache(db, canvas);
    }

    console.log('Particle texture generated successfully');
    return texture;

  } catch (error) {
    console.error('Failed to create particle texture:', error);
    return null; // Will trigger fallback material in ParticleSystem
  }
}

/**
 * Load particle texture from IndexedDB cache
 * @param {IDBDatabase} db - IndexedDB database instance
 * @returns {Promise<THREE.CanvasTexture|null>} Cached texture or null if not found
 */
async function loadParticleTextureFromCache(db) {
  if (!db) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(['particleTextures'], 'readonly');
      const store = transaction.objectStore('particleTextures');
      const request = store.get('evolutionParticle');

      request.onsuccess = (event) => {
        const data = event.target.result;
        if (data && data.imageData) {
          // Reconstruct canvas from cached image data
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          
          // Create ImageData from stored data
          const imageData = new ImageData(
            new Uint8ClampedArray(data.imageData),
            64,
            64
          );
          ctx.putImageData(imageData, 0, 0);

          // Create THREE.js texture from reconstructed canvas
          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          resolve(texture);
        } else {
          resolve(null);
        }
      };

      request.onerror = (event) => {
        console.warn('Failed to load particle texture from cache:', event.target.error);
        resolve(null);
      };
    } catch (error) {
      console.warn('Error loading particle texture from cache:', error);
      resolve(null);
    }
  });
}

/**
 * Save particle texture to IndexedDB cache
 * @param {IDBDatabase} db - IndexedDB database instance
 * @param {HTMLCanvasElement} canvas - Canvas element containing texture
 * @returns {Promise<void>}
 */
async function saveParticleTextureToCache(db, canvas) {
  if (!db) {
    console.warn('IndexedDB not available, texture will not be cached');
    return;
  }

  return new Promise((resolve) => {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, 64, 64);

      const transaction = db.transaction(['particleTextures'], 'readwrite');
      const store = transaction.objectStore('particleTextures');

      const data = {
        id: 'evolutionParticle',
        imageData: Array.from(imageData.data), // Convert Uint8ClampedArray to regular array
        timestamp: Date.now()
      };

      const request = store.put(data);

      request.onsuccess = () => {
        console.log('Particle texture cached successfully');
        resolve();
      };

      request.onerror = (event) => {
        console.warn('Failed to cache particle texture:', event.target.error);
        resolve(); // Don't reject, caching is optional
      };
    } catch (error) {
      console.warn('Error caching particle texture:', error);
      resolve(); // Don't reject, caching is optional
    }
  });
}

/**
 * ParticleData structure
 * Stores individual particle state for animation
 */
class ParticleData {
  constructor(position, velocity, angle, lifetime) {
    this.position = position; // THREE.Vector3
    this.velocity = velocity; // THREE.Vector3
    this.angle = angle; // Initial angle for helical motion
    this.lifetime = lifetime; // Total lifetime in seconds
    this.age = 0; // Current age in seconds
  }
}

/**
 * ParticleSystem class
 * Manages particle effects for evolution animations
 * Validates: Requirements 4.2, 4.3, 8.3, 9.4
 */
export class ParticleSystem {
  /**
   * Create a new ParticleSystem
   * @param {THREE.Scene} scene - The Three.js scene to add particles to
   * @param {THREE.Object3D} character - The character model to emit particles around
   */
  constructor(scene, character) {
    this.scene = scene;
    this.character = character;
    this.particles = null; // THREE.Points instance
    this.particleData = []; // Array of ParticleData
    this.geometry = null; // Reusable BufferGeometry
    this.material = null; // PointsMaterial
    this.isActive = false;
    this.texture = null; // Will be set when start() is called
  }

  /**
   * Start the particle animation
   * Creates 50-100 particles around the character
   * Validates: Requirements 4.2, 8.3, 9.4
   * @param {THREE.Texture} texture - Optional particle texture (uses fallback if null)
   */
  async start(texture = null) {
    // Store texture for use
    this.texture = texture;

    // Generate random particle count between 50 and 100
    const particleCount = Math.floor(Math.random() * 51) + 50; // 50-100 particles

    // Create reusable BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    
    // Initialize position and opacity arrays
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    // Get character position
    const charPos = this.character.position.clone();

    // Initialize particle data
    this.particleData = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Random angle around character
      const angle = Math.random() * Math.PI * 2;
      
      // Random radius within 0.5 units of character
      const radius = Math.random() * 0.5;
      
      // Random height offset
      const heightOffset = (Math.random() - 0.5) * 0.3;
      
      // Calculate initial position around character
      const x = charPos.x + radius * Math.cos(angle);
      const y = charPos.y + heightOffset;
      const z = charPos.z + radius * Math.sin(angle);
      
      // Set position in buffer
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Initial opacity
      opacities[i] = 1.0;
      
      // Create particle data
      const position = new THREE.Vector3(x, y, z);
      const velocity = new THREE.Vector3(0, 1.0, 0); // Upward velocity
      const lifetime = 2.0; // 2 seconds as per Requirement 4.3
      
      this.particleData.push(new ParticleData(position, velocity, angle, lifetime));
    }

    // Set geometry attributes
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // Create material with additive blending
    this.material = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false
    });

    // Apply texture if available, otherwise use fallback color
    if (this.texture) {
      this.material.map = this.texture;
      this.material.color.setHex(0xffffff); // White to show texture colors
    } else {
      // Fallback: solid yellow-orange color
      this.material.color.setHex(0xffcc66);
      console.warn('Particle texture not available, using fallback color');
    }

    // Create Points object
    this.particles = new THREE.Points(this.geometry, this.material);
    
    // Add to scene
    this.scene.add(this.particles);
    
    this.isActive = true;
    
    console.log(`Particle system started with ${particleCount} particles`);
  }

  /**
   * Update particle positions and opacity
   * Applies helical motion (spiral upward) and opacity fade
   * Validates: Requirements 4.3
   * @param {number} delta - Time elapsed since last frame in seconds
   */
  update(delta) {
    if (!this.isActive || !this.particles) {
      return;
    }

    const positions = this.geometry.attributes.position.array;
    const opacities = this.geometry.attributes.opacity.array;
    
    let allParticlesExpired = true;

    // Get character position for helical motion center
    const charPos = this.character.position.clone();

    // Update each particle
    for (let i = 0; i < this.particleData.length; i++) {
      const particle = this.particleData[i];
      
      // Increment age
      particle.age += delta;
      
      // Check if particle is still alive
      if (particle.age < particle.lifetime) {
        allParticlesExpired = false;
        
        // Calculate normalized time (0 to 1)
        const t = particle.age / particle.lifetime;
        
        // Helical motion parameters
        const angularVelocity = 2.0; // Radians per second
        const initialRadius = 0.5; // Starting radius
        const upwardVelocity = 1.5; // Units per second
        
        // Calculate current angle (spiral)
        const currentAngle = particle.angle + particle.age * angularVelocity;
        
        // Calculate current radius (shrinks over time)
        const currentRadius = initialRadius * (1 - t);
        
        // Calculate helical position
        const x = charPos.x + currentRadius * Math.cos(currentAngle);
        const y = charPos.y + particle.age * upwardVelocity;
        const z = charPos.z + currentRadius * Math.sin(currentAngle);
        
        // Update position in buffer
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Update particle position (for reference)
        particle.position.set(x, y, z);
        
        // Update opacity (fade out over lifetime)
        const opacity = 1 - t;
        opacities[i] = opacity;
        
      } else {
        // Particle expired, set opacity to 0
        opacities[i] = 0;
      }
    }

    // Mark attributes as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;

    // If all particles expired, stop the animation
    if (allParticlesExpired) {
      this.stop();
    }
  }

  /**
   * Stop the particle animation and clean up resources
   */
  stop() {
    if (!this.isActive) {
      return;
    }

    // Remove particles from scene
    if (this.particles) {
      this.scene.remove(this.particles);
    }

    // Clean up geometry and material
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    // Clear particle data
    this.particleData = [];
    this.particles = null;
    this.isActive = false;

    console.log('Particle system stopped and cleaned up');
  }
}

/**
 * GlowEffect class
 * Adds pulsing glow effect to character during evolution
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export class GlowEffect {
  /**
   * Create a new GlowEffect
   * @param {THREE.Object3D} character - The Three.js character model to apply glow to
   */
  constructor(character) {
    this.character = character;
    this.originalEmissive = new Map(); // Store original emissive values
    this.isActive = false;
    this.intensity = 0;
  }

  /**
   * Start the glow effect
   * Stores original emissive values and sets glow color
   * Validates: Requirement 9.1
   */
  start() {
    if (!this.character) {
      console.warn('Cannot start glow effect: character is null');
      return;
    }

    // Store original emissive values and apply glow color
    this.character.traverse((child) => {
      if (child.isMesh && child.material) {
        // Store original emissive color and intensity
        this.originalEmissive.set(child, {
          color: child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000),
          intensity: child.material.emissiveIntensity || 0
        });

        // Set glow color (warm yellow-orange: 0xffdd88)
        if (child.material.emissive) {
          child.material.emissive.setHex(0xffdd88);
        }
      }
    });

    this.isActive = true;
    console.log('Glow effect started');
  }

  /**
   * Update the glow effect with pulsing intensity
   * Uses sine wave at 4 Hz for smooth pulsing
   * Validates: Requirement 9.2
   * @param {number} time - Current time in seconds
   */
  update(time) {
    if (!this.isActive || !this.character) {
      return;
    }

    // Calculate pulsing intensity using sine wave at 4 Hz
    // Formula: sin(time * frequency * 2π) * 0.5 + 0.5
    // This produces a value between 0 and 1
    const frequency = 4; // 4 Hz (4 pulses per second)
    const pulse = Math.sin(time * frequency * Math.PI * 2) * 0.5 + 0.5;

    // Scale pulse to intensity range (0.3 to 0.8 for visible but not overwhelming glow)
    this.intensity = 0.3 + pulse * 0.5;

    // Apply pulsing intensity to all meshes
    this.character.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        child.material.emissiveIntensity = this.intensity;
      }
    });
  }

  /**
   * Stop the glow effect and restore original emissive values
   * Validates: Requirement 9.3
   */
  stop() {
    if (!this.isActive) {
      return;
    }

    // Restore original emissive values
    this.character.traverse((child) => {
      if (child.isMesh && child.material && this.originalEmissive.has(child)) {
        const original = this.originalEmissive.get(child);
        
        if (child.material.emissive) {
          child.material.emissive.copy(original.color);
        }
        
        child.material.emissiveIntensity = original.intensity;
      }
    });

    // Clear stored values
    this.originalEmissive.clear();
    this.isActive = false;
    this.intensity = 0;

    console.log('Glow effect stopped and original values restored');
  }
}

/**
 * NotificationManager class
 * Displays evolution notifications to the player
 * Validates: Requirements 5.1, 5.2, 5.3
 */
export class NotificationManager {
  constructor() {
    this.notificationElement = null;
    this.stageElement = null;
    this.hideTimeout = null;
  }

  /**
   * Initialize the notification manager
   * Finds and stores references to DOM elements
   */
  initialize() {
    this.notificationElement = document.getElementById('evolution-notification');
    this.stageElement = this.notificationElement?.querySelector('.evolution-stage');
    
    if (!this.notificationElement) {
      console.warn('Evolution notification element not found in DOM');
    }
  }

  /**
   * Show evolution notification with stage name
   * Validates: Requirements 5.1, 5.2, 5.3
   * @param {string} stageName - Name of the new evolution stage
   */
  show(stageName) {
    if (!this.notificationElement || !this.stageElement) {
      console.warn('Cannot show notification: elements not initialized');
      return;
    }

    // Update stage text
    this.stageElement.textContent = `Your pet is now a ${stageName}!`;

    // Show notification
    this.notificationElement.classList.remove('hidden');

    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Auto-hide after 3 seconds
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 3000);

    console.log(`Evolution notification shown: ${stageName}`);
  }

  /**
   * Hide the notification
   */
  hide() {
    if (this.notificationElement) {
      this.notificationElement.classList.add('hidden');
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

/**
 * EvolutionManager class
 * Orchestrates the complete evolution process
 * Validates: Requirements 2.3, 4.1, 4.4, 4.5, 7.2
 */
export class EvolutionManager {
  /**
   * Create a new EvolutionManager
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Object3D} character - Character model
   * @param {IDBDatabase} db - IndexedDB instance
   */
  constructor(scene, character, db) {
    this.scene = scene;
    this.character = character;
    this.db = db;
    
    // Initialize subsystems
    this.state = new EvolutionState();
    this.persistence = new EvolutionPersistence(db);
    this.scaleManager = null; // Will be initialized after character loads
    this.particleSystem = new ParticleSystem(scene, character);
    this.glowEffect = new GlowEffect(character);
    this.notificationManager = new NotificationManager();
    
    // Particle texture (will be loaded during initialization)
    this.particleTexture = null;
  }

  /**
   * Initialize the evolution system
   * Loads saved state and applies initial scale
   * Validates: Requirement 7.2
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize notification manager
      this.notificationManager.initialize();

      // Load particle texture
      this.particleTexture = await createParticleTexture(this.db);

      // Load saved evolution state
      const savedState = await this.persistence.initialize();
      
      if (savedState) {
        this.state.currentStage = savedState.stage;
        this.state.currentScale = savedState.scale;
        
        console.log(`Evolution state loaded: ${savedState.stage} (scale: ${savedState.scale})`);
      }

      // Initialize scale manager with character's base scale
      if (this.character) {
        // Get base scale from character (assuming uniform scale)
        this.state.baseScale = this.character.scale.x;
        this.scaleManager = new ScaleManager(this.character, this.state.baseScale);
        
        // Apply initial scale based on current stage
        const stageConfig = this.getCurrentStageConfig();
        if (stageConfig) {
          const targetScale = this.state.baseScale * stageConfig.scale;
          this.character.scale.set(targetScale, targetScale, targetScale);
          this.scaleManager.currentScale = targetScale;
          console.log(`Applied initial scale: ${targetScale} for stage ${this.state.currentStage}`);
        }
      }

      console.log('Evolution system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize evolution system:', error);
    }
  }

  /**
   * Get the configuration for the current stage
   * @returns {Object|null} Stage configuration or null
   */
  getCurrentStageConfig() {
    return EVOLUTION_CONFIG.stages.find(s => s.name === this.state.currentStage) || null;
  }

  /**
   * Get the next stage configuration
   * @returns {Object|null} Next stage configuration or null
   */
  getNextStageConfig() {
    const currentIndex = EVOLUTION_CONFIG.stages.findIndex(s => s.name === this.state.currentStage);
    if (currentIndex >= 0 && currentIndex < EVOLUTION_CONFIG.stages.length - 1) {
      return EVOLUTION_CONFIG.stages[currentIndex + 1];
    }
    return null;
  }

  /**
   * Check if evolution should trigger based on current level
   * Validates: Requirement 2.3, 7.2
   * @param {number} level - Current player level
   * @returns {boolean} True if evolution should trigger
   */
  checkEvolution(level) {
    // Don't evolve if already evolving
    if (this.state.isEvolving) {
      return false;
    }

    // Get next stage
    const nextStage = this.getNextStageConfig();
    
    // No next stage available (already at max)
    if (!nextStage) {
      return false;
    }

    // Check if level meets threshold
    if (level >= nextStage.level) {
      console.log(`Evolution triggered: Level ${level} >= ${nextStage.level} (${nextStage.name})`);
      this.triggerEvolution(nextStage);
      return true;
    }

    return false;
  }

  /**
   * Trigger evolution to a new stage
   * Orchestrates the complete evolution sequence
   * Validates: Requirements 4.1, 4.4, 4.5
   * @param {Object} newStageConfig - Configuration for the new stage
   */
  async triggerEvolution(newStageConfig) {
    if (this.state.isEvolving) {
      console.warn('Evolution already in progress, ignoring trigger');
      return;
    }

    try {
      // Lock interactions
      this.state.isEvolving = true;
      console.log(`Starting evolution to ${newStageConfig.name}...`);

      // Show notification
      this.notificationManager.show(newStageConfig.name);

      // Start particle animation
      await this.particleSystem.start(this.particleTexture);

      // Start glow effect
      this.glowEffect.start();

      // Initiate scale interpolation
      if (this.scaleManager) {
        this.scaleManager.setTargetScale(newStageConfig.scale);
      }

      // Update state
      this.state.currentStage = newStageConfig.name;
      this.state.currentScale = newStageConfig.scale;

      // Save state to IndexedDB
      const currentLevel = typeof window !== 'undefined' && window.playerLevel !== undefined ? window.playerLevel : 0;
      await this.persistence.save(newStageConfig.name, newStageConfig.scale, currentLevel);

      console.log(`Evolution to ${newStageConfig.name} initiated successfully`);

      // Wait for animations to complete (2 seconds for particles)
      setTimeout(() => {
        this.glowEffect.stop();
        this.state.isEvolving = false;
        console.log(`Evolution to ${newStageConfig.name} complete`);
      }, 2000);

    } catch (error) {
      console.error('Evolution failed:', error);
      this.state.isEvolving = false;
      this.glowEffect.stop();
    }
  }

  /**
   * Update evolution animations
   * Should be called each frame in the animation loop
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   * @param {number} delta - Time elapsed since last frame in seconds
   */
  update(timestamp, delta) {
    // Update scale interpolation
    if (this.scaleManager) {
      this.scaleManager.update(timestamp);
    }

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(delta);
    }

    // Update glow effect
    if (this.glowEffect) {
      const timeInSeconds = timestamp / 1000;
      this.glowEffect.update(timeInSeconds);
    }
  }
}
