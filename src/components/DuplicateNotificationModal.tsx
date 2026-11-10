import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { PetData } from '../types/game';

interface DuplicateNotificationModalProps {
  pet: PetData;
  essenceEarned: number;
  onClose: () => void;
}

export const DuplicateNotificationModal: React.FC<DuplicateNotificationModalProps> = ({
  pet,
  essenceEarned,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 select-none font-sans animate-fade-in">
      <div className="bg-stone-900 border-2 border-purple-500/80 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-stone-100 flex flex-col text-center">
        {/* Glow Header */}
        <div className="bg-gradient-to-b from-purple-900 via-indigo-950 to-stone-900 p-5 flex flex-col items-center border-b border-purple-700/50">
          <div className="relative mb-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-2xl border-2 border-purple-300"
              style={{ backgroundColor: pet.color }}
            >
              {pet.name[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-1 border-2 border-stone-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-600/50 mb-1">
            Duplicate Pet Converted
          </span>
          <h3 className="text-lg font-black text-white">{pet.name}</h3>
          <span className="text-xs text-stone-300 font-semibold">({pet.rarity})</span>
        </div>

        {/* Conversion Details */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            You already own <strong>{pet.name}</strong>! Your duplicate pet has been automatically converted into
            magical <strong>Pet Essence</strong>.
          </p>

          <div className="bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-500/60 rounded-2xl p-3 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="text-xl font-black text-purple-300">+{essenceEarned} Pet Essence</span>
          </div>

          <p className="text-[11px] text-stone-400">
            Use Pet Essence in the Essence Sanctuary to purchase EXP ambrosia, skill enhancers, and mystery eggs!
          </p>
        </div>

        {/* Button */}
        <div className="bg-stone-950/90 p-3 border-t border-stone-800">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Claim Pet Essence</span>
          </button>
        </div>
      </div>
    </div>
  );
};
