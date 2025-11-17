import { MOUSE_SENSITIVITY } from '@/utils/constants';

export class InputManager {
  private keys = new Set<string>();
  private mouseMovement = { x: 0, y: 0 };
  private mouseButtons = new Set<number>();
  private pointerLocked = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);

      // Prevent default browser behavior for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Mouse events
    this.canvas.addEventListener('click', () => {
      if (!this.pointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      this.updateInstructions();
    });

    document.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        this.mouseMovement.x = e.movementX * MOUSE_SENSITIVITY;
        this.mouseMovement.y = e.movementY * MOUSE_SENSITIVITY;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private updateInstructions(): void {
    const instructions = document.getElementById('instructions');
    const crosshair = document.getElementById('crosshair');
    const hud = document.getElementById('hud');

    if (instructions && crosshair && hud) {
      if (this.pointerLocked) {
        instructions.style.display = 'none';
        crosshair.style.display = 'block';
        hud.style.display = 'block';
      } else {
        instructions.style.display = 'block';
        crosshair.style.display = 'none';
        hud.style.display = 'none';
      }
    }
  }

  // Check if a key is currently pressed
  isKeyPressed(code: string): boolean {
    return this.keys.has(code);
  }

  // Check if a mouse button is currently pressed
  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  // Get mouse movement since last frame and reset it
  getMouseMovement(): { x: number; y: number } {
    const movement = { ...this.mouseMovement };
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    return movement;
  }

  // Check if pointer is locked
  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  // Get movement input vector
  getMovementInput(): { forward: number; right: number; up: number } {
    let forward = 0;
    let right = 0;
    let up = 0;

    if (this.isKeyPressed('KeyW')) forward += 1;
    if (this.isKeyPressed('KeyS')) forward -= 1;
    if (this.isKeyPressed('KeyD')) right += 1;
    if (this.isKeyPressed('KeyA')) right -= 1;
    if (this.isKeyPressed('Space')) up += 1;
    if (this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight')) up -= 1;

    return { forward, right, up };
  }
}
