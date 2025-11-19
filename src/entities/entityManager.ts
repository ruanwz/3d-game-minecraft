import * as THREE from 'three';
import { Entity } from './entity';
import { Mob, MobType } from './mob';
import { WorldManager } from '@/world/worldManager';
import { CHUNK_SIZE } from '@/utils/constants';

export class EntityManager {
    private entities: Entity[] = [];
    private scene: THREE.Scene;
    private worldManager: WorldManager;

    constructor(scene: THREE.Scene, worldManager: WorldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    addEntity(entity: Entity): void {
        this.entities.push(entity);
        this.scene.add(entity.mesh);
    }

    removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.scene.remove(entity.mesh);
        }
    }

    update(deltaTime: number): void {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(deltaTime, this.worldManager);

            if (entity.isDead) {
                this.removeEntity(entity);
            }
        }

        // Simple spawning logic
        // If low entity count, spawn some around player
        if (this.entities.length < 20 && Math.random() < 0.01) {
            this.spawnRandomMob();
        }
    }

    private spawnRandomMob(): void {
        // Find a valid spawn position
        // For simplicity, just pick a random loaded chunk and surface
        const chunks = Array.from(this.worldManager.getAllChunks().values());
        if (chunks.length === 0) return;

        const chunk = chunks[Math.floor(Math.random() * chunks.length)];
        const cx = Math.floor(Math.random() * CHUNK_SIZE);
        const cz = Math.floor(Math.random() * CHUNK_SIZE);

        // Find surface
        // We can't easily access chunk.getBlock from here without world coords logic duplication
        // Let's use worldManager.getBlock
        const wx = chunk.x * CHUNK_SIZE + cx;
        const wz = chunk.z * CHUNK_SIZE + cz;

        let surfaceY = -1;
        for (let y = 60; y > 0; y--) {
            if (this.worldManager.getBlock(wx, y, wz) !== 0) {
                surfaceY = y;
                break;
            }
        }

        if (surfaceY > 0) {
            const type = Math.floor(Math.random() * 4) as MobType;
            const mob = new Mob(wx + 0.5, surfaceY + 2, wz + 0.5, type);
            this.addEntity(mob);
        }
    }
}
