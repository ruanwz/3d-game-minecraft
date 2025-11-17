/**
 * Greedy Meshing Algorithm for Minecraft-like Voxel Games
 *
 * This algorithm combines adjacent faces of the same block type into larger quads,
 * dramatically reducing the number of triangles and improving rendering performance.
 *
 * Based on the algorithm described at:
 * https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/
 */

import { BlockType, isBlockTransparent, getBlockColor } from './block';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/utils/constants';
import * as THREE from 'three';

export class GreedyMesher {
  /**
   * Generate optimized mesh using greedy meshing algorithm
   */
  static generateMesh(
    getBlock: (x: number, y: number, z: number) => BlockType
  ): THREE.BufferGeometry {
    const vertices: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    // Process each axis (X, Y, Z)
    for (let axis = 0; axis < 3; axis++) {
      // Process both directions (positive and negative)
      for (let direction = -1; direction <= 1; direction += 2) {
        const u = (axis + 1) % 3; // First perpendicular axis
        const v = (axis + 2) % 3; // Second perpendicular axis

        const dims = [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE];
        const mask: (BlockType | null)[] = new Array(dims[u] * dims[v]);

        // Iterate through each slice along the axis
        for (let d = 0; d < dims[axis]; d++) {
          // Build mask for this slice
          let n = 0;
          for (let j = 0; j < dims[v]; j++) {
            for (let i = 0; i < dims[u]; i++) {
              const pos = [0, 0, 0];
              pos[axis] = d;
              pos[u] = i;
              pos[v] = j;

              const currentBlock = getBlock(pos[0], pos[1], pos[2]);

              // Get neighbor block in the direction we're facing
              const neighborPos = [...pos];
              neighborPos[axis] += direction;
              const neighborBlock = getBlock(neighborPos[0], neighborPos[1], neighborPos[2]);

              // Determine if we should render this face
              if (currentBlock !== BlockType.AIR &&
                  (neighborBlock === BlockType.AIR || isBlockTransparent(neighborBlock))) {
                mask[n] = currentBlock;
              } else {
                mask[n] = null;
              }

              n++;
            }
          }

          // Generate quads from mask using greedy algorithm
          n = 0;
          for (let j = 0; j < dims[v]; j++) {
            for (let i = 0; i < dims[u]; ) {
              if (mask[n] !== null) {
                const currentBlock = mask[n]!;

                // Compute width
                let width = 1;
                while (i + width < dims[u] && mask[n + width] === currentBlock) {
                  width++;
                }

                // Compute height
                let height = 1;
                let done = false;
                while (j + height < dims[v]) {
                  // Check if entire row matches
                  for (let k = 0; k < width; k++) {
                    if (mask[n + k + height * dims[u]] !== currentBlock) {
                      done = true;
                      break;
                    }
                  }
                  if (done) break;
                  height++;
                }

                // Add quad
                const pos = [0, 0, 0];
                pos[axis] = d;
                pos[u] = i;
                pos[v] = j;

                this.addQuad(
                  vertices,
                  colors,
                  normals,
                  indices,
                  pos,
                  width,
                  height,
                  axis,
                  u,
                  v,
                  direction,
                  currentBlock,
                  vertexCount
                );

                vertexCount += 4;

                // Clear mask for merged area
                for (let l = 0; l < height; l++) {
                  for (let k = 0; k < width; k++) {
                    mask[n + k + l * dims[u]] = null;
                  }
                }

                i += width;
                n += width;
              } else {
                i++;
                n++;
              }
            }
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  }

  private static addQuad(
    vertices: number[],
    colors: number[],
    normals: number[],
    indices: number[],
    pos: number[],
    width: number,
    height: number,
    axis: number,
    u: number,
    v: number,
    direction: number,
    blockType: BlockType,
    vertexCount: number
  ): void {
    const color = new THREE.Color(getBlockColor(blockType));

    // Calculate the 4 corners of the quad
    const du = [0, 0, 0];
    const dv = [0, 0, 0];
    du[u] = width;
    dv[v] = height;

    // Offset for face direction
    const offset = [0, 0, 0];
    offset[axis] = direction > 0 ? 1 : 0;

    // Four corners of the quad
    const corners = [
      [pos[0] + offset[0], pos[1] + offset[1], pos[2] + offset[2]],
      [pos[0] + du[0] + offset[0], pos[1] + du[1] + offset[1], pos[2] + du[2] + offset[2]],
      [pos[0] + du[0] + dv[0] + offset[0], pos[1] + du[1] + dv[1] + offset[1], pos[2] + du[2] + dv[2] + offset[2]],
      [pos[0] + dv[0] + offset[0], pos[1] + dv[1] + offset[1], pos[2] + dv[2] + offset[2]],
    ];

    // Determine correct winding order based on direction
    const orderedCorners = direction > 0 ? corners : [corners[3], corners[2], corners[1], corners[0]];

    // Add vertices
    for (const corner of orderedCorners) {
      vertices.push(corner[0], corner[1], corner[2]);
      colors.push(color.r, color.g, color.b);
    }

    // Add normal
    const normal = [0, 0, 0];
    normal[axis] = direction;
    for (let i = 0; i < 4; i++) {
      normals.push(normal[0], normal[1], normal[2]);
    }

    // Add indices (two triangles)
    indices.push(
      vertexCount, vertexCount + 1, vertexCount + 2,
      vertexCount, vertexCount + 2, vertexCount + 3
    );
  }
}
