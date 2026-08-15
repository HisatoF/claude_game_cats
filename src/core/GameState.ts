import type { MachineBuild } from '../data/types';
import { OPPONENT_ROSTER } from '../data/opponents';

const STARTING_UNLOCKED_PARTS = [
  'chassis_wisp',
  'chassis_core',
  'chassis_bulk',
  'wheel_sprint',
  'wheel_grip',
  'weapon_impact_mace',
  'weapon_pulse_launcher',
];

export interface LastBattleSummary {
  winner: 'player' | 'cpu' | 'draw';
  reason: 'ko' | 'flipped' | 'timeout';
  durationMs: number;
  damageDealt: number;
  damageTaken: number;
  rewardPartIds: string[];
  opponentName: string;
}

/**
 * ゲーム全体の進行状況を保持する。画面をまたいで共有される唯一の状態。
 */
export class GameState {
  unlockedPartIds: Set<string> = new Set(STARTING_UNLOCKED_PARTS);
  build: MachineBuild = {
    chassisId: 'chassis_core',
    wheelId: 'wheel_sprint',
    weaponIds: ['weapon_impact_mace', 'weapon_pulse_launcher'],
  };
  opponentIndex = 0;
  wins = 0;
  lastBattle: LastBattleSummary | null = null;

  isUnlocked(partId: string): boolean {
    return this.unlockedPartIds.has(partId);
  }

  unlock(partId: string): boolean {
    if (this.unlockedPartIds.has(partId)) return false;
    this.unlockedPartIds.add(partId);
    return true;
  }

  currentOpponent() {
    return OPPONENT_ROSTER[Math.min(this.opponentIndex, OPPONENT_ROSTER.length - 1)];
  }

  hasNextOpponent(): boolean {
    return this.opponentIndex < OPPONENT_ROSTER.length - 1;
  }

  advanceOpponent(): void {
    if (this.hasNextOpponent()) this.opponentIndex += 1;
  }
}
