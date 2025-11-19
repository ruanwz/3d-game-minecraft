import * as THREE from 'three';
import { Entity } from './entity';
import { WorldManager } from '@/world/worldManager';
import { BlockType } from '@/world/block';

export class TNTEntity extends Entity {
    private fuse: number = 3.0; // 3 seconds
    private blinkTimer: number = 0;

    constructor(x: number, y: number, z: number) {
        super(x, y, z);
        this.width = 0.9;
        this.height = 0.9;
    }

    createMesh(): THREE.Object3D {
        const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        return new THREE.Mesh(geometry, material);
    }

    update(deltaTime: number, worldManager: WorldManager): void {
        super.update(deltaTime, worldManager);

        // Fuse logic
        this.fuse -= deltaTime;
        this.blinkTimer += deltaTime;

        // Blink effect
        if (this.blinkTimer > 0.2) {
            this.blinkTimer = 0;
            const mat = (this.mesh as THREE.Mesh).material as THREE.MeshLambertMaterial;
            mat.color.setHex(mat.color.getHex() === 0xff0000 ? 0xffffff : 0xff0000);
        }

        if (this.fuse <= 0) {
            this.explode(worldManager);
            this.isDead = true;
        }
    }

    private explode(worldManager: WorldManager): void {
        const radius = 4;
        const cx = Math.floor(this.position.x);
        const cy = Math.floor(this.position.y);
        const cz = Math.floor(this.position.z);

        console.log('BOOM!');

        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    if (x * x + y * y + z * z <= radius * radius) {
                        // Don't destroy bedrock (y=0)
                        if (cy + y > 0) {
                            worldManager.setBlock(cx + x, cy + y, cz + z, BlockType.AIR);
                        }
                    }
                }
            }
        }

        // Visual effect? (Maybe just remove blocks for now)
    }
}
