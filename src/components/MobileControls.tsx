import React, { useRef, useState } from 'react';
import { ArrowUp, Sparkles, RotateCcw, RotateCw } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onJump: () => void;
  onInteract: () => void;
  onCamTurn: (direction: number) => void;
  hasInteractable: boolean;
  isZenMode: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onJump,
  onInteract,
  onCamTurn,
  hasInteractable,
  isZenMode,
}) => {
  const stickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = 46;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null || !stickRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    setKnobPos({ x: dx, y: dy });
    onJoystickMove({ x: dx / radius, y: dy / radius });
  };

  if (isZenMode) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden">
      {/* Left Thumb Virtual Joystick */}
      <div
        ref={stickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-32 h-32 rounded-full bg-stone-900/60 border-2 border-stone-600/50 backdrop-blur-sm flex items-center justify-center active:border-amber-400 touch-none shadow-2xl"
      >
        {/* Directional compass ticks */}
        <div className="absolute top-1 text-[9px] text-stone-500 font-bold">▲</div>
        <div className="absolute bottom-1 text-[9px] text-stone-500 font-bold">▼</div>
        <div className="absolute left-1 text-[9px] text-stone-500 font-bold">◀</div>
        <div className="absolute right-1 text-[9px] text-stone-500 font-bold">▶</div>

        {/* Joystick Thumb Knob */}
        <div
          className={`w-14 h-14 rounded-full border-2 shadow-lg pointer-events-none flex items-center justify-center ${
            isDragging
              ? 'bg-amber-500 border-amber-200 scale-105'
              : 'bg-amber-600/80 border-amber-400/80'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-4 h-4 rounded-full bg-amber-200/60" />
        </div>
      </div>

      {/* Right Thumb Action Zone */}
      <div className="pointer-events-auto absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-end gap-3 touch-none">
        {/* Camera Quick Turn Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onTouchStart={() => onCamTurn(1)}
            onTouchEnd={() => onCamTurn(0)}
            onMouseDown={() => onCamTurn(1)}
            onMouseUp={() => onCamTurn(0)}
            className="w-11 h-11 rounded-2xl bg-stone-900/70 active:bg-stone-800 border border-stone-600/60 text-stone-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="Rotate Camera Left"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onTouchStart={() => onCamTurn(-1)}
            onTouchEnd={() => onCamTurn(0)}
            onMouseDown={() => onCamTurn(-1)}
            onMouseUp={() => onCamTurn(0)}
            className="w-11 h-11 rounded-2xl bg-stone-900/70 active:bg-stone-800 border border-stone-600/60 text-stone-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="Rotate Camera Right"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col gap-3 items-center">
          {/* Action / Interact Button (Till, Plant, Water, Harvest) */}
          <button
            onClick={onInteract}
            className={`w-16 h-16 rounded-full border-2 font-black text-xs flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all ${
              hasInteractable
                ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-yellow-200 text-white animate-pulse'
                : 'bg-stone-800/80 border-stone-600/70 text-stone-300'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${hasInteractable ? 'text-yellow-100' : 'text-stone-400'}`} />
            <span className="text-[10px] tracking-tight mt-0.5 font-bold">ACTION</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={onJump}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 border-2 border-emerald-300 text-white font-black text-xs flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all"
          >
            <ArrowUp className="w-6 h-6 text-emerald-100" />
            <span className="text-[10px] tracking-tight font-bold">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
