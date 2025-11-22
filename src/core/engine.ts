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

import { Menu } from '@/ui/menu';
import { Hotbar } from '@/ui/hotbar';

export class GameEngine {
  private renderer: Renderer;
  private cameraController: CameraController;
  private inputManager: InputManager;
  private worldManager: WorldManager;
  public entityManager: EntityManager;
  private raycaster: VoxelRaycaster;

  private menu: Menu;
  private hotbar: Hotbar;

  private selectedBlock: RaycastHit | null = null;
  private selectionBox: THREE.LineSegments | null = null;
  private currentBlockType: BlockType = BlockType.GRASS;

  // Game State
  private availableItems: BlockType[] = [
    BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.WOOD,
    BlockType.LEAVES, BlockType.SAND, BlockType.PLANKS, BlockType.BRICKS,
    BlockType.TNT, BlockType.LOG
  ];
  private hotbarItems: BlockType[] = [];

  private lastTime = 0;
  private accumulator = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  private isRunning = false;
  private isPaused = false;

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

    // Initialize UI
    this.hotbarItems = [...this.availableItems].slice(0, 9); // Default first 9
    this.hotbar = new Hotbar((blockType) => {
      this.currentBlockType = blockType;
    });
    this.hotbar.setItems(this.hotbarItems);

    this.menu = new Menu({
      onResume: () => this.resumeGame(),
      onSave: (name) => this.saveGame(name),
      onLoad: (id) => this.loadGame(id),
      onDelete: (id) => this.deleteSave(id),
      getSaves: () => this.getSaves(),
      isItemAvailable: (type) => this.availableItems.includes(type),
      toggleItemAvailability: (type, available) => this.toggleItemAvailability(type, available)
    });

    // Setup Input Callbacks
    this.inputManager.onEscape = () => {
      if (this.menu.isOpen()) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    };

    // Generate initial chunks
    this.generateChunksAroundPlayer();

    // Load game if exists
    this.loadGame();

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
      const locked = this.inputManager.isPointerLocked();
      debugElement.textContent = `Locked: ${locked}`;
    }

    // Handle Hotbar Selection (1-9)
    for (let i = 1; i <= 9; i++) {
      if (this.inputManager.isKeyPressed(`Digit${i}`)) {
        this.hotbar.selectSlot(i - 1);
      }
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
        // console.log('Block broken!');
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
        // console.log('Block placed!');
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
      // console.log('Arrow shot!');
      this.lastInteractionTime = now;
    }

    // TNT - Place Explosive
    if (this.inputManager.isKeyPressed('KeyG') || (this.inputManager as any).touchControls?.isButtonPressed('tnt')) {
      const spawnPos = this.cameraController.camera.position.clone();
      const tnt = new TNTEntity(spawnPos.x, spawnPos.y, spawnPos.z);
      this.entityManager.addEntity(tnt);
      // console.log('TNT placed!');
      this.lastInteractionTime = now;
    }
  }
  private updatePhysics(deltaTime: number): void {
    if (this.isPaused) return;
    // Update camera/player physics
    this.cameraController.update(deltaTime);
  }

  private updateGame(_deltaTime: number): void {
    if (this.isPaused) return;

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

  // --- Game State & UI Methods ---

  pauseGame() {
    this.isPaused = true;
    this.inputManager.setEnabled(false);
    this.menu.show();
  }

  resumeGame() {
    this.isPaused = false;
    this.inputManager.setEnabled(true);
    this.menu.hide();
    // Request pointer lock again if needed, but usually user click does it
    // However, since we are resuming, we might want to hint the user to click
  }

  // --- Save System ---

  getSaves(): Array<{ id: string; name: string; date: number }> {
    const savesStr = localStorage.getItem('minecraft_saves');
    if (!savesStr) return [];
    try {
      const saves = JSON.parse(savesStr);
      return Object.values(saves).map((save: any) => ({
        id: save.id,
        name: save.name,
        date: save.date
      })).sort((a, b) => b.date - a.date);
    } catch (e) {
      console.error('Failed to parse saves', e);
      return [];
    }
  }

  saveGame(name?: string) {
    const rotation = this.cameraController.getRotation();
    const saveData = {
      player: {
        position: this.cameraController.camera.position.toArray(),
        rotation: { yaw: rotation.yaw, pitch: rotation.pitch }
      },
      availableItems: this.availableItems,
      world: this.worldManager.getModifiedChunks()
    };

    const savesStr = localStorage.getItem('minecraft_saves');
    let saves: Record<string, any> = {};
    if (savesStr) {
      try {
        saves = JSON.parse(savesStr);
      } catch (e) {
        console.error('Failed to parse existing saves', e);
      }
    }

    const id = Date.now().toString();
    const saveName = name || `Save ${new Date().toLocaleString()}`;

    saves[id] = {
      id,
      name: saveName,
      date: Date.now(),
      data: saveData
    };

    localStorage.setItem('minecraft_saves', JSON.stringify(saves));
    console.log('Game Saved', id);
  }

  loadGame(id?: string) {
    const savesStr = localStorage.getItem('minecraft_saves');
    if (!savesStr) return;

    try {
      const saves = JSON.parse(savesStr);
      let saveToLoad;

      if (id) {
        saveToLoad = saves[id];
      } else {
        // Load most recent if no ID provided (auto-load)
        const sorted = Object.values(saves).sort((a: any, b: any) => b.date - a.date);
        if (sorted.length > 0) {
          saveToLoad = sorted[0];
        }
      }

      if (saveToLoad && saveToLoad.data) {
        const data = saveToLoad.data;
        if (data.player) {
          const pos = data.player.position;
          this.cameraController.setPosition(pos[0], pos[1], pos[2]);

          if (data.player.rotation) {
            if (Array.isArray(data.player.rotation)) {
              // Fallback
            } else {
              this.cameraController.setRotation(data.player.rotation.yaw, data.player.rotation.pitch);
            }
          }
        }
        if (data.availableItems) {
          this.availableItems = data.availableItems;
          this.updateHotbarItems();
        }
        if (data.world) {
          this.worldManager.restoreChunks(data.world);
        }
        console.log('Game Loaded', saveToLoad.name);
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
  }

  deleteSave(id: string) {
    const savesStr = localStorage.getItem('minecraft_saves');
    if (!savesStr) return;

    try {
      const saves = JSON.parse(savesStr);
      if (saves[id]) {
        delete saves[id];
        localStorage.setItem('minecraft_saves', JSON.stringify(saves));
        console.log('Save Deleted', id);
      }
    } catch (e) {
      console.error('Failed to delete save', e);
    }
  }

  isItemAvailable(type: BlockType): boolean {
    return this.availableItems.includes(type);
  }

  toggleItemAvailability(type: BlockType, available: boolean) {
    if (available) {
      if (!this.availableItems.includes(type)) {
        this.availableItems.push(type);
      }
    } else {
      this.availableItems = this.availableItems.filter(t => t !== type);
    }
    this.updateHotbarItems();
  }

  private updateHotbarItems() {
    // Update hotbar with available items
    this.hotbarItems = [...this.availableItems].slice(0, 9);
    this.hotbar.setItems(this.hotbarItems);
  }
}
