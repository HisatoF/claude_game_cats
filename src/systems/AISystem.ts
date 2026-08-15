import type { Machine } from '../entities/Machine';

export type MoveDir = -1 | 0 | 1;

/**
 * プレイヤー機・CPU機は共通して「自動戦闘」する。
 * 手持ちの武器の間合いに応じて距離を取り、範囲内なら止まって攻撃する。
 * aggressiveness が高いほど間合いを詰めるのが早い。
 */
export function decideMovement(self: Machine, opponent: Machine, aggressiveness: number): MoveDir {
  if (self.isDestroyed || self.flippedTimer > 0) return 0;

  const closeRangeKinds = new Set(['melee', 'upward']);
  const hasCloseRange = self.weapons.some((w) => closeRangeKinds.has(w.part.kind));
  const rangedWeapons = self.weapons.filter((w) => !closeRangeKinds.has(w.part.kind));

  let preferredRange: number;
  if (hasCloseRange) {
    preferredRange = 40;
  } else if (rangedWeapons.length > 0) {
    const maxRange = Math.max(...rangedWeapons.map((w) => w.part.range));
    preferredRange = maxRange * 0.8;
  } else {
    preferredRange = 40;
  }

  const dx = opponent.chassisBody.position.x - self.chassisBody.position.x;
  const dist = Math.abs(dx);
  const tolerance = 18 + (1 - aggressiveness) * 20;

  if (dist > preferredRange + tolerance) {
    return (Math.sign(dx) || 1) as MoveDir;
  }
  if (dist < preferredRange - tolerance && !hasCloseRange) {
    // 遠距離武器しか持たない場合、近づかれすぎたら距離を取る
    return (-Math.sign(dx) || -1) as MoveDir;
  }
  return 0;
}
