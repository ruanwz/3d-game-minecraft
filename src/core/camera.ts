import * as THREE from 'three';
import { InputManager } from './input';
import { PLAYER_HEIGHT, PLAYER_SPEED, GRAVITY, PLAYER_JUMP_FORCE } from '@/utils/constants';
import { BlockType } from '@/world/block';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private direction = new THREE.Vector3();
  private rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  private velocity = new THREE.Vector3(0, 0, 0); // Vertical velocity
  private isOnGround = false;
  private getBlockCallback: ((x: number, y: number, z: number) => BlockType) | null = null;

  constructor(private inputManager: InputManager) {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Set initial position
    this.camera.position.set(0, PLAYER_HEIGHT + 50, 0);
    this.rotation.set(0, 0, 0);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  // Set callback to get block at position (for collision detection)
  setGetBlockCallback(callback: (x: number, y: number, z: number) => BlockType): void {
    this.getBlockCallback = callback;
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(deltaTime: number): void {
    if (!this.inputManager.isPointerLocked()) {
      return;
    }

    // Update rotation based on mouse movement
    const mouseMovement = this.inputManager.getMouseMovement();
    this.rotation.y -= mouseMovement.x;
    this.rotation.x -= mouseMovement.y;

    // Clamp vertical rotation to prevent flipping
    const maxRotation = Math.PI / 2 - 0.1;
    this.rotation.x = Math.max(-maxRotation, Math.min(maxRotation, this.rotation.x));

    // Apply rotation to camera
    this.camera.quaternion.setFromEuler(this.rotation);

    // Get movement input
    const input = this.inputManager.getMovementInput();

    // Calculate horizontal movement direction based on camera rotation
    this.direction.set(0, 0, 0);

    // Get camera's forward and right vectors
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement on horizontal plane
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Apply input to direction
    this.direction.addScaledVector(forward, input.forward);
    this.direction.addScaledVector(right, input.right);

    // Normalize to prevent faster diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Apply speed to horizontal movement
    this.direction.multiplyScalar(PLAYER_SPEED);

    // Apply gravity
    this.velocity.y -= GRAVITY * deltaTime;

    // Check for jump
    if (input.up > 0 && this.isOnGround) {
      this.velocity.y = PLAYER_JUMP_FORCE;
      this.isOnGround = false;
    }

    // Apply horizontal movement
    const newPos = this.camera.position.clone();
    newPos.addScaledVector(this.direction, deltaTime);

    // Apply vertical movement (gravity/jump)
    newPos.y += this.velocity.y * deltaTime;

    // Check collision with ground
    this.checkCollision(newPos);

    // Update position
    this.camera.position.copy(newPos);

    // Update HUD
    this.updateHUD();
  }

  private checkCollision(newPos: THREE.Vector3): void {
    if (!this.getBlockCallback) {
      return;
    }

    const playerBottom = newPos.y - PLAYER_HEIGHT;
    const playerTop = newPos.y + 0.2;

    // Check multiple points around the player for collision
    const checkRadius = 0.3;
    const checks = [
      { x: 0, z: 0 },
      { x: checkRadius, z: 0 },
      { x: -checkRadius, z: 0 },
      { x: 0, z: checkRadius },
      { x: 0, z: -checkRadius },
    ];

    this.isOnGround = false;

    for (const check of checks) {
      const checkX = Math.floor(newPos.x + check.x);
      const checkZ = Math.floor(newPos.z + check.z);

      // Check block below player
      const blockBelowY = Math.floor(playerBottom);
      const blockBelow = this.getBlockCallback(checkX, blockBelowY, checkZ);

      if (blockBelow !== BlockType.AIR) {
        // Collision with ground
        const blockTop = blockBelowY + 1;
        if (playerBottom < blockTop) {
          newPos.y = blockTop + PLAYER_HEIGHT;
          this.velocity.y = 0;
          this.isOnGround = true;
        }
      }

      // Check block above player
      const blockAboveY = Math.floor(playerTop);
      const blockAbove = this.getBlockCallback(checkX, blockAboveY, checkZ);

      if (blockAbove !== BlockType.AIR) {
        // Collision with ceiling
        const blockBottom = blockAboveY;
        if (playerTop > blockBottom) {
          newPos.y = blockBottom - 0.2;
          this.velocity.y = 0;
        }
      }

      // Check blocks at player's body level (prevent walking through walls)
      const blockMidY = Math.floor(newPos.y - PLAYER_HEIGHT / 2);
      const blockMid = this.getBlockCallback(checkX, blockMidY, checkZ);

      if (blockMid !== BlockType.AIR) {
        // Simple push-back from walls
        const dx = newPos.x - checkX - 0.5;
        const dz = newPos.z - checkZ - 0.5;

        if (Math.abs(dx) > Math.abs(dz)) {
          newPos.x = checkX + 0.5 + Math.sign(dx) * (checkRadius + 0.1);
        } else {
          newPos.z = checkZ + 0.5 + Math.sign(dz) * (checkRadius + 0.1);
        }
      }
    }

    // Clamp to world bounds
    if (newPos.y < 1) {
      newPos.y = 1;
      this.velocity.y = 0;
      this.isOnGround = true;
    }
  }

  private updateHUD(): void {
    const positionElement = document.getElementById('position');
    const chunkElement = document.getElementById('chunk');

    if (positionElement) {
      const pos = this.camera.position;
      positionElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    }

    if (chunkElement) {
      const chunkX = Math.floor(this.camera.position.x / 16);
      const chunkZ = Math.floor(this.camera.position.z / 16);
      chunkElement.textContent = `${chunkX}, ${chunkZ}`;
    }
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  getChunkPosition(): { x: number; z: number } {
    return {
      x: Math.floor(this.camera.position.x / 16),
      z: Math.floor(this.camera.position.z / 16),
    };
  }
}
