/**
 * WorldManager - Manages all chunks and provides world-level block operations
 */

import * as THREE from 'three';
import { Chunk } from './chunk';
import { BlockType } from './block';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/utils/constants';

export class WorldManager {
  private chunks = new Map<string, Chunk>();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Get chunk key from chunk coordinates
   */
  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }

  /**
   * Get chunk coordinates from world coordinates
   */
  private worldToChunkCoords(x: number, z: number): { chunkX: number; chunkZ: number } {
    return {
      chunkX: Math.floor(x / CHUNK_SIZE),
      chunkZ: Math.floor(z / CHUNK_SIZE),
    };
  }

  /**
   * Get local coordinates within a chunk from world coordinates
   */
  private worldToLocalCoords(
    x: number,
    y: number,
    z: number
  ): { localX: number; localY: number; localZ: number } {
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = y;
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { localX, localY, localZ };
  }

  /**
   * Get chunk at given chunk coordinates
   */
  getChunk(chunkX: number, chunkZ: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(chunkX, chunkZ));
  }

  /**
   * Add or update chunk
   */
  setChunk(chunk: Chunk): void {
    const key = this.getChunkKey(chunk.x, chunk.z);
    this.chunks.set(key, chunk);
  }

  /**
   * Remove chunk and dispose of its resources
   */
  removeChunk(chunkX: number, chunkZ: number): void {
    const key = this.getChunkKey(chunkX, chunkZ);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.dispose(this.scene);
      this.chunks.delete(key);
    }
  }

  /**
   * Get block at world coordinates
   */
  getBlock(x: number, y: number, z: number): BlockType {
    // Check bounds
    if (y < 0 || y >= CHUNK_HEIGHT) {
      return BlockType.AIR;
    }

    const { chunkX, chunkZ } = this.worldToChunkCoords(x, z);
    const chunk = this.getChunk(chunkX, chunkZ);

    if (!chunk) {
      return BlockType.AIR; // Chunk not loaded
    }

    const { localX, localY, localZ } = this.worldToLocalCoords(x, y, z);
    return chunk.getBlock(localX, localY, localZ);
  }

  /**
   * Set block at world coordinates
   * @returns true if block was set, false otherwise
   */
  setBlock(x: number, y: number, z: number, blockType: BlockType): boolean {
    // Check bounds
    if (y < 0 || y >= CHUNK_HEIGHT) {
      return false;
    }

    const { chunkX, chunkZ } = this.worldToChunkCoords(x, z);
    const chunk = this.getChunk(chunkX, chunkZ);

    if (!chunk) {
      return false; // Chunk not loaded
    }

    const { localX, localY, localZ } = this.worldToLocalCoords(x, y, z);
    chunk.setBlock(localX, localY, localZ, blockType);

    // Update chunk mesh
    chunk.updateMesh(this.scene);

    // Check if we need to update neighboring chunks
    // (if block is on chunk boundary)
    if (localX === 0) {
      const neighborChunk = this.getChunk(chunkX - 1, chunkZ);
      if (neighborChunk) neighborChunk.updateMesh(this.scene);
    } else if (localX === CHUNK_SIZE - 1) {
      const neighborChunk = this.getChunk(chunkX + 1, chunkZ);
      if (neighborChunk) neighborChunk.updateMesh(this.scene);
    }

    if (localZ === 0) {
      const neighborChunk = this.getChunk(chunkX, chunkZ - 1);
      if (neighborChunk) neighborChunk.updateMesh(this.scene);
    } else if (localZ === CHUNK_SIZE - 1) {
      const neighborChunk = this.getChunk(chunkX, chunkZ + 1);
      if (neighborChunk) neighborChunk.updateMesh(this.scene);
    }

    return true;
  }

  /**
   * Get all chunks
   */
  getAllChunks(): Map<string, Chunk> {
    return this.chunks;
  }

  /**
   * Clear all chunks
   */
  clear(): void {
    this.chunks.forEach(chunk => chunk.dispose(this.scene));
    this.chunks.clear();
  }
}
