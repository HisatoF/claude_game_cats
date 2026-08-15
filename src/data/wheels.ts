import type { WheelPart } from './types';

export const WHEEL_LIST: WheelPart[] = [
  {
    id: 'wheel_sprint',
    name: 'スプリントホイール',
    category: 'wheel',
    rarity: 'common',
    cost: 0,
    weight: 6,
    radius: 12,
    torque: 0.02,
    maxSpeed: 9,
    grip: 0.55,
    description: '小型軽量ホイール。俊敏に動けるが接地が弱く踏ん張りが利かない。',
  },
  {
    id: 'wheel_grip',
    name: 'グリップホイール',
    category: 'wheel',
    rarity: 'common',
    cost: 0,
    weight: 15,
    radius: 20,
    torque: 0.032,
    maxSpeed: 6,
    grip: 0.92,
    description: '大型ホイール。速度は控えめだが接地力が高く姿勢が安定する。',
  },
];

export function getWheel(id: string): WheelPart {
  const part = WHEEL_LIST.find((w) => w.id === id);
  if (!part) throw new Error(`Unknown wheel id: ${id}`);
  return part;
}
