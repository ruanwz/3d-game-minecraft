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
