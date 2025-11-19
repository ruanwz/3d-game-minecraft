import { Renderer } from './renderer';
import { CameraController } from './camera';
import { InputManager } from './input';
import { Chunk } from '@/world/chunk';
import { WorldManager } from '@/world/worldManager';
import { VoxelRaycaster, RaycastHit } from '@/world/raycaster';
import { BlockType } from '@/world/block';
import { EntityManager } from '@/entities/entityManager';
import { Arrow } from '@/entities/projectile';
import { TNTEntity } from '@/entities/explosive';
import { FIXED_TIME_STEP, RENDER_DISTANCE } from '@/utils/constants';
import * as THREE from 'three';

export class GameEngine {
  private renderer: Renderer;
  private cameraController: CameraController;
  private inputManager: InputManager;
  private worldManager: WorldManager;
  public entityManager: EntityManager;
  private raycaster: VoxelRaycaster;

  private selectedBlock: RaycastHit | null = null;
  private selectionBox: THREE.LineSegments | null = null;
  private currentBlockType: BlockType = BlockType.GRASS;

  private lastTime = 0;
  private accumulator = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  private isRunning = false;

  constructor(container: HTMLElement) {
    // Expose for entities to access entityManager
    (window as any).gameEngine = this;

    // Initialize renderer
    this.renderer = new Renderer(container);

    // Initialize input manager
    this.inputManager = new InputManager(this.renderer.getCanvas());

    // Initialize camera controller
    this.cameraController = new CameraController(this.inputManager);

    // Initialize world manager
    this.worldManager = new WorldManager(this.renderer.scene);

    // Initialize entity manager
    this.entityManager = new EntityManager(this.renderer.scene, this.worldManager);

    // Set collision detection callback for camera controller
    this.cameraController.setGetBlockCallback((x, y, z) =>
      this.worldManager.getBlock(x, y, z)
    );

    // Initialize raycaster
    this.raycaster = new VoxelRaycaster(10);

    // Create selection box
    this.createSelectionBox();

    // Generate initial chunks
    this.generateChunksAroundPlayer();

    // Hide loading screen
    this.hideLoading();
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    const instructions = document.getElementById('instructions');
    if (loading) loading.style.display = 'none';
    if (instructions) instructions.style.display = 'block';
  }

  private createSelectionBox(): void {
    // Create wireframe box for selected block
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.selectionBox = new THREE.LineSegments(geometry, material);
    this.selectionBox.visible = false;
    this.renderer.scene.add(this.selectionBox);
  }

