import Matter from 'matter-js';
import type { ChassisPart, WeaponPart, WheelPart } from '../data/types';

export type Side = 'player' | 'cpu';

export interface EquippedWeapon {
  part: WeaponPart;
  mount: { x: number; y: number };
  cooldownRemaining: number;
}

/**
 * バトル中の1台のマシンを表すランタイムエンティティ。
 * 物理ボディ(Matter)と戦闘ステータス(HP等)の両方を保持する。
 */
export class Machine {
  readonly side: Side;
  readonly name: string;
  readonly chassisPart: ChassisPart;
  readonly wheelPart: WheelPart;
  readonly weapons: EquippedWeapon[];

  readonly chassisBody: Matter.Body;
  readonly wheelBodies: Matter.Body[];
  readonly constraints: Matter.Constraint[];

  maxHp: number;
  hp: number;
  damageDealt = 0;
  damageTaken = 0;

  /** 転倒(ひっくり返り)継続時間の積算(ms) */
  flippedTimer = 0;
  isDestroyed = false;
  destroyedReason: 'ko' | 'flipped' | null = null;

  /** このフレームに発生した戦闘イベント(演出/サウンド用) */
  events: MachineCombatEvent[] = [];

  constructor(params: {
    side: Side;
    name: string;
    chassisPart: ChassisPart;
    wheelPart: WheelPart;
    weaponParts: WeaponPart[];
    chassisBody: Matter.Body;
    wheelBodies: Matter.Body[];
    constraints: Matter.Constraint[];
  }) {
    this.side = params.side;
    this.name = params.name;
    this.chassisPart = params.chassisPart;
    this.wheelPart = params.wheelPart;
    this.chassisBody = params.chassisBody;
    this.wheelBodies = params.wheelBodies;
    this.constraints = params.constraints;

    this.weapons = params.weaponParts.map((part, i) => ({
      part,
      mount: params.chassisPart.weaponMounts[i] ?? { x: 0, y: 0 },
      cooldownRemaining: 0,
    }));

    this.maxHp = params.chassisPart.hp;
    this.hp = this.maxHp;
  }

  /** 武器マウントのワールド座標を計算する */
  weaponWorldPosition(mount: { x: number; y: number }): Matter.Vector {
    const rotated = Matter.Vector.rotate(mount, this.chassisBody.angle);
    return Matter.Vector.add(this.chassisBody.position, rotated);
  }

  /** 直立を0として、どれだけ傾いているか(0=直立, 1=真横, 2=完全に転倒) */
  tiltRatio(): number {
    const normalized = Math.abs(((this.chassisBody.angle + Math.PI) % (2 * Math.PI)) - Math.PI);
    return normalized / Math.PI;
  }

  applyDamage(amount: number): number {
    const mitigated = Math.max(1, amount * (1 - this.chassisPart.defense));
    this.hp = Math.max(0, this.hp - mitigated);
    this.damageTaken += mitigated;
    return mitigated;
  }
}

export type MachineCombatEvent =
  | { type: 'attack-fire'; kind: WeaponPart['kind']; from: Side }
  | { type: 'hit'; kind: WeaponPart['kind']; from: Side; amount: number; x: number; y: number }
  | { type: 'flip-warning'; from: Side }
  | { type: 'ko'; from: Side; reason: 'ko' | 'flipped' };
