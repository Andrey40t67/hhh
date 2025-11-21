export enum GameStatus {
  START_SCREEN,
  PLAYING,
  GAME_OVER,
  VICTORY
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  pos: Vector;
  vel: Vector;
  width: number;
  height: number;
  type: EntityType;
  dead: boolean;
  grounded?: boolean;
}

export enum EntityType {
  PLAYER = 'PLAYER',
  GOOMBA = 'GOOMBA',
  COIN = 'COIN',
  MUSHROOM = 'MUSHROOM',
  PARTICLE = 'PARTICLE'
}

export interface Particle extends Entity {
  life: number;
  color: string;
}

export interface Block {
  x: number;
  y: number;
  type: BlockType;
  hit?: boolean;
}

export enum BlockType {
  GROUND = '#',
  BRICK = 'B',
  QUESTION = '?',
  PIPE_L = '[',
  PIPE_R = ']',
  PIPE_TOP_L = '{',
  PIPE_TOP_R = '}',
  HARD = 'X',
  EMPTY = ' '
}

export interface Camera {
  x: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  run: boolean;
}