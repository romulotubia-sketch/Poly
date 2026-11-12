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
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { PetData, PlayerStats, MissionEventType } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { getSkillLevelBonus } from '../game/constants';
import { PET_COMBAT_CONFIGS, getPetBasicAttackConfig } from '../game/combatSkills';

interface PetModalProps {
  pets: PetData[];
  player: PlayerStats;
  onClose: () => void;
  onUpdatePets: (updater: (prev: PetData[]) => PetData[]) => void;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onShowMessage: (msg: string) => void;
  onEnterPetDen?: () => void;
  onMissionEvent?: (eventType: MissionEventType, amount?: number, trackKey?: string) => void;
}

export const PetModal: React.FC<PetModalProps> = ({
  pets,
  player,
  onClose,
  onUpdatePets,
  onUpdatePlayer,
  onShowMessage,
  onEnterPetDen,
  onMissionEvent,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || 'pet_fox');
  const [expandedSkillsPetId, setExpandedSkillsPetId] = useState<string | null>(null);
  const [equipPickerPetId, setEquipPickerPetId] = useState<string | null>(null);
  const selectedPet = pets.find((p) => p.id === selectedPetId) || pets[0];

  // Helper to equip a pet into a specific slot (0-4) and automatically synchronize following squad
  const handleEquipSlot = (slotIndex: number, petId: string) => {
    const targetPet = pets.find((p) => p.id === petId);
    if (!targetPet || !targetPet.unlocked) {
      onShowMessage(`🔒 Unlock ${targetPet?.name || 'this pet'} first via Wild Grounds or Essence Shop!`);
      return;
    }
    const newSlots = [...player.equippedSkillSlots];
    const existingIdx = newSlots.indexOf(petId);
    if (existingIdx !== -1 && existingIdx !== slotIndex) {
      newSlots[existingIdx] = null;
    }

    if (newSlots[slotIndex] === petId) {
      newSlots[slotIndex] = null;
      onShowMessage(`Unequipped ${targetPet.name} from Slot ${slotIndex + 1}.`);
    } else {
      newSlots[slotIndex] = petId;
      onShowMessage(`Equipped ${targetPet.name} to Slot ${slotIndex + 1}! Now following you!`);
    }

    onUpdatePlayer((prev) => ({ ...prev, equippedSkillSlots: newSlots }));
    const equippedIds = new Set(newSlots.filter(Boolean) as string[]);
    onUpdatePets((prev) =>
      prev.map((p) => ({
        ...p,
        isFollowing: p.unlocked && equippedIds.has(p.id),
      }))
    );
    soundEngine.playHarvest();
  };

  // Toggle follow status: automatically equips or unequips the pet in the squad
  const handleToggleFollow = (petId: string) => {
    const targetPet = pets.find((p) => p.id === petId);
    if (!targetPet || !targetPet.unlocked) {
      onShowMessage(`🔒 Unlock ${targetPet?.name || 'this pet'} first via Wild Grounds or Essence Shop!`);
      return;
    }
    const isCurrentlyEquipped = player.equippedSkillSlots.includes(petId);
    let newSlots = [...player.equippedSkillSlots];

    if (isCurrentlyEquipped) {
      // Unequip from all slots
      newSlots = newSlots.map((id) => (id === petId ? null : id));
      onShowMessage(`${targetPet.name} returned to resting at the Pet Den.`);
    } else {
      // Equip into first open slot, or slot 4 if full
      const emptyIdx = newSlots.indexOf(null);
      if (emptyIdx !== -1) {
        newSlots[emptyIdx] = petId;
      } else {
        newSlots[newSlots.length - 1] = petId;
      }
      onShowMessage(`${targetPet.name} is now equipped and following you!`);
    }

    onUpdatePlayer((prev) => ({ ...prev, equippedSkillSlots: newSlots }));
    const equippedIds = new Set(newSlots.filter(Boolean) as string[]);
    onUpdatePets((prev) =>
      prev.map((p) => ({
        ...p,
        isFollowing: p.unlocked && equippedIds.has(p.id),
      }))
    );
    soundEngine.playPetJoy();
  };

  const handleFeedPet = (petId: string) => {
    const targetPet = pets.find((p) => p.id === petId);
    if (!targetPet || !targetPet.unlocked) {
      onShowMessage(`🔒 Unlock ${targetPet?.name || 'this pet'} first before feeding!`);
      return;
    }
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
    onShowMessage(`Fed ${targetPet.name} a sweet treat! (+Hunger, +EXP)`);
    onMissionEvent?.('feed_pet', 1);
    onMissionEvent?.('interact_pet', 1, petId);
    onMissionEvent?.('gain_pet_exp', 35);
  };

  const handlePetPlay = (petId: string) => {
    const targetPet = pets.find((p) => p.id === petId);
    if (!targetPet || !targetPet.unlocked) {
      onShowMessage(`🔒 Unlock ${targetPet?.name || 'this pet'} first before playing!`);
      return;
    }
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
    onShowMessage(`Patted and played with ${targetPet.name}! (+Happiness, +EXP)`);
    onMissionEvent?.('interact_pet', 1, petId);
    onMissionEvent?.('gain_pet_exp', 25);
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
        <div className="flex-1 overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6">
          {/* Pets Roster List (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2.5 md:overflow-y-auto md:pr-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Your Haven Pets ({pets.filter((p) => p.unlocked).length}/{pets.length})
              </h3>
              <span className="text-[10px] text-stone-400">Tap name for skills</span>
            </div>
            {pets.map((pet) => {
              const isSelected = pet.id === selectedPetId;
              const equippedIdx = player.equippedSkillSlots.indexOf(pet.id);
              const isSlotEquipped = equippedIdx !== -1;
              const isSkillsOpen = expandedSkillsPetId === pet.id;
              const isPickerOpen = equipPickerPetId === pet.id;

              return (
                <div
                  key={pet.id}
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    setExpandedSkillsPetId((prev) => (prev === pet.id ? null : pet.id));
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-stone-900/50 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-base font-bold shadow-md border border-white/20"
                        style={{ backgroundColor: pet.color }}
                      >
                        {pet.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-stone-100 truncate">{pet.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800 text-amber-300 font-semibold">
                            Lv.{pet.level}
                          </span>
                          <span className="text-stone-400 inline-flex items-center">
                            {isSkillsOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-stone-400 capitalize">
                            {pet.species.replace(/_/g, ' ')}
                          </span>
                          {(pet.role || PET_COMBAT_CONFIGS[pet.id]?.role) && (
                            <span className="text-[9.5px] text-sky-300/90 bg-sky-950/60 border border-sky-700/40 px-1.5 py-0.2 rounded-full">
                              {pet.role || PET_COMBAT_CONFIGS[pet.id]?.role}
                            </span>
                          )}
                          {pet.unlocked && isSlotEquipped && (
                            <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.2 rounded-full font-semibold">
                              Slot {equippedIdx + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Equip Button Right Next to Pet Name */}
                    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!pet.unlocked ? (
                        <span className="text-[10px] bg-stone-800 border border-stone-700 text-stone-400 px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPetId(pet.id);
                            setEquipPickerPetId((prev) => (prev === pet.id ? null : pet.id));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                            isPickerOpen
                              ? 'bg-amber-500 text-stone-950 border-amber-300 shadow'
                              : isSlotEquipped
                              ? 'bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border-amber-500/60'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500/60 shadow'
                          }`}
                        >
                          {isPickerOpen ? 'Close' : isSlotEquipped ? 'Change Slot' : 'Equip'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Slot Picker Dropdown (shown when tapping Equip next to pet name) */}
                  {pet.unlocked && isPickerOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-stone-950/90 border border-amber-500/50 rounded-xl p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300">Equip {pet.name} to which slot?</span>
                        <span className="text-[10px] text-stone-400">Tap slot to assign</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 1, 2, 3, 4].map((slotIdx) => {
                          const occupantId = player.equippedSkillSlots[slotIdx];
                          const isThisPet = occupantId === pet.id;
                          const occupantPet = pets.find((p) => p.id === occupantId);

                          return (
                            <button
                              key={slotIdx}
                              type="button"
                              onClick={() => {
                                handleEquipSlot(slotIdx, pet.id);
                                setEquipPickerPetId(null);
                              }}
                              className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                isThisPet
                                  ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow'
                                  : occupantPet
                                  ? 'bg-stone-800/90 hover:bg-stone-700 text-stone-200 border-stone-600'
                                  : 'bg-stone-900 hover:bg-emerald-950/70 text-emerald-300 border-dashed border-emerald-600/60'
                              }`}
                            >
                              <span className="text-[10px] font-bold">Slot {slotIdx + 1}</span>
                              <span className="text-[9px] truncate max-w-full opacity-90">
                                {isThisPet ? 'Remove' : occupantPet ? occupantPet.name : 'Empty'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inline Revealed Skills (shown when tapping pet name) */}
                  {isSkillsOpen && (
                    <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-2.5 space-y-2 text-left">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {pet.activeSkill.name}
                          </span>
                          <span className="text-[9.5px] font-normal text-stone-400">
                            {pet.activeSkill.cooldown}s CD
                          </span>
                        </div>
                        <p className="text-[10.5px] text-stone-300 leading-snug mt-0.5">
                          {pet.activeSkill.description}
                        </p>
                      </div>
                      <div className="pt-1.5 border-t border-stone-800/80">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span>{pet.passiveSkill.name} (Passive)</span>
                        </div>
                        <p className="text-[10.5px] text-stone-300 leading-snug mt-0.5">
                          {pet.passiveSkill.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Pet Detailed Card (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4 bg-stone-900/70 border border-stone-800 rounded-3xl p-5 md:overflow-y-auto">
            {/* Top Info Banner */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-2 border-white/30 shrink-0"
                  style={{ backgroundColor: selectedPet.color }}
                >
                  {selectedPet.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{selectedPet.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      {selectedPet.rarity}
                    </span>
                    {(selectedPet.role || PET_COMBAT_CONFIGS[selectedPet.id]?.role) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/40 font-semibold">
                        {selectedPet.role || PET_COMBAT_CONFIGS[selectedPet.id]?.role}
                      </span>
                    )}
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

            {/* Quick Skill Slot Assignment & Synergy Status */}
            <div className="bg-stone-950/80 rounded-2xl p-3 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-200">
                  ⚔️ Equip Skill to Bar (1–5)
                </span>
                {isEquipped ? (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Active in Slot {equippedSlotNum + 1} (Passive Active)
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">
                    Passive activates when equipped
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const petInSlotId = player.equippedSkillSlots[slotIdx];
                  const isThisPet = petInSlotId === selectedPet.id;
                  const occupiedPet = pets.find((p) => p.id === petInSlotId);

                  return (
                    <button
                      key={slotIdx}
                      onClick={() => handleEquipSlot(slotIdx, selectedPet.id)}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isThisPet
                          ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md ring-2 ring-amber-400/50'
                          : occupiedPet
                          ? 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border-stone-700'
                          : 'bg-stone-900/60 hover:bg-stone-800 text-stone-400 border-dashed border-stone-700'
                      }`}
                    >
                      <span>Slot {slotIdx + 1}</span>
                      <span className="text-[9px] opacity-80 truncate max-w-full">
                        {isThisPet ? 'Equipped' : occupiedPet ? occupiedPet.name : 'Empty'}
                      </span>
                    </button>
                  );
                })}
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
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isEquipped
                        ? 'text-emerald-300 bg-emerald-950 border border-emerald-500/40'
                        : 'text-stone-400 bg-stone-800'
                    }`}
                  >
                    {isEquipped ? 'Active (Equipped)' : 'Inactive (Requires Equip)'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed mb-2">{selectedPet.passiveSkill.description}</p>
                <div className="text-[11px] text-emerald-200/90 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1">
                  📈 <span className="font-semibold">Level Bonus:</span>{' '}
                  {typeof selectedPet.passiveSkill.levelBonusDescription === 'function'
                    ? selectedPet.passiveSkill.levelBonusDescription(selectedPet.level)
                    : getSkillLevelBonus(selectedPet.passiveSkill.id, selectedPet.level)}
                </div>
              </div>

              {/* Basic Attack Breakdown */}
              {(() => {
                const basicCfg = getPetBasicAttackConfig(selectedPet.species);
                return (
                  <div className="bg-stone-950/60 rounded-2xl p-3.5 border border-sky-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs">
                        <span>⚔️ BASIC ATTACK: {basicCfg.name}</span>
                      </div>
                      <span className="text-[10px] text-sky-200 bg-sky-950/80 border border-sky-600/40 px-2 py-0.5 rounded-full font-semibold">
                        {basicCfg.isRanged ? 'Ranged' : 'Melee'} • {basicCfg.attackInterval.toFixed(2)}s
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Attack Range: <strong className="text-sky-200">{basicCfg.attackRange.toFixed(1)}m</strong> • Power Scaling:{' '}
                      <strong className="text-sky-200">{Math.round(basicCfg.damageMultiplier * 100)}%</strong>. Used autonomously in Wild Grounds while invulnerable.
                    </p>
                  </div>
                );
              })()}

              {/* Level-Based Skill Milestones Matrix (Lv 1, 10, 20, 30, 40, 50) */}
              {PET_COMBAT_CONFIGS[selectedPet.id] && (
                <div className="bg-stone-950/70 rounded-2xl p-3.5 border border-stone-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Milestone Progression (Levels 1–50)
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Unlocks unique combat perks
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PET_COMBAT_CONFIGS[selectedPet.id].active.milestones.map((m) => {
                      const isReached = selectedPet.level >= m.level;
                      const passiveM = PET_COMBAT_CONFIGS[selectedPet.id].passive.milestones.find(
                        (pm) => pm.level === m.level
                      );

                      return (
                        <div
                          key={m.level}
                          className={`p-2 rounded-xl border text-[10px] flex flex-col justify-between ${
                            isReached
                              ? 'bg-amber-950/30 border-amber-500/40 text-stone-200'
                              : 'bg-stone-900/40 border-stone-800 text-stone-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded-full text-[9px] ${
                                isReached
                                  ? 'bg-amber-500 text-stone-950'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              Lv.{m.level}
                            </span>
                            {isReached ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Lock className="w-3 h-3 text-stone-600" />
                            )}
                          </div>
                          <div className="font-semibold text-amber-200/90 truncate mb-0.5">
                            {m.title}
                          </div>
                          <div className="text-[9px] line-clamp-2 text-stone-300">
                            {m.effect}
                          </div>
                          {passiveM && (
                            <div className="text-[8.5px] mt-1 pt-1 border-t border-stone-800/80 text-emerald-400/90 line-clamp-1">
                              🛡️ {passiveM.title}: {passiveM.effect}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                  player.equippedSkillSlots.includes(selectedPet.id)
                    ? 'bg-emerald-850 hover:bg-emerald-800 text-emerald-200 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-600/50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {player.equippedSkillSlots.includes(selectedPet.id) ? 'Rest at Den' : 'Equip & Follow'}
                </span>
              </button>
            </div>

            {/* Direct Shortcut to 3D Pet Den Sanctuary */}
            {onEnterPetDen && (
              <button
                onClick={() => {
                  onClose();
                  onEnterPetDen();
                }}
                className="w-full mt-3 bg-gradient-to-r from-teal-800 to-emerald-800 hover:from-teal-700 hover:to-emerald-700 active:scale-98 text-teal-100 font-bold text-xs py-2.5 px-4 rounded-xl border border-teal-500/40 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-1 ring-teal-400/20"
              >
                <span>🏡</span>
                <span>Visit Pet Den Sanctuary (Watch all pets play & roam)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
