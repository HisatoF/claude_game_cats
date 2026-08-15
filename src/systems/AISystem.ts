import type { Machine } from '../entities/Machine';

export type MoveDir = -1 | 0 | 1;

const CLOSE_RANGE_KINDS = new Set(['melee', 'upward']);

/**
 * プレイヤー機・CPU機は共通して「自動戦闘」する。
 * 手持ちの武器の間合いに応じて距離を取り、範囲内なら止まって攻撃する。
 * aggressiveness が高いほど間合いを詰めるのが早い。
 *
 * 重要: 移動を止める条件(dist <= approachThreshold)は必ず実際の武器の
 * 射程より内側に収める。射程の外側で停止できてしまうと、両者が永遠に
 * 攻撃レンジに入らないまま睨み合う「膠着」バグになる。
 */
export function decideMovement(self: Machine, opponent: Machine, aggressiveness: number): MoveDir {
  if (self.isDestroyed || self.flippedTimer > 0) return 0;

  const hasCloseRange = self.weapons.some((w) => CLOSE_RANGE_KINDS.has(w.part.kind));
  const closeWeapons = self.weapons.filter((w) => CLOSE_RANGE_KINDS.has(w.part.kind));
  const rangedWeapons = self.weapons.filter((w) => !CLOSE_RANGE_KINDS.has(w.part.kind));

  let engageRange: number;
  if (hasCloseRange) {
    // 複数の近接武器を持つ場合、最も射程が短いものにも確実に届く距離を取る
    engageRange = Math.min(...closeWeapons.map((w) => w.part.range));
  } else if (rangedWeapons.length > 0) {
    engageRange = Math.min(...rangedWeapons.map((w) => w.part.range));
  } else {
    engageRange = 40;
  }

  const dx = opponent.chassisBody.position.x - self.chassisBody.position.x;
  const centerDist = Math.abs(dx);
  // CombatSystemと同じく、車体の半幅を差し引いた表面間距離で間合いを測る
  const hullGap = self.chassisPart.size.width / 2 + opponent.chassisPart.size.width / 2;
  const dist = Math.max(0, centerDist - hullGap);

  // 停止条件は必ず射程の内側(最大でも92%)に収め、確実に攻撃が届く位置で止まる
  const approachThreshold = engageRange * (0.68 + (1 - aggressiveness) * 0.22);
  const retreatThreshold = hasCloseRange ? -1 : engageRange * 0.25;

  if (dist > approachThreshold) {
    return (Math.sign(dx) || 1) as MoveDir;
  }
  if (!hasCloseRange && dist < retreatThreshold) {
    // 遠距離武器しか持たない場合、近づかれすぎたら距離を取る
    return (-Math.sign(dx) || -1) as MoveDir;
  }
  return 0;
}
