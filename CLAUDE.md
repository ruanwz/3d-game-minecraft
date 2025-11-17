# CLAUDE.md - AI Assistant Guide for 3D Minecraft Web Game

## Project Overview

This is a **web-based Minecraft clone** that runs directly in the browser. The goal is to create a playable 3D voxel-based game inspired by Minecraft, utilizing modern web technologies for rendering, physics, and gameplay.

**Project Name:** 3D Game Minecraft (网页版我的世界)
**Platform:** Web Browser (Desktop & Mobile)
**Type:** 3D Voxel Game Engine
**Current Status:** Initial Development Phase

---

## Technology Stack

### Recommended Core Technologies

1. **3D Graphics Engine:**
   - **Three.js** (recommended) - Industry-standard WebGL library
   - **Babylon.js** - Alternative with strong game development features
   - **WebGL2** - Raw WebGL for maximum control

2. **Build Tools:**
   - **Vite** - Fast modern build tool with HMR
   - **Webpack** - Alternative bundler with extensive plugin ecosystem
   - **TypeScript** - Type-safe development (highly recommended)

3. **Physics Engine:**
   - **Cannon.js** or **Cannon-es** - Physics simulation for player movement and collision
   - **Ammo.js** - More advanced physics (Bullet port to JS)

4. **State Management:**
   - **Zustand** - Lightweight state management
   - **Redux Toolkit** - For complex state management needs

5. **Networking (Multiplayer):**
   - **WebSockets** - Real-time multiplayer
   - **Socket.io** - Simplified WebSocket implementation
   - **WebRTC** - Peer-to-peer multiplayer

6. **Terrain Generation:**
   - **Perlin/Simplex Noise** - Procedural terrain generation
   - **FastNoiseLite** - Modern noise generation library

---

## Project Structure

### Recommended Directory Layout

```
3d-game-minecraft/
├── public/                 # Static assets
│   ├── textures/          # Block textures, sprites
│   ├── models/            # 3D models (if any)
│   ├── sounds/            # Audio files
│   └── index.html         # Main HTML entry point
│
├── src/                   # Source code
│   ├── core/              # Core game engine
│   │   ├── engine.ts      # Main game loop
│   │   ├── renderer.ts    # Rendering system
│   │   ├── camera.ts      # Camera controller
│   │   └── input.ts       # Input handling
│   │
│   ├── world/             # World/terrain management
│   │   ├── chunk.ts       # Chunk data structure
│   │   ├── chunkManager.ts # Chunk loading/unloading
│   │   ├── terrain.ts     # Terrain generation
│   │   └── block.ts       # Block definitions
│   │
│   ├── physics/           # Physics system
│   │   ├── collisions.ts  # Collision detection
│   │   ├── player.ts      # Player physics
│   │   └── gravity.ts     # Gravity system
│   │
│   ├── entities/          # Game entities
│   │   ├── player.ts      # Player entity
│   │   ├── mob.ts         # Mob base class
│   │   └── item.ts        # Item entities
│   │
│   ├── ui/                # User interface
│   │   ├── hud.ts         # HUD elements
│   │   ├── inventory.ts   # Inventory UI
│   │   └── menu.ts        # Menus
│   │
│   ├── utils/             # Utility functions
│   │   ├── math.ts        # Math helpers
│   │   ├── noise.ts       # Noise generation
│   │   └── constants.ts   # Game constants
│   │
│   ├── network/           # Networking (for multiplayer)
│   │   ├── client.ts      # Network client
│   │   └── protocol.ts    # Network protocol
│   │
│   ├── assets/            # Asset management
│   │   ├── textureAtlas.ts # Texture atlas
│   │   └── assetLoader.ts  # Asset loading
│   │
│   └── main.ts            # Application entry point
│
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
│
├── docs/                  # Documentation
│   ├── architecture.md    # Architecture documentation
│   ├── api.md             # API reference
│   └── performance.md     # Performance notes
│
├── .github/               # GitHub workflows
│   └── workflows/         # CI/CD workflows
│
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite configuration
├── .gitignore             # Git ignore rules
└── README.md              # Project README
```

