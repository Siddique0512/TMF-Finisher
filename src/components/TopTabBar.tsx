import React from 'react';
import { ZOOM_STAGES } from './TrueInfiniteZoomCanvas';
import { sound } from '../utils/audio';
import { Volume2, VolumeX } from 'lucide-react';

interface TopTabBarProps {
  currentStageIndex: number;
  onSelectStage: (stageIndex: number) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
}

export const TopTabBar: React.FC<TopTabBarProps> = ({
  currentStageIndex,
  onSelectStage,
  isVoiceActive,
  onToggleVoice,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-auto select-none bg-[#07050a]/92 backdrop-blur-md border-b border-amber-500/25 px-3 py-2 sm:px-6 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2.5 h-2.5 bg-amber-400 rounded-xs shadow-[0_0_8px_#f59e0b]" />
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-white">
            THE MUTUAL FUN
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/30 rounded-xs">
            MANUAL ZOOM
          </span>
        </div>

        {/* Five Interactive Stage Tabs for Manual Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-none font-mono text-xs">
          {ZOOM_STAGES.map((stage, idx) => {
            const isActive = currentStageIndex === idx;
            const shortTitles = [
              'PORTRAITS',
              'CHAIRS',
              'WEIRDOS',
              'BRIEFCASE',
              'TRAIT VAULT',
              'BOARDROOM',
              '5 FUNDS',
              'BALLOT',
              'WEEK 13',
              'COSMOS',
            ];
            const shortLabel = shortTitles[idx] || stage.num;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  onSelectStage(idx);
                  sound.play('warp');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 whitespace-nowrap border cursor-pointer transition-all rounded-xs ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-600'
                }`}
                title={`Jump to ${stage.title}`}
              >
                <span className={isActive ? 'text-black/80 font-bold' : 'text-amber-400/80'}>
                  {stage.num}
                </span>
                <span className="text-[11px] font-semibold">{shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Single Speaker Symbol to toggle Narrator's Voice On and Off */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onToggleVoice}
            className={`p-2 border cursor-pointer transition-all rounded-xs flex items-center justify-center ${
              isVoiceActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:bg-amber-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
            }`}
            title={isVoiceActive ? 'Narrator Voice is ON (Click to turn OFF)' : 'Narrator Voice is OFF (Click to turn ON)'}
            aria-label={isVoiceActive ? 'Mute Narrator Voice' : 'Unmute Narrator Voice'}
          >
            {isVoiceActive ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
