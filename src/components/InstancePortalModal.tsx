import React, { useState } from 'react';
import { X, Flame, Shield, Sparkles, Award, Skull, Swords, Zap, Crown } from 'lucide-react';
import { INSTANCE_WAVES } from '../game/constants';
import { PlayerStats } from '../types/game';
import { PortalTheme, PORTAL_THEMES } from '../game/portalSystem';

interface InstancePortalModalProps {
  player: PlayerStats;
  currentTheme?: PortalTheme;
  onSelectTheme?: (theme: PortalTheme) => void;
  onClose: () => void;
  onEnterInstance: (theme: PortalTheme) => void;
}

export const InstancePortalModal: React.FC<InstancePortalModalProps> = ({
  player,
  currentTheme = 'normal',
  onSelectTheme,
  onClose,
  onEnterInstance,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<PortalTheme>(currentTheme);

  const handleSelect = (theme: PortalTheme) => {
    setSelectedTheme(theme);
    onSelectTheme?.(theme);
  };

  const themeCfg = PORTAL_THEMES[selectedTheme];

  const difficultyTabs: { id: PortalTheme; label: string; icon: React.ReactNode; colorClass: string; activeClass: string }[] = [
    {
      id: 'normal',
      label: 'Normal',
      icon: <Shield className="w-3.5 h-3.5 text-sky-400" />,
      colorClass: 'text-sky-300',
      activeClass: 'bg-sky-900/80 border-sky-400 text-sky-100 shadow-sky-950/50',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
      colorClass: 'text-purple-300',
      activeClass: 'bg-purple-900/80 border-purple-400 text-purple-100 shadow-purple-950/50',
    },
    {
      id: 'expert',
      label: 'Expert',
      icon: <Skull className="w-3.5 h-3.5 text-rose-400" />,
      colorClass: 'text-rose-300',
      activeClass: 'bg-rose-900/80 border-rose-400 text-rose-100 shadow-rose-950/50',
    },
    {
      id: 'special',
      label: 'Special',
      icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
      colorClass: 'text-amber-300',
      activeClass: 'bg-amber-900/80 border-amber-400 text-amber-100 shadow-amber-950/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 select-none font-sans backdrop-blur-xs">
      <div className="bg-stone-900 border-2 border-indigo-500/70 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100 animate-in fade-in zoom-in-95 duration-200">
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
                  Magical Portal
                </span>
              </h2>
              <p className="text-[11px] text-indigo-300/80">Choose your portal attunement and test your pet powers!</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Difficulty Attunement Tabs */}
        <div className="bg-stone-950/70 px-4 pt-2.5 pb-2 border-b border-stone-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
            <span>Portal Attunement & Visual Resonance</span>
            <span className="text-xs font-semibold text-stone-300">
              Active: <strong className={themeCfg.name === 'Special' ? 'text-amber-300' : themeCfg.name === 'Expert' ? 'text-rose-300' : themeCfg.name === 'Advanced' ? 'text-purple-300' : 'text-sky-300'}>{themeCfg.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {difficultyTabs.map((tab) => {
              const isSelected = selectedTheme === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelect(tab.id)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${tab.activeClass} shadow-md scale-[1.02]`
                      : 'bg-stone-850 border-stone-700/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 max-h-[62vh]">
          {/* Attuned Portal Details Card */}
          <div className={`bg-gradient-to-br ${themeCfg.bgHex} border ${themeCfg.borderHex} rounded-2xl p-3.5 space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                <Swords className="w-4 h-4 text-white" />
                <span className="text-stone-100">{themeCfg.title}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${themeCfg.badgeHex}`}>
                {themeCfg.name} Mode
              </span>
            </div>
            <p className="text-xs text-stone-200/90 leading-relaxed">{themeCfg.desc}</p>
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
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-transform"
          >
            Stay on Farm
          </button>

          <button
            onClick={() => {
              onClose();
              onEnterInstance(selectedTheme);
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
