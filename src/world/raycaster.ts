/**
 * Raycaster for voxel-based block selection
 * Uses DDA (Digital Differential Analyzer) algorithm for fast voxel traversal
 */

import * as THREE from 'three';
import { BlockType } from './block';

export interface RaycastHit {
  position: THREE.Vector3; // World position of the hit block
  normal: THREE.Vector3;   // Normal of the hit face
  blockPosition: THREE.Vector3; // Integer block coordinates
}

export class VoxelRaycaster {
  private maxDistance: number;

  constructor(maxDistance: number = 10) {
    this.maxDistance = maxDistance;
  }

  /**
   * Cast a ray and find the first solid block it hits
   * @param origin Ray origin (camera position)
   * @param direction Ray direction (normalized)
   * @param getBlock Function to get block at position
   * @returns Hit information or null if nothing hit
   */
  cast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    getBlock: (x: number, y: number, z: number) => BlockType
  ): RaycastHit | null {
    // Normalize direction
    const dir = direction.clone().normalize();

    // Current voxel position (integer coordinates)
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    // Direction of step (1 or -1 for each axis)
    const stepX = dir.x > 0 ? 1 : -1;
    const stepY = dir.y > 0 ? 1 : -1;
    const stepZ = dir.z > 0 ? 1 : -1;

    // Distance along ray to next voxel boundary for each axis
    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

    // Calculate initial tMax values (distance to next boundary)
    let tMaxX: number;
    let tMaxY: number;
    let tMaxZ: number;

    if (dir.x > 0) {
      tMaxX = (Math.floor(origin.x) + 1 - origin.x) / dir.x;
    } else if (dir.x < 0) {
      tMaxX = (origin.x - Math.floor(origin.x)) / -dir.x;
    } else {
      tMaxX = Infinity;
    }

    if (dir.y > 0) {
      tMaxY = (Math.floor(origin.y) + 1 - origin.y) / dir.y;
    } else if (dir.y < 0) {
      tMaxY = (origin.y - Math.floor(origin.y)) / -dir.y;
    } else {
      tMaxY = Infinity;
    }

    if (dir.z > 0) {
      tMaxZ = (Math.floor(origin.z) + 1 - origin.z) / dir.z;
    } else if (dir.z < 0) {
      tMaxZ = (origin.z - Math.floor(origin.z)) / -dir.z;
    } else {
      tMaxZ = Infinity;
    }

    // Track which face we hit
    let normal = new THREE.Vector3(0, 0, 0);

    // DDA traversal
    let distance = 0;
    while (distance < this.maxDistance) {
      // Check current voxel
      const block = getBlock(x, y, z);

      if (block !== BlockType.AIR) {
        // Hit a solid block
        return {
          position: new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5),
          normal: normal.clone(),
          blockPosition: new THREE.Vector3(x, y, z),
        };
      }

      // Step to next voxel
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          normal.set(-stepX, 0, 0);
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal.set(0, 0, -stepZ);
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          normal.set(0, -stepY, 0);
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal.set(0, 0, -stepZ);
        }
      }
    }

    // Nothing hit within max distance
    return null;
  }

  /**
   * Get the position where a block should be placed (adjacent to hit block)
   * @param hit The raycast hit information
   * @returns Position for new block
   */
  getPlacementPosition(hit: RaycastHit): THREE.Vector3 {
    return new THREE.Vector3(
      hit.blockPosition.x + hit.normal.x,
      hit.blockPosition.y + hit.normal.y,
      hit.blockPosition.z + hit.normal.z
    );
  }
}
