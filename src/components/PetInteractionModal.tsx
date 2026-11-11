import React, { useState } from 'react';
import {
  X,
  Heart,
  Utensils,
  Sparkles,
  UserCheck,
  UserX,
  Info,
  Flame,
  Droplets,
  Rabbit,
  Wind,
  Hammer,
  HeartHandshake,
  Sun,
  ShieldCheck,
  Eye,
  Dumbbell,
  HeartPulse,
  ChevronRight,
  Award,
} from 'lucide-react';
import { PetData, PlayerStats } from '../types/game';
import { CROPS, getSkillLevelBonus } from '../game/constants';
import { computeActiveSkillStats } from '../game/combatSkills';
import { soundEngine } from '../audio/soundEngine';

interface PetInteractionModalProps {
  pet: PetData;
  inventory: Record<string, number>;
  player: PlayerStats;
  onClose: () => void;
  onFeedPet: (petId: string, foodItemId: string) => void;
  onPetPet: (petId: string) => void;
  onToggleFollow: (petId: string) => void;
  onOpenFullInfo: (petId: string) => void;
}

const SKILL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Flame,
  Droplets,
  Rabbit,
  Wind,
  Hammer,
  HeartHandshake,
  Sun,
  ShieldCheck,
  Sparkles,
  Eye,
  Dumbbell,
  HeartPulse,
};