---

## Development Workflows

### Setting Up the Development Environment

1. **Initialize the project:**
   ```bash
   npm init -y
   npm install three @types/three
   npm install -D vite typescript @types/node
   npm install -D @vitejs/plugin-react  # If using React for UI
   ```

2. **Configure TypeScript:**
   - Use strict mode for type safety
   - Target ES2020 or later
   - Enable source maps for debugging

3. **Set up build tools:**
   - Configure Vite for fast HMR
   - Set up proper asset handling for textures and models
   - Configure code splitting for optimal loading

### Development Process

1. **Feature Development:**
   - Create feature branches: `feature/player-movement`, `feature/terrain-gen`
   - Implement core systems incrementally
   - Test in isolation before integration

2. **Testing:**
   - Unit tests for core logic (chunk generation, collision detection)
   - Visual tests for rendering
   - Performance benchmarks for critical paths

3. **Version Control:**
   - Commit frequently with descriptive messages
   - Use conventional commits: `feat:`, `fix:`, `refactor:`, `perf:`
   - Keep commits focused and atomic

---

## Coding Conventions

### General Principles

1. **Performance First:**
   - 3D games are performance-critical
   - Profile before optimizing, but be aware of common pitfalls
   - Target 60 FPS on mid-range hardware

2. **Memory Management:**
   - Reuse objects when possible (object pooling)
   - Dispose of Three.js geometries and materials properly
   - Avoid memory leaks in the game loop

3. **Code Organization:**
   - Separate concerns (rendering, logic, physics)
   - Use composition over inheritance
   - Keep files focused and modular

### TypeScript Style

```typescript
// Use explicit types for public APIs
interface IChunk {
  position: Vector3;
  blocks: Uint8Array;
  mesh: Mesh | null;
  generate(): void;
  render(): void;
}

// Use enums for block types
enum BlockType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
}

// Constants in UPPER_CASE
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 256;
const RENDER_DISTANCE = 8;

// Classes in PascalCase
class ChunkManager {
  private chunks: Map<string, Chunk>;

  constructor() {
    this.chunks = new Map();
  }

  // Methods in camelCase
  getChunk(x: number, z: number): Chunk | undefined {
    const key = `${x},${z}`;
    return this.chunks.get(key);
  }
}
```

### Naming Conventions

- **Files:** `camelCase.ts` for utilities, `PascalCase.ts` for classes
- **Variables:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Classes:** `PascalCase`
- **Interfaces:** `IPascalCase` or `PascalCase`
- **Types:** `TPascalCase` or `PascalCase`

---

## Key Patterns and Best Practices

### 1. Chunk System

**Critical for performance:** Only render visible chunks.

```typescript
// Chunk coordinates (not world coordinates)
class Chunk {
  static SIZE = 16;

  constructor(
    public x: number,  // Chunk X coordinate
    public z: number   // Chunk Z coordinate
  ) {
    this.blocks = new Uint8Array(16 * 256 * 16);
  }

  // Convert world coords to block index
  worldToBlock(wx: number, wy: number, wz: number): number {
    const lx = wx - this.x * 16;
    const lz = wz - this.z * 16;
    return lx + lz * 16 + wy * 16 * 16;
  }
}
```

### 2. Greedy Meshing

**Optimize rendering:** Combine adjacent blocks into single quads.

```typescript
// Don't create 6 faces for every block
// Combine adjacent faces of the same type
// This reduces draw calls dramatically
function createChunkMesh(chunk: Chunk): Mesh {
  // Implement greedy meshing algorithm
  // Merge adjacent visible faces
  // Result: ~100x fewer triangles
}
```

### 3. Level of Detail (LOD)

```typescript
// Render distant chunks with lower detail
class ChunkLOD {
  renderDistance = {
    high: 4,    // Full detail
    medium: 8,  // Reduced detail
    low: 12,    // Very low detail
  };
}
```

