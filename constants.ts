import { BlockType } from './types';

// Physics
export const GRAVITY = 0.5;
export const FRICTION = 0.8;
export const MOVE_ACCEL = 0.4;
export const MAX_SPEED = 6;
export const JUMP_FORCE = -11;
export const BOUNCE_FORCE = -6;

// Dimensions
export const TILE_SIZE = 32;
export const SCREEN_HEIGHT = 15 * TILE_SIZE; // 480px
export const SCREEN_WIDTH = 800;

// Colors
export const COLORS = {
  sky: '#5c94fc',
  ground: '#c84c0c',
  brick: '#b83030',
  question: '#fc9838',
  questionHit: '#b88050',
  pipe: '#00aa00',
  pipeHighlight: '#55cc55',
  goomba: '#ab3415',
  mario: '#ff0000',
  marioOveralls: '#0000ff',
  marioSkin: '#fcb88c',
  coin: '#ffd700'
};

// Level Map (Char based)
// M = Mario Start
// E = Enemy
// F = Flag
const LEVEL_STRING = `
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
      ?                                                                                             
                                                                                                    
                  ?   B?B?B                                                                         
                                                                                                    
        E                       E               E    E                               F              
    BBBBBB    P   P       BB?BB       P   P     BBBBBB     P   P                                    
            {{}} {{}}                 {{}} {{}}            {{}} {{}}                                
############[[]]#[[]]#################[[]]#[[]]############[[]]#[[]]################################
############[[]]#[[]]#################[[]]#[[]]############[[]]#[[]]################################
`;

export const parseLevel = (): { 
  grid: BlockType[][], 
  entities: {type: 'PLAYER' | 'GOOMBA', x: number, y: number}[],
  width: number,
  height: number
} => {
  const rows = LEVEL_STRING.split('\n').filter(row => row.length > 0);
  const height = rows.length;
  const width = rows[0].length;
  
  const grid: BlockType[][] = [];
  const entities: {type: 'PLAYER' | 'GOOMBA', x: number, y: number}[] = [];

  for (let y = 0; y < height; y++) {
    const row: BlockType[] = [];
    for (let x = 0; x < width; x++) {
      const char = rows[y][x];
      
      if (char === 'M') {
        entities.push({ type: 'PLAYER', x, y });
        row.push(BlockType.EMPTY);
      } else if (char === 'E') {
        entities.push({ type: 'GOOMBA', x, y });
        row.push(BlockType.EMPTY);
      } else if (char === 'F') {
         // Treat Flag as empty for collision generally, but we detect x-pos for win
         row.push(BlockType.EMPTY);
      } else {
        // Check if it matches a known block type
        const block = Object.values(BlockType).find(b => b === char);
        row.push(block || BlockType.EMPTY);
      }
    }
    grid.push(row);
  }

  return { grid, entities, width, height };
};