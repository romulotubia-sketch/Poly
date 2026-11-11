import React, { useState } from 'react';
import { X, Volume2, Music, RotateCcw, Smartphone, Maximize, Activity, Zap, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { GraphicsQuality } from '../types/game';

interface SettingsModalProps {
  onClose: () => void;
  onResetGame: () => void;
  onShowMessage: (msg: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  graphicsQuality: GraphicsQuality;
  onSelectQuality: (q: GraphicsQuality) => void;
  showPerfStats: boolean;
  onTogglePerfStats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onResetGame,
  onShowMessage,
  isFullscreen,
  onToggleFullscreen,
  graphicsQuality,
  onSelectQuality,
  showPerfStats,
  onTogglePerfStats,
}) => {
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [musicPlaying, setMusicPlaying] = useState(true);

  const toggleMusic = () => {
    if (musicPlaying) {
      soundEngine.stopAmbientMusic();
      setMusicPlaying(false);
      onShowMessage('Ambient music paused.');
    } else {
      soundEngine.startAmbientMusic();
      setMusicPlaying(true);
      onShowMessage('Ambient music started.');
    }
  };

  const handleSfxChange = (val: number) => {
    setSfxVolume(val);
    soundEngine.setVolume(val, musicPlaying ? 0.25 : 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-600/40 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold text-amber-200">Settings & Graphics</h2>
              <p className="text-[10px] text-stone-400">Quality, audio, performance monitor, and controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Graphics Quality Settings (Requirement 4) */}
          <div>
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Graphics Quality & Performance
            </h3>
            <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-3.5 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => {
                  const isSelected = graphicsQuality === q;
                  return (
                    <button
                      key={q}
                      onClick={() => onSelectQuality(q)}
                      className={`py-2 px-1 rounded-xl font-bold uppercase tracking-wide text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                          : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>

              {/* Quality Description Card */}
              <div className="text-[11px] text-stone-300 bg-stone-950/60 border border-stone-800/80 rounded-xl p-2.5 leading-relaxed">
                {graphicsQuality === 'low' && (
                  <div>
                    <strong className="text-amber-400">Low Quality:</strong> 1.0x native resolution, minimal shadows, pooled 120 particle cap. Optimized for battery saving and older mobile devices.
                  </div>
                )}
                {graphicsQuality === 'medium' && (
                  <div>
                    <strong className="text-amber-400">Medium Quality:</strong> 1.5x resolution, soft shadows, balanced 260 particle cap, standard atmospheric effects. Recommended for most devices.
                  </div>
                )}
                {graphicsQuality === 'high' && (
                  <div>
                    <strong className="text-amber-400">High Quality:</strong> 2.0x full resolution, PCF soft shadows, 500 particle cap, enhanced lighting, reflections, and full environmental foliage.
                  </div>
                )}
              </div>

              {/* Performance Monitor Toggle (Requirement 5) */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                <div>
                  <h4 className="font-bold text-stone-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-400" /> Performance Monitor Overlay
                  </h4>
                  <p className="text-[10px] text-stone-400">Display real-time FPS, frame time, particles & draw calls</p>
                </div>
                <button
                  onClick={onTogglePerfStats}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    showPerfStats
                      ? 'bg-sky-600 border-sky-400 text-white'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-white'
                  }`}
                >
                  <span>{showPerfStats ? 'Enabled' : 'Hidden'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Display & Fullscreen */}
          <div>
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Display & Mode
            </h3>
            <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-stone-200">Mobile Fullscreen Mode</h4>
                <p className="text-[10px] text-stone-400">Play in edge-to-edge landscape</p>
              </div>
              <button
                onClick={onToggleFullscreen}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>

          {/* Audio Controls */}
          <div>
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Audio & Sound
            </h3>
            <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-200">Procedural Ambient Music</h4>
                  <p className="text-[10px] text-stone-400">Cozy acoustic chord synthesis</p>
                </div>
                <button
                  onClick={toggleMusic}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    musicPlaying
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <Music className="w-3 h-3" />
                  <span>{musicPlaying ? 'Playing' : 'Muted'}</span>
                </button>
              </div>

              <div>
                <div className="flex justify-between text-stone-300 mb-1">
                  <span>Sound Effects Volume</span>
                  <span>{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-stone-800 rounded-lg h-2 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Mobile Touch Controls Guide */}
          <div>
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Mobile Touch Guide
            </h3>
            <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                <span className="text-stone-300">Left Joystick</span>
                <span className="font-semibold text-amber-300">Walk & Run</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                <span className="text-stone-300">Right Screen Drag / Arrows</span>
                <span className="font-semibold text-amber-300">Rotate Camera View</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                <span className="text-stone-300">Two-Finger Pinch</span>
                <span className="font-semibold text-amber-300">Zoom Camera</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                <span className="text-stone-300">Green JUMP Button</span>
                <span className="font-semibold text-emerald-300">Jump & Hop</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                <span className="text-stone-300">Golden ACTION Button</span>
                <span className="font-semibold text-yellow-300">Plant / Water / Harvest</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-300">Bottom 5 Slots</span>
                <span className="font-semibold text-amber-300">Cast Pet Active Abilities</span>
              </div>
            </div>
          </div>

          {/* Reset Save Data */}
          <div>
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">Save Game</h3>
            <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-stone-200">Reset Farm & Pets</h4>
                <p className="text-[10px] text-stone-400">Clear local storage and start fresh</p>
              </div>
              <button
                onClick={onResetGame}
                className="bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-200 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
