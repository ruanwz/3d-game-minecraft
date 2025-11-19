import { MOUSE_SENSITIVITY } from '@/utils/constants';
import { TouchControls } from './touch';

export class InputManager {
  private keys = new Set<string>();
  private mouseMovement = { x: 0, y: 0 };
  private mouseButtons = new Set<number>();
  private mouseClicked = new Set<number>(); // Track click events (cleared each frame)
  private pointerLocked = false;
  private touchControls: TouchControls;

  constructor(private canvas: HTMLCanvasElement) {
    this.touchControls = new TouchControls();
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
      // Only request pointer lock if not on a touch device (simple check)
      if (!this.pointerLocked && !('ontouchstart' in window)) {
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
      this.mouseClicked.add(e.button); // Register as clicked this frame
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
      // If on touch device, always show HUD/Crosshair and hide instructions (handled by CSS mostly, but logic here too)
      if ('ontouchstart' in window) {
        instructions.style.display = 'none';
        crosshair.style.display = 'block';
        hud.style.display = 'block';
        return;
      }

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
    if (this.keys.has(code)) return true;

    // Map touch buttons to keys
    if (code === 'Space' && this.touchControls.isButtonPressed('jump')) return true;

    return false;
  }

  // Check if a mouse button is currently pressed
  isMouseButtonPressed(button: number): boolean {
    if (this.mouseButtons.has(button)) return true;

    // Map touch buttons to mouse buttons
    if (button === 0 && this.touchControls.isButtonPressed('break')) return true; // Left click
    if (button === 2 && this.touchControls.isButtonPressed('place')) return true; // Right click

    return false;
  }

  // Check if a mouse button was clicked this frame (single click detection)
  isMouseButtonClicked(button: number): boolean {
    return this.mouseClicked.has(button);
  }

  // Clear per-frame input states (call at end of each frame)
  clearFrameStates(): void {
    this.mouseClicked.clear();
  }

  // Get mouse movement since last frame and reset it
  getMouseMovement(): { x: number; y: number } {
    const movement = { ...this.mouseMovement };
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;

    // Add touch look delta
    const touchLook = this.touchControls.getLookDelta();
    movement.x += touchLook.x;
    movement.y += touchLook.y;

    return movement;
  }

  // Check if pointer is locked
  isPointerLocked(): boolean {
    // On touch devices, we consider it "locked" for gameplay purposes if we are interacting
    // But strictly speaking, pointer lock API isn't used. 
    // However, the game logic checks this to enable controls.
    // Let's always return true for touch devices so controls work without clicking.
    if ('ontouchstart' in window) return true;

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

    // Add joystick input
    const joystick = this.touchControls.getMovement();
    // Joystick Y is positive down, so negative is forward (up on screen)
    // But in 3D space, forward is usually -Z. 
    // Let's check standard WASD: W is forward (+1 in this logic).
    // Joystick Up (negative Y) should be Forward (+1).
    forward -= joystick.y;
    right += joystick.x;

    // Clamp values to -1 to 1 range if needed, but usually fine as is for analog feel
    // However, the game logic might expect integers if it was purely digital.
    // Let's keep it analog for smoother control.

    return { forward, right, up };
  }
}
