import React, { useState, useEffect } from 'react';
import { Smartphone, Maximize, Play } from 'lucide-react';

interface LandscapeNoticeProps {
  onEnterFullscreen: () => void;
  isFullscreen: boolean;
}

export const LandscapeNotice: React.FC<LandscapeNoticeProps> = ({
  onEnterFullscreen,
  isFullscreen,
}) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if vertical height exceeds width
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setDismissed(false); // Reset dismissal once in landscape
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-xs flex flex-col items-center animate-fade-in">
        {/* Animated Rotating Phone Icon */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/10 animate-ping opacity-30" />
          <div className="relative w-16 h-24 rounded-2xl border-4 border-amber-400 bg-stone-900 shadow-2xl flex flex-col items-center justify-between p-1.5 transition-transform duration-700 animate-[spin_4s_ease-in-out_infinite]">
            <div className="w-4 h-1 rounded-full bg-amber-400/60" />
            <div className="text-xl">🐾</div>
            <div className="w-2.5 h-2.5 rounded-full border border-amber-400/80" />
          </div>
        </div>

        <h2 className="text-xl font-black text-amber-200 mb-2">Please Rotate to Landscape</h2>
        <p className="text-xs text-stone-300 mb-6 leading-relaxed">
          Pet Haven is designed for mobile landscape with dual-thumb controls. Please turn your device sideways!
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          {!isFullscreen && (
            <button
              onClick={() => {
                onEnterFullscreen();
                // Attempt orientation lock
                if ('orientation' in screen && 'lock' in screen.orientation) {
                  (screen.orientation.lock as (o: string) => Promise<void>)('landscape').catch(() => {});
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen & Landscape</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="w-full bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-stone-300 font-semibold text-xs py-2.5 px-4 rounded-2xl border border-stone-700 transition-colors"
          >
            <span>Continue Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
