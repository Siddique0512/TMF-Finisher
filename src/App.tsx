import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrueInfiniteZoomCanvas, ZOOM_STAGES } from './components/TrueInfiniteZoomCanvas';
import { TopTabBar } from './components/TopTabBar';
import { NarratorCaptionBar } from './components/NarratorCaptionBar';
import { ProspectusDossierDrawer } from './components/ProspectusDossierDrawer';
import { narrator } from './utils/narrator';
import { sound } from './utils/audio';

export default function App() {
  // Smooth continuous virtual progress (0.00 to 1.00)
  const [progress, setProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // Active Stage Index (0 to 9)
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Narrator Voice Toggle: ON by default when someone visits site
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);

  // Prospectus Dossier Drawer state
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Browser Autoplay unlocked state
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  // Settled Narrator Speech State
  const lastSpokenStageRef = useRef<number>(-1);
  const lastUserScrollTimeRef = useRef<number>(0);
  const settleTimerRef = useRef<number | null>(null);

  // Smooth jump to progress (purely manual)
  const handleJumpToProgress = useCallback((target: number) => {
    targetProgressRef.current = Math.min(1.0, Math.max(0.0, target));
    lastUserScrollTimeRef.current = performance.now();
  }, []);

  // Jump to specific zoom stage (manual click in top bar)
  const handleSelectStage = useCallback((stageIndex: number) => {
    const clamped = Math.max(0, Math.min(ZOOM_STAGES.length - 1, stageIndex));
    const targetP = clamped / (ZOOM_STAGES.length - 1);
    handleJumpToProgress(targetP);
    // Note: Do NOT speak immediately; narrator will speak once image settles in!
  }, [handleJumpToProgress]);

  // Toggle voice narration via single speaker symbol
  const handleToggleVoice = () => {
    setIsVoiceActive((prev) => {
      const next = !prev;
      if (next) {
        narrator.enable();
        narrator.speakStage(currentStageIndex);
      } else {
        narrator.disable();
      }
      return next;
    });
    sound.play('click');
  };

  // Unlock Audio on first user interaction (browser autoplay compliance)
  const unlockAudio = useCallback(() => {
    if (!audioUnlocked) {
      setAudioUnlocked(true);
      sound.unlock();
      if (isVoiceActive) {
        narrator.enable();
      }
    }
  }, [audioUnlocked, isVoiceActive]);

  useEffect(() => {
    const handleGesture = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('wheel', handleGesture);
    };

    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    window.addEventListener('wheel', handleGesture);

    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('wheel', handleGesture);
    };
  }, [unlockAudio]);

  // Ultra-smooth RAF Interpolation Loop & Settled Detection
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      const absDiff = Math.abs(diff);

      // Smooth critically damped lerp for buttery, responsive movement
      const lerpSpeed = 0.10;
      currentProgressRef.current += diff * lerpSpeed;

      // When difference is tiny, snap to exact target
      if (absDiff < 0.00004) {
        currentProgressRef.current = targetProgressRef.current;
      }

      const p = currentProgressRef.current;
      setProgress(p);

      const numStages = ZOOM_STAGES.length;
      // Determine nearest resting stage
      const stageIdx = Math.min(numStages - 1, Math.floor(p * (numStages - 1) + 0.5));
      if (stageIdx !== currentStageIndex) {
        setCurrentStageIndex(stageIdx);
      }

      // Check if image is currently moving vs settled in
      const now = performance.now();
      const isInputActive = now - lastUserScrollTimeRef.current < 280;
      const isStillLerping = Math.abs(targetProgressRef.current - currentProgressRef.current) > 0.0003;

      if (isInputActive || isStillLerping) {
        // Image is actively moving/zooming: cancel any pending speech
        if (settleTimerRef.current !== null) {
          clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }

        // If user is actively scrolling across stages, pause voice to avoid speaking in transit
        if (lastSpokenStageRef.current !== -1 && Math.abs(stageIdx - lastSpokenStageRef.current) >= 1) {
          narrator.stop();
        }
      } else {
        // Image has come to a steady rest ("settled in"):
        // Schedule speech if this settled stage hasn't been spoken yet
        if (stageIdx !== lastSpokenStageRef.current && settleTimerRef.current === null) {
          settleTimerRef.current = window.setTimeout(() => {
            // Re-verify the camera is still completely at rest at this stage
            const currentDiff = Math.abs(targetProgressRef.current - currentProgressRef.current);
            if (currentDiff < 0.0005) {
              lastSpokenStageRef.current = stageIdx;
              if (isVoiceActive && audioUnlocked) {
                narrator.speakStage(stageIdx);
              }
            }
            settleTimerRef.current = null;
          }, 320); // Natural pleasant beat once the image settles into place
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [currentStageIndex, isVoiceActive, audioUnlocked]);

  // Seamless Wheel Input Listener
  useEffect(() => {
    let wheelTimeout: number;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      unlockAudio();
      lastUserScrollTimeRef.current = performance.now();

      // Normalize delta across input devices (pixels, lines, pages)
      let rawDelta = e.deltaY;
      if (e.deltaMode === 1) rawDelta *= 30; // lines
      else if (e.deltaMode === 2) rawDelta *= 400; // pages

      // Clamp max single-event burst for smooth control on high-momentum wheels
      const clampedDelta = Math.max(-100, Math.min(100, rawDelta));
      const scrollStep = clampedDelta * 0.00045;

      targetProgressRef.current = Math.min(
        1.0,
        Math.max(0.0, targetProgressRef.current + scrollStep)
      );

      // Magnetic gentle snapping when wheel comes to rest near an exact stage
      clearTimeout(wheelTimeout);
      wheelTimeout = window.setTimeout(() => {
        const numStages = ZOOM_STAGES.length;
        const nearestStageP = Math.round(targetProgressRef.current * (numStages - 1)) / (numStages - 1);
        if (Math.abs(targetProgressRef.current - nearestStageP) < 0.035) {
          targetProgressRef.current = nearestStageP;
        }
      }, 150);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [unlockAudio]);

  // Touch gesture listener for mobile/tablet manual swipe
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      lastUserScrollTimeRef.current = performance.now();
      unlockAudio();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;
      lastUserScrollTimeRef.current = performance.now();

      targetProgressRef.current = Math.min(
        1.0,
        Math.max(0.0, targetProgressRef.current + deltaY * 0.0012)
      );
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [unlockAudio]);

  // Keyboard navigation for manual zooming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      unlockAudio();
      lastUserScrollTimeRef.current = performance.now();

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1.0, targetProgressRef.current + 0.06);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0.0, targetProgressRef.current - 0.06);
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleSelectStage(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        handleSelectStage(ZOOM_STAGES.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unlockAudio, handleSelectStage]);

  return (
    <div
      onClick={unlockAudio}
      className="relative w-screen h-screen overflow-hidden bg-[#050308] text-[#ededef]"
    >
      {/* 1. Master True Infinite Zoom Canvas (Seamless smooth-scroll journey) */}
      <TrueInfiniteZoomCanvas
        progress={progress}
        onTargetProgressChange={handleJumpToProgress}
        onStageChange={setCurrentStageIndex}
      />

      {/* 2. Top Tab Navigation Bar (Single speaker toggle, manual stage tabs) */}
      <TopTabBar
        currentStageIndex={currentStageIndex}
        onSelectStage={handleSelectStage}
        isVoiceActive={isVoiceActive}
        onToggleVoice={handleToggleVoice}
      />

      {/* 3. Bottom Subtitle & Narrator Strip */}
      <NarratorCaptionBar
        currentStageIndex={currentStageIndex}
        onNavigateStage={handleSelectStage}
        isDemoActive={false}
        onToggleDemo={() => {}}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* 4. Comprehensive Prospectus Dossier Drawer */}
      <ProspectusDossierDrawer
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        currentStageIndex={currentStageIndex}
        onSelectStage={handleSelectStage}
      />

      {/* Subtle CRT scanline overlay */}
      <div className="scanline-overlay fixed inset-0 z-10 pointer-events-none opacity-30" />
    </div>
  );
}
