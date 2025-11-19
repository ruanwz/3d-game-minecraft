import * as THREE from 'three';
import { Entity } from './entity';
import { WorldManager } from '@/world/worldManager';

export enum MobType {
    PIG,
    COW,
    ZOMBIE,
    HUMAN
}

export class Mob extends Entity {
    private moveTimer: number = 0;
    private moveDirection: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 2.0;

    constructor(x: number, y: number, z: number, type: MobType) {
        super(x, y, z);

        // Set color based on type
        const material = (this.mesh as THREE.Mesh).material as THREE.MeshLambertMaterial;
        switch (type) {
            case MobType.PIG: material.color.setHex(0xffc0cb); break; // Pink
            case MobType.COW: material.color.setHex(0x444444); break; // Dark Gray
            case MobType.ZOMBIE: material.color.setHex(0x00ff00); break; // Green
            case MobType.HUMAN: material.color.setHex(0xffccaa); break; // Skin tone
        }
    }

    createMesh(): THREE.Object3D {
        // Simple box for now
        const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        return new THREE.Mesh(geometry, material);
    }

    update(deltaTime: number, worldManager: WorldManager): void {
        // Simple AI: Wander
        this.moveTimer -= deltaTime;
        if (this.moveTimer <= 0) {
            this.moveTimer = 2 + Math.random() * 3; // New decision every 2-5s

            if (Math.random() < 0.6) {
                // Move random direction
                const angle = Math.random() * Math.PI * 2;
                this.moveDirection.set(Math.cos(angle), 0, Math.sin(angle));

                // Jump occasionally
                if (this.onGround && Math.random() < 0.3) {
                    this.velocity.y = 5;
                }
            } else {
                // Stop
                this.moveDirection.set(0, 0, 0);
            }
        }

        // Apply movement
        this.velocity.x = this.moveDirection.x * this.speed;
        this.velocity.z = this.moveDirection.z * this.speed;

        // Face direction
        if (this.moveDirection.lengthSq() > 0.01) {
            const angle = Math.atan2(this.moveDirection.x, this.moveDirection.z);
            this.mesh.rotation.y = angle;
        }

        super.update(deltaTime, worldManager);
    }
}
