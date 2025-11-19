import * as THREE from 'three';
import { Entity } from './entity';
import { WorldManager } from '@/world/worldManager';
import { BlockType } from '@/world/block';

export class Arrow extends Entity {
    private lifeTime: number = 0;
    private stuck: boolean = false;

    constructor(x: number, y: number, z: number, direction: THREE.Vector3) {
        super(x, y, z);
        this.width = 0.1;
        this.height = 0.1;

        // Set initial velocity
        this.velocity.copy(direction).multiplyScalar(20); // High speed

        // Rotate mesh to face direction
        this.mesh.lookAt(this.position.clone().add(direction));
    }

    createMesh(): THREE.Object3D {
        // Simple stick
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
        return new THREE.Mesh(geometry, material);
    }

    update(deltaTime: number, worldManager: WorldManager): void {
        if (this.stuck) {
            this.lifeTime += deltaTime;
            if (this.lifeTime > 10) this.isDead = true; // Despawn after 10s
            return;
        }

        // Custom physics for arrow (raycast for high speed)

        // Raycast to check for hit
        // Note: THREE.Raycaster checks meshes. We need block check.
        // So let's just step forward and check block.

        const nextPos = this.position.clone().add(this.velocity.clone().multiplyScalar(deltaTime));

        // Check block at nextPos
        if (worldManager.getBlock(Math.floor(nextPos.x), Math.floor(nextPos.y), Math.floor(nextPos.z)) !== BlockType.AIR) {
            this.stuck = true;
            this.velocity.set(0, 0, 0);
            // Snap to hit point roughly
            this.position.copy(nextPos);
            this.mesh.position.copy(this.position);
            return;
        }

        // Update position
        this.position.copy(nextPos);
        this.mesh.position.copy(this.position);

        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;

        // Rotate to face velocity
        if (this.velocity.lengthSq() > 0.1) {
            this.mesh.lookAt(this.position.clone().add(this.velocity));
        }

        this.lifeTime += deltaTime;
        if (this.lifeTime > 5) this.isDead = true;
    }
}
