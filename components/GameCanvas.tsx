import React, { useRef, useEffect, useState } from 'react';
import { Entity, EntityType, GameStatus, InputState, Vector, BlockType, Particle } from '../types';
import { GRAVITY, TILE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT, COLORS, JUMP_FORCE, MOVE_ACCEL, FRICTION, MAX_SPEED, parseLevel, BOUNCE_FORCE } from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
  setScore: (score: number) => void;
  setCoins: (coins: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, setStatus, setScore, setCoins }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Audio contexts (placeholders for simplicity, could implement actual audio)
  
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Game State Initialization ---
    const { grid, entities: initialEntities, width: mapWidth, height: mapHeight } = parseLevel();
    
    // Convert static grid to object based blocks for state (like hit blocks)
    // We will just mutate the grid directly for simplicity in this tight scope or use a separate "hit blocks" map.
    // Let's use a 2D array of objects to track state.
    const levelGrid = grid.map(row => row.map(type => ({ type, hit: false, yOffset: 0 })));

    let player: Entity = {
      id: 0,
      pos: { x: 100, y: 100 },
      vel: { x: 0, y: 0 },
      width: TILE_SIZE - 4, // Slightly smaller than tile
      height: TILE_SIZE - 2,
      type: EntityType.PLAYER,
      dead: false,
      grounded: false
    };

    // Find start pos
    const startPos = initialEntities.find(e => e.type === EntityType.PLAYER);
    if (startPos) {
      player.pos = { x: startPos.x * TILE_SIZE, y: startPos.y * TILE_SIZE };
    }

    let enemies: Entity[] = initialEntities
      .filter(e => e.type === EntityType.GOOMBA)
      .map((e, i) => ({
        id: i + 1,
        pos: { x: e.x * TILE_SIZE, y: e.y * TILE_SIZE },
        vel: { x: -1, y: 0 },
        width: TILE_SIZE,
        height: TILE_SIZE,
        type: EntityType.GOOMBA,
        dead: false
      }));

    let particles: Particle[] = [];
    let camera: Vector = { x: 0, y: 0 };
    let inputs: InputState = { left: false, right: false, up: false, down: false, jump: false, run: false };
    let scoreLocal = 0;
    let coinsLocal = 0;
    let frameCount = 0;

    // --- Input Handling ---
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': case 'KeyA': inputs.left = true; break;
        case 'ArrowRight': case 'KeyD': inputs.right = true; break;
        case 'ArrowUp': case 'KeyW': case 'Space': inputs.jump = true; inputs.up = true; break;
        case 'ArrowDown': case 'KeyS': inputs.down = true; break;
        case 'ShiftLeft': case 'ShiftRight': inputs.run = true; break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': case 'KeyA': inputs.left = false; break;
        case 'ArrowRight': case 'KeyD': inputs.right = false; break;
        case 'ArrowUp': case 'KeyW': case 'Space': inputs.jump = false; inputs.up = false; break;
        case 'ArrowDown': case 'KeyS': inputs.down = false; break;
        case 'ShiftLeft': case 'ShiftRight': inputs.run = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- Helper Functions ---
    const checkCollision = (rect1: {x: number, y: number, w: number, h: number}, rect2: {x: number, y: number, w: number, h: number}) => {
      return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
      );
    };

    const isSolid = (type: BlockType) => {
      return [BlockType.GROUND, BlockType.BRICK, BlockType.QUESTION, BlockType.PIPE_L, BlockType.PIPE_R, BlockType.PIPE_TOP_L, BlockType.PIPE_TOP_R, BlockType.HARD].includes(type);
    };

    const spawnParticle = (x: number, y: number, color: string) => {
      particles.push({
        id: Math.random(),
        pos: { x, y },
        vel: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 - 2 },
        width: 4,
        height: 4,
        type: EntityType.PARTICLE,
        dead: false,
        life: 30,
        color
      });
    };

    // --- Main Loop ---
    const update = () => {
      frameCount++;

      // 1. Update Player Physics (X-Axis)
      if (inputs.left) player.vel.x -= MOVE_ACCEL;
      if (inputs.right) player.vel.x += MOVE_ACCEL;
      
      // Friction
      player.vel.x *= FRICTION;
      
      // Cap speed
      const currentMaxSpeed = inputs.run ? MAX_SPEED * 1.5 : MAX_SPEED;
      player.vel.x = Math.max(Math.min(player.vel.x, currentMaxSpeed), -currentMaxSpeed);

      // Apply X
      player.pos.x += player.vel.x;

      // X Collision with World
      const playerRect = { x: player.pos.x, y: player.pos.y, w: player.width, h: player.height };
      
      // Check surrounding tiles
      const startX = Math.floor(player.pos.x / TILE_SIZE);
      const endX = Math.floor((player.pos.x + player.width) / TILE_SIZE);
      const startY = Math.floor(player.pos.y / TILE_SIZE);
      const endY = Math.floor((player.pos.y + player.height) / TILE_SIZE);

      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
            const block = levelGrid[y][x];
            if (isSolid(block.type)) {
              if (player.vel.x > 0) { // Moving Right
                player.pos.x = x * TILE_SIZE - player.width - 0.1;
                player.vel.x = 0;
              } else if (player.vel.x < 0) { // Moving Left
                player.pos.x = (x + 1) * TILE_SIZE + 0.1;
                player.vel.x = 0;
              }
            }
          }
        }
      }

      // Check Win Condition (reach far right)
      // Hardcoded approx end of level based on the string map length
      if (player.pos.x > (mapWidth - 2) * TILE_SIZE) {
        setStatus(GameStatus.VICTORY);
        return;
      }
      // Check Fall Death
      if (player.pos.y > SCREEN_HEIGHT) {
        setStatus(GameStatus.GAME_OVER);
        return;
      }

      // 2. Update Player Physics (Y-Axis)
      player.vel.y += GRAVITY;
      player.pos.y += player.vel.y;
      player.grounded = false;

      // Y Collision with World
      const startX_Y = Math.floor(player.pos.x / TILE_SIZE);
      const endX_Y = Math.floor((player.pos.x + player.width) / TILE_SIZE);
      const startY_Y = Math.floor(player.pos.y / TILE_SIZE);
      const endY_Y = Math.floor((player.pos.y + player.height) / TILE_SIZE);

      for (let y = startY_Y; y <= endY_Y; y++) {
        for (let x = startX_Y; x <= endX_Y; x++) {
           if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
            const block = levelGrid[y][x];
            if (isSolid(block.type)) {
              if (player.vel.y > 0) { // Falling
                // Check if we are actually above the block (landing)
                if (player.pos.y + player.height - player.vel.y <= y * TILE_SIZE + 4) { // tolerance
                    player.pos.y = y * TILE_SIZE - player.height - 0.01;
                    player.vel.y = 0;
                    player.grounded = true;
                }
              } else if (player.vel.y < 0) { // Jumping up
                player.pos.y = (y + 1) * TILE_SIZE + 0.01;
                player.vel.y = 0;
                // Hit block logic
                if (block.type === BlockType.QUESTION && !block.hit) {
                    block.hit = true;
                    block.type = BlockType.HARD; // Turn into solid block visual (conceptually)
                    block.yOffset = -10; // Animation bump
                    coinsLocal++;
                    scoreLocal += 100;
                    setCoins(coinsLocal);
                    setScore(scoreLocal);
                    spawnParticle(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE, COLORS.coin);
                } else if (block.type === BlockType.BRICK) {
                    if (Math.random() > 0.5) { // 50% chance to break
                        block.yOffset = -5;
                        spawnParticle(x * TILE_SIZE, y * TILE_SIZE, COLORS.brick);
                    } else {
                        block.yOffset = -5;
                    }
                }
              }
            }
          }
        }
      }

      // Jump Input
      if (inputs.jump && player.grounded) {
        player.vel.y = JUMP_FORCE;
        player.grounded = false;
      }

      // 3. Update Enemies
      enemies.forEach(enemy => {
        if (enemy.dead) return;

        // Gravity
        enemy.vel.y += GRAVITY;
        
        // Move X
        // Only move if active/on screen roughly
        if (enemy.pos.x - player.pos.x < SCREEN_WIDTH && enemy.pos.x - player.pos.x > -TILE_SIZE) {
            enemy.pos.x += enemy.vel.x;
        }

        // Enemy Collision (World)
        const eX = Math.floor(enemy.pos.x / TILE_SIZE);
        const eY = Math.floor((enemy.pos.y + enemy.height) / TILE_SIZE);
        const eRight = Math.floor((enemy.pos.x + enemy.width) / TILE_SIZE);
        
        // Wall turn around
        if (eX >= 0 && eX < mapWidth && levelGrid[eY-1] && isSolid(levelGrid[eY-1][eX].type)) {
             enemy.vel.x = Math.abs(enemy.vel.x); // Go right
        }
        if (eRight >= 0 && eRight < mapWidth && levelGrid[eY-1] && isSolid(levelGrid[eY-1][eRight].type)) {
            enemy.vel.x = -Math.abs(enemy.vel.x); // Go left
        }

        // Floor collision
        if (eY < mapHeight && eX >= 0) {
            if (isSolid(levelGrid[eY][eX].type) || isSolid(levelGrid[eY][eRight].type)) {
                enemy.pos.y = eY * TILE_SIZE - enemy.height;
                enemy.vel.y = 0;
            } else {
                // Falling
                enemy.pos.y += enemy.vel.y;
            }
        } else {
             enemy.pos.y += enemy.vel.y;
        }

        // Enemy vs Player
        if (checkCollision({x: player.pos.x, y: player.pos.y, w: player.width, h: player.height}, 
                           {x: enemy.pos.x, y: enemy.pos.y, w: enemy.width, h: enemy.height})) {
            // Check if player landed on top
            const landedOnTop = player.vel.y > 0 && player.pos.y + player.height - player.vel.y < enemy.pos.y + enemy.height * 0.5;
            
            if (landedOnTop) {
                enemy.dead = true;
                player.vel.y = BOUNCE_FORCE;
                scoreLocal += 200;
                setScore(scoreLocal);
                spawnParticle(enemy.pos.x, enemy.pos.y, COLORS.goomba);
            } else {
                // Die
                setStatus(GameStatus.GAME_OVER);
            }
        }
      });

      // 4. Update Particles
      particles.forEach(p => {
          p.pos.x += p.vel.x;
          p.pos.y += p.vel.y;
          p.vel.y += GRAVITY;
          p.life--;
      });
      particles = particles.filter(p => p.life > 0);

      // 5. Update Block Animations
      for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
              if (levelGrid[y][x].yOffset < 0) {
                  levelGrid[y][x].yOffset += 1; // Return to 0
              }
          }
      }

      // 6. Camera Follow
      // Keep player in middle 1/3 of screen
      let targetCamX = player.pos.x - SCREEN_WIDTH / 2;
      // Clamp camera
      targetCamX = Math.max(0, Math.min(targetCamX, mapWidth * TILE_SIZE - SCREEN_WIDTH));
      // Smooth lerp
      camera.x += (targetCamX - camera.x) * 0.1;
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      ctx.save();
      ctx.translate(-Math.floor(camera.x), 0);

      // Draw Map
      const startCol = Math.floor(camera.x / TILE_SIZE);
      const endCol = startCol + (SCREEN_WIDTH / TILE_SIZE) + 1;

      for (let y = 0; y < mapHeight; y++) {
        for (let x = startCol; x <= endCol; x++) {
          if (x >= 0 && x < mapWidth) {
            const block = levelGrid[y][x];
            if (block.type !== BlockType.EMPTY) {
              const drawX = x * TILE_SIZE;
              const drawY = y * TILE_SIZE + block.yOffset;
              
              switch (block.type) {
                case BlockType.GROUND:
                  ctx.fillStyle = COLORS.ground;
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  // Detail
                  ctx.fillStyle = 'rgba(0,0,0,0.1)';
                  ctx.fillRect(drawX + 4, drawY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                  break;
                case BlockType.BRICK:
                  ctx.fillStyle = COLORS.brick;
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#000';
                  ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  ctx.beginPath(); // Brick lines
                  ctx.moveTo(drawX, drawY + TILE_SIZE/2);
                  ctx.lineTo(drawX + TILE_SIZE, drawY + TILE_SIZE/2);
                  ctx.stroke();
                  break;
                case BlockType.QUESTION:
                  ctx.fillStyle = block.hit ? COLORS.questionHit : COLORS.question;
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  if (!block.hit) {
                      ctx.fillStyle = '#FFF';
                      ctx.font = 'bold 20px monospace';
                      ctx.fillText('?', drawX + 8, drawY + 24);
                  }
                  break;
                case BlockType.HARD:
                  ctx.fillStyle = COLORS.questionHit;
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  break;
                case BlockType.PIPE_L:
                case BlockType.PIPE_R:
                case BlockType.PIPE_TOP_L:
                case BlockType.PIPE_TOP_R:
                  ctx.fillStyle = COLORS.pipe;
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = COLORS.pipeHighlight;
                  ctx.fillRect(drawX + 4, drawY, 6, TILE_SIZE);
                  break;
              }
            }
          }
        }
      }

      // Draw Enemies
      enemies.forEach(e => {
        if (!e.dead) {
          ctx.fillStyle = COLORS.goomba;
          // Flatten if squashed (animation frame logic omitted for simplicity, just box)
          ctx.beginPath();
          ctx.moveTo(e.pos.x + 2, e.pos.y + e.height);
          ctx.lineTo(e.pos.x + 2, e.pos.y + TILE_SIZE/2);
          ctx.bezierCurveTo(e.pos.x + 2, e.pos.y, e.pos.x + e.width - 2, e.pos.y, e.pos.x + e.width - 2, e.pos.y + TILE_SIZE/2);
          ctx.lineTo(e.pos.x + e.width - 2, e.pos.y + e.height);
          ctx.fill();
          
          // Feet
          ctx.fillStyle = '#000';
          if (Math.floor(frameCount / 10) % 2 === 0) {
              ctx.fillRect(e.pos.x, e.pos.y + e.height - 4, 10, 4);
              ctx.fillRect(e.pos.x + e.width - 10, e.pos.y + e.height - 4, 10, 4);
          } else {
               ctx.fillRect(e.pos.x + 2, e.pos.y + e.height - 4, 10, 4);
               ctx.fillRect(e.pos.x + e.width - 12, e.pos.y + e.height - 4, 10, 4);
          }
        }
      });

      // Draw Particles
      particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
      });

      // Draw Player
      ctx.fillStyle = COLORS.mario;
      const pX = player.pos.x;
      const pY = player.pos.y;
      
      // Simple Mario Shape
      // Shirt
      ctx.fillStyle = COLORS.mario;
      ctx.fillRect(pX + 4, pY + 8, 20, 16);
      // Overalls
      ctx.fillStyle = COLORS.marioOveralls;
      ctx.fillRect(pX + 4, pY + 20, 20, 10);
      // Head
      ctx.fillStyle = COLORS.marioSkin;
      ctx.fillRect(pX + 6, pY, 16, 14);
      // Hat
      ctx.fillStyle = COLORS.mario;
      ctx.fillRect(pX + 4, pY, 20, 4);
      ctx.fillRect(pX + 4 + (player.vel.x > 0 ? 8 : -2), pY, 16, 4); // Hat brim direction

      ctx.restore();

      requestRef.current = requestAnimationFrame(() => {
          update();
          draw();
      });
    };

    requestRef.current = requestAnimationFrame(() => {
        update();
        draw();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [status]); // Only re-run if status changes to PLAYING

  return (
    <div className="relative border-4 border-white shadow-2xl rounded overflow-hidden">
      <canvas
        ref={canvasRef}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        className="bg-sky-400 block"
      />
    </div>
  );
};

export default GameCanvas;