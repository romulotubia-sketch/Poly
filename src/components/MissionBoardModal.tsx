import React, { useEffect, useState } from 'react';
import {
  X,
  ClipboardCheck,
  Clock,
  Coins,
  Sparkles,
  CheckCircle2,
  Gift,
  Trophy,
  Sprout,
  Heart,
  Swords,
  Star,
} from 'lucide-react';
import {
  MilestoneState,
  MissionBoardState,
  MissionCategory,
  MissionInstance,
  MissionPeriod,
  MissionReward,
} from '../types/game';
import {
  formatCountdownMs,
  getNextDailyResetMs,
  getNextWeeklyResetMs,
} from '../game/missions';

interface MissionBoardModalProps {
  missionState: MissionBoardState;
  onClose: () => void;
  onClaimMission: (missionId: string, period: MissionPeriod) => void;
  onClaimMilestone: (milestoneId: string, period: MissionPeriod) => void;
}

const CATEGORY_META: Record<
  MissionCategory,
  { label: string; icon: React.FC<{ className?: string }>; badgeClass: string }
> = {
  farming: {
    label: 'Farming',
    icon: Sprout,
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  },
  pet: {
    label: 'Pets',
    icon: Heart,
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
  },
  wild_grounds: {
    label: 'Wild Grounds',
    icon: Swords,
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
  },
  general: {
    label: 'General',
    icon: Star,
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
  },
};

const DIFFICULTY_META = {
  easy: 'bg-stone-800 text-stone-300 border-stone-600/50',
  medium: 'bg-sky-950/80 text-sky-300 border-sky-500/40',
  hard: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
};

const RewardPreviewPills: React.FC<{ reward: MissionReward }> = ({ reward }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {reward.gold && reward.gold > 0 && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
        <Coins className="w-3 h-3 text-amber-400" />
        +{reward.gold}
      </span>
    )}
    {reward.petEssence && reward.petEssence > 0 && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[11px] font-bold">
        <Sparkles className="w-3 h-3 text-purple-400" />
        +{reward.petEssence} Essence
      </span>
    )}
    {reward.seeds?.map((seed) => (
      <span
        key={seed.seedKey}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold"
      >
        <span>{seed.icon}</span>
        <span>
          +{seed.count} {seed.name}
        </span>
      </span>
    ))}
  </div>
);

