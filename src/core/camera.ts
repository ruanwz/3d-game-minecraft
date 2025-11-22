import * as THREE from 'three';
import { InputManager } from './input';
import { PLAYER_HEIGHT, PLAYER_SPEED, GRAVITY, PLAYER_JUMP_FORCE, FLY_SPEED } from '@/utils/constants';
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

  private isFlying = false;
  private lastJumpTime = 0;
  private wasJumpPressed = false;

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

    // Toggle Flight Mode (Double-tap Jump)
    // Note: input.up is 1 if Space/Jump is pressed, -1 if Shift is pressed, 0 otherwise.
    // We only care about the positive Jump press for toggling.
    // We need raw Jump input for toggle.
    // Let's check specific keys/buttons.
    const rawJumpPressed = this.inputManager.isKeyPressed('Space') || (this.inputManager as any).touchControls?.isButtonPressed('jump');

    if (rawJumpPressed && !this.wasJumpPressed) {
      const now = Date.now();
      if (now - this.lastJumpTime < 300) {
        this.isFlying = !this.isFlying;
        this.velocity.set(0, 0, 0); // Reset velocity when toggling
      }
      this.lastJumpTime = now;
    }
    this.wasJumpPressed = rawJumpPressed;

    // Calculate movement direction
    this.direction.set(0, 0, 0);

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);

    if (!this.isFlying) {
      forward.y = 0; // Keep movement on horizontal plane when walking
      forward.normalize();
    } else {
      // In flight, forward vector includes Y component (fly where you look)
      forward.normalize();
    }

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Apply input to direction
    this.direction.addScaledVector(forward, input.forward);
    this.direction.addScaledVector(right, input.right);

    // Normalize
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Apply speed
    const currentSpeed = this.isFlying ? FLY_SPEED : PLAYER_SPEED;
    this.direction.multiplyScalar(currentSpeed);

    if (this.isFlying) {
      // Flight Physics
      const moveVelocity = this.direction.clone().multiplyScalar(deltaTime);

      // Vertical movement (Ascend/Descend)
      // input.up is 1 (Jump) or -1 (Shift)
      if (input.up !== 0) {
        moveVelocity.y += input.up * currentSpeed * deltaTime;
      }

      this.camera.position.add(moveVelocity);

      // Simple collision check to prevent flying through world boundaries if needed
      // But creative mode usually allows clipping. Let's keep it simple.
      if (this.camera.position.y < 1) this.camera.position.y = 1;

    } else {
      // Normal Physics (Walking)

      // --- Physics Step 1: Horizontal Movement ---
      const horizontalVelocity = this.direction.clone().multiplyScalar(deltaTime);
      const newPos = this.camera.position.clone().add(horizontalVelocity);

      // Check horizontal collisions (X/Z)
      this.checkHorizontalCollisions(newPos);

      // Apply valid horizontal position
      this.camera.position.x = newPos.x;
      this.camera.position.z = newPos.z;

      // --- Physics Step 2: Vertical Movement ---
      // Apply gravity
      this.velocity.y -= GRAVITY * deltaTime;

      // Check for jump
      if (input.up > 0 && this.isOnGround) {
        this.velocity.y = PLAYER_JUMP_FORCE;
        this.isOnGround = false;
      }

      // Apply vertical velocity
      const verticalMovement = this.velocity.y * deltaTime;
      newPos.y = this.camera.position.y + verticalMovement;

      // Check vertical collisions (Y)
      this.checkVerticalCollisions(newPos);

      // Apply valid vertical position
      this.camera.position.y = newPos.y;
    }

    // Update HUD
    this.updateHUD();
  }

  private checkHorizontalCollisions(newPos: THREE.Vector3): void {
    if (!this.getBlockCallback) return;

    const playerRadius = 0.3;
    const playerHeight = PLAYER_HEIGHT;

    // Check points around the player's circumference
    // We check at feet level and head level
    const yLevels = [0, 1]; // Relative to bottom
    const checks = [
      { x: playerRadius, z: 0 },
      { x: -playerRadius, z: 0 },
      { x: 0, z: playerRadius },
      { x: 0, z: -playerRadius },
      { x: playerRadius * 0.7, z: playerRadius * 0.7 },
      { x: playerRadius * 0.7, z: -playerRadius * 0.7 },
      { x: -playerRadius * 0.7, z: playerRadius * 0.7 },
      { x: -playerRadius * 0.7, z: -playerRadius * 0.7 },
    ];

    const playerBottom = this.camera.position.y - playerHeight; // Use current Y for horizontal check

    for (const yOffset of yLevels) {
      for (const check of checks) {
        const checkX = newPos.x + check.x;
        const checkY = playerBottom + yOffset + 0.1; // +0.1 to be slightly inside the block vertically
        const checkZ = newPos.z + check.z;

        const blockX = Math.floor(checkX);
        const blockY = Math.floor(checkY);
        const blockZ = Math.floor(checkZ);

        const block = this.getBlockCallback(blockX, blockY, blockZ);

        if (block !== BlockType.AIR) {
          // Collision detected

          // Auto-step logic: Check if it's a low obstacle we can step up
          if (yOffset === 0) { // Only step up from feet
            const blockAbove = this.getBlockCallback(blockX, blockY + 1, blockZ);
            const blockAbove2 = this.getBlockCallback(blockX, blockY + 2, blockZ);

            if (blockAbove === BlockType.AIR && blockAbove2 === BlockType.AIR) {
              // We can step up!
              // But we handle this in vertical phase usually, or here by adjusting Y?
              // Let's adjust Y here to "snap" up, but only if we are moving into it.
              // Actually, better to just let horizontal movement happen but set a flag?
              // Standard way: Snap Y up immediately if valid.

              // Check if we have vertical clearance at current position to move up
              const currentBlockX = Math.floor(this.camera.position.x);
              const currentBlockZ = Math.floor(this.camera.position.z);
              const headBlock = this.getBlockCallback(currentBlockX, Math.floor(playerBottom + playerHeight + 1), currentBlockZ);

              if (headBlock === BlockType.AIR) {
                this.camera.position.y = Math.floor(checkY) + 1 + playerHeight;
                return; // Successfully stepped up, skip collision response
              }
            }
          }

          // Resolve collision by pushing back
          // Find the nearest face
          const dx = checkX - (blockX + 0.5);
          const dz = checkZ - (blockZ + 0.5);

          if (Math.abs(dx) > Math.abs(dz)) {
            // Push X
            // If dx > 0, we are to the right, push right.
            // Target X should be block center + 0.5 + radius + epsilon
            const sign = Math.sign(dx);
            newPos.x = blockX + 0.5 + sign * (0.5 + playerRadius + 0.001);
          } else {
            // Push Z
            const sign = Math.sign(dz);
            newPos.z = blockZ + 0.5 + sign * (0.5 + playerRadius + 0.001);
          }
        }
      }
    }
  }

  private checkVerticalCollisions(newPos: THREE.Vector3): void {
    if (!this.getBlockCallback) return;

    const playerRadius = 0.3;
    const playerHeight = PLAYER_HEIGHT;

    // Check center and corners
    const checks = [
      { x: 0, z: 0 },
      { x: playerRadius, z: 0 },
      { x: -playerRadius, z: 0 },
      { x: 0, z: playerRadius },
      { x: 0, z: -playerRadius },
    ];

    const playerBottom = newPos.y - playerHeight;
    const playerTop = newPos.y; // Top of head (eyes are at top)

    this.isOnGround = false;

    // 1. Ground Check (Falling)
    if (this.velocity.y <= 0) {
      for (const check of checks) {
        const checkX = Math.floor(newPos.x + check.x);
        const checkZ = Math.floor(newPos.z + check.z);
        const checkY = Math.floor(playerBottom); // Block feet are in

        const block = this.getBlockCallback(checkX, checkY, checkZ);

        if (block !== BlockType.AIR) {
          // Hit ground
          newPos.y = checkY + 1 + playerHeight;
          this.velocity.y = 0;
          this.isOnGround = true;
          break; // Found ground, stop checking
        }
      }
    }

    // 2. Ceiling Check (Jumping)
    if (this.velocity.y > 0) {
      for (const check of checks) {
        const checkX = Math.floor(newPos.x + check.x);
        const checkZ = Math.floor(newPos.z + check.z);
        const checkY = Math.floor(playerTop + 0.1); // Block head is entering

        const block = this.getBlockCallback(checkX, checkY, checkZ);

        if (block !== BlockType.AIR) {
          // Hit ceiling
          newPos.y = checkY - 0.1;
          this.velocity.y = 0;
          break;
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

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isOnGround = false;
  }

  getRotation(): { yaw: number; pitch: number } {
    return { yaw: this.rotation.y, pitch: this.rotation.x };
  }

  setRotation(yaw: number, pitch: number): void {
    this.rotation.y = yaw;
    this.rotation.x = pitch;
    this.camera.quaternion.setFromEuler(this.rotation);
  }

  getChunkPosition(): { x: number; z: number } {
    return {
      x: Math.floor(this.camera.position.x / 16),
      z: Math.floor(this.camera.position.z / 16),
    };
  }
}
