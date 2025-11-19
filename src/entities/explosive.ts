import * as THREE from 'three';
import { Entity } from './entity';
import { WorldManager } from '@/world/worldManager';
import { BlockType } from '@/world/block';

export class TNTEntity extends Entity {
    private fuseTimer: number = 3.0; // 3 seconds

    constructor(x: number, y: number, z: number) {
        super(x, y, z);
        this.width = 0.9;
        this.height = 0.9;
        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);
    }

    createMesh(): THREE.Object3D {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        return new THREE.Mesh(geometry, material);
    }

    update(deltaTime: number, worldManager: WorldManager): void {
        if (this.isDead) return;

        super.update(deltaTime, worldManager); // Keep base update for position, velocity, etc.

        this.fuseTimer -= deltaTime;

        // Blink effect
        if (this.fuseTimer > 0) {
            const blinkSpeed = 10; // Hz
            const isWhite = Math.floor(this.fuseTimer * blinkSpeed) % 2 === 0;
            (this.mesh as THREE.Mesh).material = new THREE.MeshLambertMaterial({
                color: isWhite ? 0xffffff : 0xff0000
            });
        } else {
            this.explode(worldManager);
        }
    }

    private explode(worldManager: WorldManager): void {
        this.isDead = true;
        const radius = 3;

        // Destroy blocks
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    if (x * x + y * y + z * z <= radius * radius) {
                        const bx = Math.floor(this.position.x + x);
                        const by = Math.floor(this.position.y + y);
                        const bz = Math.floor(this.position.z + z);

                        // Don't destroy bedrock (y=0)
                        if (by > 0) {
                            worldManager.setBlock(bx, by, bz, BlockType.AIR);
                        }
                    }
                }
            }
        }

        // Damage entities
        const entities = (window as any).gameEngine?.entityManager?.entities;
        if (entities) {
            for (const entity of entities) {
                if (entity === this) continue;
                if (entity.isDead) continue;

                const dist = this.position.distanceTo(entity.position);
                if (dist <= radius + 2) { // Explosion radius + buffer
                    const damage = Math.floor((1 - dist / (radius + 2)) * 20); // Max 20 damage
                    if (damage > 0 && entity.takeDamage) {
                        entity.takeDamage(damage);
                    }
                }
            }
        }

        // Visual effect? (Maybe just remove blocks for now)
    }
}