### 4. Object Pooling

```typescript
// Reuse objects instead of creating new ones
class ObjectPool<T> {
  private pool: T[] = [];

  acquire(): T {
    return this.pool.pop() || this.create();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
}
```

### 5. Frustum Culling

```typescript
// Don't render chunks outside the camera view
function updateVisibleChunks(camera: Camera, chunks: Chunk[]): Chunk[] {
  const frustum = new Frustum();
  frustum.setFromProjectionMatrix(camera.projectionMatrix);

  return chunks.filter(chunk =>
    frustum.intersectsBox(chunk.boundingBox)
  );
}
```

---

## Performance Optimization

### Critical Performance Areas

1. **Chunk Generation:**
   - Generate chunks asynchronously (Web Workers)
   - Cache generated chunks
   - Use efficient noise algorithms

2. **Rendering:**
   - Use instanced rendering for repeated elements
   - Implement frustum culling
   - Batch draw calls
   - Use texture atlases

3. **Physics:**
   - Use AABB collision for blocks
   - Spatial partitioning (octree/grid)
   - Only simulate nearby chunks

4. **Memory:**
   - Unload distant chunks
   - Dispose of Three.js objects properly
   - Monitor memory usage in DevTools

### Performance Targets

- **Frame Rate:** 60 FPS minimum
- **Chunk Load Time:** < 16ms per chunk (async)
- **Memory:** < 500MB for 8 chunk render distance
- **Initial Load:** < 3 seconds

### Profiling Tools

```typescript
// Add performance markers
performance.mark('chunk-generation-start');
generateChunk();
performance.mark('chunk-generation-end');
performance.measure('chunk-generation', 'chunk-generation-start', 'chunk-generation-end');
```

---

## Game Loop Architecture

```typescript
class GameEngine {
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedTimeStep = 1000 / 60; // 60 FPS

  gameLoop = (currentTime: number) => {
    // Calculate delta time
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Fixed time step for physics
    while (this.accumulator >= this.fixedTimeStep) {
      this.updatePhysics(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Variable time step for rendering
    this.updateGame(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };
}
```

---

## Asset Management

### Texture Atlas

```typescript
// Combine all block textures into a single atlas
// This reduces draw calls significantly
class TextureAtlas {
  private atlas: Texture;
  private blockSize = 16; // 16x16 pixels per block texture

  // Get UV coordinates for a block face
  getUVs(blockType: BlockType, face: Face): Vector2[] {
    // Calculate UV coordinates from atlas position
  }
}
```

### Asset Loading

```typescript
// Load assets with progress tracking
class AssetLoader {
  async loadAssets(onProgress?: (progress: number) => void): Promise<void> {
    const loader = new TextureLoader();
    const manager = new LoadingManager();

    manager.onProgress = (url, loaded, total) => {
      onProgress?.(loaded / total);
    };

    // Load all required assets
  }
}
```

---

## Input Handling

```typescript
class InputManager {
  private keys = new Set<string>();
  private mouse = { x: 0, y: 0, buttons: 0 };

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.movementX;
      this.mouse.y = e.movementY;
    });
  }

  isKeyPressed(code: string): boolean {
    return this.keys.has(code);
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test core logic independently
describe('Chunk', () => {
  it('should convert world coordinates to block index', () => {
    const chunk = new Chunk(0, 0);
    const index = chunk.worldToBlock(5, 10, 7);
    expect(index).toBe(5 + 7 * 16 + 10 * 256);
  });
});
```

### Performance Tests

```typescript
// Benchmark critical paths
describe('Performance', () => {
  it('should generate chunk in under 16ms', () => {
    const start = performance.now();
    generateChunk(0, 0);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(16);
  });
});
```

---

## Common Pitfalls to Avoid

### 1. Memory Leaks

```typescript
// BAD: Not disposing of geometries
chunk.mesh = new Mesh(geometry, material);

// GOOD: Dispose properly
if (chunk.mesh) {
  chunk.mesh.geometry.dispose();
  chunk.mesh.material.dispose();
  scene.remove(chunk.mesh);
}
```

