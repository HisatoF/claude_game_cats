import type { GameState } from '../core/GameState';
import type { OpponentDef } from '../data/opponents';

export interface RewardOutcome {
  newlyUnlocked: string[];
  alreadyOwned: string[];
}

/** 勝利報酬を付与する。未所持パーツのみ新規解放として扱う。 */
export function grantVictoryRewards(state: GameState, opponent: OpponentDef): RewardOutcome {
  const newlyUnlocked: string[] = [];
  const alreadyOwned: string[] = [];

  for (const partId of opponent.rewardPartIds) {
    if (state.unlock(partId)) {
      newlyUnlocked.push(partId);
    } else {
      alreadyOwned.push(partId);
    }
  }

  return { newlyUnlocked, alreadyOwned };
}
