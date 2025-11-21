import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START_SCREEN);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);

  const startGame = () => {
    setScore(0);
    setCoins(0);
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 select-none">
      <div className="relative group">
        
        {/* Game UI Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-bold z-10 text-xl tracking-widest drop-shadow-md">
          <div className="flex flex-col">
            <span className="text-sm text-yellow-300">MARIO</span>
            <span>{score.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-yellow-300">COINS</span>
            <span>x {coins.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-yellow-300">WORLD</span>
            <span>1-1</span>
          </div>
        </div>

        <GameCanvas 
          status={status} 
          setStatus={setStatus} 
          setScore={setScore}
          setCoins={setCoins}
        />

        {/* Start Screen */}
        {status === GameStatus.START_SCREEN && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
            <h1 className="text-5xl mb-8 text-shadow-red animate-pulse">SUPER REACT BROS</h1>
            <p className="mb-8 text-gray-300 text-center text-sm leading-relaxed max-w-md">
              Arrows / WASD to Move & Jump<br/>
              Shift to Run<br/>
              Stomp Goombas and find the Flag!
            </p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-[0_4px_0_rgb(153,27,27)] active:shadow-none active:translate-y-1 transition-all"
            >
              START GAME
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-20">
            <h2 className="text-4xl mb-4 text-red-500">GAME OVER</h2>
            <p className="mb-6">Score: {score}</p>
            <button 
              onClick={startGame}
              className="px-6 py-3 bg-white text-black hover:bg-gray-200 font-bold rounded"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Victory Screen */}
        {status === GameStatus.VICTORY && (
          <div className="absolute inset-0 bg-blue-500/90 flex flex-col items-center justify-center text-white z-20">
            <h2 className="text-4xl mb-4 text-yellow-300">COURSE CLEAR!</h2>
            <p className="mb-6">Final Score: {score}</p>
            <div className="text-6xl mb-6">⭐⭐⭐</div>
            <button 
              onClick={startGame}
              className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Global Style for Text Shadow */}
      <style>{`
        .text-shadow-red {
          text-shadow: 4px 4px 0px #991b1b;
        }
      `}</style>
    </div>
  );
};

export default App;