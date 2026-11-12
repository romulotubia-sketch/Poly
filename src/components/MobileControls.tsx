import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onJump: () => void;
  onInteract: () => void;
  hasInteractable: boolean;
  isZenMode: boolean;
  isModalOpen?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onJump,
  onInteract,
  hasInteractable,
  isZenMode,
  isModalOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  const [joystickOrigin, setJoystickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const radius = 46;

  // Reset floating joystick whenever a modal opens
  useEffect(() => {
    if (isModalOpen) {
      pointerIdRef.current = null;
      originRef.current = null;
      setJoystickOrigin(null);
      setKnobPos({ x: 0, y: 0 });
      onJoystickMove({ x: 0, y: 0 });
    }
  }, [isModalOpen, onJoystickMove]);

  const clearJoystick = () => {
    pointerIdRef.current = null;
    originRef.current = null;
    setJoystickOrigin(null);
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isModalOpen) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (pointerIdRef.current !== null) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pad = radius + 16;
    const localX = Math.max(pad, Math.min(rect.width - pad, e.clientX - rect.left));
    const localY = Math.max(pad, Math.min(rect.height - pad, e.clientY - rect.top));

    pointerIdRef.current = e.pointerId;
    originRef.current = { x: localX, y: localY };
    e.currentTarget.setPointerCapture?.(e.pointerId);

    setJoystickOrigin({ x: localX, y: localY });
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || !originRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let dx = e.clientX - rect.left - originRef.current.x;
    let dy = e.clientY - rect.top - originRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    setKnobPos({ x: dx, y: dy });
    onJoystickMove({ x: dx / radius, y: dy / radius });
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    clearJoystick();
  };

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-20 select-none overflow-hidden">
      {/* Empty-space touch/pointer capture zone to spawn floating joystick (sits behind HUD z-30 and modals z-50) */}
      {!isModalOpen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={clearJoystick}
          className="pointer-events-auto absolute inset-0 touch-none"
          aria-label="Movement Touch Area"
        />
      )}

      {/* Floating Virtual Joystick (appears wherever user taps on empty space) */}
      {joystickOrigin && (
        <div
          className="pointer-events-none absolute w-28 h-28 rounded-full bg-stone-900/55 border-2 border-amber-400/70 backdrop-blur-sm flex items-center justify-center shadow-2xl"
          style={{
            left: joystickOrigin.x - 56,
            top: joystickOrigin.y - 56,
          }}
        >
          <div className="absolute top-1 text-[9px] text-amber-300/70 font-bold">▲</div>
          <div className="absolute bottom-1 text-[9px] text-amber-300/70 font-bold">▼</div>
          <div className="absolute left-1 text-[9px] text-amber-300/70 font-bold">◀</div>
          <div className="absolute right-1 text-[9px] text-amber-300/70 font-bold">▶</div>

          <div
            className="w-12 h-12 rounded-full bg-amber-500 border-2 border-amber-200 shadow-lg flex items-center justify-center"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-amber-100/70" />
          </div>
        </div>
      )}

      {/* Right Thumb Action & Jump Buttons (Portrait-safe above bottom skill dock) */}
      {!isZenMode && (
        <div className="pointer-events-auto fixed bottom-24 right-3 sm:bottom-24 sm:right-5 z-30 flex flex-col gap-2.5 items-center touch-none">
          {/* Action / Interact Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onInteract();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onInteract();
              }
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 font-black text-xs flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all touch-none cursor-pointer ${
              hasInteractable
                ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-yellow-200 text-white animate-pulse'
                : 'bg-stone-800/80 border-stone-600/70 text-stone-300'
            }`}
          >
            <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${hasInteractable ? 'text-yellow-100' : 'text-stone-400'}`} />
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 font-bold">ACTION</span>
          </button>

          {/* Jump Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onJump();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onJump();
              }
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 border-2 border-emerald-300 text-white font-black text-xs flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all touch-none cursor-pointer"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100" />
            <span className="text-[9px] sm:text-[10px] tracking-tight font-bold">JUMP</span>
          </button>
        </div>
      )}
    </div>
  );
};

