import React from 'react';
import { X, Flame, Shield, Sparkles, Award, Skull, Swords } from 'lucide-react';
import { INSTANCE_WAVES } from '../game/constants';
import { PlayerStats } from '../types/game';

interface InstancePortalModalProps {
  player: PlayerStats;
  onClose: () => void;
  onEnterInstance: () => void;
}

export const InstancePortalModal: React.FC<InstancePortalModalProps> = ({
  player,
  onClose,
  onEnterInstance,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 select-none font-sans">
      <div className="bg-stone-900 border-2 border-indigo-500/70 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-stone-900 px-4 py-3 flex items-center justify-between border-b border-indigo-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-700/80 border border-indigo-400/50 flex items-center justify-center text-lg shadow-inner">
              🌀
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-indigo-200 tracking-wide flex items-center gap-2">
                WILD GROUNDS INSTANCE
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 font-bold border border-purple-500/40">
                  Battle Arena
                </span>
              </h2>
              <p className="text-[11px] text-indigo-300/80">Venture into the untamed arena and test your pet powers!</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[65vh]">
          {/* Overview Banner */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-600/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Swords className="w-4 h-4 text-indigo-400" />
              <span>Survive 10 Consecutive Enemy Waves</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Encounter rogue wild creatures, cunning forest imps, fierce phantom wolves, and towering colossi. Use
              your 5 equipped pet active skills to battle!
            </p>
          </div>

          {/* Wave Summary List */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
              <span>Wave Encounters</span>
              <span className="text-indigo-400 text-[10px] font-normal">
                Best Clear: Wave {player.highestWaveCleared || 0}/10
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {INSTANCE_WAVES.map((w) => (
                <div
                  key={w.wave}
                  className={`p-2 rounded-xl border flex items-center justify-between ${
                    w.wave === 10
                      ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                      : w.wave === 5 || w.wave === 9
                      ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                      : 'bg-stone-850/80 border-stone-700/60 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {w.wave === 10 ? (
                      <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : w.wave === 5 || w.wave === 9 ? (
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <span className="font-bold text-stone-400">W{w.wave}</span>
                    )}
                    <span className="truncate max-w-[120px] font-medium">{w.title}</span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-bold shrink-0">+{w.essenceReward} Ess</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards Callout */}
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-200">Guaranteed Victory Rewards</h4>
              <p className="text-amber-100/80 text-[11px] leading-relaxed">
                Clearing Wave 10 grants a <strong>Random Pet Roll</strong> from the collection (duplicates convert to Pet
                Essence!) plus <strong>bonus 150 Pet Essence and 200 Gold</strong>!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-stone-950/90 px-4 py-3 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs cursor-pointer"
          >
            Stay on Farm
          </button>

          <button
            onClick={() => {
              onClose();
              onEnterInstance();
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
            <span>ENTER WILD GROUNDS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
