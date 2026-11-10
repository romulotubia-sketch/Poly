import React, { useState } from 'react';
import {
  X,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Utensils,
  Smile,
  Check,
  CheckCircle2,
  Award,
  ChevronRight,
} from 'lucide-react';
import { PetData, PlayerStats } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { getSkillLevelBonus } from '../game/constants';

interface PetModalProps {
  pets: PetData[];
  player: PlayerStats;
  onClose: () => void;
  onUpdatePets: (updater: (prev: PetData[]) => PetData[]) => void;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onShowMessage: (msg: string) => void;
}

export const PetModal: React.FC<PetModalProps> = ({
  pets,
  player,
  onClose,
  onUpdatePets,
  onUpdatePlayer,
  onShowMessage,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || 'pet_fox');
  const selectedPet = pets.find((p) => p.id === selectedPetId) || pets[0];

  // Helper to equip a pet into a specific slot (0-4)
  const handleEquipSlot = (slotIndex: number, petId: string) => {
    onUpdatePlayer((prev) => {
      const newSlots = [...prev.equippedSkillSlots];
      // If pet already equipped in another slot, remove it first to prevent duplicates
      const existingIdx = newSlots.indexOf(petId);
      if (existingIdx !== -1) {
        newSlots[existingIdx] = null;
      }
      // If clicking same slot that already has this pet, toggle unequip
      if (newSlots[slotIndex] === petId) {
        newSlots[slotIndex] = null;
        onShowMessage(`Unequipped ${selectedPet.name}'s active & passive skills.`);
      } else {
        newSlots[slotIndex] = petId;
        onShowMessage(`Equipped ${selectedPet.name}'s skills to Slot ${slotIndex + 1}!`);
      }
      return { ...prev, equippedSkillSlots: newSlots };
    });
    soundEngine.playHarvest();
  };

  const handleToggleFollow = (petId: string) => {
    onUpdatePets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const nextState = !p.isFollowing;
          onShowMessage(nextState ? `${p.name} is now following you!` : `${p.name} returned to resting at habitat.`);
          return { ...p, isFollowing: nextState };
        }
        // Only one pet follows at a time for optimal gameplay
        return { ...p, isFollowing: false };
      })
    );
    soundEngine.playPetJoy();
  };

  const handleFeedPet = (petId: string) => {
    soundEngine.playPetJoy();
    onUpdatePets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const newExp = p.exp + 35;
          let newLvl = p.level;
          let maxExp = p.maxExp;
          if (newExp >= maxExp) {
            newLvl += 1;
            maxExp = Math.round(maxExp * 1.35);
            soundEngine.playLevelUp();
            onShowMessage(`🎉 ${p.name} reached Level ${newLvl}! Abilities strengthened.`);
          }
          return {
            ...p,
            level: newLvl,
            exp: newExp >= maxExp ? newExp - maxExp : newExp,
            maxExp,
            hunger: Math.min(100, p.hunger + 30),
            happiness: Math.min(100, p.happiness + 15),
          };
        }
        return p;
      })
    );
    onShowMessage(`Fed ${selectedPet.name} a sweet treat! (+Hunger, +EXP)`);
  };

  const handlePetPlay = (petId: string) => {
    soundEngine.playPetJoy();
    onUpdatePets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const newExp = p.exp + 25;
          let newLvl = p.level;
          let maxExp = p.maxExp;
          if (newExp >= maxExp) {
            newLvl += 1;
            maxExp = Math.round(maxExp * 1.35);
            soundEngine.playLevelUp();
            onShowMessage(`🎉 ${p.name} reached Level ${newLvl}!`);
          }
          return {
            ...p,
            level: newLvl,
            exp: newExp >= maxExp ? newExp - maxExp : newExp,
            maxExp,
            happiness: Math.min(100, p.happiness + 25),
          };
        }
        return p;
      })
    );
    onShowMessage(`Patted and played with ${selectedPet.name}! (+Happiness, +EXP)`);
  };

  const isEquipped = player.equippedSkillSlots.includes(selectedPet.id);
  const equippedSlotNum = player.equippedSkillSlots.indexOf(selectedPet.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-600/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐾</span>
            <div>
              <h2 className="text-lg font-bold text-amber-200">Pet Sanctuary & Skill Equipment</h2>
              <p className="text-xs text-stone-400">Raise pets, level abilities, and equip up to 5 active & passive skills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Slot Skill Assignment Ribbon at top of modal */}
        <div className="px-6 py-3 bg-stone-950/80 border-b border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-300 font-medium">
            <span className="text-amber-400 font-bold">5 Equipped Skill Slots:</span>
            <span className="text-[11px] text-stone-400 block sm:inline sm:ml-2">
              (Equipping active skill auto-binds its passive)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((idx) => {
              const petInSlotId = player.equippedSkillSlots[idx];
              const petInSlot = pets.find((p) => p.id === petInSlotId);

              return (
                <button
                  key={idx}
                  onClick={() => handleEquipSlot(idx, selectedPet.id)}
                  title={
                    petInSlot
                      ? `Slot ${idx + 1}: ${petInSlot.name} (${petInSlot.activeSkill.name}). Click to assign ${selectedPet.name} here.`
                      : `Slot ${idx + 1}: Empty. Click to assign ${selectedPet.name}.`
                  }
                  className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                    petInSlot
                      ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow'
                      : 'border-dashed border-stone-700 bg-stone-900/40 text-stone-500 hover:border-amber-500/70'
                  }`}
                >
                  <span className="text-[9px] text-stone-400 absolute top-0.5 left-1">{idx + 1}</span>
                  {petInSlot ? (
                    <span className="text-sm">{petInSlot.name[0]}</span>
                  ) : (
                    <span className="text-[10px] text-stone-600">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Left column list, Right column details */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6">
          {/* Pets Roster List (4 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-1">Your Haven Pets</h3>
            {pets.map((pet) => {
              const isSelected = pet.id === selectedPetId;
              const isSlotEquipped = player.equippedSkillSlots.includes(pet.id);

              return (
                <div
                  key={pet.id}
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-stone-900/50 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md border border-white/20"
                      style={{ backgroundColor: pet.color }}
                    >
                      {pet.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-100">{pet.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800 text-amber-300 font-semibold">
                          Lv.{pet.level}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 capitalize">{pet.species}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {pet.isFollowing && (
                      <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                        Following
                      </span>
                    )}
                    {isSlotEquipped && (
                      <span className="text-[10px] bg-amber-950 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                        Skill Equipped
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Pet Detailed Card (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4 bg-stone-900/70 border border-stone-800 rounded-3xl p-5">
            {/* Top Info Banner */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-2 border-white/30"
                  style={{ backgroundColor: selectedPet.color }}
                >
                  {selectedPet.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedPet.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      {selectedPet.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 max-w-sm mt-0.5 leading-relaxed">{selectedPet.description}</p>
                </div>
              </div>
            </div>

            {/* Level & Progression Bar */}
            <div className="bg-stone-950/60 rounded-2xl p-3 border border-stone-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-amber-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Level {selectedPet.level}
                </span>
                <span className="text-stone-400">
                  {selectedPet.exp} / {selectedPet.maxExp} EXP
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (selectedPet.exp / selectedPet.maxExp) * 100)}%` }}
                />
              </div>

              {/* Status Meters */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-stone-800/60 text-xs">
                <div>
                  <div className="flex justify-between text-stone-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Happiness
                    </span>
                    <span>{selectedPet.happiness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${selectedPet.happiness}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-stone-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-amber-400" /> Hunger Fullness
                    </span>
                    <span>{selectedPet.hunger}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedPet.hunger}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="space-y-3">
              {/* Active Skill */}
              <div className="bg-stone-950/60 rounded-2xl p-3.5 border border-amber-600/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>ACTIVE SKILL: {selectedPet.activeSkill.name}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full">
                    {selectedPet.activeSkill.cooldown}s Cooldown
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed mb-2">{selectedPet.activeSkill.description}</p>
                <div className="text-[11px] text-amber-200/90 bg-amber-950/40 border border-amber-500/30 rounded-xl px-2.5 py-1">
                  📈 <span className="font-semibold">Level Bonus:</span>{' '}
                  {typeof selectedPet.activeSkill.levelBonusDescription === 'function'
                    ? selectedPet.activeSkill.levelBonusDescription(selectedPet.level)
                    : getSkillLevelBonus(selectedPet.activeSkill.id, selectedPet.level)}
                </div>
              </div>

              {/* Passive Skill */}
              <div className="bg-stone-950/60 rounded-2xl p-3.5 border border-emerald-600/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>PASSIVE SKILL: {selectedPet.passiveSkill.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">Always On</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed mb-2">{selectedPet.passiveSkill.description}</p>
                <div className="text-[11px] text-emerald-200/90 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1">
                  📈 <span className="font-semibold">Level Bonus:</span>{' '}
                  {typeof selectedPet.passiveSkill.levelBonusDescription === 'function'
                    ? selectedPet.passiveSkill.levelBonusDescription(selectedPet.level)
                    : getSkillLevelBonus(selectedPet.passiveSkill.id, selectedPet.level)}
                </div>
              </div>
            </div>

            {/* Pet Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => handleFeedPet(selectedPet.id)}
                className="bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold text-xs py-2.5 px-3 rounded-xl border border-amber-600/40 shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Feed (+30)</span>
              </button>

              <button
                onClick={() => handlePetPlay(selectedPet.id)}
                className="bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold text-xs py-2.5 px-3 rounded-xl border border-rose-600/40 shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Play & Pet</span>
              </button>

              <button
                onClick={() => handleToggleFollow(selectedPet.id)}
                className={`font-semibold text-xs py-2.5 px-3 rounded-xl border shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  selectedPet.isFollowing
                    ? 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border-emerald-500/50'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-600/50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{selectedPet.isFollowing ? 'Rest at Home' : 'Follow Me'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
