import Matter from 'matter-js';
import type { Machine, MachineCombatEvent } from '../entities/Machine';

const { Body, Vector } = Matter;

/** 転倒とみなす傾き比率(0=直立, 1=完全に逆さま) */
const FLIP_THRESHOLD = 0.55;
/** この時間だけ転倒し続けるとKO扱いになる(ms) */
const FLIP_KO_TIME = 3000;

export function updateCooldowns(machine: Machine, deltaMs: number): void {
  for (const weapon of machine.weapons) {
    if (weapon.cooldownRemaining > 0) {
      weapon.cooldownRemaining = Math.max(0, weapon.cooldownRemaining - deltaMs);
    }
  }
}

/** 転倒判定を更新し、必要ならKOにする */
export function updateFlipState(machine: Machine, deltaMs: number): void {
  if (machine.isDestroyed) return;
  const tilt = machine.tiltRatio();
  if (tilt >= FLIP_THRESHOLD) {
    machine.flippedTimer += deltaMs;
    if (machine.flippedTimer === deltaMs) {
      machine.events.push({ type: 'flip-warning', from: machine.side });
    }
    if (machine.flippedTimer >= FLIP_KO_TIME) {
      machine.isDestroyed = true;
      machine.destroyedReason = 'flipped';
      machine.events.push({ type: 'ko', from: machine.side, reason: 'flipped' });
    }
  } else {
    machine.flippedTimer = 0;
  }
}

function applyImpulse(target: Machine, impulseVec: Matter.Vector): void {
  const mass = target.chassisBody.mass;
  const deltaV = Vector.div(impulseVec, mass);
  Body.setVelocity(target.chassisBody, Vector.add(target.chassisBody.velocity, deltaV));
}

/**
 * 攻撃可能な武器を判定し、命中していればダメージ・ノックバック・反動を適用する。
 * プレイヤー機・CPU機のどちらにも同じロジックを使う(自動戦闘)。
 */
export function resolveAttacks(attacker: Machine, defender: Machine): void {
  if (attacker.isDestroyed || defender.isDestroyed) return;
  if (attacker.flippedTimer > 0) return; // 転倒中は攻撃できない

  const facing = attacker.side === 'player' ? 1 : -1;
  const dx = defender.chassisBody.position.x - attacker.chassisBody.position.x;
  const dy = defender.chassisBody.position.y - attacker.chassisBody.position.y;
  const dist = Math.hypot(dx, dy);

  for (const weapon of attacker.weapons) {
    if (weapon.cooldownRemaining > 0) continue;

    let hit = false;
    let knockDir: Matter.Vector = { x: Math.sign(dx) || facing, y: 0 };

    switch (weapon.part.kind) {
      case 'melee': {
        hit = dist <= weapon.part.range && Math.sign(dx || 1) === facing;
        knockDir = Vector.normalise({ x: dx, y: dy * 0.3 });
        break;
      }
      case 'forward': {
        const inFront = dx * facing > 0;
        hit = inFront && dist <= weapon.part.range && Math.abs(dy) < 60;
        knockDir = { x: facing, y: -0.1 };
        break;
      }
      case 'upward': {
        hit = dist <= weapon.part.range;
        knockDir = { x: (Math.sign(dx) || facing) * 0.25, y: -1 };
        break;
      }
      case 'area': {
        hit = dist <= weapon.part.range;
        knockDir = dist > 1 ? Vector.normalise({ x: dx, y: dy }) : { x: facing, y: 0 };
        break;
      }
    }

    if (!hit) continue;

    weapon.cooldownRemaining = weapon.part.cooldown;

    const mitigated = defender.applyDamage(weapon.part.attack);
    attacker.damageDealt += mitigated;

    applyImpulse(defender, Vector.mult(knockDir, weapon.part.knockback));

    // 反動: 自分自身にも逆向きの力積が作用し、姿勢を崩す原因になる
    const recoilDir = Vector.neg(knockDir);
    applyImpulse(attacker, Vector.mult(recoilDir, weapon.part.recoil));

    const hitPos = defender.chassisBody.position;
    attacker.events.push({ type: 'attack-fire', kind: weapon.part.kind, from: attacker.side });
    defender.events.push({
      type: 'hit',
      kind: weapon.part.kind,
      from: attacker.side,
      amount: mitigated,
      x: hitPos.x,
      y: hitPos.y,
    });

    if (defender.hp <= 0 && !defender.isDestroyed) {
      defender.isDestroyed = true;
      defender.destroyedReason = 'ko';
      defender.events.push({ type: 'ko', from: defender.side, reason: 'ko' });
    }
  }
}

export function drainEvents(machine: Machine): MachineCombatEvent[] {
  const events = machine.events;
  machine.events = [];
  return events;
}
