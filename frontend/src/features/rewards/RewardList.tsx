import React from 'react';
import { Gift, Plus, CheckCircle2, Lock, Unlock, PartyPopper, Trash2 } from 'lucide-react';
import { Reward } from '../../types/index';

interface RewardListProps {
  rewards: Reward[];
  onOpenRewardModal: (reward?: Reward) => void;
  onRedeemReward: (id: string) => Promise<void>;
  onDeleteReward: (id: string) => Promise<void>;
}

export const RewardList: React.FC<RewardListProps> = ({
  rewards,
  onOpenRewardModal,
  onRedeemReward,
  onDeleteReward
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">Incentive Protocol & Rewards</h1>
          <p className="text-xs font-mono opacity-60">
            GUILT-FREE UNLOCKS TIED STRICTLY TO VERIFIABLE MILESTONES AND COMMITMENT STREAKS.
          </p>
        </div>
        <button
          onClick={() => onOpenRewardModal()}
          className="flex items-center space-x-1.5 bg-[#141414] px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Reward</span>
        </button>
      </div>

      {rewards.length === 0 ? (
        <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono opacity-60">
          NO INCENTIVE TIERS CONFIGURED. SET UP TANGIBLE REWARDS TIED TO MILESTONE CRITERIA.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => {
            const isUnlocked = reward.status === 'unlocked';
            const isRedeemed = reward.status === 'redeemed';
            const isLocked = reward.status === 'locked';

            return (
              <div
                key={reward._id}
                className={`border-2 border-[#141414] p-4 flex flex-col justify-between space-y-4 transition-all text-[#141414] ${
                  isUnlocked
                    ? 'bg-amber-50 shadow-md ring-2 ring-amber-500'
                    : isRedeemed
                    ? 'bg-[#E4E3E0] opacity-75'
                    : 'bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {isUnlocked ? (
                        <Unlock className="h-4 w-4 text-amber-700" />
                      ) : isRedeemed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-700" />
                      ) : (
                        <Lock className="h-4 w-4 opacity-50" />
                      )}
                      <span
                        className={`border border-[#141414] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                          isUnlocked
                            ? 'bg-amber-300 text-[#141414]'
                            : isRedeemed
                            ? 'bg-green-300 text-[#141414]'
                            : 'bg-[#E4E3E0] text-[#141414]'
                        }`}
                      >
                        {reward.status.toUpperCase()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Delete reward "${reward.title}"?`)) {
                          onDeleteReward(reward._id);
                        }
                      }}
                      className="p-1 opacity-60 hover:text-red-600 hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-2 text-xs font-mono font-black uppercase tracking-wider">{reward.title}</h3>
                  <p className="mt-1 text-xs font-mono font-bold">
                    ITEM: {reward.value}
                  </p>

                  <div className="mt-3 border border-[#141414] bg-[#E4E3E0] p-2 text-xs text-[#141414] space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-60 block">
                      REQUIREMENT:
                    </span>
                    <p className="text-[11px] font-mono leading-relaxed">{reward.requirement}</p>
                  </div>

                  {reward.description && (
                    <p className="mt-2 text-[11px] font-mono opacity-70 italic">
                      "{reward.description}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t-2 border-[#141414] flex items-center justify-between">
                  <span className="text-[10px] font-mono opacity-60">
                    {reward.linkedGoalTitle ? `GOAL: ${reward.linkedGoalTitle}` : 'INDEPENDENT'}
                  </span>

                  {isUnlocked && (
                    <button
                      onClick={() => onRedeemReward(reward._id)}
                      className="flex items-center space-x-1.5 border-2 border-[#141414] bg-amber-400 px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#141414] hover:bg-amber-300 transition-colors shadow-xs cursor-pointer"
                    >
                      <PartyPopper className="h-3.5 w-3.5" />
                      <span>Redeem Now</span>
                    </button>
                  )}

                  {isRedeemed && (
                    <span className="text-xs font-mono text-green-800 font-bold uppercase">
                      Redeemed ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
