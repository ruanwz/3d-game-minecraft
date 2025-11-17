import { Renderer } from './renderer';
import { CameraController } from './camera';
import { InputManager } from './input';
import { Chunk } from '@/world/chunk';
import { FIXED_TIME_STEP, RENDER_DISTANCE } from '@/utils/constants';

export class GameEngine {
  private renderer: Renderer;
  private cameraController: CameraController;
  private inputManager: InputManager;
  private chunks = new Map<string, Chunk>();

  private lastTime = 0;
  private accumulator = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  private isRunning = false;

  constructor(container: HTMLElement) {
    // Initialize renderer
    this.renderer = new Renderer(container);

    // Initialize input manager
    this.inputManager = new InputManager(this.renderer.getCanvas());

    // Initialize camera controller
    this.cameraController = new CameraController(this.inputManager);

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

  private generateChunksAroundPlayer(): void {
    const playerChunk = this.cameraController.getChunkPosition();

    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
      for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
        const chunkX = playerChunk.x + x;
        const chunkZ = playerChunk.z + z;
        const key = `${chunkX},${chunkZ}`;

        if (!this.chunks.has(key)) {
          const chunk = new Chunk(chunkX, chunkZ);
          chunk.generate();
          chunk.updateMesh(this.renderer.scene);
          this.chunks.set(key, chunk);
        }
      }
    }
  }

  private updateChunks(): void {
    const playerChunk = this.cameraController.getChunkPosition();

    // Remove far chunks
    const chunksToRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const dx = Math.abs(chunk.x - playerChunk.x);
      const dz = Math.abs(chunk.z - playerChunk.z);

      if (dx > RENDER_DISTANCE + 1 || dz > RENDER_DISTANCE + 1) {
        chunk.dispose(this.renderer.scene);
        chunksToRemove.push(key);
      }
    });

    chunksToRemove.forEach(key => this.chunks.delete(key));

    // Generate new chunks
    this.generateChunksAroundPlayer();
  }

  private updatePhysics(deltaTime: number): void {
    // Update camera/player physics
    this.cameraController.update(deltaTime);
  }

  private updateGame(_deltaTime: number): void {
    // Update chunks based on player position
    this.updateChunks();
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
    this.chunks.forEach(chunk => chunk.dispose(this.renderer.scene));
    this.chunks.clear();
    this.renderer.dispose();
  }
}
