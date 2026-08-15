import type { MachineBuild } from '../data/types';
import { getChassis } from '../data/chassis';
import { getWheel } from '../data/wheels';
import { getWeapon } from '../data/weapons';

export interface BuildStats {
  hp: number;
  attack: number;
  defensePct: number;
  weight: number;
  speed: number;
  grip: number;
  stability: number; // 0-1, 低いほど転倒しやすい
  warning: string | null;
}

export function computeBuildStats(build: MachineBuild): BuildStats {
  const chassis = getChassis(build.chassisId);
  const wheel = getWheel(build.wheelId);
  const weapons = build.weaponIds.map((id) => getWeapon(id));

  const weaponWeight = weapons.reduce((sum, w) => sum + w.weight, 0);
  const weight = chassis.weight + wheel.weight * chassis.wheelMounts.length + weaponWeight;
  const attack = weapons.reduce((sum, w) => sum + w.attack, 0);

  // 武器が高い位置(mount.y が負に大きい)かつ重いほど重心が悪化する
  let topHeaviness = 0;
  build.weaponIds.forEach((id, i) => {
    const mount = chassis.weaponMounts[i];
    if (!mount) return;
    const w = getWeapon(id);
    const height = Math.max(0, -mount.y);
    topHeaviness += (w.weight * height) / 100;
  });
  const stability = Math.max(0, Math.min(1, wheel.grip - topHeaviness / (chassis.weight + 20)));

  let warning: string | null = null;
  if (stability < 0.35) {
    warning = '⚠ 重心が高く不安定です。転倒しやすい可能性があります。';
  } else if (weight > 220) {
    warning = '⚠ 車体が重すぎて動きが鈍くなる可能性があります。';
  }

  return {
    hp: chassis.hp,
    attack,
    defensePct: Math.round(chassis.defense * 100),
    weight,
    speed: wheel.maxSpeed,
    grip: wheel.grip,
    stability,
    warning,
  };
}
