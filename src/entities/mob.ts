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
    private type: MobType;
    private moveTimer: number = 0;
    private moveDirection: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 2.0;

    constructor(x: number, y: number, z: number, type: MobType) {
        super(x, y, z);
        this.type = type;
        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);
    }

    createMesh(): THREE.Object3D {
        const group = new THREE.Group();

        let bodyColor = 0xffffff;
        let headColor = 0xffffff;
        let legColor = 0x444444;

        switch (this.type) {
            case MobType.PIG:
                bodyColor = 0xffaaaa; // Pink
                headColor = 0xffaaaa;
                legColor = 0xff8888;
                this.meshColor = bodyColor;

                // Body
                const bodyGeo = new THREE.BoxGeometry(0.5, 0.3, 0.6);
                const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.3;
                group.add(body);

                // Head
                const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const headMat = new THREE.MeshLambertMaterial({ color: headColor });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.set(0, 0.5, 0.35);
                group.add(head);

                // Legs
                const legGeo = new THREE.BoxGeometry(0.15, 0.2, 0.15);
                const legMat = new THREE.MeshLambertMaterial({ color: legColor });

                const leg1 = new THREE.Mesh(legGeo, legMat); leg1.position.set(-0.15, 0.1, 0.2); group.add(leg1);
                const leg2 = new THREE.Mesh(legGeo, legMat); leg2.position.set(0.15, 0.1, 0.2); group.add(leg2);
                const leg3 = new THREE.Mesh(legGeo, legMat); leg3.position.set(-0.15, 0.1, -0.2); group.add(leg3);
                const leg4 = new THREE.Mesh(legGeo, legMat); leg4.position.set(0.15, 0.1, -0.2); group.add(leg4);
                break;

            case MobType.COW:
                bodyColor = 0x443322; // Brown
                headColor = 0x443322;
                legColor = 0x221100;
                this.meshColor = bodyColor;

                // Body
                const cowBodyGeo = new THREE.BoxGeometry(0.6, 0.5, 0.8);
                const cowBodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
                const cowBody = new THREE.Mesh(cowBodyGeo, cowBodyMat);
                cowBody.position.y = 0.5;
                group.add(cowBody);

                // Head
                const cowHeadGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
                const cowHeadMat = new THREE.MeshLambertMaterial({ color: headColor });
                const cowHead = new THREE.Mesh(cowHeadGeo, cowHeadMat);
                cowHead.position.set(0, 0.8, 0.5);
                group.add(cowHead);

                // Legs
                const cowLegGeo = new THREE.BoxGeometry(0.18, 0.3, 0.18);
                const cowLegMat = new THREE.MeshLambertMaterial({ color: legColor });

                const cleg1 = new THREE.Mesh(cowLegGeo, cowLegMat); cleg1.position.set(-0.2, 0.15, 0.3); group.add(cleg1);
                const cleg2 = new THREE.Mesh(cowLegGeo, cowLegMat); cleg2.position.set(0.2, 0.15, 0.3); group.add(cleg2);
                const cleg3 = new THREE.Mesh(cowLegGeo, cowLegMat); cleg3.position.set(-0.2, 0.15, -0.3); group.add(cleg3);
                const cleg4 = new THREE.Mesh(cowLegGeo, cowLegMat); cleg4.position.set(0.2, 0.15, -0.3); group.add(cleg4);
                break;

            case MobType.ZOMBIE:
            case MobType.HUMAN:
                bodyColor = this.type === MobType.ZOMBIE ? 0x00aa00 : 0x0000aa; // Green or Blue
                headColor = this.type === MobType.ZOMBIE ? 0x00aa00 : 0xffccaa; // Green or Skin
                legColor = 0x444444;
                this.meshColor = bodyColor;

                // Body
                const hBodyGeo = new THREE.BoxGeometry(0.4, 0.6, 0.2);
                const hBodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
                const hBody = new THREE.Mesh(hBodyGeo, hBodyMat);
                hBody.position.y = 0.7;
                group.add(hBody);

                // Head
                const hHeadGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const hHeadMat = new THREE.MeshLambertMaterial({ color: headColor });
                const hHead = new THREE.Mesh(hHeadGeo, hHeadMat);
                hHead.position.y = 1.15;
                group.add(hHead);

                // Legs
                const hLegGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
                const hLegMat = new THREE.MeshLambertMaterial({ color: legColor });

                const hleg1 = new THREE.Mesh(hLegGeo, hLegMat); hleg1.position.set(-0.1, 0.3, 0); group.add(hleg1);
                const hleg2 = new THREE.Mesh(hLegGeo, hLegMat); hleg2.position.set(0.1, 0.3, 0); group.add(hleg2);

                // Arms
                const hArmGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
                const hArmMat = new THREE.MeshLambertMaterial({ color: bodyColor });

                const harm1 = new THREE.Mesh(hArmGeo, hArmMat); harm1.position.set(-0.3, 0.7, 0); group.add(harm1);
                const harm2 = new THREE.Mesh(hArmGeo, hArmMat); harm2.position.set(0.3, 0.7, 0); group.add(harm2);

                if (this.type === MobType.ZOMBIE) {
                    // Zombie arms raised
                    harm1.rotation.x = -Math.PI / 2;
                    harm1.position.set(-0.3, 0.9, 0.3);
                    harm2.rotation.x = -Math.PI / 2;
                    harm2.position.set(0.3, 0.9, 0.3);
                }
                break;
        }

        return group;
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
