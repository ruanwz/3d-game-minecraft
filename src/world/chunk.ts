import * as THREE from 'three';
import { BlockType, isBlockTransparent, getBlockColor } from './block';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_SIZE } from '@/utils/constants';

export class Chunk {
  public x: number; // Chunk X coordinate
  public z: number; // Chunk Z coordinate
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  private needsUpdate = true;

  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    // Initialize blocks array (x * z * y)
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
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

  // Generate simple terrain for this chunk
  generate(): void {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        // Simple terrain: create layers
        const worldX = this.x * CHUNK_SIZE + x;
        const worldZ = this.z * CHUNK_SIZE + z;

        // Simple height map using sine waves for demo
        const height = Math.floor(
          32 +
          Math.sin(worldX * 0.1) * 4 +
          Math.cos(worldZ * 0.1) * 4 +
          Math.sin(worldX * 0.05) * 8 +
          Math.cos(worldZ * 0.05) * 8
        );

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            this.setBlock(x, y, z, BlockType.STONE); // Bedrock
          } else if (y < height - 4) {
            this.setBlock(x, y, z, BlockType.STONE);
          } else if (y < height - 1) {
            this.setBlock(x, y, z, BlockType.DIRT);
          } else if (y === height - 1) {
            this.setBlock(x, y, z, BlockType.GRASS);
          } else {
            this.setBlock(x, y, z, BlockType.AIR);
          }
        }
      }
    }
    this.needsUpdate = true;
  }

  // Create mesh for this chunk (simple version - one cube per block)
  createMesh(): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertexCount = 0;

    // Iterate through all blocks
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const blockType = this.getBlock(x, y, z);

          // Skip air blocks
          if (blockType === BlockType.AIR) continue;

          const color = new THREE.Color(getBlockColor(blockType));

          // World position of this block
          const wx = x * BLOCK_SIZE;
          const wy = y * BLOCK_SIZE;
          const wz = z * BLOCK_SIZE;

          // Check each face and only add if adjacent block is transparent
          const faces = [
            { dir: [0, 1, 0], corners: [[0,1,0],[1,1,0],[1,1,1],[0,1,1]] }, // Top
            { dir: [0, -1, 0], corners: [[0,0,1],[1,0,1],[1,0,0],[0,0,0]] }, // Bottom
            { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] }, // Right
            { dir: [-1, 0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] }, // Left
            { dir: [0, 0, 1], corners: [[0,0,1],[0,1,1],[1,1,1],[1,0,1]] }, // Front
            { dir: [0, 0, -1], corners: [[1,0,0],[1,1,0],[0,1,0],[0,0,0]] }, // Back
          ];

          for (const face of faces) {
            const [dx, dy, dz] = face.dir;
            const neighborBlock = this.getBlock(x + dx, y + dy, z + dz);

            // Only render face if neighbor is transparent or air
            if (isBlockTransparent(neighborBlock) || neighborBlock === BlockType.AIR) {
              const startVertex = vertexCount;

              // Add 4 vertices for this face
              for (const corner of face.corners) {
                vertices.push(
                  wx + corner[0] * BLOCK_SIZE,
                  wy + corner[1] * BLOCK_SIZE,
                  wz + corner[2] * BLOCK_SIZE
                );
                colors.push(color.r, color.g, color.b);
                vertexCount++;
              }

              // Add 2 triangles (6 indices) for this face
              indices.push(
                startVertex, startVertex + 1, startVertex + 2,
                startVertex, startVertex + 2, startVertex + 3
              );
            }
          }
        }
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

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
