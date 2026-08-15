import type { ChassisPart } from './types';

// 車体パーツ。オリジナルデザイン。
// weaponMounts の高さ(y)が低いほど重心が低く安定し、高いほど転倒しやすくなる。
export const CHASSIS_LIST: ChassisPart[] = [
  {
    id: 'chassis_wisp',
    name: 'ウィスプフレーム',
    category: 'chassis',
    rarity: 'common',
    cost: 0,
    weight: 42,
    hp: 80,
    defense: 0.05,
    description: '軽量な骨組みだけの車体。加速に優れるが装甲は薄い。',
    size: { width: 68, height: 22 },
    wheelMounts: [
      { x: -22, y: 9 },
      { x: 22, y: 9 },
    ],
    weaponMounts: [{ x: 4, y: -8 }],
    centerOfMassBias: 0,
  },
  {
    id: 'chassis_core',
    name: 'コアフレーム',
    category: 'chassis',
    rarity: 'common',
    cost: 0,
    weight: 72,
    hp: 130,
    defense: 0.12,
    description: 'バランス型の標準車体。何にでも対応できる万能設計。',
    size: { width: 88, height: 30 },
    wheelMounts: [
      { x: -30, y: 12 },
      { x: 30, y: 12 },
    ],
    weaponMounts: [
      { x: -18, y: -12 },
      { x: 18, y: -12 },
    ],
    centerOfMassBias: 0,
  },
  {
    id: 'chassis_bulk',
    name: 'バルクフレーム',
    category: 'chassis',
    rarity: 'rare',
    cost: 0,
    weight: 118,
    hp: 210,
    defense: 0.22,
    description: '分厚い装甲を持つ重量車体。鈍重だが打たれ強い。武器搭載位置が高くなりがちで重心管理が課題。',
    size: { width: 108, height: 40 },
    wheelMounts: [
      { x: -36, y: 16 },
      { x: 36, y: 16 },
    ],
    weaponMounts: [
      { x: -32, y: -18 },
      { x: 0, y: -22 },
      { x: 32, y: -18 },
    ],
    centerOfMassBias: 0,
  },
];

export function getChassis(id: string): ChassisPart {
  const part = CHASSIS_LIST.find((c) => c.id === id);
  if (!part) throw new Error(`Unknown chassis id: ${id}`);
  return part;
}