export const PetInteractionModal: React.FC<PetInteractionModalProps> = ({
  pet,
  inventory,
  player,
  onClose,
  onFeedPet,
  onPetPet,
  onToggleFollow,
  onOpenFullInfo,
}) => {
  const [showFeedPicker, setShowFeedPicker] = useState(false);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);

  const activeStats = computeActiveSkillStats(pet.id, pet.level);
  const ActiveIcon = SKILL_ICONS[pet.activeSkill.icon] || Sparkles;
  const PassiveIcon = SKILL_ICONS[pet.passiveSkill.icon] || ShieldCheck;

  // Available edible crops and treats in inventory
  const edibleItems = [
    { id: 'pet_treat', name: 'Pet Treat', icon: '🍖', count: inventory['pet_treat'] || 0, exp: 35 },
    { id: 'carrot', name: 'Sweet Carrot', icon: '🥕', count: inventory['carrot'] || 0, exp: 30 },
    { id: 'tomato', name: 'Juicy Tomato', icon: '🍅', count: inventory['tomato'] || 0, exp: 30 },
    { id: 'strawberry', name: 'Sugar Berry', icon: '🍓', count: inventory['strawberry'] || 0, exp: 35 },
    { id: 'corn', name: 'Golden Corn', icon: '🌽', count: inventory['corn'] || 0, exp: 40 },
    { id: 'pumpkin', name: 'Harvest Pumpkin', icon: '🎃', count: inventory['pumpkin'] || 0, exp: 50 },
  ];

  const handleFeed = (foodId: string) => {
    onFeedPet(pet.id, foodId);
    setShowFeedPicker(false);
    const item = edibleItems.find((i) => i.id === foodId);
    setInteractionFeedback(`Yum! ${pet.name} happily devoured the ${item?.name || 'food'}! (+EXP, +Hunger)`);
    setTimeout(() => setInteractionFeedback(null), 3000);
  };

  const handlePet = () => {
    onPetPet(pet.id);
    setInteractionFeedback(`${pet.name} leans in and purrs with delight! (+Happiness, +EXP)`);
    setTimeout(() => setInteractionFeedback(null), 3000);
  };

  const handleToggle = () => {
    onToggleFollow(pet.id);
    const nextState = !pet.isFollowing;
    setInteractionFeedback(
      nextState
        ? `${pet.name} is now loyally following you!`
        : `${pet.name} is now resting happily in the sanctuary.`
    );
    setTimeout(() => setInteractionFeedback(null), 3000);
  };

  const expPct = Math.min(100, Math.max(0, (pet.exp / pet.maxExp) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md select-none">
      <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-amber-600/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-stone-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner border"
              style={{
                backgroundColor: pet.color + '33',
                borderColor: pet.color,
                color: pet.accentColor,
              }}
            >
              {pet.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">{pet.name}</h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase"
                  style={{
                    backgroundColor: pet.color + '20',
                    borderColor: pet.color + '60',
                    color: pet.accentColor,
                  }}
                >
                  {pet.rarity} {pet.species}
                </span>
                {pet.isFollowing && (
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    FOLLOWING
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-400 font-medium">
                Level {pet.level} • {pet.role || 'Companion'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {interactionFeedback && (
          <div className="bg-amber-950/90 text-amber-200 border-b border-amber-500/40 px-5 py-2 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{interactionFeedback}</span>
          </div>
        )}

        {/* Pet Condition & EXP Bars */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5 bg-stone-950/70 border border-stone-800 rounded-2xl p-3">
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>Happiness</span>
              </div>
              <div className="text-xs font-black text-rose-200">{pet.happiness}%</div>
              <div className="w-full h-1.5 bg-stone-900 rounded-full mt-1 overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${pet.happiness}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase mb-1 flex items-center gap-1">
                <span>🍖</span>
                <span>Fullness</span>
              </div>
              <div className="text-xs font-black text-amber-200">{pet.hunger}%</div>
              <div className="w-full h-1.5 bg-stone-900 rounded-full mt-1 overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase mb-1 flex items-center gap-1">
                <Award className="w-3 h-3 text-purple-400" />
                <span>EXP</span>
              </div>
              <div className="text-xs font-black text-purple-200">
                {pet.exp}/{pet.maxExp}
              </div>
              <div className="w-full h-1.5 bg-stone-900 rounded-full mt-1 overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${expPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Abilities Summary */}
          <div className="bg-stone-950/50 border border-stone-800/80 rounded-2xl p-3 space-y-2 text-xs">
            {/* Active Skill */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-200">{pet.activeSkill.name}</span>
                  <span className="text-[10px] text-stone-400">CD: {activeStats.cooldown}s</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-snug">{pet.activeSkill.description}</p>
              </div>
            </div>

            {/* Passive Skill */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-stone-800/60">
              <div className="w-7 h-7 rounded-xl bg-purple-950/80 border border-purple-600/40 flex items-center justify-center shrink-0 text-purple-400 mt-0.5">
                <PassiveIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-200">{pet.passiveSkill.name}</span>
                  <span className="text-[10px] text-purple-400 font-semibold">Passive</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-snug">{pet.passiveSkill.description}</p>
              </div>
            </div>
          </div>

          {/* 4 Primary Interaction Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* 1. Feed Button */}
            <button
              onClick={() => setShowFeedPicker((prev) => !prev)}
              className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs py-3 px-3 rounded-2xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Utensils className="w-4 h-4" />
              <span>Feed Produce</span>
            </button>

            {/* 2. Pet Button */}
            <button
              onClick={handlePet}
              className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs py-3 px-3 rounded-2xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              <span>Pet & Cuddle</span>
            </button>

            {/* 3. Assign as Follower */}
            <button
              onClick={handleToggle}
              className={`font-bold text-xs py-3 px-3 rounded-2xl shadow flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                pet.isFollowing
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {pet.isFollowing ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              <span>{pet.isFollowing ? 'Rest at Sanctuary' : 'Assign as Follower'}</span>
            </button>

            {/* 4. View Full Information */}
            <button
              onClick={() => {
                onClose();
                onOpenFullInfo(pet.id);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs py-3 px-3 rounded-2xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>View Information</span>
            </button>
          </div>

          {/* Crop / Food Picker Drawer */}
          {showFeedPicker && (
            <div className="bg-stone-950 border border-amber-600/40 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <span>Select crop or treat to feed {pet.name}:</span>
                <button
                  onClick={() => setShowFeedPicker(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {edibleItems.map((item) => (
                  <button
                    key={item.id}
                    disabled={item.count <= 0}
                    onClick={() => handleFeed(item.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-left transition-all ${
                      item.count > 0
                        ? 'bg-stone-900 border-stone-750 hover:border-amber-500 text-stone-100 cursor-pointer active:scale-95'
                        : 'bg-stone-950/60 border-stone-900 text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="text-[11px] font-bold leading-none">{item.name}</div>
                        <div className="text-[9.5px] text-emerald-400 font-semibold mt-0.5">
                          +{item.exp} EXP
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300">x{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