export const MissionBoardModal: React.FC<MissionBoardModalProps> = ({
  missionState,
  onClose,
  onClaimMission,
  onClaimMilestone,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'milestones'>('daily');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dailyCompletedCount = missionState.dailyMissions.filter((m) => m.completed).length;
  const weeklyCompletedCount = missionState.weeklyMissions.filter((m) => m.completed).length;

  const dailyUnclaimedCount =
    missionState.dailyMissions.filter((m) => m.completed && !m.claimed).length +
    missionState.dailyMilestones.filter((ms) => !ms.claimed && dailyCompletedCount >= ms.requiredCount).length;

  const weeklyUnclaimedCount =
    missionState.weeklyMissions.filter((m) => m.completed && !m.claimed).length +
    missionState.weeklyMilestones.filter((ms) => !ms.claimed && weeklyCompletedCount >= ms.requiredCount).length;

  const milestoneUnclaimedCount =
    missionState.dailyMilestones.filter((ms) => !ms.claimed && dailyCompletedCount >= ms.requiredCount).length +
    missionState.weeklyMilestones.filter((ms) => !ms.claimed && weeklyCompletedCount >= ms.requiredCount).length;

  const dailyResetIn = formatCountdownMs(getNextDailyResetMs(nowMs) - nowMs);
  const weeklyResetIn = formatCountdownMs(getNextWeeklyResetMs(nowMs) - nowMs);

  const renderMissionCard = (mission: MissionInstance) => {
    const catMeta = CATEGORY_META[mission.category];
    const CatIcon = catMeta.icon;
    const pct = Math.min(100, Math.round((mission.progress / Math.max(1, mission.target)) * 100));
    const canClaim = mission.completed && !mission.claimed;

    return (
      <div
        key={mission.id}
        className={`rounded-2xl border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          mission.claimed
            ? 'bg-stone-900/40 border-stone-800/80 opacity-75'
            : canClaim
            ? 'bg-gradient-to-r from-amber-950/60 via-stone-900/90 to-emerald-950/50 border-amber-400/70 shadow-lg ring-1 ring-amber-400/30'
            : 'bg-stone-900/75 border-stone-800 hover:border-stone-700'
        }`}
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.badgeClass}`}
            >
              <CatIcon className="w-3 h-3" />
              {catMeta.label}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${DIFFICULTY_META[mission.difficulty]}`}
            >
              {mission.difficulty}
            </span>
            {mission.claimed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Claimed
              </span>
            ) : mission.completed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 animate-pulse">
                <Gift className="w-3 h-3" />
                Ready to Claim
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800/80 text-stone-400 border border-stone-700/60">
                In Progress
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-stone-100 leading-tight">{mission.title}</h4>
            <p className="text-xs text-stone-400 mt-0.5">{mission.description}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-stone-400">Progress</span>
              <span className={mission.completed ? 'text-emerald-300' : 'text-amber-300'}>
                {mission.progress.toLocaleString()} / {mission.target.toLocaleString()} ({pct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  mission.claimed
                    ? 'bg-stone-600'
                    : mission.completed
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <RewardPreviewPills reward={mission.reward} />
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-end shrink-0">
          {mission.claimed ? (
            <div className="px-4 py-2 rounded-xl bg-stone-800/80 border border-stone-700 text-stone-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Claimed</span>
            </div>
          ) : canClaim ? (
            <button
              onClick={() => onClaimMission(mission.id, mission.period)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Gift className="w-4 h-4" />
              <span>Claim</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-stone-800/50 border border-stone-700/60 text-stone-500 text-xs font-bold">
              Incomplete
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMilestoneStrip = (
    period: MissionPeriod,
    milestones: MilestoneState[],
    completedCount: number,
    totalCount: number
  ) => (
    <div className="bg-stone-950/80 border border-amber-600/30 rounded-2xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wide text-amber-200">
            {period === 'daily' ? 'Daily Milestone Rewards' : 'Weekly Milestone Rewards'}
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
          {completedCount} / {totalCount} Completed
        </span>
      </div>

      {/* Milestone Progress Track */}
      <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300 rounded-full"
          style={{ width: `${Math.min(100, (completedCount / Math.max(1, totalCount)) * 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {milestones.map((ms) => {
          const unlocked = completedCount >= ms.requiredCount;
          const canClaim = unlocked && !ms.claimed;

          return (
            <div
              key={ms.id}
              className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 ${
                ms.claimed
                  ? 'bg-stone-900/40 border-stone-800 opacity-75'
                  : canClaim
                  ? 'bg-amber-950/50 border-amber-400/70 ring-1 ring-amber-400/30 shadow'
                  : 'bg-stone-900/70 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-100">{ms.title}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    ms.claimed
                      ? 'bg-stone-800 text-stone-400'
                      : unlocked
                      ? 'bg-emerald-900 text-emerald-300'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {Math.min(completedCount, ms.requiredCount)}/{ms.requiredCount}
                </span>
              </div>

              <RewardPreviewPills reward={ms.reward} />

              {ms.claimed ? (
                <div className="w-full py-1.5 rounded-lg bg-stone-800/80 text-stone-400 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Claimed</span>
                </div>
              ) : canClaim ? (
                <button
                  onClick={() => onClaimMilestone(ms.id, period)}
                  className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-stone-950 text-[11px] font-black shadow cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Claim Milestone</span>
                </button>
              ) : (
                <div className="w-full py-1.5 rounded-lg bg-stone-950/70 border border-stone-800 text-stone-500 text-[11px] font-semibold text-center">
                  Need {ms.requiredCount - completedCount} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/65 backdrop-blur-sm select-none">
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-600/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-800 bg-stone-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-200">Haven Mission Board</h2>
              <p className="text-[11px] sm:text-xs text-stone-400">
                Complete daily & weekly tasks across your farm, pets, and Wild Grounds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs + UTC+8 Timer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-6 pt-2 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'daily'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Daily Missions</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300">
                {dailyCompletedCount}/5
              </span>
              {dailyUnclaimedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {dailyUnclaimedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'weekly'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Weekly Missions</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300">
                {weeklyCompletedCount}/7
              </span>
              {weeklyUnclaimedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {weeklyUnclaimedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'milestones'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Milestone Rewards</span>
              {milestoneUnclaimedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {milestoneUnclaimedCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300 bg-sky-950/50 border border-sky-500/30 px-2.5 py-1 rounded-xl mb-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {activeTab === 'weekly' ? `Weekly Reset (Mon 00:00 UTC+8): ${weeklyResetIn}` : `Daily Reset (00:00 UTC+8): ${dailyResetIn}`}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'daily' && (
            <>
              {renderMilestoneStrip('daily', missionState.dailyMilestones, dailyCompletedCount, 5)}
              <div className="space-y-2.5">
                {missionState.dailyMissions.map(renderMissionCard)}
              </div>
            </>
          )}

          {activeTab === 'weekly' && (
            <>
              {renderMilestoneStrip('weekly', missionState.weeklyMilestones, weeklyCompletedCount, 7)}
              <div className="space-y-2.5">
                {missionState.weeklyMissions.map(renderMissionCard)}
              </div>
            </>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900/70 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-300">
                <span>Complete missions to unlock bonus milestone chests. Rewards must be claimed manually.</span>
                <span className="text-sky-300 font-semibold">
                  Weekly Reset in {weeklyResetIn}
                </span>
              </div>
              {renderMilestoneStrip('daily', missionState.dailyMilestones, dailyCompletedCount, 5)}
              {renderMilestoneStrip('weekly', missionState.weeklyMilestones, weeklyCompletedCount, 7)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
