import { MOUSE_SENSITIVITY } from '@/utils/constants';

export class TouchControls {
    private joystickData = { active: false, originX: 0, originY: 0, x: 0, y: 0 };
    private lookData = { active: false, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0 };
    private buttons = new Set<string>();

    private joystickElement: HTMLElement | null = null;
    private joystickKnobElement: HTMLElement | null = null;
    private touchContainer: HTMLElement | null = null;

    constructor() {
        if (this.isTouchDevice()) {
            this.createUI();
            this.setupEventListeners();
        }
    }

    private isTouchDevice(): boolean {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    private createUI(): void {
        // Create container
        this.touchContainer = document.createElement('div');
        this.touchContainer.id = 'touch-controls';

        // Joystick
        const joystickZone = document.createElement('div');
        joystickZone.id = 'joystick-zone';
        this.joystickElement = document.createElement('div');
        this.joystickElement.id = 'joystick-base';
        this.joystickKnobElement = document.createElement('div');
        this.joystickKnobElement.id = 'joystick-knob';

        this.joystickElement.appendChild(this.joystickKnobElement);
        joystickZone.appendChild(this.joystickElement);

        // Look Zone (Right side)
        const lookZone = document.createElement('div');
        lookZone.id = 'look-zone';

        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'touch-buttons';

        const jumpBtn = this.createButton('Jump', 'jump-btn');
        const breakBtn = this.createButton('Break', 'break-btn');
        const placeBtn = this.createButton('Place', 'place-btn');

        buttonContainer.appendChild(placeBtn);
        buttonContainer.appendChild(breakBtn);
        buttonContainer.appendChild(jumpBtn);

        this.touchContainer.appendChild(joystickZone);
        this.touchContainer.appendChild(lookZone);
        this.touchContainer.appendChild(buttonContainer);

        document.body.appendChild(this.touchContainer);
    }

    private createButton(text: string, id: string): HTMLElement {
        const btn = document.createElement('div');
        btn.className = 'touch-button';
        btn.id = id;
        btn.innerText = text;
        return btn;
    }

    private setupEventListeners(): void {
        if (!this.touchContainer) return;

        const joystickZone = document.getElementById('joystick-zone');
        const lookZone = document.getElementById('look-zone');
        const jumpBtn = document.getElementById('jump-btn');
        const breakBtn = document.getElementById('break-btn');
        const placeBtn = document.getElementById('place-btn');

        // Joystick Logic
        if (joystickZone) {
            joystickZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                this.joystickData.active = true;
                this.joystickData.originX = touch.clientX;
                this.joystickData.originY = touch.clientY;
                this.updateJoystickVisuals(touch.clientX, touch.clientY);
            }, { passive: false });

            joystickZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (this.joystickData.active) {
                    const touch = e.changedTouches[0];
                    this.updateJoystickVisuals(touch.clientX, touch.clientY);
                }
            }, { passive: false });

            const endJoystick = (e: TouchEvent) => {
                e.preventDefault();
                this.joystickData.active = false;
                this.joystickData.x = 0;
                this.joystickData.y = 0;
                this.resetJoystickVisuals();
            };

            joystickZone.addEventListener('touchend', endJoystick);
            joystickZone.addEventListener('touchcancel', endJoystick);
        }

        // Look Logic
        if (lookZone) {
            lookZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                this.lookData.active = true;
                this.lookData.lastX = touch.clientX;
                this.lookData.lastY = touch.clientY;
            }, { passive: false });

            lookZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (this.lookData.active) {
                    const touch = e.changedTouches[0];
                    const dx = touch.clientX - this.lookData.lastX;
                    const dy = touch.clientY - this.lookData.lastY;

                    this.lookData.deltaX += dx * MOUSE_SENSITIVITY * 0.5; // Adjust sensitivity for touch
                    this.lookData.deltaY += dy * MOUSE_SENSITIVITY * 0.5;

                    this.lookData.lastX = touch.clientX;
                    this.lookData.lastY = touch.clientY;
                }
            }, { passive: false });

            const endLook = (e: TouchEvent) => {
                e.preventDefault();
                this.lookData.active = false;
            };

            lookZone.addEventListener('touchend', endLook);
            lookZone.addEventListener('touchcancel', endLook);
        }

        // Buttons
        const setupButton = (btn: HTMLElement | null, action: string) => {
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.buttons.add(action);
                btn.classList.add('active');
            }, { passive: false });

            const endBtn = (e: TouchEvent) => {
                e.preventDefault();
                this.buttons.delete(action);
                btn.classList.remove('active');
            };

            btn.addEventListener('touchend', endBtn);
            btn.addEventListener('touchcancel', endBtn);
        };

        setupButton(jumpBtn, 'jump');
        setupButton(breakBtn, 'break');
        setupButton(placeBtn, 'place');
    }

    private updateJoystickVisuals(currentX: number, currentY: number): void {
        if (!this.joystickKnobElement || !this.joystickElement) return;

        const maxRadius = 40;
        let dx = currentX - this.joystickData.originX;
        let dy = currentY - this.joystickData.originY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) {
            const ratio = maxRadius / distance;
            dx *= ratio;
            dy *= ratio;
        }

        this.joystickData.x = dx / maxRadius;
        this.joystickData.y = dy / maxRadius;

        this.joystickKnobElement.style.transform = `translate(${dx}px, ${dy}px)`;
        this.joystickElement.style.display = 'block';
        this.joystickElement.style.left = `${this.joystickData.originX}px`;
        this.joystickElement.style.top = `${this.joystickData.originY}px`;
    }

    private resetJoystickVisuals(): void {
        if (!this.joystickKnobElement || !this.joystickElement) return;
        this.joystickKnobElement.style.transform = `translate(0px, 0px)`;
        this.joystickElement.style.display = 'none';
    }

    // Public API

    getMovement(): { x: number, y: number } {
        return { x: this.joystickData.x, y: this.joystickData.y };
    }

    getLookDelta(): { x: number, y: number } {
        const delta = { x: this.lookData.deltaX, y: this.lookData.deltaY };
        this.lookData.deltaX = 0;
        this.lookData.deltaY = 0;
        return delta;
    }

    isButtonPressed(action: string): boolean {
        return this.buttons.has(action);
    }
}
