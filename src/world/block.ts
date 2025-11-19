// Block types enum
export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  WATER = 7,
  PLANKS = 8,
  BRICKS = 9,
  TNT = 10,
  LOG = 11,
}

// Block properties
export interface BlockProperties {
  name: string;
  solid: boolean;
  transparent: boolean;
  color: number;
}

// Block registry
export const BLOCK_REGISTRY: Record<BlockType, BlockProperties> = {
  [BlockType.AIR]: {
    name: 'Air',
    solid: false,
    transparent: true,
    color: 0x000000,
  },
  [BlockType.GRASS]: {
    name: 'Grass',
    solid: true,
    transparent: false,
    color: 0x5a8c3a,
  },
  [BlockType.DIRT]: {
    name: 'Dirt',
    solid: true,
    transparent: false,
    color: 0x8b6d47,
  },
  [BlockType.STONE]: {
    name: 'Stone',
    solid: true,
    transparent: false,
    color: 0x808080,
  },
  [BlockType.WOOD]: {
    name: 'Wood',
    solid: true,
    transparent: false,
    color: 0x8b5a2b,
  },
  [BlockType.LEAVES]: {
    name: 'Leaves',
    solid: true,
    transparent: true,
    color: 0x228b22,
  },
  [BlockType.SAND]: {
    name: 'Sand',
    solid: true,
    transparent: false,
    color: 0xf4a460,
  },
  [BlockType.WATER]: {
    name: 'Water',
    solid: false,
    transparent: true,
    color: 0x4169e1,
  },
  [BlockType.PLANKS]: {
    name: 'Planks',
    solid: true,
    transparent: false,
    color: 0xa0522d,
  },
  [BlockType.BRICKS]: {
    name: 'Bricks',
    solid: true,
    transparent: false,
    color: 0xb22222,
  },
  [BlockType.TNT]: {
    name: 'TNT',
    solid: true,
    transparent: false,
    color: 0xff0000,
  },
  [BlockType.LOG]: {
    name: 'Log',
    solid: true,
    transparent: false,
    color: 0x5c4033,
  },
};

export function isBlockSolid(blockType: BlockType): boolean {
  return BLOCK_REGISTRY[blockType].solid;
}

export function isBlockTransparent(blockType: BlockType): boolean {
  return BLOCK_REGISTRY[blockType].transparent;
}

export function getBlockColor(blockType: BlockType): number {
  return BLOCK_REGISTRY[blockType].color;
}
