import * as THREE from 'three';
import { InputManager } from './input';
import { PLAYER_HEIGHT, PLAYER_SPEED } from '@/utils/constants';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private direction = new THREE.Vector3();
  private rotation = new THREE.Euler(0, 0, 0, 'YXZ');

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

    // Calculate movement direction based on camera rotation
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

    // Apply speed
    this.direction.multiplyScalar(PLAYER_SPEED);

    // Add vertical movement
    this.direction.y = input.up * PLAYER_SPEED;

    // Update position
    this.camera.position.addScaledVector(this.direction, deltaTime);

    // Update HUD
    this.updateHUD();
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
