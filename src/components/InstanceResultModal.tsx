import React from 'react';
import { Trophy, Skull, Sparkles, Coins, RotateCcw, Home, Award } from 'lucide-react';
import { PetData } from '../types/game';

interface InstanceResultModalProps {
  isVictory: boolean;
  wavesCleared: number;
  totalWaves: number;
  essenceEarned: number;
  goldEarned: number;
  rewardPet: PetData | null;
  duplicateConverted: boolean;
  duplicateEssenceValue: number;
  onRetry: () => void;
  onReturnToFarm: () => void;
}

export const InstanceResultModal: React.FC<InstanceResultModalProps> = ({
  isVictory,
  wavesCleared,
  totalWaves,
  essenceEarned,
  goldEarned,
  rewardPet,
  duplicateConverted,
  duplicateEssenceValue,
  onRetry,
  onReturnToFarm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 select-none font-sans animate-fade-in">
      <div className="bg-stone-900 border-2 border-amber-500/70 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-stone-100 flex flex-col">
        {/* Banner */}
        <div
          className={`px-4 py-5 text-center flex flex-col items-center border-b ${
            isVictory
              ? 'bg-gradient-to-b from-amber-600 via-amber-700 to-stone-900 border-amber-500/50'
              : 'bg-gradient-to-b from-rose-900 via-stone-900 to-stone-900 border-rose-600/50'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl mb-2 ${
              isVictory ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-300/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
            }`}
          >
            {isVictory ? <Trophy className="w-8 h-8 text-amber-950" /> : <Skull className="w-8 h-8 text-rose-400" />}
          </div>

          <h2 className="text-xl font-black tracking-wide text-white">
            {isVictory ? 'WILD GROUNDS CONQUERED!' : 'DEFEATED IN BATTLE'}
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            {isVictory
              ? 'All 10 Waves cleared! You triumphed over the Eclipse Shadow Titan!'
              : `Fell in battle on Wave ${wavesCleared + 1} of ${totalWaves}. Your pets fought valiantly!`}
          </p>
        </div>

        {/* Breakdown Stats */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-stone-850 p-2.5 rounded-2xl border border-stone-700">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Waves Survived</span>
              <p className="text-lg font-black text-amber-300">
                {wavesCleared} / {totalWaves}
              </p>
            </div>
            <div className="bg-stone-850 p-2.5 rounded-2xl border border-stone-700">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Pet Essence</span>
              <p className="text-lg font-black text-purple-400 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>+{essenceEarned}</span>
              </p>
            </div>
          </div>

          {goldEarned > 0 && (
            <div className="bg-amber-950/40 border border-amber-600/30 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-amber-200">Coins Awarded:</span>
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> +{goldEarned}
              </span>
            </div>
          )}

          {/* Reward Pet Section */}
          {rewardPet && (
            <div className="bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/50 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-purple-200 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{duplicateConverted ? 'Duplicate Pet Converted!' : 'New Pet Unlocked!'}</span>
              </div>

              <div className="flex items-center gap-3 bg-stone-900/80 p-2.5 rounded-xl border border-white/5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white shadow"
                  style={{ backgroundColor: rewardPet.color }}
                >
                  {rewardPet.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-white">{rewardPet.name}</h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-500/30">
                      {rewardPet.rarity}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300 line-clamp-1">{rewardPet.description}</p>
                </div>
              </div>

              {duplicateConverted && (
                <div className="bg-purple-900/60 border border-purple-400/40 rounded-xl px-3 py-1.5 text-center text-xs text-purple-200 font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                  <span>Already Owned! Converted to +{duplicateEssenceValue} Pet Essence!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-stone-950/90 px-4 py-3 border-t border-stone-800 flex items-center justify-between gap-2">
          <button
            onClick={onReturnToFarm}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Farm</span>
          </button>

          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black rounded-xl text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
