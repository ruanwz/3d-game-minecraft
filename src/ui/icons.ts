import { BlockType, getBlockColor } from '@/world/block';

export function generateBlockIcon(type: BlockType): string {
    const color = '#' + getBlockColor(type).toString(16).padStart(6, '0');

    // Basic isometric-ish cube view
    // Top face: lighter
    // Right face: darker
    // Left face: base color

    // We can simulate this with simple SVG paths

    // Helper to darken/lighten hex color
    const adjustColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    };

    const topColor = adjustColor(color, 20);
    const leftColor = color;
    const rightColor = adjustColor(color, -20);

    // Special handling for specific blocks
    let pattern = '';

    if (type === BlockType.GRASS) {
        // Grass block has green top, dirt sides
        const dirtColor = '#8b6d47';
        const grassColor = '#5a8c3a';

        return `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2 L38 11 L20 20 L2 11 Z" fill="${grassColor}"/> <!-- Top -->
      <path d="M2 11 L20 20 L20 38 L2 29 Z" fill="${adjustColor(dirtColor, 0)}"/> <!-- Left -->
      <path d="M20 20 L38 11 L38 29 L20 38 Z" fill="${adjustColor(dirtColor, -20)}"/> <!-- Right -->
    </svg>`;
    }

    if (type === BlockType.LOG) {
        // Log has rings on top
        const barkColor = '#5c4033';
        const ringColor = '#deb887';

        return `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2 L38 11 L20 20 L2 11 Z" fill="${ringColor}"/> <!-- Top -->
      <circle cx="20" cy="11" r="4" fill="${barkColor}" opacity="0.5"/> <!-- Ring -->
      <path d="M2 11 L20 20 L20 38 L2 29 Z" fill="${barkColor}"/> <!-- Left -->
      <path d="M20 20 L38 11 L38 29 L20 38 Z" fill="${adjustColor(barkColor, -20)}"/> <!-- Right -->
    </svg>`;
    }

    if (type === BlockType.TNT) {
        return `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2 L38 11 L20 20 L2 11 Z" fill="#ffcccc"/> <!-- Top -->
      <path d="M2 11 L20 20 L20 38 L2 29 Z" fill="#ff0000"/> <!-- Left -->
      <path d="M20 20 L38 11 L38 29 L20 38 Z" fill="#cc0000"/> <!-- Right -->
      <text x="6" y="30" font-family="monospace" font-size="8" fill="black" transform="rotate(26 10 30)">TNT</text>
    </svg>`;
    }

    // Default Cube
    return `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2 L38 11 L20 20 L2 11 Z" fill="${topColor}"/> <!-- Top -->
    <path d="M2 11 L20 20 L20 38 L2 29 Z" fill="${leftColor}"/> <!-- Left -->
    <path d="M20 20 L38 11 L38 29 L20 38 Z" fill="${rightColor}"/> <!-- Right -->
  </svg>`;
}