  private generateChunksAroundPlayer(): void {
    const playerChunk = this.cameraController.getChunkPosition();

    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
      for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
        const chunkX = playerChunk.x + x;
        const chunkZ = playerChunk.z + z;

        if (!this.worldManager.getChunk(chunkX, chunkZ)) {
          const chunk = new Chunk(chunkX, chunkZ);
          chunk.generate();
          chunk.updateMesh(this.renderer.scene);
          this.worldManager.setChunk(chunk);
        }
      }
    }
  }

  private updateChunks(): void {
    const playerChunk = this.cameraController.getChunkPosition();

    // Remove far chunks
    const chunksToRemove: Array<{ x: number; z: number }> = [];
    this.worldManager.getAllChunks().forEach((chunk) => {
      const dx = Math.abs(chunk.x - playerChunk.x);
      const dz = Math.abs(chunk.z - playerChunk.z);

      if (dx > RENDER_DISTANCE + 1 || dz > RENDER_DISTANCE + 1) {
        chunksToRemove.push({ x: chunk.x, z: chunk.z });
      }
    });

    chunksToRemove.forEach(({ x, z }) => this.worldManager.removeChunk(x, z));

    // Generate new chunks
    this.generateChunksAroundPlayer();
  }

  private updateBlockSelection(): void {
    if (!this.inputManager.isPointerLocked()) {
      this.selectedBlock = null;
      if (this.selectionBox) this.selectionBox.visible = false;
      return;
    }

    // Cast ray from camera
    const cameraPos = this.cameraController.camera.position;
    const cameraDir = new THREE.Vector3();
    this.cameraController.camera.getWorldDirection(cameraDir);

    const hit = this.raycaster.cast(
      cameraPos,
      cameraDir,
      (x, y, z) => this.worldManager.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))
    );

    this.selectedBlock = hit;

    // Update selection box
    if (this.selectionBox) {
      if (hit) {
        this.selectionBox.position.set(
          hit.blockPosition.x + 0.5,
          hit.blockPosition.y + 0.5,
          hit.blockPosition.z + 0.5
        );
        this.selectionBox.visible = true;
      } else {
        this.selectionBox.visible = false;
      }
    }
  }

  private lastInteractionTime = 0;

  private handleBlockInteraction(): void {
    // Update debug info
    const debugElement = document.getElementById('debug');
    if (debugElement) {
      // We need access to touchControls to show active buttons. 
      // Since inputManager has it private, we might need to expose it or just rely on console logs for now?
      // Actually, let's cast inputManager to any to access it for debug, or better, add a method to InputManager.
      // For now, let's just show if pointer is locked.
      const locked = this.inputManager.isPointerLocked();
      debugElement.textContent = `Locked: ${locked}`;

      // Access touch controls via a dirty cast for debug purposes if needed, 
      // but let's try to be cleaner. 
      // Let's skip button debug in HUD for a second and focus on the cooldown.
    }

    if (!this.inputManager.isPointerLocked()) {
      return;
    }

    // Cooldown check
    const now = Date.now();
    if (now - this.lastInteractionTime < 200) {
      return;
    }

    // Left click - break block
    if (this.inputManager.isMouseButtonPressed(0)) {
      if (this.selectedBlock) {
        this.worldManager.setBlock(
          Math.floor(this.selectedBlock.blockPosition.x),
          Math.floor(this.selectedBlock.blockPosition.y),
          Math.floor(this.selectedBlock.blockPosition.z),
          BlockType.AIR
        );
        console.log('Block broken!');
        this.lastInteractionTime = now;
      }
    }

    // Right click - place block
    if (this.inputManager.isMouseButtonPressed(2)) {
      if (this.selectedBlock) {
        const placePos = this.raycaster.getPlacementPosition(this.selectedBlock);
        this.worldManager.setBlock(
          Math.floor(placePos.x),
          Math.floor(placePos.y),
          Math.floor(placePos.z),
          this.currentBlockType
        );
        console.log('Block placed!');
        this.lastInteractionTime = now;
      }
    }

    // Bow - Shoot Arrow
    if (this.inputManager.isKeyPressed('KeyF') || (this.inputManager as any).touchControls?.isButtonPressed('bow')) {
      const cameraDir = new THREE.Vector3();
      this.cameraController.camera.getWorldDirection(cameraDir);
      const spawnPos = this.cameraController.camera.position.clone().add(cameraDir.clone().multiplyScalar(1.0));

      const arrow = new Arrow(spawnPos.x, spawnPos.y, spawnPos.z, cameraDir);
      this.entityManager.addEntity(arrow);
      console.log('Arrow shot!');
      this.lastInteractionTime = now;
    }

    // TNT - Place Explosive
    if (this.inputManager.isKeyPressed('KeyG') || (this.inputManager as any).touchControls?.isButtonPressed('tnt')) {
      const spawnPos = this.cameraController.camera.position.clone();
      const tnt = new TNTEntity(spawnPos.x, spawnPos.y, spawnPos.z);
      this.entityManager.addEntity(tnt);
      console.log('TNT placed!');
      this.lastInteractionTime = now;
    }
  }
  private updatePhysics(deltaTime: number): void {
    // Update camera/player physics
    this.cameraController.update(deltaTime);
  }

  private updateGame(_deltaTime: number): void {
    // Update chunks based on player position
    this.updateChunks();

    // Update entities
    this.entityManager.update(_deltaTime);

    // Update block selection
    this.updateBlockSelection();

    // Handle block interaction
    this.handleBlockInteraction();
  }

  private updateFPS(): void {
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.lastFpsUpdate >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
      const fpsElement = document.getElementById('fps');
      if (fpsElement) {
        fpsElement.textContent = fps.toString();
      }

      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Calculate delta time in seconds
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.accumulator += deltaTime * 1000;

    // Fixed time step for physics
    while (this.accumulator >= FIXED_TIME_STEP) {
      this.updatePhysics(FIXED_TIME_STEP / 1000);
      this.accumulator -= FIXED_TIME_STEP;
    }

    // Variable time step for game logic
    this.updateGame(deltaTime);

    // Render
    this.renderer.render(this.cameraController.camera);

    // Update FPS counter
    this.updateFPS();

    // Clear per-frame input states
    this.inputManager.clearFrameStates();

    // Continue loop
    requestAnimationFrame(this.gameLoop);
  };

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.frameCount = 0;
    this.accumulator = 0;

    requestAnimationFrame(this.gameLoop);

    console.log('Game started!');
  }

  stop(): void {
    this.isRunning = false;
    console.log('Game stopped!');
  }

  dispose(): void {
    this.stop();
    this.worldManager.clear();
    this.renderer.dispose();
  }
}
