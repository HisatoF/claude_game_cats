import type { MachineBuild } from './types';

export interface OpponentDef {
  id: string;
  name: string;
  description: string;
  build: MachineBuild;
  /** AIの攻撃性(0-1)。高いほど積極的に距離を詰める */
  aggressiveness: number;
  rewardPartIds: string[]; // 初勝利時に得られる報酬パーツ
}

export const OPPONENT_ROSTER: OpponentDef[] = [
  {
    id: 'cpu_rusty_walker',
    name: 'オンボロウォーカー',
    description: '練習用のポンコツマシン。動きは遅く単調。',
    build: {
      chassisId: 'chassis_wisp',
      wheelId: 'wheel_sprint',
      weaponIds: ['weapon_impact_mace'],
    },
    aggressiveness: 0.4,
    rewardPartIds: ['weapon_spring_puncher'],
  },
  {
    id: 'cpu_core_ranger',
    name: 'コアレンジャー',
    description: 'バランス型の標準機。遠距離から着実に攻撃してくる。',
    build: {
      chassisId: 'chassis_core',
      wheelId: 'wheel_grip',
      weaponIds: ['weapon_pulse_launcher', 'weapon_impact_mace'],
    },
    aggressiveness: 0.5,
    rewardPartIds: ['weapon_shock_pulser'],
  },
  {
    id: 'cpu_dual_crasher',
    name: 'デュアルクラッシャー',
    description: '二丁の武器で畳み掛ける攻撃的な機体。',
    build: {
      chassisId: 'chassis_core',
      wheelId: 'wheel_sprint',
      weaponIds: ['weapon_impact_mace', 'weapon_spring_puncher'],
    },
    aggressiveness: 0.7,
    rewardPartIds: ['weapon_impact_mace_mk2'],
  },
  {
    id: 'cpu_bulk_guardian',
    name: 'バルクガーディアン',
    description: '重装甲でじりじりと迫る鉄壁の防衛機。',
    build: {
      chassisId: 'chassis_bulk',
      wheelId: 'wheel_grip',
      weaponIds: ['weapon_shock_pulser', 'weapon_impact_mace_mk2'],
    },
    aggressiveness: 0.55,
    rewardPartIds: ['weapon_pulse_launcher_mk2'],
  },
  {
    id: 'cpu_champion_zero',
    name: 'チャンピオン・ゼロ',
    description: '歴代最強と噂される完成形マシン。全方位に隙が無い。',
    build: {
      chassisId: 'chassis_bulk',
      wheelId: 'wheel_grip',
      weaponIds: ['weapon_pulse_launcher_mk2', 'weapon_shock_pulser_mk2', 'weapon_impact_mace_mk2'],
    },
    aggressiveness: 0.8,
    rewardPartIds: ['weapon_shock_pulser_mk2'],
  },
];

export function getOpponent(index: number): OpponentDef {
  const clamped = Math.max(0, Math.min(OPPONENT_ROSTER.length - 1, index));
  return OPPONENT_ROSTER[clamped];
}