### 2. Inefficient Collision Detection

```typescript
// BAD: Check all blocks
for (const block of allBlocks) {
  checkCollision(player, block);
}

// GOOD: Only check nearby blocks
const nearbyBlocks = getNearbyBlocks(player.position, 3);
for (const block of nearbyBlocks) {
  checkCollision(player, block);
}
```

### 3. Synchronous Chunk Generation

```typescript
// BAD: Blocks the main thread
function loadChunks() {
  for (const pos of positions) {
    generateChunk(pos); // Freezes the game!
  }
}

// GOOD: Use Web Workers
async function loadChunks() {
  const promises = positions.map(pos =>
    generateChunkAsync(pos)
  );
  await Promise.all(promises);
}
```

---

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `claude/*` - AI assistant working branches

### Commit Messages

```
feat: add terrain generation with Perlin noise
fix: correct chunk boundary collision detection
perf: optimize mesh generation with greedy meshing
refactor: reorganize chunk manager for better testability
docs: add architecture documentation for rendering system
```

### Before Committing

1. **Run tests:** Ensure all tests pass
2. **Check performance:** Profile critical changes
3. **Lint code:** Follow style guidelines
4. **Update docs:** Document new features

---

## AI Assistant Guidelines

### When Adding Features

1. **Understand the architecture first** - Read existing code
2. **Follow existing patterns** - Consistency is key
3. **Consider performance** - Profile new code
4. **Write tests** - Especially for core systems
5. **Document complex logic** - Help future developers

### When Debugging

1. **Use browser DevTools** - Console, Performance, Memory tabs
2. **Add performance markers** - Measure execution time
3. **Check Three.js stats** - Monitor draw calls, triangles
4. **Profile with DevTools** - Find bottlenecks
5. **Test in different browsers** - Cross-browser compatibility

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] No memory leaks (proper disposal)
- [ ] Performance is acceptable (60 FPS)
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Cross-browser compatible
- [ ] Responsive on different screen sizes

---

## Useful Resources

### Three.js
- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Three.js Fundamentals](https://threejs.org/manual/)

### Voxel Game Development
- [Greedy Meshing Algorithm](https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/)
- [Minecraft-like Game Tutorial](https://www.youtube.com/watch?v=C_Ux3l1LH1U)
- [Voxel.js](http://voxeljs.com/)

### Performance
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Three.js Performance Tips](https://discoverthreejs.com/tips-and-tricks/)
- [Game Loop Pattern](https://gameprogrammingpatterns.com/game-loop.html)

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run performance benchmarks
npm run bench

# Type check
npm run type-check

# Lint code
npm run lint
```

---

## Current Development Priorities

1. **Phase 1: Core Engine**
   - Set up Three.js renderer
   - Implement basic camera controls
   - Create game loop

2. **Phase 2: Terrain**
   - Implement chunk system
   - Generate terrain with Perlin noise
   - Add basic block rendering

3. **Phase 3: Player**
   - Add player entity
   - Implement WASD movement
   - Add mouse look controls
   - Implement collision detection

4. **Phase 4: Interaction**
   - Block placing/breaking
   - Inventory system
   - Basic UI/HUD

5. **Phase 5: Polish**
   - Optimize performance
   - Add textures and materials
   - Sound effects
   - Improve visuals

---

## Notes for AI Assistants

- **Always prioritize performance** - This is a real-time 3D application
- **Test changes visually** - Run the dev server and check the browser
- **Consider mobile support** - Use touch controls and optimize for mobile GPUs
- **Keep it modular** - Separate systems should be loosely coupled
- **Profile regularly** - Use Chrome DevTools Performance tab
- **Memory matters** - Dispose of Three.js objects, monitor memory usage
- **Comment complex algorithms** - Especially mesh generation and physics
- **Think in chunks** - Most systems should operate on chunks, not individual blocks

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0
**Status:** Initial Documentation
