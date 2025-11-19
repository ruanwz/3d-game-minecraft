import * as THREE from 'three';
import { BlockType } from './block';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_SIZE } from '@/utils/constants';
import { TerrainNoise } from '@/utils/noise';
import { GreedyMesher } from './greedyMesher';

export class Chunk {
  public x: number; // Chunk X coordinate
  public z: number; // Chunk Z coordinate
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  private needsUpdate = true;
  private static terrainNoise: TerrainNoise | null = null;

  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    // Initialize blocks array (x * z * y)
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);

    // Initialize terrain noise generator (shared across all chunks)
    if (!Chunk.terrainNoise) {
      Chunk.terrainNoise = new TerrainNoise(12345); // Use consistent seed
    }
  }

  // Get block at local chunk coordinates (0-15, 0-63, 0-15)
  getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return BlockType.AIR;
    }
    const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    return this.blocks[index];
  }

  // Set block at local chunk coordinates
  setBlock(x: number, y: number, z: number, blockType: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    this.blocks[index] = blockType;
    this.needsUpdate = true;
  }

  // Generate terrain using Perlin noise
  generate(): void {
    if (!Chunk.terrainNoise) return;

    const minHeight = 20; // Minimum terrain height
    const maxHeight = CHUNK_HEIGHT - 10; // Maximum terrain height
    const heightRange = maxHeight - minHeight;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = this.x * CHUNK_SIZE + x;
        const worldZ = this.z * CHUNK_SIZE + z;

        // Get height from noise (0-1 range)
        const heightNoise = Chunk.terrainNoise.getHeight(worldX, worldZ);
        const height = Math.floor(minHeight + heightNoise * heightRange);

        // Get biome value for this position
        const biome = Chunk.terrainNoise.getBiome(worldX, worldZ);

        // Generate columns based on height and biome
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            // Bedrock layer
            this.setBlock(x, y, z, BlockType.STONE);
          } else if (y < height - 4) {
            // Check for caves
            const caveDensity = Chunk.terrainNoise.getCaveDensity(worldX, y, worldZ);
            if (caveDensity > 0.6 && y > 5) {
              this.setBlock(x, y, z, BlockType.AIR); // Cave
            } else {
              this.setBlock(x, y, z, BlockType.STONE);
            }
          } else if (y < height - 1) {
            // Dirt layer
            this.setBlock(x, y, z, BlockType.DIRT);
          } else if (y === height - 1) {
            // Surface layer - biome dependent
            if (biome < 0.3) {
              // Desert biome
              this.setBlock(x, y, z, BlockType.SAND);
            } else if (biome < 0.7) {
              // Grass biome
              this.setBlock(x, y, z, BlockType.GRASS);
            } else {
              // Snow/stone biome (high altitude or cold)
              if (height > maxHeight * 0.7) {
                this.setBlock(x, y, z, BlockType.STONE);
              } else {
                this.setBlock(x, y, z, BlockType.GRASS);
              }
            }
          } else {
            // Air above surface
            this.setBlock(x, y, z, BlockType.AIR);
          }
        }
      }
    }
    this.needsUpdate = true;

    // Decorate chunk (Trees, etc.)
    this.decorate();
  }

  decorate(): void {
    if (!Chunk.terrainNoise) return;

    // Simple seeded random for decoration
    const seed = this.x * 10000 + this.z;
    const random = (n: number) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };

    for (let x = 2; x < CHUNK_SIZE - 2; x++) {
      for (let z = 2; z < CHUNK_SIZE - 2; z++) {
        // Get surface height
        // We need to find the top block. Since we just generated, we can scan down.
        let surfaceY = -1;
        for (let y = CHUNK_HEIGHT - 1; y > 0; y--) {
          if (this.getBlock(x, y, z) !== BlockType.AIR) {
            surfaceY = y;
            break;
          }
        }

        if (surfaceY > 0) {
          const surfaceBlock = this.getBlock(x, surfaceY, z);

          // Trees on Grass
          if (surfaceBlock === BlockType.GRASS) {
            // 2% chance for tree
            if (random(x * z) < 0.02) {
              this.generateTree(x, surfaceY + 1, z);
            }
            // 0.5% chance for house (rare)
            else if (random(x * z + 100) < 0.005) {
              this.generateHouse(x, surfaceY + 1, z);
            }
          }
        }
      }
    }
  }

  generateTree(x: number, y: number, z: number): void {
    const height = 4 + Math.floor(Math.random() * 2);

    // Trunk
    for (let i = 0; i < height; i++) {
      this.setBlock(x, y + i, z, BlockType.LOG);
    }

    // Leaves
    for (let lx = x - 2; lx <= x + 2; lx++) {
      for (let ly = y + height - 2; ly <= y + height + 1; ly++) {
        for (let lz = z - 2; lz <= z + 2; lz++) {
          // Skip corners to make it rounder
          if (Math.abs(lx - x) === 2 && Math.abs(lz - z) === 2) continue;

          // Don't overwrite trunk
          if (lx === x && lz === z && ly < y + height) continue;

          // Set leaves if empty
          if (this.getBlock(lx, ly, lz) === BlockType.AIR) {
            this.setBlock(lx, ly, lz, BlockType.LEAVES);
          }
        }
      }
    }
  }

  generateHouse(x: number, y: number, z: number): void {
    // Simple 5x5x4 house
    const width = 5;
    const height = 4;
    const depth = 5;

    // Check bounds
    if (x + width >= CHUNK_SIZE || z + depth >= CHUNK_SIZE) return;

    for (let hx = 0; hx < width; hx++) {
      for (let hz = 0; hz < depth; hz++) {
        for (let hy = 0; hy < height; hy++) {
          const bx = x + hx;
          const by = y + hy;
          const bz = z + hz;

          // Floor
          if (hy === 0) {
            this.setBlock(bx, by, bz, BlockType.PLANKS);
          }
          // Walls
          else if (hx === 0 || hx === width - 1 || hz === 0 || hz === depth - 1) {
            // Door
            if (hx === 2 && hz === 0 && hy < 3) {
              this.setBlock(bx, by, bz, BlockType.AIR);
            }
            // Windows
            else if ((hx === 0 || hx === width - 1) && hz === 2 && hy === 2) {
              this.setBlock(bx, by, bz, BlockType.AIR);
            }
            else {
              this.setBlock(bx, by, bz, BlockType.BRICKS);
            }
          }
          // Roof
          else if (hy === height - 1) {
            this.setBlock(bx, by, bz, BlockType.PLANKS);
          }
          // Inside
          else {
            this.setBlock(bx, by, bz, BlockType.AIR);
          }
        }
      }
    }
  }

  // Create optimized mesh using greedy meshing algorithm
  createMesh(): THREE.Mesh {
    // Use greedy meshing for optimized geometry
    const geometry = GreedyMesher.generateMesh((x, y, z) => this.getBlock(x, y, z));

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position mesh at chunk world coordinates
    mesh.position.set(
      this.x * CHUNK_SIZE * BLOCK_SIZE,
      0,
      this.z * CHUNK_SIZE * BLOCK_SIZE
    );

    return mesh;
  }

  // Update mesh if needed
  updateMesh(scene: THREE.Scene): void {
    if (!this.needsUpdate) return;

    // Remove old mesh
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }

    // Create new mesh
    this.mesh = this.createMesh();
    scene.add(this.mesh);
    this.needsUpdate = false;
  }

  // Dispose of resources
  dispose(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }
}
