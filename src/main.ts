import { GameEngine } from './core/engine';
import './style.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('3D Minecraft - 网页版我的世界');
  console.log('Initializing game...');

  // Get game container
  const container = document.getElementById('game-container');

  if (!container) {
    console.error('Game container not found!');
    return;
  }

  // Create and start game engine
  const game = new GameEngine(container);
  game.start();

  // Make game globally accessible for debugging
  (window as any).game = game;

  console.log('Game initialized successfully!');
  console.log('Click on the screen to start playing');
  console.log('Controls:');
  console.log('  WASD - Move');
  console.log('  Space - Up');
  console.log('  Shift - Down');
  console.log('  Mouse - Look around');
  console.log('  ESC - Release pointer lock');
});
