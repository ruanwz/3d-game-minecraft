import * as THREE from 'three';
import { Entity } from './entity';
import { WorldManager } from '@/world/worldManager';
import { BlockType } from '@/world/block';

export class Arrow extends Entity {
    private lifeTime: number = 0;
    private stuck: boolean = false;

    constructor(x: number, y: number, z: number, direction: THREE.Vector3) {
        super(x, y, z);
        this.velocity = direction.normalize().multiplyScalar(50); // High speed
        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);

        // Orient arrow to face direction
        this.mesh.lookAt(this.position.clone().add(direction));
    }

    createMesh(): THREE.Object3D {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        return new THREE.Mesh(geometry, material);
    }

    update(deltaTime: number, worldManager: WorldManager): void {
        if (this.isDead) return;

        this.lifeTime += deltaTime;
        if (this.lifeTime > 5.0) {
            this.isDead = true;
            return;
        }

        if (this.stuck) {
            return;
        }

        // Custom physics for arrow (raycast for high speed)

        // Raycast to check for hit
        // Note: THREE.Raycaster checks meshes. We need block check.
        // But for entities, we can use simple distance check for now or raycast against entity meshes.

        // Check entity collisions
        const entities = (window as any).gameEngine?.entityManager?.entities;
        if (entities) {
            for (const entity of entities) {
                if (entity === this) continue;
                if (entity.isDead) continue;

                // Simple bounding box check
                const dist = this.position.distanceTo(entity.position);
                if (dist < 1.0) { // Hit radius
                    if (entity.takeDamage) {
                        entity.takeDamage(3); // Arrow does 3 damage
                        console.log("Hit entity!");
                        this.isDead = true; // Destroy arrow
                        return;
                    }
                }
            }
        }

        // Block collision check
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
