import * as THREE from 'three';
import { WorldManager } from '@/world/worldManager';
import { GRAVITY } from '@/utils/constants';
import { BlockType } from '@/world/block';

export abstract class Entity {
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public mesh!: THREE.Object3D;
    public isDead: boolean = false;

    protected width: number = 0.6;
    protected height: number = 1.8;
    protected onGround: boolean = false;
    public health: number = 10;
    public maxHealth: number = 10;
    protected meshColor: number = 0xffffff;

    constructor(x: number, y: number, z: number) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        // Mesh must be initialized by subclasses
    }

    abstract createMesh(): THREE.Object3D;

    public takeDamage(amount: number): void {
        this.health -= amount;
        this.flashRed();
        if (this.health <= 0) {
            this.isDead = true;
        }
    }

    private flashRed(): void {
        if (this.mesh instanceof THREE.Mesh) {
            const material = this.mesh.material as THREE.MeshLambertMaterial;
            // Store original color if not already stored (though for simple mesh we use meshColor)
            material.color.setHex(0xff0000);
            setTimeout(() => {
                if (!this.isDead) {
                    material.color.setHex(this.meshColor);
                }
            }, 200);
        } else if (this.mesh instanceof THREE.Group) {
            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshLambertMaterial;
                    // Store original color in userData if not already there
                    if (!child.userData.originalColor) {
                        child.userData.originalColor = material.color.getHex();
                    }
                    material.color.setHex(0xff0000);
                }
            });
            setTimeout(() => {
                if (!this.isDead) {
                    this.mesh.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            const material = child.material as THREE.MeshLambertMaterial;
                            if (child.userData.originalColor !== undefined) {
                                material.color.setHex(child.userData.originalColor);
                            }
                        }
                    });
                }
            }, 200);
        }
    }

    update(deltaTime: number, worldManager: WorldManager): void {
        // Apply gravity
        this.velocity.y -= GRAVITY * deltaTime;

        // Apply velocity
        const moveStep = this.velocity.clone().multiplyScalar(deltaTime);

        // Simple collision detection (similar to player but simplified)
        this.handleCollision(moveStep, worldManager);

        // Update mesh position
        this.mesh.position.copy(this.position);
    }

    protected handleCollision(moveStep: THREE.Vector3, worldManager: WorldManager): void {
        // 1. Horizontal X
        let nextPos = this.position.clone().add(new THREE.Vector3(moveStep.x, 0, 0));
        if (!this.checkCollision(nextPos, worldManager)) {
            this.position.x = nextPos.x;
        } else {
            this.velocity.x = 0;
        }

        // 2. Horizontal Z
        nextPos = this.position.clone().add(new THREE.Vector3(0, 0, moveStep.z));
        if (!this.checkCollision(nextPos, worldManager)) {
            this.position.z = nextPos.z;
        } else {
            this.velocity.z = 0;
        }

        // 3. Vertical Y
        nextPos = this.position.clone().add(new THREE.Vector3(0, moveStep.y, 0));
        if (!this.checkCollision(nextPos, worldManager)) {
            this.position.y = nextPos.y;
            this.onGround = false;
        } else {
            if (this.velocity.y < 0) this.onGround = true;
            this.velocity.y = 0;
        }

        // World bounds
        if (this.position.y < -10) {
            this.isDead = true;
        }
    }

    protected checkCollision(pos: THREE.Vector3, worldManager: WorldManager): boolean {
        // Check bounding box corners
        const minX = Math.floor(pos.x - this.width / 2);
        const maxX = Math.floor(pos.x + this.width / 2);
        const minY = Math.floor(pos.y);
        const maxY = Math.floor(pos.y + this.height);
        const minZ = Math.floor(pos.z - this.width / 2);
        const maxZ = Math.floor(pos.z + this.width / 2);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const block = worldManager.getBlock(x, y, z);
                    if (block !== BlockType.AIR && block !== BlockType.WATER) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
